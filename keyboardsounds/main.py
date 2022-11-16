import argparse
import sys
import os
import json

from importlib.metadata import version

from keyboardsounds.daemon_manager import DaemonManager
from keyboardsounds.profile import Profile
from keyboardsounds.root import ROOT

def main():
    LOCK_FILE = f"{ROOT}/.lock"

    dm = DaemonManager(LOCK_FILE)
    if dm.capture_daemon_initialization():
        return

    version_number = version("keyboardsounds")

    usage = (
        f"usage: {os.linesep * 2}"
        f"  manage daemon:{os.linesep * 2}"
        f"    %(prog)s start [-v <volume>] [-p <profile>] [-r]{os.linesep}"
        f"    %(prog)s stop{os.linesep}"
        f"    %(prog)s status{os.linesep * 2}"
        f"  manage profiles:{os.linesep * 2}"
        f"    %(prog)s add-profile -z <zipfile>{os.linesep}"
        f"    %(prog)s remove-profile -n <profile>{os.linesep}"
        f"    %(prog)s list-profiles{os.linesep * 2}"
        f"  other:{os.linesep * 2}"
        f"    %(prog)s version{os.linesep}"
    )

    parser = argparse.ArgumentParser(
        prog=f"keyboardsounds",
        usage=argparse.SUPPRESS,
        description=f"Keyboard Sounds v{version_number}{os.linesep * 2}{usage}{os.linesep}",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument("action", choices=["start", "stop", "status", "add-profile", "remove-profile", "list-profiles"], help="The action to perform")
    
    # Start Action
    parser.add_argument("-v", "--volume", type=int, default=100, metavar="volume", help="volume of the sound effects (0-100), default 100")
    parser.add_argument("-p", "--profile", type=str, default="ios", metavar="profile", help="sound profile to use, default 'ios'")
    parser.add_argument("-r", "--repeat", default=False, action="store_true", help="repeat the sound effect when the key is held down")

    # Profiles
    parser.add_argument("-n", "--name", type=str, default=None, metavar="name", help="name of the profile remove")
    parser.add_argument("-z", "--zip", type=str, default=None, metavar="file", help="path to the zip file containing the profile to add")

    parser.add_argument("-V", "--version", action="version", version=version_number)

    args = parser.parse_args()

    if args.action == "start":
        status = dm.status()
        if status == "running":
            print("Re-configuring running instance of Keyboard Sounds daemon...")
        elif status == "stale" or status == "free":
            print("Starting Keyboard Sounds daemon...")
        if not dm.try_start(volume=args.volume, profile=args.profile, repeat=args.repeat):
            print("Failed to start.")
            return;
        print(f"Started Keyboard Sounds.")
    elif args.action == "stop":
        stopped = dm.try_stop()
        print("Stopped Keyboard Sounds daemon." if stopped else "Failed to stop Keyboard Sounds daemon. Is it running?")
    elif args.action == "status":
        status = dm.status(full=True)
        print(f"{status}")
    elif args.action == "add-profile":
        if args.zip is None:
            print("Please specify a zip file for the profile to add.")
            return
        Profile.add_profile(args.zip)
        return
    elif args.action == "remove-profile":
        if args.name is None:
            print("Please specify a name for the profile to remove.")
            return
        Profile.remove_profile(args.name)
        return
    elif args.action == "list-profiles":
        profiles = Profile.list()
        delim = f"{os.linesep}  - "
        print(f"{os.linesep}available profiles:{os.linesep}{delim}{delim.join(profiles)}{os.linesep}")
        return
    else:
        parser.print_usage()

if __name__ == "__main__":
    main()
