# the main issue with using GPR for preference function estimation is
# that it doesn't help that much with providing new design suggestions
# (GPR estimates f | X and f* | f, X, X* and i want to sample X | f)

from dsTypes import *
import random
import torch
import pyro
import pyro.distributions as dist
from threading import Thread, Event

# logging setup
import logging

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


class Rejection(SamplerThread):
    def __init__(
        self,
        snippet,
        x0,
        name="",
        threshold=0.7,
        freeParams=1000,
        n=10,
        cb=None,
        final=None,
    ):
        super().__init__()
        self.snippet = snippet
        self.name = name
        self.x0 = x0
        self.threshold = threshold
        self.freeParams = freeParams
        self.n = n
        self.cb = cb
        self.final = final

    def run(self):
        logger.info("[{0}] Rejection sampler initializing".format(self.name))
        count = 0
        accept = []

        # duplicate, we're going to shuffle it a lot
        filter = list(self.snippet.filter)
        posExamples = self.snippet.posExamples()

        g = dist.Uniform(torch.zeros(len(filter)), torch.ones(len(filter)))

        logger.info("[{0}] Filter: {1}".format(self.name, filter))
        logger.info("[{0}] Initial Free Params: {1}".format(self.name, self.freeParams))
        logger.info(
            "[{0}] Positive Example Count: {1}".format(self.name, len(posExamples))
        )

        while count < self.n:
            if self.stopped():
                logger.info("[{0}] Rejection Sampler early stop".format(self.name))
                break

            # determine which parameters are fixed (randomly select from the filter params)
            random.shuffle(filter)
            selected = filter[0 : self.freeParams]

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
            score = self.snippet.predictOne(xp)

            logger.debug(
                "[{0}] Sample Generated. Mean Score: {1}".format(
                    self.name, score["mean"]
                )
            )

            # check score
            if score["mean"] > self.threshold:
                logger.info(
                    "[{0}/{1}] Accepted {2} mean score: {3}".format(
                        count + 1, self.n, xp, score["mean"]
                    )
                )
                accept.append(xp.tolist())

                if self.cb:
                    self.callback(
                        self.cb, xp.tolist(), score["mean"], score["cov"], count
                    )

                count = count + 1

        # finalize
        logger.info("[{0}] Finalizing sampler".format(self.name))

        if self.final:
            self.final(accept, self.name)


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
        logger.info("[{0}] Metropolis sampler initializing".format(self.name))
        fx = self.f.predictOne(self.x0)
        x = torch.tensor(self.x0)
        count = 0
        accept = []
        filter = self.f.filter

        g = dist.MultivariateNormal(
            torch.zeros(len(filter)), torch.eye(len(filter)) * self.scale
        )

        logger.info("[{0} Metropolis sampler starting".format(self.name))
        while count < self.limit:
            if self.stopped():
                logger.info("[{0}] Metropolis sampler early stop".format(self.name))
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
                        logger.info(
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
