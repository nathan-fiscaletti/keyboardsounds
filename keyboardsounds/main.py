import argparse
import os

os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
import pygame

from importlib.metadata import version

from keyboardsounds.daemon_manager import DaemonManager
from keyboardsounds.profile import Profile
from keyboardsounds.profile_builder import CliProfileBuilder
from keyboardsounds.root import ROOT

def main():
    LOCK_FILE = f"{ROOT}/.lock"

    # Work around to get pygame to load mp3 files on windows
    # see https://github.com/pygame/pygame/issues/2647
    if os.name == "nt":
        os.add_dll_directory(pygame.__path__[0])

    dm = DaemonManager(LOCK_FILE)
    if dm.capture_daemon_initialization():
        return

    version_number = version("keyboardsounds")

    usage = (
        f"usage: %(prog)s <action> [params]{os.linesep *2}"
        f"  manage daemon:{os.linesep * 2}"
        f"    %(prog)s start [-v <volume>] [-p <profile>]{os.linesep}"
        f"    %(prog)s stop{os.linesep}"
        f"    %(prog)s status{os.linesep * 2}"
        f"  manage profiles:{os.linesep * 2}"
        f"    %(prog)s <ap|add-profile> -z <zipfile>{os.linesep}"
        f"    %(prog)s <rp|remove-profile> -n <profile>{os.linesep}"
        f"    %(prog)s <lp|list-profiles>{os.linesep}"
        f"    %(prog)s <bp|build-profile> -d <sound_dir> -o <zip_file>{os.linesep * 2}"
        f"  other:{os.linesep * 2}"
        f"    %(prog)s [--version|-V]{os.linesep}"
    )

    parser = argparse.ArgumentParser(
        prog=f"<keyboardsounds|kbs>",
        usage=argparse.SUPPRESS,
        description=f"Keyboard Sounds v{version_number}{os.linesep * 2}{usage}{os.linesep}",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument("action", help="The action to perform")
    
    # Start Action
    parser.add_argument("-v", "--volume", type=int, default=100, metavar="volume", help="volume of the sound effects (0-100), default 100")
    parser.add_argument("-p", "--profile", type=str, default="ios", metavar="profile", help="sound profile to use, default 'ios'")

    # Profiles
    parser.add_argument("-n", "--name", type=str, default=None, metavar="name", help="name of the profile remove")
    parser.add_argument("-z", "--zip", type=str, default=None, metavar="file", help="path to the zip file containing the profile to add")
    parser.add_argument("-V", "--version", action="version", version=version_number)

    # Profile Builder
    parser.add_argument("-d", "--directory", type=str, default=None, metavar="directory", help="path to the directory containing the sounds to use for the profile")
    parser.add_argument("-o", "--output", type=str, default=None, metavar="file", help="path to the zip file to create")

    args = parser.parse_args()

    if args.action == "start":
        status = dm.status()
        if status == "running":
            print("Re-configuring running instance of Keyboard Sounds daemon...")
        elif status == "stale" or status == "free":
            print("Starting Keyboard Sounds daemon...")
        if not dm.try_start(volume=args.volume, profile=args.profile):
            print("Failed to start.")
            return;
        print(f"Started Keyboard Sounds.")
    elif args.action == "stop":
        stopped = dm.try_stop()
        print("Stopped Keyboard Sounds daemon." if stopped else "Failed to stop Keyboard Sounds daemon. Is it running?")
    elif args.action == "status":
        status = dm.status(full=True)
        print(f"{status}")
    elif args.action == "add-profile" or args.action == "ap":
        if args.zip is None:
            print("Please specify a zip file for the profile to add.")
            return
        Profile.add_profile(args.zip)
        return
    elif args.action == "remove-profile" or args.action == "rp":
        if args.name is None:
            print("Please specify a name for the profile to remove.")
            return
        Profile.remove_profile(args.name)
        return
    elif args.action == "list-profiles" or args.action == "lp":
        profiles = [profile.metadata() for profile in Profile.list()]

        names = [profile["name"] for profile in profiles]
        names.append('Name')
        authors = [profile["author"] for profile in profiles]
        authors.append('Author')
        name_len = len(max(names, key=len))
        auth_len = len(max(authors, key=len))

        print(f"{os.linesep} Available profiles{os.linesep}")
        print(f" {'Name'.ljust(name_len)} | {'Author'.ljust(auth_len)} | Description")
        print(f" {'-' * name_len} | {'-' * auth_len} | -----------")
        for profile in profiles:
            print(f" {profile['name'].ljust(name_len)} | {profile['author'].ljust(auth_len)} | {profile['description']}")
        print(os.linesep)

        return
    elif args.action == "build-profile" or args.action == "bp":
        if args.directory is None:
            print("Please specify a directory containing the sounds to use for the profile.")
            return
        if args.output is None:
            print("Please specify a zip file to create.")
            return
        
        builder = CliProfileBuilder(args.directory, args.output)
        builder.start()
    else:
        parser.print_usage()

if __name__ == "__main__":
    main()
