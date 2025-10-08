import os
import sys
import shutil


def get_root():
    if getattr(sys, "frozen", False):
        if os.name == "nt":
            root = os.path.join(os.path.expanduser("~"), "keyboardsounds")
        else:
            root = os.path.join(os.path.expanduser("~"), ".keyboardsounds")

        profiles_dir = os.path.join(root, "profiles")
        if not os.path.exists(profiles_dir):
            # Create the profiles directory
            os.makedirs(profiles_dir, exist_ok=True)

            # Copy existing profiles from application directory
            application_dir = os.path.dirname(sys.executable)
            application_profiles_dir = os.path.join(application_dir, "profiles")
            if os.path.exists(application_profiles_dir):
                shutil.copytree(application_profiles_dir, profiles_dir)

        return root
    else:
        return os.path.dirname(os.path.realpath(__file__))
