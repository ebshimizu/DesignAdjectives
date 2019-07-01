from dsTypes import *
import random

# logging setup
import logging

# additional level
MIXER_INFO_LEVEL = 32
logging.addLevelName(MIXER_INFO_LEVEL, "MIXER")


def sample(self, message, *args, **kws):
    if self.isEnabledFor(MIXER_INFO_LEVEL):
        self._log(MIXER_INFO_LEVEL, message, args, **kws)


logging.Logger.sample = sample
logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)-5.5s] %(asctime)s [%(threadName)-12.12s]  %(message)s",
    handlers=[logging.FileHandler("server.log"), logging.StreamHandler()],
)

logger = logging.getLogger()


# returns a mix result objects, containing an object with debug info,
# and an array of objects each containing:
# - the vector itself
# - the bitvector that created it
# this function currently does not de-duplicate
# a snippet parameter may be required in the future
def mix(a, b, count):
    results = []
    length = len(a)
    print("Mixer starting")

    for i in range(0, count):
        # generate 0/1 vector
        zvec = list(map(lambda x: random.randint(0, 1), range(0, length)))

        # pick elements from other vectors
        rvec = list(map(lambda i: a[i] if zvec[i] == 0 else b[i], range(0, length)))

        results.append({"generator": zvec, "x": rvec})

    # expect to return more in info eventually
    return {"results": results, "info": {"count": count}}
