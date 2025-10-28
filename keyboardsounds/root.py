import os
import sys
import shutil


def get_root():
    if getattr(sys, "frozen", False):
        if os.name == "nt":
            root = os.path.join(os.path.expanduser("~"), "keyboardsounds")
        else:
            root = os.path.join(os.path.expanduser("~"), ".keyboardsounds")

        if not os.path.exists(root):
            os.makedirs(root)

        profiles_dir = os.path.join(root, "profiles")
        application_dir = os.path.dirname(sys.executable)
        application_profiles_dir = os.path.join(application_dir, "profiles")

        if not os.path.exists(profiles_dir):
            os.makedirs(profiles_dir)

        if os.path.exists(application_profiles_dir):
            # Loop through each directory in application_profiles_dir
            for pdir in os.listdir(application_profiles_dir):
                if not os.path.exists(os.path.join(profiles_dir, pdir)):
                    if os.path.isdir(os.path.join(application_profiles_dir, pdir)):
                        shutil.copytree(
                            os.path.join(application_profiles_dir, pdir),
                            os.path.join(profiles_dir, pdir),
                        )

        return root
    else:
        return os.path.dirname(os.path.realpath(__file__))
