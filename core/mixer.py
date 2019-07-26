from dsTypes import *
from functools import reduce
from snippet import Snippet
from samplers import *
import math
import random
import numpy.random

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
def mix(a, b, count, bias=0.5, attempts=100):
    results = []
    logger.mixer("Mixer starting")

    logger.mixer("Identifying common parameters")
    # only want to swap things that actually make a visual difference
    activeParams = []
    for i in range(0, len(a)):
        if not math.isclose(a[i], b[i], rel_tol=1e-3):
            activeParams.append(i)

    length = len(activeParams)
    logger.mixer("Identified {0} different params: {1}".format(length, activeParams))

    if length == 0:
        logger.mixer("Vectors are identical, cancelling mix")
    else:
        for i in range(0, attempts):
            # generate 0/1 vector
            zvec = list(
                map(lambda x: 0 if random.random() > bias else 1, range(0, length))
            )

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
    return {"results": results, "info": {"count": len(results), "active": activeParams}}


# this method basically just takes the examples and combines them all together
# this is not expected to work particularly well
# this is predictably a disaster, as snippets with disjoint parameter sets exert
# essentially random control over each other when combined.
def mixGPAll(snippets, params):
    logger.mixer("Starting mixGPAll mix method")
    combined = Snippet("combined")

    # copy a few things, assume first snippet has the defaults
    combined.optSteps = snippets[0].optSteps
    combined.learningRate = snippets[0].learningRate
    combined.lossTolerance = snippets[0].lossTolerance

    logger.mixer("Adding training data")
    # add training data
    for snippet in snippets:
        for tdata in snippet.data:
            combined.addData(tdata)

    # train the new snippet
    logger.mixer("Training new snippet")
    combined.train()

    # sample the stuff
    logger.mixer("Sampling new snippet")
    sampler = Rejection(combined, params["x0"], n=20)
    sampler.start()

    # this is threaded so we'll join then pull the results out
    sampler.join()
    return sampler.results


def weightedObjFunc(x, snippets):
    # eval x on all snippets
    scores = []
    for snippet in snippets:
        scores.append(snippet.predictOne(x))

    # compute weight (not using covariance at the moment)
    ret = 0
    for score in scores:
        ret = ret + score["mean"] / len(snippets)

    return {"mean": ret, "cov": 0}


def nonDetWeightedObjFunc(x, snippets):
    # eval x on all snippets
    scores = []
    for snippet in snippets:
        scores.append(snippet.predictOne(x))

    # select a distribution
    distParams = scores[random.randint(0, len(scores) - 1)]

    # sample from dist
    sampleScore = numpy.random.normal(distParams["mean"], distParams["cov"])

    # do this multiple times???
    # idk, maybe just return for now
    return {"mean": sampleScore, "cov": distParams["cov"]}


def multiObjSample(x0, snippets):
    logger.mixer("Starting multi-objective sampler")
    # order snippets by filter size, randomize order of equal length snippets
    paramOrder = sorted(
        snippets, key=lambda snippet: len(snippet.filter) + random.random()
    )

    fx0 = paramOrder[0].predictOne(x0)["mean"]
    logger.mixer(
        "Snippets randomized. First Snippet: {0} score: {1}".format(
            paramOrder[0].name, fx0
        )
    )

    # sample one from the first snippet
    sampler = Rejection(paramOrder[0], x0, threshold=fx0, n=1, limit=1000)
    sampler.run()
    currentResult = sampler.results[0]["x"] if len(sampler.results) > 0 else x0

    # tracking history of snippet values
    fxs = [paramOrder[0].predictOne(currentResult)["mean"]]

    # for each subsequent thing, run this loop
    for i in range(1, len(paramOrder)):
        nextSnippet = paramOrder[i]
        # sample a thing from the next snippet
        fxn = nextSnippet.predictOne(currentResult)["mean"]
        logger.mixer("Next snippet: {0} score: {1}".format(nextSnippet.name, fxn))

        samplerN = Rejection(nextSnippet, currentResult, threshold=fxn, n=1, limit=1000)
        samplerN.run()
        nextResult = (
            samplerN.results[0]["x"] if len(samplerN.results) > 0 else currentResult
        )

        # accept next result as current with probability relative to how much it improved things overall
        fxs.append(fxn)
        nextFxs = []
        for j in range(0, len(fxs)):
            nextFxs.append(paramOrder[j].predictOne(nextResult)["mean"])

        # sum diffs
        previousScoreTotal = reduce(lambda a, b: a + b, fxs)
        nextScoreTotal = reduce(lambda a, b: a + b, nextFxs)

        logger.mixer(
            "prev score: {0} next score: {1}".format(previousScoreTotal, nextScoreTotal)
        )

        # accept this sample as next with probability similar to a MH MCMC decision
        # probably not gonna work since some of these function values will be negative...
        a = nextScoreTotal / previousScoreTotal
        logger.mixer("a: {0}".format(a))

        # generate uniform
        rng = random.random()
        if rng <= a:
            logger.mixer("accepted with u {0}".format(rng))
            currentResult = nextResult
            fxs = nextFxs
        else:
            logger.mixer("rejected with u {0}".format(rng))

    return {"x": currentResult, "mean": reduce(lambda a, b: a + b, fxs), "cov": 0}


def multiObjMix(snippets, params):
    results = []
    for i in range(0, params["n"]):
        sample = multiObjSample(params["x0"], snippets)
        sample["count"] = i
        sample["idx"] = i
        results.append(sample)

    return results


def mixWeightedObjFunc(snippets, params):
    logger.mixer("Starting mixed objective function method")

    logger.mixer("collecting starting points and filter")
    startPts = []
    paramFilter = []
    for snippet in snippets:
        startPts = startPts + snippet.posExamples()

        f = snippet.filter
        for param in f:
            if param not in paramFilter:
                paramFilter.append(param)

    # the threshold here is really hard to just define absolutely
    # degenerate case probably happens when there is disagreement about goodness of
    # same parameter values
    sampler = GenericRejection(
        params["x0"],
        startPts,
        lambda x: nonDetWeightedObjFunc(x, snippets),
        paramFilter,
        threshold=0.5,
    )
    sampler.start()
    sampler.join()
    return sampler.results


# simple snippet mixing scheme:
# combines training data and then re-trains the snippet
# likely to be a somewhat naive approach
def mixSnippets(snippets, params):
    if params["method"] == "mixGPAll":
        return mixGPAll(snippets, params)
    if params["method"] == "mixWeightedObjFunc":
        return mixWeightedObjFunc(snippets, params)
    if params["method"] == "multiObjMix":
        return multiObjMix(snippets, params)
    else:
        return
