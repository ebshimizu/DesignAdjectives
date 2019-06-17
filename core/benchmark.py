import json
from snippet import *
from dsTypes import *

import os
import torch
import matplotlib

import time

# opt iteration counts to test
iters = [10, 50, 100, 200, 300, 400, 500, 1000, 2000]
snippets = {}
results = {}

# test on "real" dataset
# import data
with open("./benchmarks/bricks.json", "r") as bricksFile:
    bricksData = json.load(bricksFile)

with open("./benchmarks/bricks-test.json", "r") as bricksFile:
    bricksTest = json.load(bricksFile)

# pull relevant snippet data
weatheredAllData = objToTraining(bricksData["weathered"]["data"])
weatheredTestData = bricksTest["test points"]["data"]

# create snippets and set iters
for i in iters:
    sn = Snippet("weathered-{0}".format(i))
    sn.optSteps = i
    sn.setData(weatheredAllData)
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
    print("Snippet {0} training complete")
    print("{0}s, loss: {1}".format(elapsed, s.losses[-1]))

# should export to CSV or something
# losses
outCSV = "id,iters,time,pct max,loss,loss delta,pred1,err1,pred2,err2,pred3,err3\n"
maxTime = results[iters[-1]]["time"]
maxLoss = snippets[iters[-1]].losses[-1]
p1 = snippets[iters[-1]].predictOne(weatheredTestData[0]["x"])["mean"]
p2 = snippets[iters[-1]].predictOne(weatheredTestData[1]["x"])["mean"]
p3 = snippets[iters[-1]].predictOne(weatheredTestData[2]["x"])["mean"]

for key in snippets:
    s = snippets[key]
    res = results[key]

    row = "{0},{1},{2},{3}%,{4},{5},{6},{7},{8},{9},{10},{11}\n".format(
        key,
        s.optSteps,
        res["time"],
        res["time"] / maxTime * 100,
        s.losses[-1],
        s.losses[-1] - maxLoss,
        s.predictOne(weatheredTestData[0]["x"])["mean"],
        s.predictOne(weatheredTestData[0]["x"])["mean"] - p1,
        s.predictOne(weatheredTestData[1]["x"])["mean"],
        s.predictOne(weatheredTestData[1]["x"])["mean"] - p2,
        s.predictOne(weatheredTestData[2]["x"])["mean"],
        s.predictOne(weatheredTestData[2]["x"])["mean"] - p3,
    )

    outCSV = outCSV + row

print(outCSV)
outFile = open("benchmarks/results.csv", "w")
outFile.write(outCSV)

# test on randomized "fake" dataset (worst case performance assumed)
