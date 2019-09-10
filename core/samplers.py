# the main issue with using GPR for preference function estimation is
# that it doesn't help that much with providing new design suggestions
# (GPR estimates f | X and f* | f, X, X* and i want to sample X | f)

from dsTypes import *

import torch
import pyro
import pyro.distributions as dist

import numpy as np
from scipy.stats import norm
from scipy.optimize import minimize

from functools import reduce
from threading import Thread, Event
import random

# logging setup
import logging

# additional levels
SAMPLE_INFO_LEVEL = 33
logging.addLevelName(SAMPLE_INFO_LEVEL, "SAMPLE")


def sample(self, message, *args, **kws):
    if self.isEnabledFor(SAMPLE_INFO_LEVEL):
        self._log(SAMPLE_INFO_LEVEL, message, args, **kws)


logging.Logger.sample = sample
logging.basicConfig(
    level=logging.WARNING,
    format="[%(levelname)-5.5s] %(asctime)s [%(threadName)-12.12s]  %(message)s",
    handlers=[logging.FileHandler("server.log"), logging.StreamHandler()],
)

logger = logging.getLogger()


def l2Dist(a, b):
    return torch.dist(a, b, 2)


# returns true if x is different enough from the accept set
# according to the given epsilon and d(istance) f(unction)
# x should be a tensor
def checkSimilarity(x, accept, epsilon, df):
    minDist = 1e2
    for data in accept:
        dist = df(x, data["x"])
        if dist < minDist:
            minDist = dist

        if minDist < epsilon:
            logger.debug("Rejected {0}, {1} below epsilon {2}".format(x, dist, epsilon))
            return False

    logger.debug("Accepted {0}, minDist: {1}".format(x, minDist))
    return True


class SamplerThread(Thread):
    def __init__(self):
        super().__init__()
        self._stop_event = Event()

    def stop(self):
        self._stop_event.set()

    def stopped(self):
        return self._stop_event.is_set()

    # standardizing the callback format for these samplers
    def callback(self, func, x, mean, cov, id):
        func({"x": x, "mean": mean, "cov": cov, "idx": id})


class GenericRejection(SamplerThread):
    def __init__(
        self,
        x0,
        startingPts,
        evalFunc,
        filter,
        name="",
        threshold=0.7,
        freeParams=1000,
        n=10,
        paramFloor=3,
        retries=20,
        cb=None,
        final=None,
    ):
        super().__init__()
        self.name = name
        self.x0 = x0
        self.threshold = threshold
        self.freeParams = freeParams
        self.filter = filter
        self.n = n
        self.cb = cb
        self.final = final
        self.retries = retries
        self.results = None
        self.paramFloor = paramFloor
        self.evalFunc = evalFunc
        self.startingPts = startingPts

        if self.freeParams > len(self.filter):
            self.freeParams = len(self.filter)

    def run(self):
        logger.sample("[{0}] Generic Rejection sampler initializing".format(self.name))
        count = 0
        accept = []
        rejected = 0
        attempts = 0
        log = []
        currentFreeParams = self.freeParams

        # duplicate, we're going to shuffle it a lot
        filter = list(self.filter)

        # generic sampler still uses torch cause it's easy to generate random dists from it
        g = dist.Uniform(torch.zeros(len(filter)), torch.ones(len(filter)))

        logger.sample("[{0}] Filter: {1}".format(self.name, filter))
        logger.sample(
            "[{0}] Initial Free Params: {1}".format(self.name, self.freeParams)
        )
        logger.sample(
            "[{0}] Initial Point Count: {1}".format(self.name, len(self.startingPts))
        )
        logger.sample("[{0}] Free Param Floor: {1}".format(self.name, self.paramFloor))

        while count < self.n:
            if self.stopped():
                logger.sample("[{0}] Rejection Sampler early stop".format(self.name))
                break

            # determine which parameters are fixed (randomly select from the filter params)
            random.shuffle(filter)
            selected = filter[0:currentFreeParams]

            # pull a random positive example to use as the base
            random.shuffle(self.startingPts)
            xp = torch.tensor(self.x0)
            for i in range(len(filter)):
                xp[filter[i]] = self.startingPts[0][filter[i]]

            # drop in replace the modified params
            randVec = g.sample()

            for i in range(len(selected)):
                xp[selected[i]] = randVec[i]

            # eval (expects return of mean and cov)
            score = self.evalFunc(xp)

            logger.debug("[{0}] Sample Generated. Score: {1}".format(self.name, score))

            # check score
            if score["mean"] > self.threshold:
                logger.sample(
                    "[{0}/{1}] Accepted {2} mean score: {3}".format(
                        count + 1, self.n, xp, score["mean"]
                    )
                )
                accept.append(
                    {
                        "x": xp.tolist(),
                        "mean": score["mean"],
                        "cov": score["cov"],
                        "count": count,
                        "idx": count,
                    }
                )

                if self.cb:
                    self.callback(
                        self.cb, xp.tolist(), score["mean"], score["cov"], count
                    )

                log.append(
                    {
                        "accept": True,
                        "attempts": attempts,
                        "score": score["mean"],
                        "freeParams": currentFreeParams,
                        "count": rejected + len(accept),
                    }
                )

                count = count + 1
                attempts = 0

                if currentFreeParams < self.freeParams:
                    currentFreeParams = currentFreeParams + 1
                    logger.sample(
                        "[{0}] Sample accepted. Raising free param limit to {1}.".format(
                            self.name, currentFreeParams
                        )
                    )
            else:
                log.append(
                    {
                        "accept": False,
                        "score": score["mean"],
                        "freeParams": currentFreeParams,
                        "attempt": attempts,
                        "count": rejected + len(accept),
                    }
                )

                attempts = attempts + 1
                rejected = rejected + 1

                if (attempts > self.retries) & (currentFreeParams > self.paramFloor):
                    currentFreeParams = currentFreeParams - 1
                    attempts = 0
                    logger.sample(
                        "[{0}] Retry limit reached. Decreasing free params to {1}".format(
                            self.name, currentFreeParams
                        )
                    )

        # finalize
        logger.sample("[{0}] Finalizing sampler".format(self.name))
        logger.sample(
            "[{0}] Rejection Rate: {1}% ({2}/{3})".format(
                self.name,
                100 * (rejected / (rejected + len(accept))),
                rejected,
                len(accept),
            )
        )

        self.results = accept

        if self.final:
            # sends the trace back to the client for whatever use
            self.final(log, self.name)


