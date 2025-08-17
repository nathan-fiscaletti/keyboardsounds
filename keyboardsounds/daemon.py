import os
from sys import platform

import json
import base64
import time

from pygame import mixer

from pynput.keyboard import Listener
from pynput.mouse import Listener as MouseListener, Button

from keyboardsounds.profile import Profile, OneShotProfile
from keyboardsounds.audio_manager import AudioManager
from typing import Optional, Any

WIN32 = platform.lower().startswith("win")

if WIN32:
    from keyboardsounds import app_detector
    from keyboardsounds import app_rules
    from keyboardsounds.app_rules import Action

__am: Optional[AudioManager] = None  # keyboard audio manager
__mam: Optional[AudioManager] = None  # mouse audio manager
__dm: Optional[Any] = None
__volume = 100
__down = []
__debug = False

# Keep references to listeners so they can be started/stopped dynamically
__kb_listener: Optional[Listener] = None
__mouse_listener: Optional[MouseListener] = None


def on_command(command: dict) -> None:
    global __volume
    global __am, __mam
    global __kb_listener, __mouse_listener

    if "action" in command:
        action = command["action"]
        if action == "set_volume":
            if "volume" in command:
                __volume = command["volume"]
                if __dm is not None:
                    __dm.update_lock_file(
                        __volume,
                        __am.profile.name if __am is not None else None,
                        __mam.profile.name if __mam is not None else None,
                    )
                print(f"Volume set to {__volume}%")
        elif action == "set_profile":
            if "profile" in command:
                profile = command["profile"]
                try:
                    if profile is None or profile == "":
                        __am = None
                        # Stop keyboard listener if running
                        if __kb_listener is not None:
                            try:
                                __kb_listener.stop()
                            except Exception:
                                pass
                            __kb_listener = None
                        if __dm is not None:
                            __dm.update_lock_file(
                                __volume,
                                None,
                                __mam.profile.name if __mam is not None else None,
                            )
                        print("Keyboard profile disabled")
                    else:
                        if __am is not None:
                            __am.set_profile(Profile(profile))
                        else:
                            __am = AudioManager(Profile(profile))
                            # Start keyboard listener if not running
                            if __kb_listener is None:
                                __kb_listener = Listener(
                                    on_press=__on_press, on_release=__on_release
                                )
                                __kb_listener.start()
                        if __dm is not None:
                            __dm.update_lock_file(
                                __volume,
                                profile,
                                __mam.profile.name if __mam is not None else None,
                            )
                        print(f"Profile set to {profile}")
                except ValueError as err:
                    print(f"Error: {err}")
        elif action == "set_mouse_profile":
            if "profile" in command:
                profile = command["profile"]
                try:
                    if profile is None or profile == "":
                        __mam = None
                        # Stop mouse listener if running
                        if __mouse_listener is not None:
                            try:
                                __mouse_listener.stop()
                            except Exception:
                                pass
                            __mouse_listener = None
                        if __dm is not None:
                            __dm.update_lock_file(
                                __volume,
                                __am.profile.name if __am is not None else None,
                                None,
                            )
                        print("Mouse profile disabled")
                    else:
                        if __mam is not None:
                            __mam.set_profile(Profile(profile))
                        else:
                            __mam = AudioManager(Profile(profile))
                            # Start mouse listener if not running
                            if __mouse_listener is None:
                                __mouse_listener = MouseListener(
                                    on_click=__on_mouse_click
                                )
                                __mouse_listener.start()
                        if __dm is not None:
                            __dm.update_lock_file(
                                __volume,
                                __am.profile.name if __am is not None else None,
                                profile,
                            )
                        print(f"Mouse profile set to {profile}")
                except ValueError as err:
                    print(f"Error: {err}")
        elif action == "show_daemon_window":
            try:
                if __dm is not None:
                    __dm.show_daemon_window()
            except Exception as e:
                print(f"Error: {e}")


def __on_press(key):
    """
    Callback function for key press events.

    When a key is pressed, this function is invoked to play the corresponding
    key press sound. It prevents the same key press sound from being played
    multiple times if the key is already pressed and held down.

    Parameters:
    - key: The key that was pressed.
    """
    global __am
    global __volume
    global __down

    if key in __down:
        return

    if __am is None:
        return
    sound = __am.get_sound(key, action="press")
    if sound is not None:
        clip = mixer.Sound(sound)
        clip.set_volume(float(__volume) / float(100))
        clip.play()

    # Play the sound
    __down.append(key)


def __on_release(key):
    """
    Callback function for key release events.

    When a key is released, this function is invoked to play the corresponding
    key release sound.

    Parameters:
    - key: The key that was released.
    """
    global __down
    global __am

    if __am is None:
        return
    sound = __am.get_sound(key, action="release")
    if sound is not None:
        clip = mixer.Sound(sound)
        clip.set_volume(float(__volume) / float(100))
        clip.play()

    __down = [k for k in __down if k != key]


