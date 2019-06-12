# the design snippets server is a socket.io-based API that allows
# remote access to the snippets currently listed in the system. The server handles
# data marshalling. Should be compatible with the node implementation of sio as well.
import socketio
import sys
import engineio
import eventlet

sys.path.append("../core")
import dsCore
import dsTypes
import samplers

# logging setup
import logging

logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)-5.5s] %(asctime)s [%(threadName)-12.12s]  %(message)s",
    handlers=[logging.FileHandler("server.log"), logging.StreamHandler()],
)
logger = logging.getLogger()


def logExc(exctype, value, tb):
    logger.exception("Uncaught Exception")


sys.excepthook = logExc

currentSampler = None

snippetServer = dsCore.SnippetServer()

sio = socketio.Client()


def sampleSingleResult(data, name):
    data["x"] = data["x"]
    sio.emit("single sample", {"data": data, "name": name})


def sampleFinal(data, name):
    sio.emit("sampler complete", {"data": data, "name": name})


@sio.on("connect")
def onConnect():
    logger.info("connected")


@sio.on("getType")
def onType():
    logger.info("Relay requested connection type.")
    return "server"


@sio.on("add snippet")
def addSnippet(args):
    res = snippetServer.addSnippet(args["name"])
    logger.info(res)
    return None, {"code": res.code, "message": res.message}


@sio.on("delete snippet")
def deleteSnippet(args):
    res = snippetServer.deleteSnippet(args["name"])
    logger.info(res)
    return None, {"code": res.code, "message": res.message}


@sio.on("list snippets")
def listSnippets(args):
    res = snippetServer.listSnippets()
    logger.info(res)
    return None, res


@sio.on("snippet set filter")
def snippetSetFilter(args):
    s = snippetServer.getSnippet(args["name"])
    if s:
        s.setParamFilter(args["filter"])
        return None, True
    else:
        return None, False


@sio.on("snippet set data")
def setData(args):
    s = snippetServer.getSnippet(args["name"])
    if s:
        s.setData(dsTypes.objToTraining(args["data"]))
        return None, True
    else:
        return None, False


@sio.on("snippet add data")
def addData(args):
    s = snippetServer.getSnippet(args["name"])
    if s:
        s.addData(dsTypes.Training(args["x"], args["y"]))
        return None, True
    else:
        return None, False


@sio.on("snippet remove data")
def removeData(args):
    s = snippetServer.getSnippet(args["name"])
    if s:
        s.removeData(args["index"])
        return None, True
    else:
        return None, False


@sio.on("snippet train")
def trainSnippet(args):
    s = snippetServer.getSnippet(args["name"])
    if s:
        ret = s.train()
        return None, ret
    else:
        return None, False


@sio.on("snippet plotLastLoss")
def snippetPlotLastLoss(args):
    s = snippetServer.getSnippet(args["name"])
    if s:
        s.plotLastLoss()
        return None, True
    else:
        return None, False


@sio.on("snippet plot1D")
def snippetPlot1D(args):
    s = snippetServer.getSnippet(args["name"])
    if s:
        s.plot1D(args["x"], args["dim"], args["rmin"], args["rmax"], args["n"])
        return None, True
    else:
        return None, False


@sio.on("snippet setProp")
def snippetSetProp(args):
    s = snippetServer.getSnippet(args["name"])
    if s:
        setattr(s, args["propName"], args["val"])
        return None, True
    else:
        return None, False


@sio.on("snippet getProp")
def snippetGetProp(args):
    s = snippetServer.getSnippet(args["name"])
    if s:
        val = getattr(s, args["propName"])
        return None, val
    else:
        return None, False


@sio.on("snippet predict")
def snippetPredict(args):
    s = snippetServer.getSnippet(args["name"])
    if s:
        print(args["data"])
        val = s.predict(args["data"])
        val["mean"] = val["mean"].numpy().tolist()
        val["cov"] = val["cov"].numpy().toList()
        return None, val
    else:
        return None, False


@sio.on("snippet predict one")
def snippetPredict(args):
    s = snippetServer.getSnippet(args["name"])
    if s:
        print(args["data"])
        val = s.predictOne(args["data"])
        return None, val
    else:
        return None, False


@sio.on("snippet sample")
def snippetSample(args):
    global currentSampler
    if currentSampler is None or (not currentSampler.is_alive()):
        s = snippetServer.getSnippet(args["name"])
        if s:
            currentSampler = samplers.Rejection(
                s,
                name=args["name"],
                cb=lambda data: sampleSingleResult(data, args["name"]),
                final=sampleFinal,
                **args["data"]
            )
            # currentSampler = samplers.Metropolis(
            #     s,
            #     name=args["name"],
            #     cb=lambda data: sampleSingleResult(data, args["name"]),
            #     final=sampleFinal,
            #     **args["data"],
            # )
            currentSampler.start()
            return None, True
        else:
            return None, False
    else:
        return "sampler is already running", False


@sio.on("stop sampler")
def stopSampler(args):
    global currentSampler
    if currentSampler and currentSampler.is_alive():
        currentSampler.stop()
        currentSampler.join()
        logger.info("Sampler thread for {0} stopped".format(currentSampler.name))
        return None, True
    else:
        return None, True


@sio.on("sampler running")
def samplerRunning(args):
    global currentSampler
    return None, currentSampler and currentSampler.is_alive()


@sio.on("reset")
def reset(args):
    snippetServer.deleteAllSnippets()
    logger.info("Server Reset Complete")
    return None, True


@sio.on("snippet load gpr")
def snippetLoadKernel(args):
    s = snippetServer.getSnippet(args["name"])
    if s:
        s.setKernelParams(args["kernelData"])
        s.loadGPR()
        return None, True
    else:
        return None, False


@sio.on("snippet 1DPredict")
def snippet1DPredict(args):
    s = snippetServer.getSnippet(args["name"])
    if s:
        # 1d predict, assumes normalized range 0-1
        res = s.predict1D(**args["data"])
        return None, res
    else:
        return None, False


@sio.on("snippet 1DPredictAll")
def snippet1DPredictAll(args):
    s = snippetServer.getSnippet(args["name"])
    if s:
        # 1d predict, assumes normalized range 0-1
        res = s.predictAll1D(**args["data"])
        return None, res
    else:
        return None, False


sio.connect("http://localhost:5234")

logger.info("Design Snippets server launched")
