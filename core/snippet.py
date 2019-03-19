from dsTypes import *
from samplers import *
import os
import torch
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


class Snippet:
    def __init__(self, name):
        self.name = name
        self.data = []
        self.filter = []
        self.optSteps = 2000
        self.learningRate = 0.005
        self.lossTolerance = -1e2
        self.gpr = None

    # param filter is a list of which parameter vector indices are to be used
    # for sampling and training
    def setParamFilter(self, filter):
        self.filter = filter

    def setData(self, items):
        self.data = items

    def addData(self, item):
        self.data.append(item)

    def removeData(self, index):
        if index < len(self.data):
            del self.data[index]

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

        # check that a filter has been set to include at least one parameter
        if len(self.filter) == 0:
            # and if not, set it to all (default)
            self.setDefaultFilter()

        # TODO: allow kernel settings per-snippet?
        # for retraining, use exising variance/lengthscale
        if self.gpr:
            kernel = self.gpr.kernel
        else:
            kernel = gp.kernels.RBF(
                input_dim=len(self.filter),
                variance=torch.tensor(5.0),
                lengthscale=torch.tensor(10.0),
            )

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
        retData["code"] = 0
        retData["message"] = "Snippet {0} training complete".format(self.name)

        return retData

    def plotLastLoss(self):
        graphUtils.plotLoss(self.losses)

    def plot1D(self, x, dim, rmin=0, rmax=1, n=100):
        graphUtils.plot1DPredictions(
            x, self.gpr, paramIdx=dim, rmin=rmin, rmax=rmax, n=n
        )

    def predict(self, items):
        Xtest = torch.tensor(items)
        with torch.no_grad():
            if type(self.gpr) == gp.models.VariationalSparseGP:
                mean, cov = self.gpr(Xtest, full_cov=True)
            else:
                mean, cov = self.gpr(Xtest, full_cov=True, noiseless=False)

        return {"mean": mean.item(), "cov": cov.item()}

    # remember that gpr samples are functions.
    # there should be another function for actually sampling
    # for new designs.
    def sample(self, count=1):
        return []

    def setDefaultFilter(self):
        # assumption: all data is the same vector length
        if len(self.data) > 0:
            self.filter = list(range(0, len(self.data[0].data)))
        else:
            self.filter = []
