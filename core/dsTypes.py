class AnnotatedParam:
    def __init__(self, name, value, dataType):
        self.name = name
        self.value = value
        self.type = dataType


class Training:
    def __init__(self, data, score):
        self.data = data
        self.score = score

    def __str__(self):
        return "X: {0}, y: {1}".format(self.data, self.score)


class DSStatus:
    def __init__(self, code=0, message="Success"):
        self.code = code
        self.message = message

    def __str__(self):
        return "Status {0}: {1}".format(self.code, self.message)
