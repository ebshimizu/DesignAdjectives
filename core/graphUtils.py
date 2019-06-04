import pyro
import pyro.contrib.gp as gp
import matplotlib.pyplot as plt
import torch


def plotLoss(losses):
    plt.figure()
    plt.plot(losses)
    plt.show()


def plot1DPredictions(x, model, paramIdx=0, rmin=0, rmax=1, n=100):
    plt.figure()

    XRange = torch.linspace(rmin, rmax, n)
    XTest = []
    for i in XRange:
        xt = x.copy()
        xt[paramIdx] = i
        XTest.append(xt)

    res = model.predict(XTest)
    mean = res["mean"]
    cov = res["cov"]

    sd = cov.diag().sqrt()  # standard deviation at each input point x
    plt.plot(XTest, mean.numpy(), "r", lw=2)  # plot the mean
    plt.fill_between(
        torch.reshape(
            XRange, (-1,)
        ).numpy(),  # plot the two-sigma uncertainty about the mean
        (mean - 2.0 * sd).numpy(),
        (mean + 2.0 * sd).numpy(),
        color="C0",
        alpha=0.3,
    )

    plt.show()
