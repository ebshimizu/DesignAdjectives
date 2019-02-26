from dsTypes import *
import os
import torch
import matplotlib.pyplot as plt
import pyro
import pyro.contrib.gp as gp
import pyro.distributions as dist

# debug
pyro.enable_validation(True)


class Snippet:
    def __init__(self, name):
        self.name = name
        self.data = []
        self.filter = []

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
        y = [i.score for i in self.data]

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
        kernel = gp.kernels.RBF(
            input_dim=len(self.filter),
            variance=torch.tensor(5.0),
            lengthscale=torch.tensor(10.0),
        )

        # generate X matrix
        X = self.getXTrain()

        # generate y vector
        y = self.getYTrain()

        print(y)
        # TODO: allow gpr settings per-snippet?
        self.gpr = gp.models.GPRegression(X, y, kernel)

        # hyperparams
        optimizer = torch.optim.Adam(self.gpr.parameters(), lr=0.005)
        loss_fn = pyro.infer.Trace_ELBO().differentiable_loss
        losses = []
        num_steps = 1000
        for i in range(num_steps):
            optimizer.zero_grad()
            loss = loss_fn(self.gpr.model, self.gpr.guide)
            loss.backward()
            optimizer.step()
            losses.append(loss.item())

        # debug
        plt.plot(losses)
        print("variance: {0}".format(self.gpr.kernel.variance.item()))
        print("lengthscale: {0}".format(self.gpr.kernel.lengthscale.item()))
        print("noise: {0}".format(self.gpr.noise.item()))

        return DSStatus(
            code=0, message="Training for snippet {0} complete.".format(self.name)
        )

    def eval(self, item):
        return 0  # TODO: Implement evaluation against trained GPR

    def sample(self, count=1):
        return 0  # TODO: Implement snipper sampling option

    def setDefaultFilter(self):
        # assumption: all data is the same vector length
        if len(self.data) > 0:
            self.filter = list(range(0, len(self.data[0].data)))
        else:
            self.filter = []
