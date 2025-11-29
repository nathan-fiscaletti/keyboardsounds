import argparse
import os
import json
import sys

# import warnings

from sys import platform

LINUX = platform.lower().startswith("linux")
WIN32 = platform.lower().startswith("win")

os.environ["PYGAME_HIDE_SUPPORT_PROMPT"] = "1"
import pygame

if not getattr(sys, "frozen", False):
    from importlib.metadata import version

from keyboardsounds.root import get_root

from keyboardsounds.daemon_manager import DaemonManager

from keyboardsounds.profile import Profile
from keyboardsounds.profile_builder import CliProfileBuilder

from keyboardsounds.app_rules import Action, GlobalAction
from keyboardsounds.app_rules import get_rules

if WIN32:
    import winreg


def main():
    LOCK_FILE = f"{get_root()}/.lock"

    # Work around to get pygame to load mp3 files on windows
    # see https://github.com/pygame/pygame/issues/2647
    if os.name == "nt":
        os.add_dll_directory(pygame.__path__[0])

    dm = DaemonManager(lock_file=None, one_shot=True)
    if dm.capture_oneshot():
        return

    dm = DaemonManager(lock_file=LOCK_FILE)
    if dm.capture_daemon_initialization():
        return

    if getattr(sys, "frozen", False):
        # Read version from pyinstaller based on the information provided
        # at build time using app-version.txt
        try:
            if WIN32:
                # Read version from Windows executable version resource
                import ctypes

                def get_file_version(filename):
                    """Get the version string from a Windows executable."""
                    # Get version info size
                    size = ctypes.windll.version.GetFileVersionInfoSizeW(filename, None)
                    if size == 0:
                        return None

                    # Allocate buffer and get version info
                    buffer = ctypes.create_string_buffer(size)
                    if (
                        ctypes.windll.version.GetFileVersionInfoW(
                            filename, 0, size, buffer
                        )
                        == 0
                    ):
                        return None

                    # Get the product version
                    value = ctypes.c_void_p(0)
                    value_size = ctypes.c_uint(0)
                    if (
                        ctypes.windll.version.VerQueryValueW(
                            buffer,
                            "\\StringFileInfo\\040904B0\\ProductVersion",
                            ctypes.byref(value),
                            ctypes.byref(value_size),
                        )
                        == 0
                    ):
                        return None

                    # Extract version string
                    return ctypes.wstring_at(value.value)

                version_number = get_file_version(sys.executable)
                if not version_number:
                    version_number = "unknown"
            else:
                # For non-Windows frozen builds, use a default
                from keyboardsounds.version import get_version

                version_number = get_version()
        except Exception:
            version_number = "unknown"
    else:
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
            f"    %(prog)s start [-v <volume>] [-p <profile>] [-m <mouse_profile>] [-c '<lower_semitone>,<upper_semitone>'] [-k <keyboard|mouse|both>] [-D] [-w]{os.linesep}"
            f"    %(prog)s stop{os.linesep}"
            f"    %(prog)s status [-s]{os.linesep * 2}"
            f"  manage profiles:{os.linesep * 2}"
            f"    %(prog)s <new|create-profile> [-d <path>] -n <name>{os.linesep}"
            f"    %(prog)s <ap|add-profile> -z <zipfile>{os.linesep}"
            f"    %(prog)s <rp|remove-profile> -n <profile>{os.linesep}"
            f"    %(prog)s <lp|list-profiles> [-s] [--remote] [-t <device_type>]{os.linesep}"
            f"    %(prog)s <dp|download-profile> -n <profile>{os.linesep}"
            f"    %(prog)s <ex|export-profile> -n <profile> -o <zip_file>{os.linesep * 2}"
            f"    %(prog)s <bp|build-profile> -d <sound_dir> -o <zip_file>{os.linesep * 2}"
        )
        + win_messages
        + (f"  other:{os.linesep * 2}" f"    %(prog)s [--version|-V]{os.linesep}")
    )

    parser = argparse.ArgumentParser(
        prog=f"kbs",
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
        default=None,
        metavar="profile",
        help="keyboard sound profile to use; if omitted, keyboard sounds are disabled",
    )
    parser.add_argument(
        "-m",
        "--mouse-profile",
        type=str,
        default=None,
        metavar="mouse_profile",
        help="mouse sound profile to use; if omitted, mouse clicks are disabled",
    )
    parser.add_argument(
        "-D",
        "--debug",
        action="store_true",
        help="used with kbs start to debug the daemon",
    )
    parser.add_argument(
        "-w",
        "--window",
        action="store_true",
        help="used with kbs start to enable the daemon window",
    )
    parser.add_argument(
        "-c",
        "--semitones",
        type=str,
        default=None,
        metavar="semitones",
        help="semitones to use for random pitch shift, in the format of '<lower_semitone>,<upper_semitone>'. eg. -c='-2,2'",
    )
    parser.add_argument(
        "-k",
        "--pitch-shift-profile",
        type=str,
        default="both",
        metavar="pitch_shift_profile",
        help="pitch shift profile to use for random pitch shift, in the format of 'both', 'keyboard', or 'mouse'.",
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
    parser.add_argument(
        "-t",
        "--device-type",
        type=str,
        choices=["keyboard", "mouse"],
        default=None,
        metavar="device_type",
        help="used with the list-profiles action to filter by device type",
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

    # If no arguments provided, show help instead of error
    if len(sys.argv) == 1:
        parser.print_help()
        return

    args = parser.parse_args()

    if (
        args.pitch_shift_profile != "both"
        and args.pitch_shift_profile != "keyboard"
        and args.pitch_shift_profile != "mouse"
    ):
        print(
            "Invalid pitch shift profile. Must be one of 'both', 'keyboard', or 'mouse'."
        )
        return

    if args.action == "start":
        status = dm.status()
        if status == "running":
            print("Re-configuring running instance of Keyboard Sounds daemon...")
            print(f"Using Keyboard Profile: {args.profile if args.profile else 'None'}")
            print(
                f"Using Mouse Profile: {args.mouse_profile if args.mouse_profile else 'None'}"
            )
            print(
                f"Semitone range: {args.semitones} ({args.pitch_shift_profile})"
                if args.semitones
                else "Semitone range: Off"
            )
        elif status == "stale" or status == "free":
            print("Starting Keyboard Sounds daemon...")
            print(f"Using Keyboard Profile: {args.profile if args.profile else 'None'}")
            print(
                f"Using Mouse Profile: {args.mouse_profile if args.mouse_profile else 'None'}"
            )
            print(
                f"Semitone range: {args.semitones} ({args.pitch_shift_profile})"
                if args.semitones
                else "Semitone range: Off"
            )
        # Require at least one profile
        if args.profile is None and args.mouse_profile is None:
            print(
                "Error: You must provide at least one profile (-p for keyboard, -m for mouse)."
            )
            return
        if not dm.try_start(
            volume=args.volume,
            profile=args.profile,
            debug=args.debug,
            window=args.window,
            semitones=args.semitones,
            pitch_shift_profile=args.pitch_shift_profile,
            mouse_profile=args.mouse_profile,
        ):
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
    elif args.action == "state":
        rules = get_rules()
        output = {
            "global_action": rules.global_action.value,
            "rules": [
                {"app_path": rule.app_path, "action": rule.action.value}
                for rule in rules.rules
            ],
            "profiles": [
                {
                    "name": profile["name"],
                    "author": profile["author"],
                    "description": profile["description"],
                }
                for profile in [profile.metadata() for profile in Profile.list()]
            ],
            "status": json.loads(dm.status(full=False, short=True)),
        }

        print(json.dumps(output))
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
            if args.device_type is not None:
                profiles = [
                    p
                    for p in profiles
                    if p.get("device", "keyboard") == args.device_type
                ]
            else:
                profiles = sorted(
                    profiles,
                    key=lambda p: (
                        (p.get("device", "keyboard") == "mouse"),
                        p.get("name", "").lower(),
                    ),
                )

            if args.short:
                print(json.dumps(profiles))
                return
            else:
                print(f"{os.linesep} Fetching remote profiles...{os.linesep}")

                names = [profile["name"] for profile in profiles]
                names.append("Name")
                authors = [profile["author"] for profile in profiles]
                authors.append("Author")
                devices = [profile.get("device", "keyboard") for profile in profiles]
                devices.append("Device")
                name_len = len(max(names, key=len))
                auth_len = len(max(authors, key=len))
                dev_len = len(max(devices, key=len))

                print(f" Downloadable profiles{os.linesep}")
                print(
                    f" {'Name'.ljust(name_len)} | {'Author'.ljust(auth_len)} | {'Device'.ljust(dev_len)} | Description"
                )
                print(
                    f" {'-' * name_len} | {'-' * auth_len} | {'-' * dev_len} | -----------"
                )
                for profile in profiles:
                    print(
                        f" {profile['name'].ljust(name_len)} | {profile['author'].ljust(auth_len)} | {profile.get('device','keyboard').ljust(dev_len)} | {profile['description']}"
                    )
                print(os.linesep)
        else:
            profiles = [profile.metadata() for profile in Profile.list()]
            if args.device_type is not None:
                profiles = [
                    p
                    for p in profiles
                    if p.get("device", "keyboard") == args.device_type
                ]
            else:
                profiles = sorted(
                    profiles,
                    key=lambda p: (
                        (p.get("device", "keyboard") == "mouse"),
                        p.get("name", "").lower(),
                    ),
                )

            if args.short:
                print(
                    json.dumps(
                        [
                            {
                                "name": profile["name"],
                                "author": profile["author"],
                                "description": profile["description"],
                                "device": profile.get("device", "keyboard"),
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
            devices = [profile.get("device", "keyboard") for profile in profiles]
            devices.append("Device")
            name_len = len(max(names, key=len))
            auth_len = len(max(authors, key=len))
            dev_len = len(max(devices, key=len))

            print(f"{os.linesep} Available profiles{os.linesep}")
            print(
                f" {'Name'.ljust(name_len)} | {'Author'.ljust(auth_len)} | {'Device'.ljust(dev_len)} | Description"
            )
            print(
                f" {'-' * name_len} | {'-' * auth_len} | {'-' * dev_len} | -----------"
            )
            for profile in profiles:
                print(
                    f" {profile['name'].ljust(name_len)} | {profile['author'].ljust(auth_len)} | {profile.get('device','keyboard').ljust(dev_len)} | {profile['description']}"
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
    elif WIN32 and (args.action == "list-apps" or args.action == "la"):
        apps = list_apps()
        print(json.dumps(apps))
        return
    else:
        parser.print_usage()


def list_apps():
    apps = []
    reg_paths = [
        (
            winreg.HKEY_LOCAL_MACHINE,
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        ),
        (
            winreg.HKEY_CURRENT_USER,
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        ),
        (
            winreg.HKEY_LOCAL_MACHINE,
            r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
        ),
    ]

    for reg_root, reg_path in reg_paths:
        try:
            key = winreg.OpenKey(reg_root, reg_path)
        except FileNotFoundError:
            continue

        for i in range(0, winreg.QueryInfoKey(key)[0]):
            try:
                subkey_name = winreg.EnumKey(key, i)
                subkey = winreg.OpenKey(key, subkey_name)

                app_name, _ = winreg.QueryValueEx(subkey, "DisplayName")

                exe_path = None
                icon_path = None
                install_dir = None
                # Try to find possible executable-related values
                for value_name in ["DisplayIcon", "InstallLocation"]:
                    try:
                        value, _ = winreg.QueryValueEx(subkey, value_name)
                        if value and ".exe" in value.lower():
                            exe_path = value.strip('"')
                            break
                        elif value_name == "InstallLocation" and os.path.isdir(value):
                            install_dir = value
                            # Guess main exe from install folder (rough)
                            for f in os.listdir(value):
                                if f.lower().endswith(".exe"):
                                    exe_path = os.path.join(value, f)
                                    break
                    except FileNotFoundError:
                        continue
                # Try to read DisplayIcon for a more accurate icon path
                try:
                    icon_value, _ = winreg.QueryValueEx(subkey, "DisplayIcon")
                    if icon_value:
                        icon_value = os.path.expandvars(icon_value.strip('"'))
                        # Often in the form "C:\\Path\\app.exe,0" → take path before comma
                        if "," in icon_value:
                            icon_value = icon_value.split(",", 1)[0]
                        icon_path = icon_value
                except FileNotFoundError:
                    pass

                # Fallbacks for icon path
                if icon_path is None and exe_path:
                    icon_path = exe_path
                if icon_path is None and install_dir and os.path.isdir(install_dir):
                    try:
                        for f in os.listdir(install_dir):
                            if f.lower().endswith(".ico"):
                                icon_path = os.path.join(install_dir, f)
                                break
                    except OSError:
                        pass
                if exe_path is not None:
                    if exe_path.lower().endswith(",0"):
                        exe_path = exe_path.split(",", 1)[0]
                    apps.append({"name": app_name, "path": exe_path, "icon": icon_path})

            except FileNotFoundError:
                continue
            except OSError:
                continue
            except Exception:
                continue

    # Remove duplicates by app name
    unique_apps = {a["path"]: a for a in apps if a["path"]}.values()
    return sorted(unique_apps, key=lambda x: x["name"].lower())


if __name__ == "__main__":
    main()
