import argparse
import sys
import os
import json

from importlib.metadata import version

from iostypingsound.process_manager import ProcessManager
from iostypingsound.ios_keys import run
from iostypingsound.root import ROOT

def main():
    LOCK_FILE = f"{ROOT}/.lock"

    pm = ProcessManager(LOCK_FILE)

    if len(sys.argv) == 3 and sys.argv[1] == "start-daemon":
        if pm.status() == "running":
            return

        volume = 100
        try:
            volume = int(sys.argv[2])
        except:
            pass

        with open(pm.lock_file, 'w') as f:
            json.dump({
                "pid": os.getpid(),
                "volume": volume
            }, f)

        f = open(os.devnull, 'w')
        sys.stdout = f
        sys.stderr = f
        run(volume=volume)

    version_number = version("iostypingsound")

    parser = argparse.ArgumentParser(
        prog=f"iostype",
        usage=argparse.SUPPRESS,
        description=f"iOS Typing Sound v{version_number}{os.linesep * 2}Manage the iOS Typing Sound daemon.{os.linesep * 2}usage: %(prog)s [start [-v <volume>]|stop|status]{os.linesep}",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("action", choices=["start", "stop", "status"])
    parser.add_argument("-v", type=int, default=100, metavar="volume", help="volume of the sound effects (0-100)")
    parser.add_argument("-V", "--version", action="version", version=version_number)

    args = parser.parse_args()

    if args.action == "start":
        status = pm.status()
        if status == "running":
            print("Re-configuring running instance of iOS Typing Sound daemon...")
        elif status == "stale" or status == "free":
            print("Starting iOS Typing Sound daemon...")
        pm.try_start(volume=args.v)
        volume = pm.get_volume()
        volume_status = f" (Volume: {volume}%)" if volume is not None else ""
        pid = pm.get_pid()
        pid_status = f" (PID: {pid})" if pid is not None else ""
        print(f"Started iOS Typing Sound daemon{volume_status}{pid_status}.")
    elif args.action == "stop":
        stopped = pm.try_stop()
        print("Stopped iOS Typing Sound daemon." if stopped else "Failed to stop iOS Typing Sound daemon. Is it running?")
    elif args.action == "status":
        volume = pm.get_volume()
        volume_status = f" (Volume: {volume}%)" if volume is not None else ""
        pid = pm.get_pid()
        pid_status = f" (PID: {pid})" if pid is not None else ""
        status_text = "Running" if pm.status() == "running" else "Stale (not running)" if pm.status() == "stale" else "Not running"
        print(f"iOS Typing Sound Status: {status_text}{volume_status}{pid_status}")
    else:
        parser.print_usage()

if __name__ == "__main__":
    main()
