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

snippetServer = dsCore.SnippetServer()

sio = socketio.Client()


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
        val = s.predict(args["data"])
        return None, val
    else:
        return None, False


@sio.on("snippet sample")
def snippetSample(args):
    return None, "unimplemented"
    # s = snippetServer.getSnippet(args["name"])
    # if s:
    # val = s.predict(args["n"])


sio.connect("http://localhost:5234")

logger.info("Design Snippets server launched")
