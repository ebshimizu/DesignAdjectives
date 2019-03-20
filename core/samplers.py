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
    logger.info("Metropolis sampler initializing. Burn: {0}, n: {1}".format(burn, n))
    fx = f.predict([x0])
    x = torch.tensor(x0)
    count = 0
    accept = []
    g = dist.MultivariateNormal(torch.zeros(len(x)), torch.eye(len(x)) * scale)

    while count < limit:
        # generate
        xp = x + g.sample()

        # bounds (assuming normalized, if not will need a key)
        xp = torch.clamp(xp, 0.0, 1.0)

        fxp = f.predict(xp.view(-1, 1).t())

        # test
        a = fxp["mean"] / fx["mean"]
        if fx["mean"] == 0:
            a = 1

        # accept?
        if random.random() < a:
            # check burnin
            count = count + 1

            if (count > burn) & (count % stride == 0) & (fxp["mean"] > qMin):
                # acceptance check
                if checkSimilarity(xp, accept, epsilon, l2Dist):
                    logger.info(
                        "[{0}/{1} ct: {2}] Accepted {3} mean: {4}".format(
                            len(accept) + 1, n, count, xp, fxp["mean"]
                        )
                    )

                    if cb:
                        cb(
                            {
                                "x": xp.tolist(),
                                "mean": fxp["mean"],
                                "cov": fxp["cov"],
                                "idx": count,
                            }
                        )

                    accept.append(
                        {"x": xp, "mean": fxp["mean"], "cov": fxp["cov"], "idx": count}
                    )

                    x = torch.tensor(xp)
                    fx = fxp

        if len(accept) >= n:
            break

    # listify the vectors (they are torch tensors at this point)
    for d in accept:
        d["x"] = d["x"].tolist()

    return accept
