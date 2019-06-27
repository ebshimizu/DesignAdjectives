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

# additional levels
SAMPLE_INFO_LEVEL = 32
logging.addLevelName(SAMPLE_INFO_LEVEL, "SAMPLE")


def sample(self, message, *args, **kws):
    if self.isEnabledFor(SAMPLE_INFO_LEVEL):
        self._log(SAMPLE_INFO_LEVEL, message, args, **kws)


logging.Logger.sample = sample
logging.basicConfig(
    level=logging.INFO,
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
        cb=None,
        final=None,
    ):
        super().__init__()
        self.snippet = snippet
        self.name = name
        self.x0 = x0
        self.threshold = threshold
        self.freeParams = freeParams

        if self.freeParams > len(self.snippet.filter):
            self.freeParams = len(self.snippet.filter)

        self.n = n
        self.cb = cb
        self.final = final
        self.paramFloor = paramFloor
        self.retries = retries

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

        while count < self.n:
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
            score = self.snippet.predictOne(xp)

            logger.debug(
                "[{0}] Sample Generated. Mean Score: {1}".format(
                    self.name, score["mean"]
                )
            )

            # check score
            if score["mean"] > self.threshold:
                logger.sample(
                    "[{0}/{1}] Accepted {2} mean score: {3}".format(
                        count + 1, self.n, xp, score["mean"]
                    )
                )
                accept.append(xp.tolist())

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
