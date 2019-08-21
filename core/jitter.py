from dsTypes import *
from snippet import Snippet
from samplers import *
import pyro.distributions as dist
import math
import random
import numpy.random

# logging setup
import logging

# additional level
JITTER_INFO_LEVEL = 32
logging.addLevelName(JITTER_INFO_LEVEL, "JITTER")


def jitterLog(self, message, *args, **kws):
    if self.isEnabledFor(JITTER_INFO_LEVEL):
        self._log(JITTER_INFO_LEVEL, message, args, **kws)


logging.Logger.jitter = jitterLog
logging.basicConfig(
    level=logging.WARNING,
    format="[%(levelname)-5.5s] %(asctime)s [%(threadName)-12.12s]  %(message)s",
    handlers=[logging.FileHandler("server.log"), logging.StreamHandler()],
)

logger = logging.getLogger()


def clamp(x, min, max):
    if x < min:
        return min
    if x > max:
        return max

    return x


def jitter(x0, delta, affectedParams=None, n=20, scoreFunc=None):
    # first reset filter if no affected params given
    if affectedParams is None:
        affectedParams = list(range(0, len(x0)))

    samples = []
    for i in range(0, n):
        # duplicate x0
        xp = list(x0)

        # modify duplciated vector
        for affectedParam in affectedParams:
            xp[affectedParam] = clamp(
                xp[affectedParam] + random.uniform(-1, 1) * delta, 0, 1
            )

        # optional eval
        retObj = {"x": xp, "score": 0, "idx": i}
        if scoreFunc is not None:
            retObj["score"] = scoreFunc(xp)

        samples.append(retObj)

    return samples

