import dsTypes


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

    # runs GPR based on current data set
    def train(self):
        return 0  # TODO: Implement GPR with pyro

    def eval(self, item):
        return 0  # TODO: Implement evaluation against trained GPR

    def sample(self, count=1):
        return 0  # TODO: Implement snipper sampling option
