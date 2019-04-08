from snippet import Snippet
from dsTypes import DSStatus


class SnippetServer:
    def __init__(self):
        self.snippets = {}

    def addSnippet(self, name):
        if name not in self.snippets:
            self.snippets[name] = Snippet(name)
            return DSStatus(code=0, message="Added Snippet: {0}".format(name))
        else:
            return DSStatus(
                code=-1,
                message="Failed to add Snippet with name {0}. Snippet already exists.".format(
                    name
                ),
            )

    def deleteSnippet(self, name):
        if name in self.snippets:
            del self.snippets[name]
            return DSStatus(code=0, message="Deleted Snippet: {0}".format(name))
        else:
            return DSStatus(
                code=-1,
                message="Failed to delete Snippet with name {0}. Snippet does not exist.".format(
                    name
                ),
            )

    def getSnippet(self, name):
        if name in self.snippets:
            return self.snippets[name]
        else:
            return None

    def listSnippets(self):
        return list(self.snippets.keys())

    def deleteAllSnippets(self):
        self.snippets = {}
