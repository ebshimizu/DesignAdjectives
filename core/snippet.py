from dsTypes import *
from samplers import *
from functools import reduce
import os
import torch
import math
import random
import pyro
import pyro.contrib.gp as gp
import pyro.distributions as dist

import graphUtils

# what if design intent is just sampling from the prior distribution over the preference function

# debug
pyro.enable_validation(True)

# use gpu by default?
# torch.set_default_tensor_type(torch.cuda.FloatTensor)
# torch.cuda.init()

# couple snippet notes
# - Input vectors are assumed to already be normalized. They don't technically have to be for training,
#   but the samplers will fail because they have a hard [0,1] clamp constraint.
class Snippet:
    def __init__(self, name):
        self.name = name
        self.data = []
        self.filter = []
        self.optSteps = 2000
        self.learningRate = 0.005
        self.lossTolerance = -1e2
        self.gpr = None
        self.kernelMode = "RBF"
        self.kernel = {"variance": 1.0, "lengthscale": 1.0}
        self.dirtyKernel = False

    # param filter is a list of which parameter vector indices are to be used
    # for sampling and training
    def setParamFilter(self, filter):
        self.filter = filter

    def applyFilter(self, data):
        # return new set of vectors with filtered out values
        return [
            list(map(lambda x: data[i][x], self.filter)) for i in range(0, len(data))
        ]

    def setData(self, items):
        self.data = items

    def addData(self, item):
        self.data.append(item)

    def addTraining(self, x, y):
        self.data.append(Training(x, y))

    def removeData(self, index):
        if index < len(self.data):
            del self.data[index]

    def changeKernelMode(self, mode):
        self.kernelMode = mode
        self.dirtyKernel = True

    def getNewKernel(self):
        # check types, RBF is only valid one for now
        return gp.kernels.RBF(
            input_dim=len(self.filter),
            variance=torch.tensor(self.kernel["variance"]),
            lengthscale=torch.tensor(self.kernel["lengthscale"]),
        )

    def setKernelParams(self, data):
        self.kernel = data

    def loadGPR(self):
        # might need to change this at some point
        self.setDefaultFilter()

        # generate X matrix
        X = self.getXTrain()

        # generate y vector
        y = self.getYTrain()

        # load kernel settings
        # after this line, should be ok to eval (only relies on kernel params and input data)
        self.gpr = gp.models.GPRegression(X, y, self.getNewKernel())

    def getXTrain(self):
        # returns training data vector. Row-wise (?)
        X = []
        for t in self.data:
            v = t.data
            X.append([v[idx] for idx in self.filter])

        return torch.tensor(X)

    def getYTrain(self):
        y = [float(i.score) for i in self.data]

        return torch.tensor(y)

    # runs GPR based on current data set
    def train(self):
        # check that training data exists
        if len(self.data) == 0:
            return DSStatus(
                code=-1,
                message="Snippet training failure. No training data set for Snippet {0}".format(
                    self.name
                ),
            )

        # In the event that additional data points have extended the relevant dimensions,
        # adjust the filter.
        # TODO: allow custom overrides for the filter
        self.setDefaultFilter()

        # TODO: allow kernel settings per-snippet?
        # for retraining, use exising variance/lengthscale
        if self.gpr and ~self.dirtyKernel:
            kernel = self.gpr.kernel
        else:
            kernel = self.getNewKernel()

        # generate X matrix
        X = self.getXTrain()

        # generate y vector
        y = self.getYTrain()

        # TODO: allow gpr settings per-snippet?
        self.gpr = gp.models.GPRegression(X, y, kernel)

        # hyperparams
        optimizer = torch.optim.Adam(self.gpr.parameters(), lr=self.learningRate)
        loss_fn = pyro.infer.Trace_ELBO().differentiable_loss
        self.losses = []
        for i in range(self.optSteps):
            optimizer.zero_grad()
            loss = loss_fn(self.gpr.model, self.gpr.guide)
            loss.backward()
            optimizer.step()
            self.losses.append(loss.item())

            # short-circuit past an arbitrary threshold
            if loss.item() < self.lossTolerance:
                print("Loss tolerance met early, breaking. Loss {0}".format(loss))
                break

        # debug
        # plt.plot(losses)
        retData = {}
        retData["variance"] = self.gpr.kernel.variance.item()
        retData["lengthscale"] = self.gpr.kernel.lengthscale.item()
        retData["noise"] = self.gpr.noise.item()
        retData["type"] = self.kernelMode
        retData["code"] = 0
        retData["message"] = "Snippet {0} training complete".format(self.name)

        return retData

    def plotLastLoss(self):
        graphUtils.plotLoss(self.losses)

    def plot1D(self, x, dim, rmin=0, rmax=1, n=100):
        graphUtils.plot1DPredictions(x, self, paramIdx=dim, rmin=rmin, rmax=rmax, n=n)

    def predict(self, items):
        # need to filter the input based on the current filter val
        Xtest = torch.tensor(self.applyFilter(items))
        with torch.no_grad():
            if type(self.gpr) == gp.models.VariationalSparseGP:
                mean, cov = self.gpr(Xtest, full_cov=True)
            else:
                mean, cov = self.gpr(Xtest, full_cov=True, noiseless=False)

        return {"mean": mean, "cov": cov}

    def predictOne(self, item):
        # identical to predict, but returns scalars
        res = self.predict([item])
        return {"mean": res["mean"].item(), "cov": res["cov"].item()}

    def predict1D(self, x, dim, rmin=0, rmax=1, n=10):
        XRange = torch.linspace(rmin, rmax, n)
        XTest = []
        for i in XRange:
            xt = x.copy()
            xt[dim] = i
            XTest.append(xt)

        res = self.predict(XTest)
        return {
            "mean": res["mean"].numpy().tolist(),
            "cov": res["cov"].numpy().tolist(),
        }

    def predictAll1D(self, x, rmin=0, rmax=1, n=10):
        dims = {}
        for i in self.filter:
            res = self.predict1D(x, i, rmin, rmax, n)
            dims[i] = res
        return dims

    def x0(self):
        if self.data:
            # NOTE: CHANGE LATER THIS ASSUMES FIRST EXAMPLE IS POSITIVE
            return self.data[0].data
        else:
            return 0

    # returns the positive example from the example set
    def posExamples(self):
        pos = []
        for i in self.data:
            if i.score > 0:
                pos.append(i.data)

        return pos

    def setDefaultFilter(self):
        # assumption: all data is the same vector length
        self.filter = []

        # for each parameter
        for i in range(0, len(self.data[0].data)):
            # extract vector of params
            p = list(map(lambda x: x.data[i], self.data))

            # map again, test == to first val
            p0 = p[0]
            isEq = list(map(lambda x: math.isclose(x, p0, rel_tol=1e-5), p))

            # reduce with &
            allEq = reduce(lambda x, y: x and y, isEq)

            if not allEq:
                self.filter.append(i)