class Rejection(SamplerThread):
    def __init__(
        self,
        snippet,
        x0,
        name="",
        threshold=0.7,
        freeParams=1000,
        n=10,
        paramFloor=3,
        retries=20,
        limit=10000,
        cb=None,
        final=None,
        paramFilter=None,
        customEval=None,
        thresholdEvalMode="gt",
        thresholdTarget=None,
        scoreDelta=0,
    ):
        super().__init__()
        self.snippet = snippet
        self.name = name
        self.x0 = x0
        self.threshold = threshold
        self.freeParams = freeParams
        self.limit = limit

        if self.freeParams > len(self.snippet.filter):
            self.freeParams = len(self.snippet.filter)

        self.n = n
        self.cb = cb
        self.final = final
        self.paramFloor = paramFloor
        self.retries = retries
        self.paramFilter = paramFilter
        self.results = None

        # the custom eval function should return in the same format as
        # the snippet eval function does. This is an object containing "mean"
        # and "cov" fields. cov can be optional if the eval function does not provide one
        self.customEval = customEval

        # the threshold mode determines the accept criteria
        self.thresholdEvalMode = thresholdEvalMode
        self.thresholdTarget = thresholdTarget
        self.setThresholdFunc()

        # the score delta is the minimum score difference between accepted samples
        # if it's 0, the check is skipped
        self.scoreDelta = scoreDelta

    def setThresholdFunc(self):
        # standard greater than
        if self.thresholdEvalMode == "gt":
            self.thresholdFunc = lambda x: x > self.threshold
        # standard less than
        elif self.thresholdEvalMode == "lt":
            self.thresholdFunc = lambda x: x < self.threshold
        # within radius around target (distance)
        elif self.thresholdEvalMode == "absRadius":
            self.thresholdFunc = (
                lambda x: abs(x - self.thresholdTarget) < self.threshold
            )
        # within radius but strictly improving
        elif self.thresholdEvalMode == "radius":
            self.thresholdFunc = (
                lambda x: x > self.thresholdTarget and x < self.threshold
            )

    # returns true if the given score is different enough from all other elements
    # in the list
    def scoreDiff(self, score, accepted):
        if self.scoreDelta == 0 or len(accepted) == 0:
            return True

        scoreAboveThresh = list(
            map(lambda x: abs(score - x["mean"]) > self.scoreDelta, accepted)
        )
        return reduce(lambda x, y: x and y, scoreAboveThresh)

    def run(self):
        logger.sample("[{0}] Rejection sampler initializing".format(self.name))
        count = 0
        accept = []
        rejected = 0
        currentFreeParams = self.freeParams
        attempts = 0
        log = []

        # duplicate, we're going to shuffle it a lot
        filter = list(self.snippet.filter)

        # filter override
        if self.paramFilter is not None:
            filter = list(self.paramFilter)

        # anything that's not in the custom filter is a locked parameter.
        # we'll need to remove things that are in the snippet filter but not in the
        # custom filter here.
        # if there is no custom filter, proceed
        # if self.paramFilter is not None:
        #     for elem in filter:
        #         if elem not in self.paramFilter:
        #             filter.remove(elem)

        posExamples = self.snippet.posExamples()

        g = dist.Uniform(torch.zeros(len(filter)), torch.ones(len(filter)))

        logger.sample("[{0}] Filter: {1}".format(self.name, filter))
        logger.sample(
            "[{0}] Initial Free Params: {1}".format(self.name, self.freeParams)
        )
        logger.sample(
            "[{0}] Positive Example Count: {1}".format(self.name, len(posExamples))
        )
        logger.sample("[{0}] Free Param Floor: {1}".format(self.name, self.paramFloor))

        while count < self.n and attempts < self.limit:
            if self.stopped():
                logger.sample("[{0}] Rejection Sampler early stop".format(self.name))
                break

            # determine which parameters are fixed (randomly select from the filter params)
            random.shuffle(filter)
            selected = filter[0:currentFreeParams]

            # pull a random positive example to use as the base
            random.shuffle(posExamples)
            xp = torch.tensor(self.x0)
            for i in range(len(filter)):
                xp[filter[i]] = posExamples[0][filter[i]]

            # drop in replace the modified params
            randVec = g.sample()

            for i in range(len(selected)):
                xp[selected[i]] = randVec[i]

            # eval
            score = 0
            if self.customEval:
                score = self.customEval(xp)
            else:
                score = self.snippet.predictOne(xp)

            logger.debug(
                "[{0}] Sample Generated. Mean Score: {1}".format(
                    self.name, score["mean"]
                )
            )

            # check score
            if self.thresholdFunc(score["mean"]) and self.scoreDiff(
                score["mean"], accept
            ):
                logger.sample(
                    "[{0}/{1}] Accepted {2} mean score: {3}".format(
                        count + 1, self.n, xp, score["mean"]
                    )
                )
                accept.append(
                    {
                        "x": xp.tolist(),
                        "mean": score["mean"],
                        "cov": score["cov"],
                        "count": count,
                        "idx": count,
                    }
                )

                if self.cb:
                    self.callback(
                        self.cb, xp.tolist(), score["mean"], score["cov"], count
                    )

                log.append(
                    {
                        "accept": True,
                        "attempts": attempts,
                        "score": score["mean"],
                        "freeParams": currentFreeParams,
                        "count": rejected + len(accept),
                    }
                )

                count = count + 1
                attempts = 0

                if currentFreeParams < self.freeParams:
                    currentFreeParams = currentFreeParams + 1
                    logger.sample(
                        "[{0}] Sample accepted. Raising free param limit to {1}.".format(
                            self.name, currentFreeParams
                        )
                    )
            else:
                log.append(
                    {
                        "accept": False,
                        "score": score["mean"],
                        "freeParams": currentFreeParams,
                        "attempt": attempts,
                        "count": rejected + len(accept),
                    }
                )

                attempts = attempts + 1
                rejected = rejected + 1

                if (attempts > self.retries) & (currentFreeParams > self.paramFloor):
                    currentFreeParams = currentFreeParams - 1
                    attempts = 0
                    logger.sample(
                        "[{0}] Retry limit reached. Decreasing free params to {1}".format(
                            self.name, currentFreeParams
                        )
                    )

        # finalize
        logger.sample("[{0}] Finalizing sampler".format(self.name))
        logger.sample(
            "[{0}] Rejection Rate: {1}% ({2}/{3})".format(
                self.name,
                100 * (rejected / (rejected + len(accept))),
                rejected,
                len(accept),
            )
        )

        self.results = accept

        if self.final:
            # sends the trace back to the client for whatever use
            self.final(log, self.name)


