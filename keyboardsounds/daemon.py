from pygame import mixer

from pynput.keyboard import Listener

from keyboardsounds.profile import Profile
from keyboardsounds.audio_manager import AudioManager

__am: AudioManager = None
__volume = 100
__down = []

def __on_press(key):
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
    global __down
    global __am

    sound = __am.get_sound(key, action="release")
    if sound is not None:
        clip = mixer.Sound(sound)
        clip.set_volume(float(__volume) / float(100))
        clip.play()

    __down = [k for k in __down if k != key]

def run(volume: int, profile: str):
    global __am
    global __volume

    __volume = volume
    __am = AudioManager(Profile(profile))

    mixer.init()
    with Listener(on_press=__on_press, on_release=__on_release) as listener:
        listener.join()
        