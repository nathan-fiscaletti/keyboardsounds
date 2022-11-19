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
        self.__lock_file = lock_file
        self.__proc_info = None
        self.__lock_exists = False
        self.__is_daemon_process = False
        self.__proc = None
        self.__load_status()

    def __load_status(self):
        if os.path.isfile(self.__lock_file):
            self.__lock_exists = True
            try:
                with open(self.__lock_file, "r") as f:
                    self.__proc_info = json.load(f)
            except ValueError:
                self.__proc_info = None
                pass
        else:
            self.__proc_info = None

        if self.__proc_info:
            try:
                self.__proc = psutil.Process(self.__proc_info["pid"])
            except psutil.NoSuchProcess:
                self.__proc = None
                pass
        else:
            self.__proc = None

        if self.__proc:
            try:
                self.__is_daemon_process = self.__proc.name() == psutil.Process().name()
            except ValueError:
                pass
        else:
            self.__is_daemon_process = False

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
            self.__load_status()
            if self.__lock_exists:
                if self.__is_daemon_process:
                    return "running"
                else:
                    return "stale"
            else:
                return "free"

    def get_volume(self) -> int:
        self.__load_status()
        status = self.status()
        if status == "running":
            return self.__proc_info["volume"]
        return None

    def get_pid(self) -> int:
        self.__load_status()
        status = self.status()
        if status == "running":
            return self.__proc_info["pid"]
        return None

    def get_profile(self) -> str:
        self.__load_status()
        status = self.status()
        if status == "running":
            return self.__proc_info["profile"]
        return None

    def try_stop(self) -> None:
        status = self.status()
        if status == "free":
            return False

        if status == "running":
            self.__proc.kill()
            status = self.status()

        if status == "stale":
            os.unlink(self.__lock_file)

        self.__proc_info = None
        self.__lock_exists = False
        self.__is_daemon_process = False
        self.__proc = None

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
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
            start_new_session=True
        )
        time.sleep(1.0)
        return True

    def capture_daemon_initialization(self):
        if len(sys.argv) == 4 and sys.argv[1] == "start-daemon":
            if self.status() == "running":
                return

            volume = 100
            try:
                volume = int(sys.argv[2])
            except:
                pass

            profile = "ios"
            try:
                profile = sys.argv[3]
            except:
                pass

            with open(self.__lock_file, 'w') as f:
                json.dump({
                    "pid": os.getpid(),
                    "volume": volume,
                    "profile": profile,
                }, f)

            f = open(os.devnull, 'w')
            sys.stdout = f
            sys.stderr = f
            daemon.run(volume, profile)
            return True
        return False
        