"""
Custom wrapper classes for pynput keyboard and mouse listeners.
"""

import os
import sys
import threading
import glob
from typing import Optional, Callable, Any, TYPE_CHECKING

from pynput.keyboard import Listener as PynputKeyboardListener, Key, KeyCode
from pynput.mouse import Listener as PynputMouseListener, Button

# Try to import libevdev - only needed on Linux+Wayland
try:
    import libevdev
    from libevdev import Device
    LIBEVDEV_AVAILABLE = True
except ImportError:
    LIBEVDEV_AVAILABLE = False
    # Type stub for when libevdev is not available
    Device = None  # type: ignore

def isWayland():
    """
    Check if the current session is Wayland.
    """
    return os.environ.get("XDG_SESSION_TYPE") == "wayland"

def isLinux():
    """
    Check if the current system is Linux.
    """
    return sys.platform.startswith("linux")


def _should_use_libevdev() -> bool:
    """
    Check if we should use libevdev instead of pynput.
    """
    return isLinux() and isWayland() and LIBEVDEV_AVAILABLE


def _find_keyboard_devices() -> list["Device"]:
    """
    Find all available keyboard devices using libevdev.
    """
    devices = []
    if not LIBEVDEV_AVAILABLE:
        print("Libevdev is not available")
        return devices
    
    event_devices = glob.glob("/dev/input/event*")
    print(f"Searching {len(event_devices)} input devices for Keyboard Devices (EV_KEY, KEY_A, KEY_Z, KEY_ESC)")
    for device_path in sorted(event_devices):
        try:
            fd = open(device_path, "rb")
            device = Device(fd)
            # Check if device has keyboard capabilities
            if device.has(libevdev.EV_KEY):
                # Check if it has at least some key codes (basic keyboard check)
                if device.has(libevdev.EV_KEY.KEY_A) and \
                   device.has(libevdev.EV_KEY.KEY_Z) and \
                   device.has(libevdev.EV_KEY.KEY_ESC):
                    devices.append(device)
                    continue  # Keep the fd open, device manages it
            # If not a keyboard, close the fd
            fd.close()
        except (OSError, PermissionError) as e:
            print(f"Error opening input device '{device_path}': {e}")
            continue
        except Exception as e:
            print(f"Error opening input device '{device_path}': {e}")
            # If device creation fails, try to close fd if it was opened
            try:
                fd.close()
            except Exception:
                pass
            continue
    return devices


def _find_mouse_devices() -> list["Device"]:
    """
    Find all available mouse devices using libevdev.
    """
    devices = []
    if not LIBEVDEV_AVAILABLE:
        print("Libevdev is not available")
        return devices
    
    event_devices = glob.glob("/dev/input/event*")
    print(f"Searching {len(event_devices)} input devices for Mouse Devices (EV_REL, BTN_LEFT, BTN_RIGHT)")
    for device_path in sorted(event_devices):
        try:
            fd = open(device_path, "rb")
            device = Device(fd)
            # Check if device has mouse button capabilities
            if device.has(libevdev.EV_REL):
                # Check for mouse buttons (BTN_LEFT, BTN_RIGHT, BTN_MIDDLE)
                if (device.has(libevdev.EV_KEY.BTN_LEFT) or
                    device.has(libevdev.EV_KEY.BTN_RIGHT)):
                    devices.append(device)
                    continue  # Keep the fd open, device manages it
            # If not a mouse, close the fd
            fd.close()
        except (OSError, PermissionError) as e:
            print(f"Error opening mouse device '{device_path}': {e}")
            continue
        except Exception as e:
            print(f"Error opening mouse device '{device_path}': {e}")
            # If device creation fails, try to close fd if it was opened
            try:
                fd.close()
            except Exception as e:
                print(f"Error closing mouse device '{device_path}': {e}")
            continue
    return devices


