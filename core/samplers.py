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
        fx = self.f.predict([self.x0])
        x = torch.tensor(self.x0)
        count = 0
        accept = []
        g = dist.MultivariateNormal(torch.zeros(len(x)), torch.eye(len(x)) * self.scale)

        while count < self.limit:
            if self.stopped():
                logger.info("[{0}] Metropolis sampler early stop".format(self.name))
                break

            # generate
            xp = x + g.sample()

            # bounds (assuming normalized, if not will need a key)
            xp = torch.clamp(xp, 0.0, 1.0)

            fxp = self.f.predict(xp.view(-1, 1).t())

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
