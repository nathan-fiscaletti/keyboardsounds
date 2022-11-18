import os

class PathResolver:
    def __init__(self, root: str):
        self.root = root

    def get_file_path(self, child: str):
        return os.path.join(self.root, child)