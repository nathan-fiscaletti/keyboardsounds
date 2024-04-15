from sys import platform

import json
import base64

from pygame import mixer

from pynput.keyboard import Listener

from keyboardsounds.profile import Profile
from keyboardsounds.audio_manager import AudioManager

WIN32 = platform.lower().startswith("win")

if WIN32:
    from keyboardsounds import app_detector
    from keyboardsounds import app_rules
    from keyboardsounds.app_rules import Action

__am: AudioManager = None
__dm = None
__volume = 100
__down = []


def on_command(command: dict) -> None:
    global __volume

    if "action" in command:
        action = command["action"]
        if action == "set_volume":
            if "volume" in command:
                __volume = command["volume"]
                __dm.update_lock_file(__volume, __am.profile.name)
                print(f"Volume set to {__volume}%")
        elif action == "set_profile":
            if "profile" in command:
                profile = command["profile"]
                try:
                    __am.set_profile(Profile(profile))
                    __dm.update_lock_file(__volume, profile)
                    print(f"Profile set to {profile}")
                except ValueError as err:
                    print(f"Error: {err}")


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

    sound = __am.get_sound(key, action="release")
    if sound is not None:
        clip = mixer.Sound(sound)
        clip.set_volume(float(__volume) / float(100))
        clip.play()

    __down = [k for k in __down if k != key]


if WIN32:

    def __on_focused_application_changed(app_path: str):
        """
        Callback function for detecting focused application changes on Windows.

        It adjusts the AudioManager's state based on the foreground application
        by consulting the app rules.

        Parameters:
        - app_path: The file path of the application that has just gained focus.
        """
        rules = app_rules.get_rules()

        global __am
        if rules.has_exclusive_rule():
            if app_path == rules.get_exclusive_rule().app_path:
                __am.set_enabled(True)
            else:
                __am.set_enabled(False)
            return

        action = rules.get_action(app_path)
        if action == Action.DISABLE:
            __am.set_enabled(False)
        elif action in [Action.ENABLE, Action.EXCLUSIVE]:
            __am.set_enabled(True)


def run(dm, volume: int, profile: str):
    """
    Initializes and runs the keyboard sound application.

    This function initializes the AudioManager with a given profile and volume,
    sets up the application detector if on Windows, and starts listening for
    keyboard events.

    Parameters:
    - volume: The volume level for the sound playback.
    - profile: The sound profile to use for the AudioManager.
    """
    global __am
    global __volume
    global __dm

    __volume = volume
    __am = AudioManager(Profile(profile))
    __dm = dm

    if WIN32:
        app_detector.start_listening(__on_focused_application_changed)

    mixer.init()
    with Listener(on_press=__on_press, on_release=__on_release) as listener:
        listener.join()


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
    return __am
