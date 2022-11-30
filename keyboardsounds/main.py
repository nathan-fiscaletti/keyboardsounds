import argparse
import os
import sys

os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
import pygame

from importlib.metadata import version

from keyboardsounds.daemon_manager import DaemonManager
from keyboardsounds.profile import Profile
from keyboardsounds.profile_builder import CliProfileBuilder
from keyboardsounds.root import ROOT

def main():
    if sys.platform == 'darwin':
        if os.geteuid() != 0:
            print("keyboardsounds: this program must be run as root on macOS.")
            return

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
        f"    %(prog)s start{os.linesep}"
        f"    %(prog)s stop{os.linesep}"
        f"    %(prog)s status{os.linesep}"
        f"    %(prog)s <dl|daemon-logs>{os.linesep * 2}"
        f"  manage configuration:{os.linesep * 2}"
        f"    %(prog)s <sp|set-profile> -v <profile>{os.linesep}"
        f"    %(prog)s <sv|set-volume> -v <volume>{os.linesep}"
        f"    %(prog)s <cf|config>{os.linesep * 2}"
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

    # Configuration
    parser.add_argument("-v", "--value", type=str, default=None, metavar="value", help="value for the configuration property")

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
        if not dm.try_start():
            print("Failed to start.")
            return
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
    elif args.action == 'daemon-logs' or args.action == 'dl':
        log = dm.get_log()
        if log is not None:
            print("Daemon Log:")
            print("")
            print(log)
        else:
            print("No daemon log found.")
    elif args.action == "set-profile" or args.action == 'sp':
        if args.value is None:
            print("Please specify a value for the configuration entry using the --value flag.")
            return
        try:
            Profile(args.value)
        except:
            print("Please provide a valid profile name. Run `kbs lp` for a list of profiles.")
            return
        dm.set_configured_profile(profile=args.value)
        if dm.status() == 'running':
            dm.try_start()
    elif args.action == "set-volume" or args.action == "sv":
        if args.value is None:
            print("Please specify a value for the configuration entry using the --value flag.")
            return
        volume = None
        try:
            _volume = int(args.value)
            if _volume < 0 or _volume > 100:
                raise Exception("Invalid volume value.")
            volume = float(_volume)
        except:
            print("Please provide a valid value for volume from 1-100 inclusive.")
            return
        dm.set_configured_volume(volume)
        if dm.status() == 'running':
            dm.try_start()
    elif args.action == "config" or args.action == "cf":
        profile = dm.get_configured_profile()
        volume = dm.get_configured_volume()

        print("Configuration:")
        print(f"  Profile: {profile}")
        print(f"  Volume:  {volume}%")
    else:
        parser.print_usage()

if __name__ == "__main__":
    main()