class Metropolis(SamplerThread):
    def __init__(
        self,
        f,
        x0,
        name="",
        qMin=0.6,
        epsilon=0.1,
        n=10,
        burn=100,
        limit=1e5,
        stride=1,
        scale=0.05,
        cb=None,
        final=None,
    ):
        super().__init__()
        self.f = f
        self.x0 = x0
        self.qMin = qMin
        self.epsilon = epsilon
        self.n = n
        self.burn = burn
        self.limit = limit
        self.stride = stride
        self.scale = scale
        self.cb = cb
        self.name = name
        self.final = final

    def run(self):
        # initialize
        logger.sample("[{0}] Metropolis sampler initializing".format(self.name))
        fx = self.f.predictOne(self.x0)
        x = torch.tensor(self.x0)
        count = 0
        accept = []
        filter = self.f.filter

        g = dist.MultivariateNormal(
            torch.zeros(len(filter)), torch.eye(len(filter)) * self.scale
        )

        logger.sample("[{0} Metropolis sampler starting".format(self.name))
        while count < self.limit:
            if self.stopped():
                logger.sample("[{0}] Metropolis sampler early stop".format(self.name))
                break

            # generate
            delta = g.sample()

            # modify xp but only do it to the relevant params in filter
            xp = torch.tensor(x)

            for i in range(0, len(filter)):
                idx = filter[i]
                xp[idx] = xp[idx] + delta[i]
            # xp = x + g.sample()

            # bounds (assuming normalized, if not will need a key)
            xp = torch.clamp(xp, 0.0, 1.0)

            fxp = self.f.predict(xp.view(-1, 1).t())
            fxp["mean"] = fxp["mean"].item()
            fxp["cov"] = fxp["cov"].item()

            # test
            a = fxp["mean"] / fx["mean"]
            if fx["mean"] == 0:
                a = 1

            logger.debug(
                "[{0}/{1} ct: {2}] a: {3} mean: {4}".format(
                    count, self.limit, count, a, fxp["mean"]
                )
            )

            # accept?
            if random.random() < a:
                # check burnin
                count = count + 1

                if (
                    (count > self.burn)
                    & (count % self.stride == 0)
                    & (fxp["mean"] > self.qMin)
                ):
                    # acceptance check
                    if checkSimilarity(xp, accept, self.epsilon, l2Dist):
                        logger.sample(
                            "[{0}/{1} ct: {2}] Accepted {3} mean: {4}".format(
                                len(accept) + 1, self.n, count, xp, fxp["mean"]
                            )
                        )

                        if self.cb:
                            self.cb(
                                {
                                    "x": xp.tolist(),
                                    "mean": fxp["mean"],
                                    "cov": fxp["cov"],
                                    "idx": count,
                                }
                            )

                        accept.append(
                            {
                                "x": xp,
                                "mean": fxp["mean"],
                                "cov": fxp["cov"],
                                "idx": count,
                            }
                        )

                        x = torch.tensor(xp)
                        fx = fxp

            if len(accept) >= self.n:
                break

        # listify the vectors (they are torch tensors at this point)
        for d in accept:
            d["x"] = d["x"].tolist()

        # final callback
        if self.final:
            self.final(accept, self.name)

        return accept


