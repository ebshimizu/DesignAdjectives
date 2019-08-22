class AnnotatedParam:
    def __init__(self, name, value, dataType):
        self.name = name
        self.value = value
        self.type = dataType


class Training:
    def __init__(self, data, score, affected=[]):
        self.data = data
        self.score = score
        self.affected = affected

    def __str__(self):
        return "X: {0}, y: {1}, affected: {2}".format(
            self.data, self.score, self.affected
        )


class DSStatus:
    def __init__(self, code=0, message="Success"):
        self.code = code
        self.message = message

    def __str__(self):
        return "Status {0}: {1}".format(self.code, self.message)


# assumes items have an x (vector) and y value
def objToTraining(items):
    xs = [Training(i["x"], i["y"]) for i in items]
    return xs
