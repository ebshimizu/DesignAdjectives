from dsTypes import *
from functools import reduce
import random

# logging setup
import logging

# additional level
MIXER_INFO_LEVEL = 32
logging.addLevelName(MIXER_INFO_LEVEL, "MIXER")


def mixer(self, message, *args, **kws):
    if self.isEnabledFor(MIXER_INFO_LEVEL):
        self._log(MIXER_INFO_LEVEL, message, args, **kws)


logging.Logger.mixer = mixer
logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)-5.5s] %(asctime)s [%(threadName)-12.12s]  %(message)s",
    handlers=[logging.FileHandler("server.log"), logging.StreamHandler()],
)

logger = logging.getLogger()


def btVecEq(a, b):
    vecEq = list(map(lambda i: a[i] == b[i], range(0, len(a))))
    return reduce(lambda x, y: x & y, vecEq)


def isDuplicate(x, results):
    # no results, can't be duplicate
    if len(results) == 0:
        return False

    resEq = list(map(lambda result: btVecEq(x, result["generator"]), results))
    return reduce(lambda x, y: x | y, resEq)


# returns a mix result objects, containing an object with debug info,
# and an array of objects each containing:
# - the vector itself
# - the bitvector that created it
# a snippet parameter may be required in the future
def mix(a, b, count, attempts=100):
    results = []
    logger.mixer("Mixer starting")

    logger.mixer("Identifying common parameters")
    # only want to swap things that actually make a visual difference
    activeParams = []
    for i in range(0, len(a)):
        if a[i] != b[i]:
            activeParams.append(i)
    length = len(activeParams)
    logger.mixer("Identified {0} different params: {1}".format(length, activeParams))

    if length == 0:
        logger.mixer("Vectors are identical, cancelling mix")
    else:
        for i in range(0, attempts):
            # generate 0/1 vector
            zvec = list(map(lambda x: random.randint(0, 1), range(0, length)))

            # check that the vector isn't already in the results
            if not isDuplicate(zvec, results):
                # pick elements from other vectors
                rvec = list(a)
                for j in range(0, length):
                    if zvec[j] == 0:
                        rvec[activeParams[j]] = a[activeParams[j]]
                    elif zvec[j] == 1:
                        rvec[activeParams[j]] = b[activeParams[j]]

                results.append({"generator": zvec, "x": rvec})

                if len(results) >= count:
                    logger.mixer("Mix count reached, exiting generation loop")
                    break

    # expect to return more in info eventually
    return {"results": results, "info": {"count": len(results)}}
