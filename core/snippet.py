from dsTypes import *
from samplers import *
from functools import reduce
import os
import torch
import math
import random
import gpytorch

import graphUtils

# what if design intent is just sampling from the prior distribution over the preference function

# debug
# pyro.enable_validation(True)

# use gpu by default?
# torch.set_default_tensor_type(torch.cuda.FloatTensor)
# torch.cuda.init()


class ExactGPModel(gpytorch.models.ExactGP):
    def __init__(self, train_x, train_y, likelihood, num_dims):
        super(ExactGPModel, self).__init__(train_x, train_y, likelihood)
        self.mean_module = gpytorch.means.ConstantMean()
        # self.base_covar_module = gpytorch.kernels.ScaleKernel(
        #     gpytorch.kernels.RBFKernel()
        # )
        # self.covar_module = gpytorch.kernels.InducingPointKernel(
        #     self.base_covar_module,
        #     inducing_points=train_x[:100, :],
        #     likelihood=likelihood,
        # )
        self.covar_module = gpytorch.kernels.ScaleKernel(
            gpytorch.kernels.RBFKernel(ard_num_dims=num_dims)
        )

    def forward(self, x):
        mean_x = self.mean_module(x)
        covar_x = self.covar_module(x)
        return gpytorch.distributions.MultivariateNormal(mean_x, covar_x)


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
        self.lossTolerance = 1e-5
        self.gpr = None
        self.kernelMode = "RBF"
        self.kernel = {"variance": 1.0, "lengthscale": 1.0}
        self.dirtyKernel = False
        self.likelihood = gpytorch.likelihoods.GaussianLikelihood()

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
        # TODO: remove or fix, using new gpr module
        return None

    def setKernelParams(self, data):
        self.kernel = data

    def unTorchStateDict(self):
        stateDict = self.gpr.state_dict()
        for key in stateDict:
            stateDict[key] = stateDict[key].numpy().tolist()

        return stateDict

    def torchStateDict(self, state):
        for key in state:
            state[key] = torch.tensor(state[key])

        return state

    # load data
    def loadGPR(self, trainData, state, filter=None):
        # set the X and Y examples
        self.setData(trainData)

        # construct GPR
        # note: user should re-set filter manually after this completes (for now)
        if filter is None:
            self.setDefaultFilter()
        else:
            self.setParamFilter(filter)

        self.likelihood = gpytorch.likelihoods.GaussianLikelihood()
        self.gpr = ExactGPModel(
            self.getXTrain(), self.getYTrain(), self.likelihood, len(self.filter)
        )

        # load kernel settings
        self.gpr.load_state_dict(self.torchStateDict(state))

    def getXTrain(self):
        # returns training data vector. Row-wise (?)
        X = []
        for t in self.data:
            v = t.data
            X.append([float(v[idx]) for idx in self.filter])

        return torch.tensor(X)

    def getYTrain(self):
        y = [float(i.score) for i in self.data]

        return torch.tensor(y)

    # runs GPR based on current data set
    def train(self, optCB=None, customFilter=None):
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
        if customFilter is not None:
            self.setParamFilter(customFilter)
        else:
            self.setDefaultFilter()

        # generate X matrix
        X = self.getXTrain()

        # generate y vector
        y = self.getYTrain()

        # TODO: allow gpr settings per-snippet?
        # self.gpr = gp.models.GPRegression(X, y, kernel)
        self.likelihood = gpytorch.likelihoods.GaussianLikelihood()
        self.gpr = ExactGPModel(X, y, self.likelihood, len(self.filter))

        self.gpr.train()
        self.likelihood.train()

        # hyperparams
        optimizer = torch.optim.Adam(
            [{"params": self.gpr.parameters()}], lr=self.learningRate
        )
        mll = gpytorch.mlls.ExactMarginalLogLikelihood(self.likelihood, self.gpr)
        self.losses = []
        for i in range(self.optSteps):
            optimizer.zero_grad()
            output = self.gpr(X)
            loss = -mll(output, y)
            loss.backward()
            # print(
            #     "Iter %d/%d - Loss: %.3f   lengthscale: %.3f   noise: %.3f"
            #     % (
            #         i + 1,
            #         self.optSteps,
            #         loss.item(),
            #         self.gpr.covar_module.base_kernel.lengthscale.item(),
            #         self.gpr.likelihood.noise.item(),
            #     )
            # )

            if optCB:
                optCB(loss.item())

            self.losses.append(loss.item())
            optimizer.step()

        # debug
        # plt.plot(losses)
        retData = {}
        retData["state"] = self.unTorchStateDict()
        retData["type"] = self.kernelMode
        retData["code"] = 0
        retData["losses"] = self.losses
        retData["message"] = "Snippet {0} training complete".format(self.name)

        return retData

    def plotLastLoss(self):
        graphUtils.plotLoss(self.losses)

    def plot1D(self, x, dim, rmin=0, rmax=1, n=100):
        graphUtils.plot1DPredictions(x, self, paramIdx=dim, rmin=rmin, rmax=rmax, n=n)

    def predict(self, items):
        self.gpr.eval()
        self.likelihood.eval()

        # need to filter the input based on the current filter val
        Xtest = torch.tensor(self.applyFilter(items))
        with torch.no_grad(), gpytorch.settings.fast_pred_var():
            observed_pred = self.likelihood(self.gpr(Xtest))

        return {"mean": observed_pred.mean, "cov": observed_pred.variance}

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

    def getDefaultFilter(self):
        # assumption: all data is the same vector length
        filter = []

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
                filter.append(i)

        return filter

    def setDefaultFilter(self):
        self.setParamFilter(self.getDefaultFilter())

    # returns a set of parameters that meet an impact threshold
    # Impact here is going to be defined as parameters that cause
    # large changes in the score value, relative to the variation across
    # the 1D parameter sweeps at the given point
    def identifyHighImpactParams(self, x0, magnitudeThreshold=0.75):
        # coarse sweep, n = 10
        paramScores = self.predictAll1D(x0, n=10)
        paramMag = {}
        maxMag = 0

        # determine max magnitude changes
        for id in paramScores:
            paramMag[id] = max(paramScores[id]["mean"]) - min(paramScores[id]["mean"])
            if paramMag[id] > maxMag:
                maxMag = paramMag[id]

        # determine if a param meets the threshold
        params = []
        threshold = maxMag * magnitudeThreshold
        for id in paramMag:
            if paramMag[id] > threshold:
                params.append(int(id))

        return params

    # similar to high impact params, best params are those that can achieve close to maximal
    # values along their 1D sweep range relative to the given x0
    def identifyBestParams(self, x0, bestThreshold=0.75):
        # coarse sweep
        paramScores = self.predictAll1D(x0, n=10)
        paramMax = {}
        scoreMax = 0

        # determine max magnitude changes
        for id in paramScores:
            paramMax[id] = max(paramScores[id]["mean"])
            if paramMax[id] > scoreMax:
                scoreMax = paramMax[id]

        # determine if a param meets the threshold
        params = []
        threshold = scoreMax * bestThreshold
        for id in paramMax:
            if paramMax[id] > threshold:
                params.append(int(id))

        return params
