import os

class PathResolver:
    def __init__(self, root: str):
        self.root = root

    def get_child(self, child: str):
        return PathResolver(os.path.join(self.root, child))
    
    def get_path(self):
        return self.root