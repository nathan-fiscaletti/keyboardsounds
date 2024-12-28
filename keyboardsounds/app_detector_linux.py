import os
import time
from threading import Thread
from typing import Callable

try:
    from i3ipc import Connection  # For Sway
    sway_available = True
except ImportError:
    sway_available = False

try:
    from pydbus import SessionBus  # For GNOME and KDE
    dbus_available = True
except ImportError:
    dbus_available = False

try:
    from Xlib import X, display  # For X11
    xlib_available = True
except ImportError:
    xlib_available = False

__callback: Callable[[str], None] = None
__thread = None


def start_listening(callback):
    """
    Starts listening for active window changes, selecting the appropriate method
    based on the current environment (X11, GNOME, KDE, or Sway).

    Parameters:
    - callback: A function that accepts a single string argument. It will be
                called with the path to the binary of the active window process
                whenever it changes.
    """
    global __callback
    __callback = callback
    global __thread
    __thread = Thread(target=__monitor_foreground_window, daemon=True)
    __thread.start()


def __get_executable_path(pid: int) -> str:
    """
    Retrieves the executable path for a given process ID (PID).

    Parameters:
    - pid: The process ID of the target process.

    Returns:
    - A string representing the path to the executable, or None if not found.
    """
    try:
        return os.readlink(f"/proc/{pid}/exe")
    except FileNotFoundError:
        return None
    except Exception as e:
        print(f"Error fetching executable path for PID {pid}: {e}")
        return None


def __get_active_window_binary_x11() -> str:
    """
    Retrieves the path to the binary of the active window's process for X11.
    """
    try:
        d = display.Display()
        root = d.screen().root
        window_id = root.get_full_property(
            d.intern_atom('_NET_ACTIVE_WINDOW'), X.AnyPropertyType
        ).value[0]
        window = d.create_resource_object('window', window_id)
        pid = window.get_full_property(d.intern_atom('_NET_WM_PID'), 0).value[0]
        return __get_executable_path(pid)
    except Exception as e:
        print(f"Error fetching active window binary for X11: {e}")
        return None


def __get_active_window_binary_sway() -> str:
    """
    Retrieves the path to the binary of the active window's process for Sway.
    """
    try:
        sway = Connection()
        focused = sway.get_tree().find_focused()
        if focused and focused.pid:
            return __get_executable_path(focused.pid)
        return None
    except Exception as e:
        print(f"Error fetching active window binary for Sway: {e}")
        return None


def __get_active_window_binary_gnome() -> str:
    """
    Retrieves the path to the binary of the active window's process for GNOME.
    """
    try:
        bus = SessionBus()
        shell = bus.get("org.gnome.Shell", "/org/gnome/Shell")
        active_window_pid = shell.Eval(
            "global.get_window_actors().find(w => w.meta_window.has_focus()).meta_window.get_pid()"
        )
        if active_window_pid:
            return __get_executable_path(int(active_window_pid))
        return None
    except Exception as e:
        print(f"Error fetching active window binary for GNOME: {e}")
        return None


def __get_active_window_binary_kwin() -> str:
    """
    Retrieves the path to the binary of the active window's process for KDE.
    """
    try:
        bus = SessionBus()
        kwin = bus.get("org.kde.KWin", "/KWin")
        active_window_pid = kwin.activeWindow().pid
        if active_window_pid:
            return __get_executable_path(active_window_pid)
        return None
    except Exception as e:
        print(f"Error fetching active window binary for KDE: {e}")
        return None


def __get_active_window_binary() -> str:
    """
    Determines the active window binary path by detecting the environment
    and using the appropriate logic.
    """
    # Check if Sway (Wayland compositor with i3 IPC protocol)
    if sway_available and os.getenv("SWAYSOCK"):
        return __get_active_window_binary_sway()

    # Check for GNOME (Mutter) using environment variables or D-Bus service
    if dbus_available and os.getenv("GNOME_DESKTOP_SESSION_ID"):
        return __get_active_window_binary_gnome()

    # Check for KDE (KWin) using D-Bus service
    if dbus_available and os.getenv("KDE_FULL_SESSION"):
        return __get_active_window_binary_kwin()

    # Default to X11 if the display is ":0" or similar
    if xlib_available and os.getenv("DISPLAY"):
        return __get_active_window_binary_x11()

    print("Unsupported environment: Could not determine window manager.")
    return None


def __monitor_foreground_window():
    """
    Monitors for changes in the foreground window and calls the provided callback.

    This function runs in a separate thread.
    """
    previous_binary = None
    while True:
        active_binary = __get_active_window_binary()
        if active_binary and active_binary != previous_binary:
            previous_binary = active_binary
            if __callback:
                __callback(active_binary)
        time.sleep(0.5)  # Poll every 500ms (adjust as needed)
