import os
import sys


def get_root():
    if getattr(sys, "frozen", False):
        if os.name == "nt":
            root = os.path.join(os.path.expanduser("~"), "keyboardsounds")
        else:
            root = os.path.join(os.path.expanduser("~"), ".keyboardsounds")

        os.makedirs(os.path.join(root, "profiles"), exist_ok=True)
        return root
    else:
        return os.path.dirname(os.path.realpath(__file__))
