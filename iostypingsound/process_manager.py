import os
import sys
import psutil
import subprocess
import time
import json

from iostypingsound.ios_keys import run

class ProcessManager:
    def __init__(self, lock_file) -> None:
        self.lock_file = lock_file
        self.proc_info = None
        self.lock_exists = False
        self.is_ios_keys_process = False
        self.proc = None
        self._load_status()

    def _load_status(self):
        if os.path.isfile(self.lock_file):
            self.lock_exists = True
            try:
                with open(self.lock_file, "r") as f:
                    self.proc_info = json.load(f)
            except ValueError:
                pass

        if self.proc_info:
            try:
                self.proc = psutil.Process(self.proc_info["pid"])
            except psutil.NoSuchProcess:
                pass

        if self.proc:
            try:
                self.is_ios_keys_process = self.proc.name() == psutil.Process().name()
            except ValueError:
                pass

    def status(self) -> str:
        self._load_status()
        if self.lock_exists:
            if self.is_ios_keys_process:
                return "running"
            else:
                return "stale"
        else:
            return "free"

    def get_volume(self) -> int:
        self._load_status()
        status = self.status()
        if status == "running":
            return self.proc_info["volume"]
        return None

    def get_pid(self) -> int:
        self._load_status()
        status = self.status()
        if status == "running":
            return self.proc_info["pid"]
        return None

    def try_stop(self) -> None:
        status = self.status()
        if status == "free":
            return False

        if status == "running":
            self.proc.kill()
            status = self.status()

        if status == "stale":
            os.unlink(self.lock_file)

        self.proc_info = None
        self.lock_exists = False
        self.is_ios_keys_process = False
        self.proc = None

        return True

    def try_start(self, volume: int) -> None:
        status = self.status()
        if status == "running":
            self.try_stop()
            status = self.status()

        if status == "stale":
            self.try_stop()

        subprocess.Popen(
            [sys.argv[0], "start-daemon", str(volume)],
            start_new_session=True,
        )
        time.sleep(0.5)
        