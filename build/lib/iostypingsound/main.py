import argparse
import sys
import os

from iostypingsound.process_manager import ProcessManager
from iostypingsound.ios_keys import run
from iostypingsound.root import ROOT

def main():
    PID_LOCK_FILE = f"{ROOT}/pid.lock"

    pm = ProcessManager(PID_LOCK_FILE)

    if sys.argv[1] == "start-daemon":
        if pm.status() == "running":
            return

        with open(pm.lock_file, 'w') as f:
            f.write(str(os.getpid()))

        f = open(os.devnull, 'w')
        sys.stdout = f
        sys.stderr = f
        run()

    parser = argparse.ArgumentParser(description="Manage the iOS Typing Sound daemon.")
    parser.add_argument("action", choices=["start", "stop", "status"])

    args = parser.parse_args()

    if args.action == "start":
        pm.try_start()
        print(f"iOS Typing Sound Status: {pm.status()}")
    elif args.action == "stop":
        pm.try_stop()
        print(f"iOS Typing Sound Status: {pm.status()}")
    elif args.action == "status":
        print(f"iOS Typing Sound Status: {pm.status()}")

if __name__ == "__main__":
    main()