def __on_mouse_click(x, y, button: Button, pressed: bool):
    """
    Callback for mouse click events. Plays sounds for mouse profiles.
    """
    global __mam
    global __volume

    action = "press" if pressed else "release"
    if __mam is None:
        return
    sound = __mam.get_sound(button, action=action)
    if sound is not None and pressed:
        # Only play on press by default; release will play if configured
        clip = mixer.Sound(sound)
        clip.set_volume(float(__volume) / float(100))
        clip.play()
    elif sound is not None and not pressed:
        clip = mixer.Sound(sound)
        clip.set_volume(float(__volume) / float(100))
        clip.play()


if WIN32:

    def __on_focused_application_changed(app_path: str):
        """
        Callback function for detecting focused application changes on Windows.

        It adjusts the AudioManager's state based on the foreground application
        by consulting the app rules.

        Parameters:
        - app_path: The file path of the application that has just gained focus.
        """
        global __debug
        if __debug:
            print(f"focused application changed: {app_path}")

        rules = app_rules.get_rules()

        global __am, __mam
        if __am is None and __mam is None:
            return
        if rules is not None and rules.has_exclusive_rule():
            exclusive = rules.get_exclusive_rule()
            if exclusive is not None and app_path == exclusive.app_path:
                if __am is not None:
                    __am.set_enabled(True)
                if __mam is not None:
                    __mam.set_enabled(True)
            else:
                if __am is not None:
                    __am.set_enabled(False)
                if __mam is not None:
                    __mam.set_enabled(False)
            return

        action = rules.get_action(app_path) if rules is not None else None
        if action == Action.DISABLE:
            if __am is not None:
                __am.set_enabled(False)
            if __mam is not None:
                __mam.set_enabled(False)
        elif action in [Action.ENABLE, Action.EXCLUSIVE]:
            if __am is not None:
                __am.set_enabled(True)
            if __mam is not None:
                __mam.set_enabled(True)


def run(
    dm,
    volume: int,
    profile: Optional[str],
    debug: bool,
    mouse_profile: Optional[str] = None,
):
    """
    Initializes and runs the keyboard sound application.

    This function initializes the AudioManager with a given profile and volume,
    sets up the application detector if on Windows, and starts listening for
    keyboard events.

    Parameters:
    - volume: The volume level for the sound playback.
    - profile: The sound profile to use for the AudioManager.
    """
    global __am, __mam
    global __volume
    global __dm
    global __debug
    global __kb_listener, __mouse_listener

    __debug = debug

    __volume = volume
    __am = AudioManager(Profile(profile)) if profile is not None else None
    if mouse_profile is not None:
        __mam = AudioManager(Profile(mouse_profile))
    else:
        __mam = None
    __dm = dm

    if WIN32:
        app_detector.start_listening(__on_focused_application_changed)

    mixer.init()
    __kb_listener = (
        Listener(on_press=__on_press, on_release=__on_release)
        if __am is not None
        else None
    )
    __mouse_listener = (
        MouseListener(on_click=__on_mouse_click) if __mam is not None else None
    )
    if __kb_listener is not None:
        __kb_listener.start()
    if __mouse_listener is not None:
        __mouse_listener.start()
    if __debug:

        def stdin_loop(listener):
            print("Run 'quit' to terminate the debug process")
            while (listener is not None) and listener.running:  # type: ignore[attr-defined]
                cmd = input("")
                if cmd == "quit":
                    os._exit(0)

        stdin_loop(__kb_listener or __mouse_listener)
    else:
        if __kb_listener is not None:
            __kb_listener.join()
        if __mouse_listener is not None:
            __mouse_listener.join()


def one_shot(volume: int, press_sound: str, release_sound: str | None):
    global __am

    __am = AudioManager(
        OneShotProfile(press_sound=press_sound, release_sound=release_sound)
    )

    sounds = __am.get_one_shot_sounds()

    clips = []

    mixer.init()

    waitlen = 0
    for sound in sounds:
        if sound is not None:
            clip = mixer.Sound(sound)
            clip.set_volume(float(volume) / float(100))
            clips.append(clip)
            waitlen += clip.get_length()

    for clip in clips:
        clip.set_volume(float(volume) / float(100))
        clip.play()
        time.sleep(0.15)

    time.sleep(waitlen)


def get_audio_manager() -> AudioManager:
    """
    Retrieves the AudioManager instance.

    This function returns the AudioManager instance that is currently in use by
    the application. It is used by the external API to access the AudioManager
    for sound playback.

    Returns:
    - AudioManager: The AudioManager instance.
    """
    global __am
    return __am  # type: ignore[return-value]
