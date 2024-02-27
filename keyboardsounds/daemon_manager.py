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
        """
        Initializes the DaemonManager object with a specified lock file.

        Parameters:
        - lock_file (str): The path to the lock file used to manage the daemon's
                           state.

        Returns:
        - None
        """
        self.__lock_file = lock_file
        self.__proc_info = None
        self.__lock_exists = False
        self.__is_daemon_process = False
        self.__proc = None
        self.__load_status()

    def __load_status(self):
        """
        Loads the daemon's current status from the lock file, if it exists, and
        updates internal state accordingly. This includes checking if the lock
        file exists, reading process information, and determining if the current
        process is the daemon process.

        Parameters:
        - None

        Returns:
        - None
        """
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
                proc_name = self.__proc.name()
                current_name = psutil.Process().name()
                self.__is_daemon_process = proc_name == current_name
            except ValueError:
                pass
        else:
            self.__is_daemon_process = False

    def status(self, full=False) -> str:
        """
        Returns the current status of the daemon process. Can provide a simple
        status or a full status with additional details.

        Parameters:
        - full (bool): If True, returns a detailed status string including
                       volume, PID, and profile. If False, returns a simple
                       status string.

        Returns:
        - str: The status of the daemon, which can be 'running', 'stale', or
               'free'. If 'full' is True, additional details are included in the
               returned string.
        """
        if full:
            volume = self.get_volume()
            volume_status = f", Volume: {volume}%" if volume is not None else ""
            pid = self.get_pid()
            pid_status = f", PID: {pid}" if pid is not None else ""
            prof = self.get_profile()
            profile_status = f", Profile: {prof}" if prof is not None else ""
            status_text = {"running": "Running", "stale": "Stale"}.get(
                self.status(), "Not running"
            )
            status = f"{status_text}{volume_status}{pid_status}{profile_status}"
            return f"Status: {status}"
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
        """
        Retrieves the current volume level of the daemon if it is running.

        Parameters:
        - None

        Returns:
        - int or None: The volume level of the daemon, or None if the daemon is
                       not running.
        """
        self.__load_status()
        status = self.status()
        if status == "running":
            return self.__proc_info["volume"]
        return None

    def get_pid(self) -> int:
        """
        Retrieves the PID (Process ID) of the daemon if it is running.

        Parameters:
        - None

        Returns:
        - int or None: The PID of the daemon, or None if the daemon is not
                       running.
        """
        self.__load_status()
        status = self.status()
        if status == "running":
            return self.__proc_info["pid"]
        return None

    def get_profile(self) -> str:
        """
        Retrieves the profile name used by the daemon if it is running.

        Parameters:
        - None

        Returns:
        - str or None: The profile name, or None if the daemon is not running.
        """
        self.__load_status()
        status = self.status()
        if status == "running":
            return self.__proc_info["profile"]
        return None

    def try_stop(self) -> None:
        """
        Attempts to stop the daemon process if it is running or stale. Cleans up
        the lock file if necessary.

        Parameters:
        - None

        Returns:
        - bool: True if the daemon was stopped or cleaned up successfully, False
                if the daemon was already free.
        """
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
        """
        Attempts to start the daemon process with the specified volume and
        profile. Stops any existing daemon process before starting a new one.

        Parameters:
        - volume (int): The volume level for the daemon.
        - profile (str): The profile name to be used by the daemon.

        Returns:
        - bool: True if the daemon was started successfully, False if there was
                an error during startup.
        """
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
        """
        Captures and initializes the daemon process based on command-line
        arguments. This method is intended to be called at the start of the
        program.

        Parameters:
        - None

        Returns:
        - bool: True if the daemon was initialized successfully, False if the
                conditions for initialization were not met.
        """
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

            LINE_BUFFERED = 1
            f = open(os.devnull, 'w', buffering=LINE_BUFFERED)
            sys.stdout = f
            sys.stderr = f
            daemon.run(volume, profile)
            return True
        return False
        