# Mapping from Linux key codes to pynput Key enum values
# Based on linux/input-event-codes.h
_LINUX_KEY_TO_PYNPUT_KEY = {
    # Special keys
    1: Key.esc,  # KEY_ESC
    14: Key.backspace,  # KEY_BACKSPACE
    15: Key.tab,  # KEY_TAB
    28: Key.enter,  # KEY_ENTER
    29: Key.ctrl_l,  # KEY_LEFTCTRL
    42: Key.shift_l,  # KEY_LEFTSHIFT
    54: Key.shift_r,  # KEY_RIGHTSHIFT
    56: Key.alt_l,  # KEY_LEFTALT
    57: Key.space,  # KEY_SPACE
    58: Key.caps_lock,  # KEY_CAPSLOCK
    91: Key.cmd_l,  # KEY_LEFTMETA
    92: Key.cmd_r,  # KEY_RIGHTMETA
    93: Key.menu,  # KEY_COMPOSE
    96: Key.enter,  # KEY_KPENTER
    97: Key.ctrl_r,  # KEY_RIGHTCTRL
    98: Key.alt_gr,  # KEY_RIGHTALT
    99: Key.ctrl_l,  # KEY_LEFTCTRL (fallback)
    100: Key.alt_gr,  # KEY_RIGHTALT (fallback)
    102: Key.home,  # KEY_HOME
    103: Key.up,  # KEY_UP
    104: Key.page_up,  # KEY_PAGEUP
    105: Key.left,  # KEY_LEFT
    106: Key.right,  # KEY_RIGHT
    107: Key.end,  # KEY_END
    108: Key.down,  # KEY_DOWN
    109: Key.page_down,  # KEY_PAGEDOWN
    110: Key.insert,  # KEY_INSERT
    111: Key.delete,  # KEY_DELETE
    114: Key.media_volume_down,  # KEY_VOLUMEDOWN
    115: Key.media_volume_up,  # KEY_VOLUMEUP
    118: Key.media_previous,  # KEY_PREVIOUSSONG
    119: Key.media_play_pause,  # KEY_PLAYPAUSE
    120: Key.media_next,  # KEY_NEXTSONG
    121: Key.media_volume_mute,  # KEY_MUTE
    122: Key.media_volume_down,  # KEY_VOLUMEDOWN
    123: Key.media_volume_up,  # KEY_VOLUMEUP
    127: Key.pause,  # KEY_PAUSE
    128: Key.media_previous,  # KEY_STOPCD
    173: Key.media_volume_mute,  # KEY_MUTE
    174: Key.media_volume_down,  # KEY_VOLUMEDOWN
    175: Key.media_volume_up,  # KEY_VOLUMEUP
    176: Key.media_next,  # KEY_NEXTSONG
    177: Key.media_play_pause,  # KEY_PLAYPAUSE
    178: Key.media_previous,  # KEY_PREVIOUSSONG
    181: Key.media_play_pause,  # KEY_PLAYPAUSE
    182: Key.media_previous,  # KEY_PREVIOUSSONG
    183: Key.media_next,  # KEY_NEXTSONG
    184: Key.media_volume_mute,  # KEY_MUTE
    185: Key.media_volume_down,  # KEY_VOLUMEDOWN
    186: Key.media_volume_up,  # KEY_VOLUMEUP
    193: Key.media_play_pause,  # KEY_PLAYPAUSE
    194: Key.media_previous,  # KEY_PREVIOUSSONG
    195: Key.media_next,  # KEY_NEXTSONG
    196: Key.media_volume_mute,  # KEY_MUTE
    197: Key.media_volume_down,  # KEY_VOLUMEDOWN
    198: Key.media_volume_up,  # KEY_VOLUMEUP
    202: Key.media_play_pause,  # KEY_MEDIA
    215: Key.media_play_pause,  # KEY_PLAY
    217: Key.media_previous,  # KEY_BASSBOOST
    219: Key.print_screen,  # KEY_PRINT
    220: Key.media_volume_mute,  # KEY_HP
    240: Key.media_play_pause,  # KEY_PLAYPAUSE
    241: Key.media_volume_mute,  # KEY_MUTE
    242: Key.media_volume_down,  # KEY_VOLUMEDOWN
    243: Key.media_volume_up,  # KEY_VOLUMEUP
    244: Key.media_next,  # KEY_BASSBOOST
    247: Key.media_previous,  # KEY_BASSBOOST
    248: Key.media_next,  # KEY_BASSBOOST
    249: Key.media_play_pause,  # KEY_PLAYPAUSE
    251: Key.media_previous,  # KEY_PREVIOUSSONG
    252: Key.media_next,  # KEY_NEXTSONG
    253: Key.media_volume_mute,  # KEY_MUTE
    254: Key.media_volume_down,  # KEY_VOLUMEDOWN
    255: Key.media_volume_up,  # KEY_VOLUMEUP
}

