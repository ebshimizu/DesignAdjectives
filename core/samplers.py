# the main issue with using GPR for preference function estimation is
# that it doesn't help that much with providing new design suggestions
# (GPR estimates f | X and f* | f, X, X* and i want to sample X | f)

from dsTypes import *
import random
import torch
import pyro
import pyro.distributions as dist

# logging setup
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format="[%(levelname)-5.5s] %(asctime)s [%(threadName)-12.12s]  %(message)s",
    handlers=[logging.FileHandler("sampler.log"), logging.StreamHandler()],
)
logger = logging.getLogger()

# epsilon: similarity threshold for adding final samples to the return set
def metropolis(
    f,
    x0,
    qMin=0.6,
    epsilon=0.1,
    n=10,
    burn=100,
    limit=1e5,
    stride=1,
    scale=0.05,
    cb=None,
):
    # initialize
    logger.info("Metropolis sampler initializing...")
    fx = f.predict([x0])
    x = list(x0)
    count = 0
    accept = []
    g = dist.MultivariateNormal(torch.zeros(len(x)), torch.eye(len(x)) * scale)

    while count < limit:
        # generate
        xp = torch.tensor(x) + g.sample()

        # bounds (assuming normalized, if not will need a key)
        torch.clamp(xp, 0.0, 1.0)

        fxp = f.predict(xp.view(1, -1).t())

        # test
        a = fxp["mean"] / fx["mean"]
        if fx["mean"] == 0:
            a = 1

        # accept?
        if random.random() < a:
            logger.debug("Accepted val {0}".format(fxp["mean"]))
            # check burnin
            count = count + 1

            if count > burn & count % stride == 0:
                # acceptance check
                # check for similarities
                # checkSimilarity()
                retObj = {
                    "x": xp.tolist(),
                    "mean": fxp["mean"],
                    "cov": fxp["cov"],
                    "idx": count,
                }
                if cb:
                    cb(retObj)
                accept.append(retObj)

                x = xp.tolist()

        if len(accept) > n:
            break

    return accept
