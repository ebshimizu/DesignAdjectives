import json
from snippet import *
from dsTypes import *

import os
import torch
import matplotlib

import time
import sys
import random

# opt iteration counts to test
iters = [10, 50, 100, 200, 300, 400, 500]  # , 1000, 2000]
snippets = {}
results = {}

# arg order
# 1 - training set OR keyword "random"
# 2 - training snippet name
# 3 - test set (can be same as training file)
# 4 - test snippet name
# 5 - output filename
allTrainData = None
allTestData = None
prefix = ""
outFilePath = ""

if sys.argv[1] != "random":
    # test on "real" dataset
    # import data
    with open(sys.argv[1], "r") as bricksFile:
        bricksData = json.load(bricksFile)

    with open(sys.argv[3], "r") as bricksFile:
        bricksTest = json.load(bricksFile)

    print("Loaded train data from {0} snippet {1}".format(sys.argv[1], sys.argv[2]))
    print("Loaded test data from {0} snippet {1}".format(sys.argv[3], sys.argv[4]))
    print("Results will be saved to {0}".format(sys.argv[5]))

    # pull relevant snippet data
    allTrainData = objToTraining(bricksData[sys.argv[2]]["data"])
    allTestData = bricksTest[sys.argv[4]]["data"]
    prefix = sys.argv[2]
    outFilePath = sys.argv[5]

else:
    # generate a random series of data and force the optimizer to match (probably worst case)
    # generate train
    count = int(float(sys.argv[2]))
    dim = int(float(sys.argv[3]))
    test = int(float(sys.argv[4]))
    dist = torch.distributions.Uniform(torch.zeros(dim), torch.ones(dim))
    allTrainData = []
    allTestData = []

    for i in range(0, count):
        allTrainData.append(
            {
                "x": dist.sample().numpy().tolist(),
                "y": 1 if random.randint(0, 1) == 1 else -1,
            }
        )

    allTrainData = objToTraining(allTrainData)

    for i in range(0, test):
        allTestData.append({"x": dist.sample().numpy().tolist()})

    print("Initialized random training set. {0} dims, {1} points".format(dim, count))
    print("Initialized random test set. {0} test points".format(test))
    print("Results will be saved to {0}".format(sys.argv[5]))
    outFilePath = sys.argv[5]
    prefix = "rand"


# create snippets and set iters
for i in iters:
    sn = Snippet("{0}-{1}".format(prefix, i))
    sn.optSteps = i
    sn.setData(allTrainData)
    snippets[i] = sn

for key in snippets:
    # benchmark testing
    s = snippets[key]
    print("Testing Snippet {0} - iters: {1}".format(s.name, s.optSteps))

    t = time.perf_counter()
    res = s.train()
    elapsed = time.perf_counter() - t

    # print results
    res["time"] = elapsed
    results[key] = res
    print("Snippet {0} training complete".format(s.name))
    print("{0}s, loss: {1}".format(elapsed, s.losses[-1]))

# should export to CSV or something
# losses
outCSV = "id,iters,time,pct max,loss,loss delta"
maxTime = results[iters[-1]]["time"]
maxLoss = snippets[iters[-1]].losses[-1]

# add test column headers and data
testRefVals = []

for i in range(0, len(allTestData)):
    pt = allTestData[i]
    testRefVals.append(snippets[iters[-1]].predictOne(pt["x"])["mean"])
    outCSV = outCSV + ",pred{0},err{0}".format(i)

outCSV = outCSV + "\n"

for key in snippets:
    s = snippets[key]
    res = results[key]

    row = "{0},{1},{2},{3}%,{4},{5}".format(
        s.name,
        s.optSteps,
        res["time"],
        res["time"] / maxTime * 100,
        s.losses[-1],
        s.losses[-1] - maxLoss,
    )

    for i in range(0, len(allTestData)):
        pt = allTestData[i]
        pred = s.predictOne(pt["x"])["mean"]
        row = row + ",{0},{1}".format(pred, pred - testRefVals[i])

    outCSV = outCSV + row + "\n"

print(outCSV)
outFile = open(sys.argv[5], "w")
outFile.write(outCSV)

# test on randomized "fake" dataset (worst case performance assumed)