# Function keys (KEY_F1 = 59, KEY_F2 = 60, ..., KEY_F12 = 70)
for i in range(1, 13):
    f_key = getattr(Key, f"f{i}", None)
    if f_key is not None:
        _LINUX_KEY_TO_PYNPUT_KEY[58 + i] = f_key

# Number row (1-9, 0)
_LINUX_KEY_TO_PYNPUT_KEY.update({
    2: KeyCode.from_char("1"),  # KEY_1
    3: KeyCode.from_char("2"),  # KEY_2
    4: KeyCode.from_char("3"),  # KEY_3
    5: KeyCode.from_char("4"),  # KEY_4
    6: KeyCode.from_char("5"),  # KEY_5
    7: KeyCode.from_char("6"),  # KEY_6
    8: KeyCode.from_char("7"),  # KEY_7
    9: KeyCode.from_char("8"),  # KEY_8
    10: KeyCode.from_char("9"),  # KEY_9
    11: KeyCode.from_char("0"),  # KEY_0
})

# Letters (a-z)
for i, char in enumerate("abcdefghijklmnopqrstuvwxyz", start=30):
    _LINUX_KEY_TO_PYNPUT_KEY[i] = KeyCode.from_char(char)

# Mapping from Linux button codes to pynput Button
_LINUX_BUTTON_TO_PYNPUT_BUTTON = {
    272: Button.left,  # BTN_LEFT
    273: Button.right,  # BTN_RIGHT
    274: Button.middle,  # BTN_MIDDLE
}


def _linux_key_to_pynput(linux_key_code: int) -> Key | KeyCode:
    """
    Convert a Linux key code to a pynput Key or KeyCode.
    """
    if linux_key_code in _LINUX_KEY_TO_PYNPUT_KEY:
        result = _LINUX_KEY_TO_PYNPUT_KEY[linux_key_code]
        if result is not None:
            return result
    
    # Fallback: create a KeyCode with the raw scan code
    # This handles keys not in our mapping
    # KeyCode can be constructed with just the vk (virtual key code)
    try:
        # Try to create KeyCode with the scan code as vk
        return KeyCode(vk=linux_key_code)
    except Exception:
        # Last resort: return a KeyCode with just the code
        return KeyCode(linux_key_code)


def _linux_button_to_pynput(linux_button_code: int) -> Optional[Button]:
    """
    Convert a Linux button code to a pynput Button.
    """
    # Convert to int in case libevdev returns an enum
    return _LINUX_BUTTON_TO_PYNPUT_BUTTON.get(int(linux_button_code))


