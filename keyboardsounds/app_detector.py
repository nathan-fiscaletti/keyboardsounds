from threading import Thread
from typing import Callable
from ctypes import wintypes, windll, create_unicode_buffer
import ctypes

PROCESS_QUERY_INFORMATION = 0x0400
PROCESS_VM_READ = 0x0010
WINEVENT_OUTOFCONTEXT = 0x0000
EVENT_SYSTEM_FOREGROUND = 0x0003

user32 = windll.user32
ole32 = windll.ole32

__callback: Callable[[str], None] = None
__hook = None

def start_listening(callback):
    """
    Initiates the listening process for foreground window changes on the system.

    This function starts a new thread that runs the internal message loop, which
    listens for window change events. When a foreground window change is
    detected, the specified callback function is invoked with the full path of
    the executable file of the foreground process.

    Parameters:
    - callback: A Callable accepting a single string argument. This function
                will be called with the path of the executable file of the
                active window whenever a foreground window change occurs.

    Returns:
    - None
    """
    global __callback
    __callback = callback
    t = Thread(target=__message_loop)
    t.start()

def __on_foreground_window_change(hWinEventHook, event, hwnd, idObject,
                                  idChild, dwEventThread, dwmsEventTime):
    """
    Internal callback function triggered by Windows event hook when a foreground
    window change is detected.

    This function is called by the system, not directly by the user. It
    retrieves the process ID of the new foreground window, obtains a handle to
    the process, and then queries for the process's executable file path. If
    successful, it invokes the user-provided callback function with the
    executable path.

    Parameters:
    - hWinEventHook: Handle to the event hook that triggered this callback.
                     Not used in this function.
    - event:         Specifies the event that occurred. This function expects
                     EVENT_SYSTEM_FOREGROUND.
    - hwnd:          Handle to the window that triggered the foreground change
                     event.
    - idObject:      Specifies the object identifier. Not used in this function.
    - idChild:       Specifies the child identifier. Not used in this function.
    - dwEventThread: The identifier of the thread that generated the event.
                     Not used in this function.
    - dwmsEventTime: Specifies the time in milliseconds when the event occurred.
                     Not used in this function.

    Returns:
    - None
    """
    global __callback
    if __callback is not None:
        pid = wintypes.DWORD()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        access = wintypes.DWORD(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ)
        hProcess = windll.kernel32.OpenProcess(access, False, pid)
        if hProcess:
            buffer = create_unicode_buffer(260)
            size = wintypes.DWORD(ctypes.sizeof(buffer))
            if windll.psapi.GetModuleFileNameExW(hProcess, 0, buffer, size):
                __callback(buffer.value)
            windll.kernel32.CloseHandle(hProcess)

WinEventProcType = ctypes.WINFUNCTYPE(
    None, 
    wintypes.HANDLE,
    wintypes.DWORD,
    wintypes.HWND,
    wintypes.LONG,
    wintypes.LONG,
    wintypes.DWORD,
    wintypes.DWORD
)
__win_event_proc = WinEventProcType(__on_foreground_window_change)

def __message_loop():
    """
    Internal function that runs a message loop to listen for system events.

    This function initializes COM libraries, sets up a Windows event hook to
    listen for foreground window changes, and enters a message loop to keep the
    thread alive and responsive to events. When an event matching the criteria
    is detected, __on_foreground_window_change is invoked. The loop and hook are
    terminated when the script ends or an exception occurs.

    Returns:
    - None
    """
    ole32.CoInitialize(0)

    # make sure we call the callback with the current foreground window
    # to initialize the state of the delegate
    hwnd = user32.GetForegroundWindow()
    __on_foreground_window_change(None, EVENT_SYSTEM_FOREGROUND, hwnd, 0, 0, 0, 0)

    global __hook
    global __win_event_proc
    user32.SetWinEventHook.restype = ctypes.wintypes.HANDLE
    __hook = user32.SetWinEventHook(
        wintypes.DWORD(EVENT_SYSTEM_FOREGROUND),
        wintypes.DWORD(EVENT_SYSTEM_FOREGROUND),
        0,
        __win_event_proc,
        0,
        0,
        wintypes.DWORD(WINEVENT_OUTOFCONTEXT)
    )
    if not __hook:
        raise f"Hook error: ${ctypes.WinError(ctypes.get_last_error())}"

    try:
        msg = wintypes.MSG()
        while user32.GetMessageW(ctypes.byref(msg), 0, 0, 0) != 0:
            user32.TranslateMessage(ctypes.byref(msg))
            user32.DispatchMessageW(ctypes.byref(msg))
    finally:
        user32.UnhookWinEvent(__hook)