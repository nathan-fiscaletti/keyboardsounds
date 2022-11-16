import os
import sys
import psutil
import subprocess
import time
import json

import keyboardsounds.daemon as daemon
from keyboardsounds.profile import Profile

class DaemonManager:
    def __init__(self, lock_file) -> None:
        self.lock_file = lock_file
        self.proc_info = None
        self.lock_exists = False
        self.is_daemon_process = False
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
                self.is_daemon_process = self.proc.name() == psutil.Process().name()
            except ValueError:
                pass

    def status(self, full=False) -> str:
        if full:
            volume = self.get_volume()
            volume_status = f", Volume: {volume}%" if volume is not None else ""
            pid = self.get_pid()
            pid_status = f", PID: {pid}" if pid is not None else ""
            profile = self.get_profile()
            profile_status = f", Profile: {profile}" if profile is not None else ""
            status_text = "Running" if self.status() == "running" else "Stale" if self.status() == "stale" else "Not running"
            return f"Status: {status_text}{volume_status}{pid_status}{profile_status}"
        else:
            self._load_status()
            if self.lock_exists:
                if self.is_daemon_process:
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

    def get_profile(self) -> str:
        self._load_status()
        status = self.status()
        if status == "running":
            return self.proc_info["profile"]
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
        self.is_daemon_process = False
        self.proc = None

        return True

    def try_start(self, volume: int, profile: str) -> None:
        try:
            Profile(profile)
        except ValueError as err:
            print(F"Error: {err}")
            return False

        status = self.status()
        if status == "running":
            self.try_stop()
            status = self.status()

        if status == "stale":
            self.try_stop()

        subprocess.Popen(
            [sys.argv[0], "start-daemon", str(volume), profile],
            start_new_session=True,
        )
        time.sleep(0.5)
        return True

    def capture_daemon_initialization(self):
        if len(sys.argv) == 4 and sys.argv[1] == "start-daemon":
            if self.status() == "running":
                return

            profile = "ios"
            try:
                profile = sys.argv[3]
            except:
                pass

            volume = 100
            try:
                volume = int(sys.argv[2])
            except:
                pass

            with open(self.lock_file, 'w') as f:
                json.dump({
                    "pid": os.getpid(),
                    "volume": volume,
                    "profile": profile
                }, f)

            f = open(os.devnull, 'w')
            sys.stdout = f
            sys.stderr = f
            daemon.run(volume, profile)
            return True
        return False
        