# the bootstrapper sampler attempts to determine which points should
# be sampled next in order to gain maximal info about the expressed preferences
# It requires some extra annotations on the samples to be most effective, may need to
# go back and re-write them
# Borrowed primarily from: http://krasserm.github.io/2018/03/21/bayesian-optimization/
class Bootstrapper(SamplerThread):
    def __init__(self, f, x0, name="", n=10, cb=None, final=None):
        super().__init__()
        self.f = f
        self.x0 = x0
        self.n = n
        self.cb = cb
        self.name = name
        self.final = final

    def unfilter(self, subset, x):
        xp = list(self.x0)
        for i in range(0, len(subset)):
            xp[subset[i]] = x[i]

        return xp

    def expectedImprovement(self, X, xi=0.01):
        # untested, need to check types, original written assuming numpy
        # in this function, called from minObj in proposeLocation, it is assumed
        # that the vectors are the proper length (all params)
        pred = self.f.predictOne(X)
        mean = pred["mean"]
        sigma = pred["cov"]

        with np.errstate(divide="warn"):
            # meanSampleOpt is cached at start of sampler (invariant during run, gpr does not change)
            imp = mean - self.meanSampleOpt - xi
            Z = imp / sigma
            ei = imp * norm.cdf(Z) + sigma * norm.pdf(Z)

            if sigma == 0.0:
                ei = 0.0

        return ei

    def proposeLocation(self, subset, bounds=[0, 1], restarts=5):
        # again, needs tests for types, may need torch -> numpy conversion
        # the gpr has been re-trained to include all parameters in this search
        # in this case, I want to limit which parameters get used in the optimization,
        # so we'll retrieve the data and use our own subset thing to re-filter
        # the data
        acquisition = self.expectedImprovement
        dim = len(subset)
        bounds = np.array([[0, 1]] * dim)
        minVal = 1
        minX = None

        # assumes X is a subset limited vector
        def minObj(X):
            # replace x0 subset indices with values from x
            # duplicate
            xp = self.unfilter(subset, X)
            return -acquisition(xp)

        for x0 in np.random.uniform(bounds[:, 0], bounds[:, 1], size=(restarts, dim)):
            res = minimize(minObj, x0=x0, bounds=bounds, method="L-BFGS-B")
            if res.fun < minVal:
                minVal = res.fun
                minX = res.x

        logger.sample("[Bootstrap] impovement {0}".format(-minVal))
        return minX.reshape(-1).tolist()

    def initFrequencyTable(self):
        logger.sample("[Bootstrap] Initializing parameter frequency table")

        dim = len(self.x0)
        defaultFilter = self.f.getDefaultFilter()
        self.frequencies = [1] * dim

        for pt in self.f.data:
            if len(pt.affected) > 0:
                for idx in pt.affected:
                    self.frequencies[idx] = self.frequencies[idx] + 1
            else:
                for idx in defaultFilter:
                    self.frequencies[idx] = self.frequencies[idx] + 1

        # select dimensions relative to frequency max + 1
        self.maxFreq = max(self.frequencies) + 1

        logger.sample(
            "[Bootstrap] Sampler frequency table initialized, max {0}: {1}".format(
                self.maxFreq - 1, self.frequencies
            )
        )

    def selectParams(self):
        # returns a set of parameter indices, weighted by how often they appeared in the
        # training data
        selected = []
        for i in range(0, len(self.x0)):
            if random.random() < self.frequencies[i] / self.maxFreq:
                selected.append(i)

        return selected

    def run(self):
        # problem: the gpr may be trained only on a subset of params, which might not
        # be the right subset to train on. the gpr should maybe be retrained against
        # all parameters, and then optimizations should proceed based on that
        # there could maybe be a mode that just uses the existing parameter set, but for
        # now I'll assume this is also about parameter exploration
        logger.sample(
            "[Bootstrap] Re-training snippet {0} on all parameters".format(self.name)
        )
        self.f.optSteps = 200   # quick opt
        self.f.train(customFilter=list(range(0, len(self.x0))))
        logger.sample("[Bootstrap] Re-training complete. Sampler starting.")

        # precompute some things
        logger.sample("[Bootstrap] Computing current max training data value")

        XSample = self.f.getXTrain()
        sampleMean = self.f.predict(XSample)["mean"]
        self.meanSampleOpt = torch.max(sampleMean).item()

        logger.sample(
            "[Bootstrap] Maximum sample mean found: {0}".format(self.meanSampleOpt)
        )

        self.initFrequencyTable()

        # the ideal cycle for this is as follows:
        # - if a preset filter exists, get the best sample from that config of params
        # first subset, the default filter (still recoverable from the sampler)
        i = 0
        logger.sample("[Bootstrap] Finding maximal info point for default subset")
        firstSubset = self.f.getDefaultFilter()
        p1 = self.proposeLocation(firstSubset)
        fp1 = self.f.predictOne(self.unfilter(firstSubset, p1))
        if self.cb:
            self.cb(
                {
                    "x": self.unfilter(firstSubset, p1),
                    "mean": fp1["mean"],
                    "cov": fp1["cov"],
                    "idx": i,
                    "affected": firstSubset,
                }
            )
        logger.sample(
            "[Bootstrap] {0}/{1}\tFound mean {2}, cov: {3}, affected: {4}".format(
                i, self.n, fp1["mean"], fp1["cov"], firstSubset
            )
        )

        i = i + 1

        # With the remaining required samples:
        # - Pick a random subset of parameters
        # - Within that subset, pick the location that should give maximal information
        # - Return that sample, repeat
        #
        # Samples returned from this function must include information about which
        # parameters were included in a subset.
        while i < self.n:
            # pick subset
            subset = self.selectParams()

            # propose a location
            # note: if this is a snippet with nothing currently in it, we should jitter
            # the param vector around x0 to give a starting point
            # for now: assume this is an initialized snippet
            proposed = self.proposeLocation(subset)

            fp = self.f.predictOne(self.unfilter(subset, proposed))
            if self.cb:
                self.cb(
                    {
                        "x": self.unfilter(subset, proposed),
                        "mean": fp["mean"],
                        "cov": fp["cov"],
                        "idx": i,
                        "affected": subset,
                    }
                )

            logger.sample(
                "[Bootstrap] {0}/{1}\tFound sample mean {2}, cov: {3}, affected: {4}".format(
                    i, self.n, fp["mean"], fp["cov"], subset
                )
            )

            # return proposed, repeat till done
            i = i + 1
        
        # todo: stop returning 0
        # todo: reload initial training settings after running this sampler
        return 0