class KeyboardListener:
    """
    Wrapper around pynput.keyboard.Listener that maintains identical signatures.
    Uses libevdev on Linux+Wayland, otherwise uses pynput.
    """

    def __init__(
        self,
        on_press: Optional[Callable] = None,
        on_release: Optional[Callable] = None,
        **kwargs: Any
    ):
        """
        Initialize the keyboard listener wrapper.

        Args:
            on_press: Callback function for key press events.
            on_release: Callback function for key release events.
            **kwargs: Additional keyword arguments passed to the underlying listener.
        """
        self._on_press = on_press
        self._on_release = on_release
        self._use_libevdev = _should_use_libevdev()
        self._running = False
        self._devices: list["Device"] = []
        self._threads: list[threading.Thread] = []
        self._stop_event = threading.Event()
        
        if self._use_libevdev:
            print("Using libevdev for keyboard listener")
            self._devices = _find_keyboard_devices()
            if not self._devices:
                print("Attempted to find keyboard devices with libevdev, but no devices found")
                # Fallback to pynput if no keyboard devices found
                self._use_libevdev = False
            else:
                print(f"Found {len(self._devices)} keyboard device(s) with libevdev:")
                for device in self._devices:
                    print(f"  - {device.name}")
        
        if not self._use_libevdev:
            print("Using pynput for keyboard listener")
            self._listener = PynputKeyboardListener(
                on_press=on_press, on_release=on_release, **kwargs
            )
        else:
            self._listener = None

    def _libevdev_listener_loop(self, device: "Device") -> None:
        """Event loop for a single libevdev keyboard device."""
        while not self._stop_event.is_set():
            try:
                # Use sync mode to read events
                # This will block until an event is available or timeout
                events = device.events()
                for event in events:
                    if self._stop_event.is_set():
                        print(f"Stop event set for keyboard device '{device.name}'")
                        break
                    
                    if event.type == libevdev.EV_KEY:
                        key = _linux_key_to_pynput(event.code)
                        if event.value == 1:  # Key press
                            if self._on_press:
                                self._on_press(key)
                        elif event.value == 0:  # Key release
                            if self._on_release:
                                self._on_release(key)
                        else:
                            print(f"Unknown event value for keyboard device '{device.name}': {event.value}")
            except (OSError, IOError) as e:
                # If there's an error reading events (e.g., device disconnected), break
                print(f"Error reading from keyboard device '{device.name}': {e}")
                break
            except Exception as e:
                print(f"Error reading from keyboard device '{device.name}': {e}")
                # For other exceptions, continue but log if needed
                continue

    def start(self) -> None:
        """Start the listener."""
        if self._use_libevdev:
            if not self._devices:
                return
            self._running = True
            self._stop_event.clear()
            self._threads = []
            # Create a thread for each device
            for device in self._devices:
                thread = threading.Thread(
                    target=self._libevdev_listener_loop,
                    args=(device,),
                    daemon=True
                )
                thread.start()
                self._threads.append(thread)
        else:
            if self._listener:
                self._listener.start()

    def stop(self) -> None:
        """Stop the listener."""
        if self._use_libevdev:
            self._running = False
            self._stop_event.set()
        else:
            if self._listener:
                self._listener.stop()

    def join(self) -> None:
        """Wait for the listener threads to terminate."""
        if self._use_libevdev:
            for thread in self._threads:
                thread.join()
        else:
            if self._listener:
                self._listener.join()

    @property
    def running(self) -> bool:
        """Check if the listener is currently running."""
        if self._use_libevdev:
            return self._running and any(thread.is_alive() for thread in self._threads)
        else:
            if self._listener:
                return self._listener.running
            return False


