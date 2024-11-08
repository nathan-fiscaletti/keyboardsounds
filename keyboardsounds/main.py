import argparse
import os
import json

from sys import platform

LINUX = platform.lower().startswith("linux")
WIN32 = platform.lower().startswith("win")

os.environ["PYGAME_HIDE_SUPPORT_PROMPT"] = "1"
import pygame

from importlib.metadata import version

from keyboardsounds.root import ROOT

from keyboardsounds.daemon_manager import DaemonManager

from keyboardsounds.profile import Profile
from keyboardsounds.profile_builder import CliProfileBuilder

from keyboardsounds.app_rules import Action, GlobalAction
from keyboardsounds.app_rules import get_rules


def main():
    if LINUX:
        if os.geteuid() != 0:
            print(
                "warning: it is recommended that you run this program "
                + "as root on Linux systems."
            )

    LOCK_FILE = f"{ROOT}/.lock"

    # Work around to get pygame to load mp3 files on windows
    # see https://github.com/pygame/pygame/issues/2647
    if os.name == "nt":
        os.add_dll_directory(pygame.__path__[0])

    dm = DaemonManager(LOCK_FILE)
    if dm.capture_daemon_initialization():
        return

    version_number = version("keyboardsounds")

    win_messages = ""
    if WIN32:
        win_messages = (
            f"  manage rules:{os.linesep * 2}"
            f"    %(prog)s <ar|add-rule> -r <rule> -a <app>{os.linesep}"
            f"    %(prog)s <rr|remove-rule> -a <app>{os.linesep}"
            f"    %(prog)s <lr|list-rules> [-s]{os.linesep}"
            f"    %(prog)s <sr|set-global-rule> -r <rule>{os.linesep}"
            f"    %(prog)s <gr|get-global-rule> [-s]{os.linesep * 2}"
        )

    usage = (
        (
            f"usage: %(prog)s <action> [params]{os.linesep *2}"
            f"  manage daemon:{os.linesep * 2}"
            f"    %(prog)s start [-v <volume>] [-p <profile>]{os.linesep}"
            f"    %(prog)s stop{os.linesep}"
            f"    %(prog)s status [-s]{os.linesep * 2}"
            f"  manage profiles:{os.linesep * 2}"
            f"    %(prog)s <new|create-profile> [-d <path>] -n <name>{os.linesep}"
            f"    %(prog)s <ap|add-profile> -z <zipfile>{os.linesep}"
            f"    %(prog)s <rp|remove-profile> -n <profile>{os.linesep}"
            f"    %(prog)s <lp|list-profiles> [-s] [--remote]{os.linesep}"
            f"    %(prog)s <dp|download-profile> -n <profile>{os.linesep}"
            f"    %(prog)s <ex|export-profile> -n <profile> -o <zip_file>{os.linesep * 2}"
            f"    %(prog)s <bp|build-profile> -d <sound_dir> -o <zip_file>{os.linesep * 2}"
        )
        + win_messages
        + (f"  other:{os.linesep * 2}" f"    %(prog)s [--version|-V]{os.linesep}")
    )

    parser = argparse.ArgumentParser(
        prog=f"<keyboardsounds|kbs>",
        usage=argparse.SUPPRESS,
        description=f"Keyboard Sounds v{version_number}{os.linesep * 2}{usage}{os.linesep}",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument("action", help="The action to perform")

    # Start Action
    parser.add_argument(
        "-v",
        "--volume",
        type=int,
        default=100,
        metavar="volume",
        help="volume of the sound effects (0-100), default 100",
    )
    parser.add_argument(
        "-p",
        "--profile",
        type=str,
        default="ios",
        metavar="profile",
        help="sound profile to use, default 'ios'",
    )

    # Status Action
    parser.add_argument(
        "-s",
        "--short",
        action="store_true",
        help="consolidate output to a single line of json for scripting",
    )

    # Profiles
    parser.add_argument(
        "-n",
        "--name",
        type=str,
        default=None,
        metavar="name",
        help="name of the profile",
    )
    parser.add_argument(
        "-z",
        "--zip",
        type=str,
        default=None,
        metavar="file",
        help="path to the zip file containing the profile to add",
    )
    parser.add_argument(
        "--remote",
        action="store_true",
        help="used with the list-profiles action to list remote profiles",
    )
    parser.add_argument("-V", "--version", action="version", version=version_number)

    # Profile Builder
    parser.add_argument(
        "-d",
        "--directory",
        type=str,
        default=None,
        metavar="path",
        help="path to the directory",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=str,
        default=None,
        metavar="file",
        help="path to the zip file to create",
    )

    # Rules
    if WIN32:
        parser.add_argument(
            "-a",
            "--app",
            type=str,
            default=None,
            metavar="app",
            help="absolute path to the application to add the rule for",
        )
        parser.add_argument(
            "-r",
            "--rule",
            type=str,
            default=None,
            metavar="rule",
            help="rule to apply. must be one of 'enable', 'disable', or 'exclusive'",
        )

    args = parser.parse_args()

    if args.action == "start":
        status = dm.status()
        if status == "running":
            print("Re-configuring running instance of Keyboard Sounds daemon...")
        elif status == "stale" or status == "free":
            print("Starting Keyboard Sounds daemon...")
        if not dm.try_start(volume=args.volume, profile=args.profile):
            print("Failed to start.")
            return
        print(f"Started Keyboard Sounds.")
    elif args.action == "stop":
        stopped = dm.try_stop()
        print(
            "Stopped Keyboard Sounds daemon."
            if stopped
            else "Failed to stop Keyboard Sounds daemon. Is it running?"
        )
    elif args.action == "status":
        status = dm.status(full=not args.short, short=args.short)
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
        if args.remote:
            profiles = Profile.list_remote_profiles()

            if args.short:
                print(json.dumps(profiles))
                return
            else:
                print(f"{os.linesep} Fetching remote profiles...{os.linesep}")

                names = [profile["name"] for profile in profiles]
                names.append("Name")
                authors = [profile["author"] for profile in profiles]
                authors.append("Author")
                name_len = len(max(names, key=len))
                auth_len = len(max(authors, key=len))

                print(f" Downloadable profiles{os.linesep}")
                print(
                    f" {'Name'.ljust(name_len)} | {'Author'.ljust(auth_len)} | Description"
                )
                print(f" {'-' * name_len} | {'-' * auth_len} | -----------")
                for profile in profiles:
                    print(
                        f" {profile['name'].ljust(name_len)} | {profile['author'].ljust(auth_len)} | {profile['description']}"
                    )
                print(os.linesep)
        else:
            profiles = [profile.metadata() for profile in Profile.list()]

            if args.short:
                print(
                    json.dumps(
                        [
                            {
                                "name": profile["name"],
                                "author": profile["author"],
                                "description": profile["description"],
                            }
                            for profile in profiles
                        ]
                    )
                )
                return

            names = [profile["name"] for profile in profiles]
            names.append("Name")
            authors = [profile["author"] for profile in profiles]
            authors.append("Author")
            name_len = len(max(names, key=len))
            auth_len = len(max(authors, key=len))

            print(f"{os.linesep} Available profiles{os.linesep}")
            print(
                f" {'Name'.ljust(name_len)} | {'Author'.ljust(auth_len)} | Description"
            )
            print(f" {'-' * name_len} | {'-' * auth_len} | -----------")
            for profile in profiles:
                print(
                    f" {profile['name'].ljust(name_len)} | {profile['author'].ljust(auth_len)} | {profile['description']}"
                )
            print(os.linesep)
            return
    elif args.action == "build-profile" or args.action == "bp":
        if args.directory is None:
            print(
                "Please specify a directory containing the sounds to use for the profile."
            )
            return

        builder = CliProfileBuilder(args.directory, args.output)
        builder.start()
    elif args.action == "download-profile" or args.action == "dp":
        if args.name is None:
            print("Please specify a name for the remote profile to download.")
            return

        existing = Profile.list()
        for profile in existing:
            if profile.metadata()["name"] == args.name:
                print(f"Profile '{args.name}' already exists.")
                return

        try:
            Profile.download_profile(args.name)
        except Exception as e:
            print(e)
    elif args.action == "create-profile" or args.action == "new":
        Profile.create_profile(args.directory, args.name)
        return
    elif args.action == "export-profile" or args.action == "ex":
        Profile.export_profile(args.name, args.output)
        return
    # Rules are only available on windows
    elif WIN32 and (args.action == "list-rules" or args.action == "lr"):
        rules = get_rules()

        if args.short:
            print(
                json.dumps(
                    [
                        {"app_path": rule.app_path, "action": rule.action.value}
                        for rule in rules.rules
                    ]
                )
            )
            return

        print(f"Keyboard Sounds v{version_number} - Application Rules{os.linesep}")

        print(
            f"Use 'keyboardsounds add-rule' to add a rule for a specific application."
        )
        print(
            f"Use 'keyboardsounds remove-rule' to remove a rule for a specific application."
        )
        print(f"Use 'keyboardsounds set-global-rule' to set the global rule.")

        print(f"{os.linesep}Configured Rules:{os.linesep}")

        print(f" - Application : Global")
        print(f"   Action      : {rules.global_action.value.upper()}")

        for rule in rules.rules:
            print("")
            print(f" - Application : {rule.app_path}")
            print(f"   Action      : {rule.action.value.upper()}")
        print("")
    elif WIN32 and (args.action == "add-rule" or args.action == "ar"):
        if args.app is None:
            print("Please specify an application to add the rule for.")
            return
        if args.rule is None:
            print(
                "Please specify a rule to apply. Must be one of 'enable', 'disable', or 'exclusive'."
            )
            return

        args.rule = args.rule.lower()

        rules = get_rules()
        if args.rule.lower() not in [
            Action.ENABLE.value,
            Action.DISABLE.value,
            Action.EXCLUSIVE.value,
        ]:
            print("Invalid rule. Must be one of 'enable', 'disable', or 'exclusive'.")
            return
        if args.rule.lower() == Action.EXCLUSIVE.value:
            if rules.has_exclusive_rule():
                print(
                    "Exclusive rule already exists. Only one exclusive rule can be set."
                )
                return
        rules.set_rule(args.app, Action(args.rule))
        try:
            rules.save()
            print(f"Rule '{args.rule.upper()}' added for {args.app}.")
        except Exception as e:
            print(f"Failed to save rules: {e}")
    elif WIN32 and (args.action == "remove-rule" or args.action == "rr"):
        if args.app is None:
            print("Please specify an application to remove the rule for.")
            return

        rules = get_rules()
        if not rules.has_rule(args.app):
            print(f"No rule exists for {args.app}.")
            return

        rules.remove_rule(args.app)
        try:
            rules.save()
            print(f"Rule removed for {args.app}.")
        except Exception as e:
            print(f"Failed to save rules: {e}")
    elif WIN32 and (args.action == "set-global-rule" or args.action == "sr"):
        if args.rule is None:
            print(
                "Please specify a rule to apply. Must be one of 'enable' or 'disable'."
            )
            return

        args.rule = args.rule.lower()

        if args.rule not in [Action.ENABLE.value, Action.DISABLE.value]:
            print("Invalid rule. Must be one of 'enable' or 'disable'.")
            return

        if args.rule == "exclusive":
            print("Global rule cannot be set to 'exclusive'.")
            return

        rules = get_rules()
        rules.set_global_action(GlobalAction(args.rule))

        try:
            rules.save()
        except Exception as e:
            print(f"Failed to save rules: {e}")
            return

        print(f"Global rule set to '{args.rule.upper()}'.")
    elif WIN32 and (args.action == "get-global-rule" or args.action == "gr"):
        rules = get_rules()
        if args.short:
            print(json.dumps({"global_action": rules.global_action.value}))
            return
        print(f"Global rule is set to '{rules.global_action.value.upper()}'.")

    else:
        parser.print_usage()


if __name__ == "__main__":
    main()
