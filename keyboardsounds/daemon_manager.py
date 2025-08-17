import os
import sys
import psutil
import subprocess
import time
import json
import socket
import threading
import tkinter as tk
import atexit
from typing import Optional

try:
    import msvcrt  # type: ignore
except Exception:
    msvcrt = None  # type: ignore

try:
    import fcntl  # type: ignore
except Exception:
    fcntl = None  # type: ignore

import keyboardsounds.daemon as daemon
from keyboardsounds.profile import Profile
from keyboardsounds.external_api import ExternalAPI


class DaemonManager:
    def __init__(self, lock_file, one_shot=False) -> None:
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
        self.__api = None
        self.__one_shot = one_shot
        self.__thread = None
        self.__daemon_window_visible = False
        # Separate OS-level process lock to prevent multiple daemons
        self.__proc_lock_file: Optional[str] = (
            f"{lock_file}.pid" if lock_file is not None else None
        )
        self.__proc_lock_handle = None
        if not self.__one_shot:
            self.__load_status()

    def __load_status(self):
        if self.__one_shot:
            return

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

        # Current process is the daemon if our PID matches the lock file PID
        try:
            self.__is_daemon_process = (
                self.__proc_info is not None
                and self.__proc_info.get("pid") == os.getpid()
            )
        except Exception:
            self.__is_daemon_process = False

    def status(self, full=False, short=False) -> str:
        """
        Returns the current status of the daemon process. Can provide a simple
        status or a full status with additional details.

        Parameters:
        - full (bool): If True, returns a detailed status string including
                       volume, PID, and profile. If False, returns a simple
                       status string.
        - short (bool): If True, returns a JSON string with the status details.

        Returns:
        - str: The status of the daemon, which can be 'running', 'stale', or
               'free'. If 'full' or 'short' is True, returns a detailed status
                string or JSON string, respectively.
        """
        if full:
            volume = self.get_volume()
            volume_status = f", Volume: {volume}%" if volume is not None else ""
            pid = self.get_pid()
            pid_status = f", PID: {pid}" if pid is not None else ""
            daemon_status = self.status()
            kb_status = ""
            mouse_status = ""
            if daemon_status == "running":
                prof_kb = self.get_profile()
                prof_mouse = self.get_mouse_profile()
                kb_status = (
                    f", Keyboard Profile: {prof_kb}" if prof_kb is not None else ""
                )
                mouse_label = prof_mouse if prof_mouse is not None else "None"
                mouse_status = f", Mouse Profile: {mouse_label}"
            status_text = {"running": "Running", "stale": "Stale"}.get(
                daemon_status, "Not running"
            )
            status = (
                f"{status_text}{volume_status}{pid_status}{kb_status}{mouse_status}"
            )
            return f"Status: {status}"
        elif short:
            volume = self.get_volume()
            pid = self.get_pid()
            prof_kb = self.get_profile()
            prof_mouse = self.get_mouse_profile()
            daemon_status = self.status()
            api_port = self.get_api_port()

            user_status = None
            if daemon_status == "running":
                user_status = "Running"
            else:
                user_status = "Not running"

            status = {
                "status": daemon_status,
                "user_status": user_status,
                "volume": volume,
                "pid": pid,
                "api_port": api_port,
                "lock": {
                    "active": self.__lock_exists,
                    "file": os.path.abspath(self.__lock_file),
                },
            }
            # Include profiles conditionally; only expose 'profile' (keyboard) and 'mouse_profile'
            if daemon_status == "running":
                status.update(
                    {
                        "profile": prof_kb,
                        "mouse_profile": prof_mouse,
                    }
                )
            else:
                status.update(
                    {
                        "profile": prof_kb,
                        "mouse_profile": prof_mouse,
                    }
                )
            return json.dumps(status)
        else:
            self.__load_status()
            if self.__lock_exists:
                # If lock exists and process with PID is alive -> running; else stale
                if self.__proc is not None and self.__proc.is_running():
                    return "running"
                return "stale"
            return "free"

    def get_volume(self) -> int | None:
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
        if status == "running" and self.__proc_info is not None:
            return self.__proc_info.get("volume")
        return None

    def get_pid(self) -> int | None:
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
        if status == "running" and self.__proc_info is not None:
            return self.__proc_info.get("pid")
        return None

    def get_profile(self) -> str | None:
        """
        Retrieves the profile name used by the daemon if it is running.

        Parameters:
        - None

        Returns:
        - str or None: The profile name, or None if the daemon is not running.
        """
        self.__load_status()
        status = self.status()
        if status == "running" and self.__proc_info is not None:
            return self.__proc_info.get("profile")
        return None

    def get_mouse_profile(self) -> str | None:
        self.__load_status()
        status = self.status()
        if status == "running" and self.__proc_info is not None:
            return self.__proc_info.get("mouse_profile")
        return None

    def get_api_port(self) -> int | None:
        """
        Retrieves the API port used by the daemon if it is running.

        Parameters:
        - None

        Returns:
        - str or None: The API port, or None if the daemon is not running.
        """
        self.__load_status()
        status = self.status()
        if (
            status == "running"
            and self.__proc_info is not None
            and "api_port" in self.__proc_info
        ):
            return int(self.__proc_info["api_port"])
        return None

    def try_stop(self) -> bool:
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

        # If we are the daemon process itself, perform graceful in-process shutdown
        is_self = (
            self.__proc_info is not None and self.__proc_info.get("pid") == os.getpid()
        )
        if status == "running" and is_self:
            try:
                # Stop API listener if any
                if self.__api is not None:
                    try:
                        self.__api.stop()
                    except Exception:
                        pass
                # Release process lock and remove pid file
                try:
                    self.__release_process_lock()
                except Exception:
                    pass
                # Remove .lock state file
                try:
                    if self.__lock_file is not None and os.path.exists(
                        self.__lock_file
                    ):
                        os.unlink(self.__lock_file)
                except Exception:
                    pass
            finally:
                # Exit the process; cleanup done above
                os._exit(0)

        if status == "running" and self.__proc is not None:
            try:
                self.__proc.kill()
            except Exception:
                pass
            # Give OS a moment to release any file locks
            time.sleep(0.25)
            status = self.status()

        if status == "stale":
            try:
                os.unlink(self.__lock_file)
            except Exception:
                pass
        # Clean up pid lock file if present
        if self.__proc_lock_file is not None and os.path.exists(self.__proc_lock_file):
            try:
                os.unlink(self.__proc_lock_file)
            except Exception:
                pass

        self.__proc_info = None
        self.__lock_exists = False
        self.__is_daemon_process = False
        self.__proc = None

        return True

    def try_start(
        self,
        volume: int,
        profile: str | None,
        debug: bool,
        window: bool,
        mouse_profile: str | None = None,
    ) -> bool:
        """
        Attempts to start the daemon process with the specified volume and
        profile. Stops any existing daemon process before starting a new one.

        Parameters:
        - volume (int): The volume level for the daemon.
        - profile (str): The profile name to be used by the daemon.
        - debug (bool): Whether or not to enable debug mode.
        - window (bool): Whether or not to display the daemon window.

        Returns:
        - bool: True if the daemon was started successfully, False if there was
                an error during startup.
        """
        # Validate profiles if provided and ensure device matches the flag
        if profile is not None:
            try:
                kb_prof = Profile(profile)
                device = kb_prof.value("profile.device") or "keyboard"
                if device != "keyboard":
                    print(
                        f"Error: '{profile}' is a '{device}' profile. Use -m/--mouse-profile for mouse profiles."
                    )
                    return False
            except ValueError as err:
                print(f"Error: {err}")
                return False
        if mouse_profile is not None:
            try:
                m_prof = Profile(mouse_profile)
                device = m_prof.value("profile.device") or "keyboard"
                if device != "mouse":
                    print(
                        f"Error: '{mouse_profile}' is a '{device}' profile. Use -p/--profile for keyboard profiles."
                    )
                    return False
            except ValueError as err:
                print(f"Error: {err}")
                return False

        status = self.status()
        if status == "running":
            self.try_stop()
            status = self.status()

        if status == "stale":
            self.try_stop()

        if debug:
            self.run_daemon(
                volume, profile, debug=True, window=window, mouse_profile=mouse_profile
            )
        else:
            args = [
                sys.argv[0],
                "start-daemon",
                str(volume),
                profile if profile is not None else "",
                str(window),
            ]
            if mouse_profile is not None:
                args.append(mouse_profile)
            subprocess.Popen(
                args,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                start_new_session=True,
            )
            time.sleep(1.0)
        return True

    def __acquire_process_lock(self) -> bool:
        """
        Acquire an OS-level exclusive lock to ensure only one daemon runs.
        Returns True only in the daemon process that obtained the lock.
        """
        if self.__proc_lock_file is None:
            return True
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.__proc_lock_file), exist_ok=True)
        except Exception:
            pass
        try:
            # Open or create the lock file and hold the handle
            self.__proc_lock_handle = open(self.__proc_lock_file, "a+b")
            if msvcrt is not None and os.name == "nt":
                try:
                    # Ensure file has at least 1 byte to lock
                    self.__proc_lock_handle.seek(0, os.SEEK_END)
                    if self.__proc_lock_handle.tell() == 0:
                        self.__proc_lock_handle.write(b"\0")
                        self.__proc_lock_handle.flush()
                    self.__proc_lock_handle.seek(0)
                    msvcrt.locking(self.__proc_lock_handle.fileno(), msvcrt.LK_NBLCK, 1)
                except OSError:
                    # Already locked by another process
                    self.__proc_lock_handle.close()
                    self.__proc_lock_handle = None
                    return False
            elif fcntl is not None:
                try:
                    fcntl.flock(self.__proc_lock_handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
                except OSError:
                    self.__proc_lock_handle.close()
                    self.__proc_lock_handle = None
                    return False
            else:
                # Fallback: best-effort without OS lock (should not happen)
                pass
            # Register cleanup on exit for the daemon process
            atexit.register(self.__release_process_lock)
            return True
        except Exception:
            if self.__proc_lock_handle is not None:
                try:
                    self.__proc_lock_handle.close()
                except Exception:
                    pass
                self.__proc_lock_handle = None
            return False

    def __release_process_lock(self) -> None:
        try:
            if self.__proc_lock_handle is not None:
                if msvcrt is not None and os.name == "nt":
                    try:
                        msvcrt.locking(
                            self.__proc_lock_handle.fileno(), msvcrt.LK_UNLCK, 1
                        )
                    except Exception:
                        pass
                elif fcntl is not None:
                    try:
                        fcntl.flock(self.__proc_lock_handle, fcntl.LOCK_UN)
                    except Exception:
                        pass
                try:
                    self.__proc_lock_handle.close()
                except Exception:
                    pass
                self.__proc_lock_handle = None
        finally:
            # Remove the pid lock file
            try:
                if self.__proc_lock_file is not None and os.path.exists(
                    self.__proc_lock_file
                ):
                    os.unlink(self.__proc_lock_file)
            except Exception:
                pass

    def update_lock_file(
        self, volume: int, profile: str | None, mouse_profile: str | None = None
    ):
        lockData = {
            "pid": os.getpid(),
            "volume": volume,
            "profile": profile,
            "mouse_profile": mouse_profile,
            "api_port": self.__api.port() if self.__api is not None else None,
        }
        print(f"updating lock-file with {lockData}")
        # Write atomically to avoid partial reads
        tmp_path = f"{self.__lock_file}.tmp"
        with open(tmp_path, "w") as f:
            json.dump(lockData, f)
            f.flush()
            os.fsync(f.fileno())
        try:
            os.replace(tmp_path, self.__lock_file)
        except Exception:
            # Fallback if replace not available
            try:
                os.unlink(self.__lock_file)
            except Exception:
                pass
            os.rename(tmp_path, self.__lock_file)

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
        if (len(sys.argv) == 5 or len(sys.argv) == 6) and sys.argv[1] == "start-daemon":
            # Ensure only one daemon proceeds by acquiring OS-level lock
            if not self.__acquire_process_lock():
                # Another daemon is already running
                return True

            volume = 100
            try:
                volume = int(sys.argv[2])
            except:
                pass

            profile = None
            try:
                profile_arg = sys.argv[3]
                profile = profile_arg if profile_arg != "" else None
            except:
                pass

            window = False
            try:
                window = sys.argv[4] == str(True)
            except:
                pass

            mouse_profile = None
            try:
                mouse_profile = sys.argv[5]
            except:
                pass

            self.run_daemon(
                volume, profile, debug=False, window=window, mouse_profile=mouse_profile
            )
            return True
        return False

    def run_daemon(
        self,
        volume: int,
        profile: str | None,
        debug: bool,
        window: bool,
        mouse_profile: str | None = None,
    ):
        api_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        api_socket.bind(("localhost", 0))
        self.__api = ExternalAPI(api_socket, daemon.on_command)
        self.__api.listen()

        self.update_lock_file(volume, profile, mouse_profile)

        if not debug:
            LINE_BUFFERED = 1
            f = open(os.devnull, "w", buffering=LINE_BUFFERED)
            sys.stdout = f
            sys.stderr = f

        if window:
            self.show_daemon_window()

        daemon.run(self, volume, profile, debug=debug, mouse_profile=mouse_profile)

    def show_daemon_window(self):
        if not self.__daemon_window_visible:
            self.__thread = threading.Thread(target=self.start_daemon_window)
            self.__thread.start()

    def start_daemon_window(self):
        self.__daemon_window_visible = True
        root = tk.Tk()
        root.title("Keyboard Sounds - Audio Daemon")
        root.resizable(False, False)
        root.attributes("-topmost", True)

        # Main label at the top left
        label_main = tk.Label(
            root,
            text="Keyboard Sounds - Audio Daemon",
            font=("Arial", 16),
            anchor="w",
            justify="left",
        )
        label_main.pack(anchor="nw", padx=10, pady=(10, 5))

        # Daemon Control group
        group_daemon = tk.LabelFrame(
            root, text="What is this?", font=("Arial", 11, "bold"), padx=10, pady=10
        )
        group_daemon.pack(anchor="nw", fill="x", padx=10, pady=5)

        label_explain = tk.Label(
            group_daemon,
            text=(
                "This window exists so you can select it as an audio source in apps "
                "like OBS. This allows you to isolate keyboard sounds from other audio, "
                "since apps like OBS can only select audio based on the active window, "
                "not the running process."
            ),
            font=("Arial", 10),
            wraplength=340,
            anchor="w",
            justify="left",
        )
        label_explain.grid(row=0, column=0, columnspan=2, sticky="w", pady=(0, 5))

        # Removed label_explain2

        btn_stop = tk.Button(
            group_daemon,
            text="Stop Daemon & Close Window",
            command=lambda: self._stop_via_gui(root),
        )
        btn_stop.grid(row=1, column=1, sticky="e", pady=(5, 0))

        group_daemon.grid_columnconfigure(0, weight=1)
        group_daemon.grid_columnconfigure(1, weight=0)

        # Hide Window group
        group_hide = tk.LabelFrame(
            root, text="Hide Window", font=("Arial", 11, "bold"), padx=10, pady=10
        )
        group_hide.pack(anchor="nw", fill="x", padx=10, pady=(5, 16))

        label_hide_explain = tk.Label(
            group_hide,
            text=(
                "Closing this window will not stop the sound daemon; it will continue "
                "running in the background. To stop the daemon, you can either use your "
                "Keyboard Sounds desktop application or run `kbs stop` command from your "
                "system's terminal. (Or use the button above.)"
            ),
            font=("Arial", 9),
            wraplength=340,
            anchor="w",
            justify="left",
        )
        label_hide_explain.grid(row=0, column=0, columnspan=2, sticky="w", pady=(0, 5))

        label_hide_explain2 = tk.Label(
            group_hide,
            text=(
                "To make this window available again for apps that need it (such as OBS), "
                "you must restart the daemon. If you have the Desktop Application installed, "
                "you can simply opposite click on the Keyboard Sounds icon in your system tray "
                "and select the 'Show Daemon Window' option."
            ),
            font=("Arial", 9),
            wraplength=340,
            anchor="w",
            justify="left",
        )
        label_hide_explain2.grid(row=1, column=0, columnspan=2, sticky="w", pady=(5, 0))

        btn_hide = tk.Button(group_hide, text="Hide Window", command=root.destroy)
        btn_hide.grid(row=2, column=1, sticky="e", pady=(5, 0))

        group_hide.grid_columnconfigure(0, weight=1)
        group_hide.grid_columnconfigure(1, weight=0)

        root.update_idletasks()
        root.mainloop()
        self.__daemon_window_visible = False

    def _stop_via_gui(self, root: tk.Tk) -> None:
        try:
            # Close the window promptly to avoid UI freeze
            try:
                root.destroy()
            except Exception:
                pass
            # Stop the daemon in a background thread so UI event loop isn't blocked
            threading.Thread(target=self.try_stop, daemon=True).start()
        except Exception:
            # Fallback if anything goes wrong
            try:
                threading.Thread(target=self.try_stop, daemon=True).start()
            except Exception:
                pass

    def capture_oneshot(self) -> bool:
        if (
            self.__one_shot
            and (len(sys.argv) == 3 or len(sys.argv) == 4)
            and sys.argv[1] == "one-shot"
        ):
            pressSound = sys.argv[2]
            releaseSound = None
            if len(sys.argv) == 4:
                releaseSound = sys.argv[3]

            try:
                daemon.one_shot(100, pressSound, releaseSound)
                return True
            except Exception as e:
                print(e)
                return False

        return False