class MouseListener:
    """
    Wrapper around pynput.mouse.Listener that maintains identical signatures.
    Uses libevdev on Linux+Wayland, otherwise uses pynput.
    """

    def __init__(
        self,
        on_move: Optional[Callable] = None,
        on_click: Optional[Callable] = None,
        on_scroll: Optional[Callable] = None,
        **kwargs: Any
    ):
        """
        Initialize the mouse listener wrapper.

        Args:
            on_move: Callback function for mouse move events.
            on_click: Callback function for mouse click events.
            on_scroll: Callback function for mouse scroll events.
            **kwargs: Additional keyword arguments passed to the underlying listener.
        """
        self._on_move = on_move
        self._on_click = on_click
        self._on_scroll = on_scroll
        self._use_libevdev = _should_use_libevdev()
        self._running = False
        self._devices: list["Device"] = []
        self._threads: list[threading.Thread] = []
        self._stop_event = threading.Event()
        # Shared position tracking across all mouse devices
        self._last_x = 0
        self._last_y = 0
        self._position_lock = threading.Lock()
        
        if self._use_libevdev:
            print("Using libevdev for mouse listener")
            self._devices = _find_mouse_devices()
            if not self._devices:
                print("Attempted to find mouse devices with libevdev, but no devices found")
                # Fallback to pynput if no mouse devices found
                self._use_libevdev = False
            else:
                print(f"Found {len(self._devices)} mouse device(s) with libevdev:")
                for device in self._devices:
                    print(f"  - {device.name}")
        
        if not self._use_libevdev:
            print("Using pynput for mouse listener")
            self._listener = PynputMouseListener(
                on_move=on_move, on_click=on_click, on_scroll=on_scroll, **kwargs
            )
        else:
            self._listener = None

    def _libevdev_listener_loop(self, device: "Device") -> None:
        """Event loop for a single libevdev mouse device."""
        while not self._stop_event.is_set():
            try:
                # Use sync mode to read events
                events = device.events()
                for event in events:
                    if self._stop_event.is_set():
                        print(f"Stop event set for mouse device '{device.name}'")
                        break
                    
                    if event.type == libevdev.EV_KEY:
                        # Mouse button event
                        button = _linux_button_to_pynput(event.code)
                        if button is not None:
                            pressed = event.value == 1
                            if self._on_click:
                                # Get current position with lock
                                with self._position_lock:
                                    x, y = self._last_x, self._last_y
                                # pynput's on_click signature: (x, y, button, pressed)
                                self._on_click(x, y, button, pressed)
                        else:
                            print(f"Unknown button code for mouse device '{device.name}': {event.code}")
                    elif event.type == libevdev.EV_REL:
                        # Relative movement event
                        with self._position_lock:
                            if event.code == 0:  # REL_X
                                self._last_x += event.value
                                x, y = self._last_x, self._last_y
                            elif event.code == 1:  # REL_Y
                                self._last_y += event.value
                                x, y = self._last_x, self._last_y
                            else:
                                x, y = self._last_x, self._last_y
                            
                            if event.code == 0 or event.code == 1:
                                # Movement event
                                if self._on_move:
                                    self._on_move(x, y)
                            elif event.code == 8:  # REL_WHEEL
                                if self._on_scroll:
                                    # pynput's on_scroll signature: (x, y, dx, dy)
                                    self._on_scroll(x, y, 0, event.value)
                            elif event.code == 11:  # REL_WHEEL_HI_RES
                                if self._on_scroll:
                                    self._on_scroll(x, y, 0, event.value)
            except (OSError, IOError) as e:
                # If there's an error reading events (e.g., device disconnected), break
                print(f"Error reading from mouse device '{device.name}': {e}")
                break
            except Exception as e:
                print(f"Error reading from mouse device '{device.name}': {e}")
                # For other exceptions, continue but log if needed
                continue

    def start(self) -> None:
        """Start the listener."""
        if self._use_libevdev:
            if not self._devices:
                return
            self._running = True
            self._stop_event.clear()
            self._threads = []
            # Create a thread for each device
            for device in self._devices:
                thread = threading.Thread(
                    target=self._libevdev_listener_loop,
                    args=(device,),
                    daemon=True
                )
                thread.start()
                self._threads.append(thread)
        else:
            if self._listener:
                self._listener.start()

    def stop(self) -> None:
        """Stop the listener."""
        if self._use_libevdev:
            self._running = False
            self._stop_event.set()
        else:
            if self._listener:
                self._listener.stop()

    def join(self) -> None:
        """Wait for the listener threads to terminate."""
        if self._use_libevdev:
            for thread in self._threads:
                thread.join()
        else:
            if self._listener:
                self._listener.join()

    @property
    def running(self) -> bool:
        """Check if the listener is currently running."""
        if self._use_libevdev:
            return self._running and any(thread.is_alive() for thread in self._threads)
        else:
            if self._listener:
                return self._listener.running
            return False

