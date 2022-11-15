import os
import sys
import psutil

from iostypingsound.ios_keys import run

class ProcessManager:
    def __init__(self, lock_file) -> None:
        self.lock_file = lock_file
        self.pid = None
        self.pid_lock_exists = False
        self.is_ios_keys_process = False
        self.proc = None
        self._load_status()

    def _load_status(self):
        if os.path.isfile(self.lock_file):
            self.pid_lock_exists = True
            try:
                with open(self.lock_file, "r") as f:
                    self.pid = int(f.read())
            except ValueError:
                pass

        if self.pid:
            try:
                self.proc = psutil.Process(self.pid)
            except psutil.NoSuchProcess:
                pass

        if self.proc:
            try:
                self.is_ios_keys_process = self.proc.name() == psutil.Process().name()
            except ValueError:
                pass

    def status(self) -> str:
        self._load_status()
        if self.pid_lock_exists:
            if self.is_ios_keys_process:
                return "running"
            else:
                return "stale"
        else:
            return "free"

    def try_stop(self) -> None:
        status = self.status()
        if status == "free":
            print("Error: iOS Typing Sound is not running.")
            return

        if self.pid_lock_exists:
            if self.is_ios_keys_process:
                self.proc.kill()
            os.unlink(self.lock_file)
        self.pid = None
        self.pid_lock_exists = False
        self.is_ios_keys_process = False
        self.proc = None

    def try_start(self) -> None:
        status = self.status()
        if status == "running":
            print("Error: iOS Typing Sound is already running.")
            return

        if status == "stale":
            print("Error: Found stale instance of iOS Typing Sound. Attempting to stop it before starting...")
            self.try_stop()

        cpid = os.fork()
        if cpid == 0:
            f = open(os.devnull, 'w')
            sys.stdout = f
            sys.stderr = f
            run()
        else:
            with open(self.lock_file, 'w') as f:
                f.write(str(cpid))