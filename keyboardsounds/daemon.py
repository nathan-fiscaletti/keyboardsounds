from pygame import mixer

from pynput.keyboard import Listener

from keyboardsounds.profile import Profile
from keyboardsounds.audio_manager import AudioManager

_am: AudioManager = None
_volume = 100
_down = []

def on_press(key):
    global _am
    global _volume
    global _down

    if key in _down:
        return

    sound = _am.get_sound(key, action="press")
    if sound is not None:
        clip = mixer.Sound(sound)
        clip.set_volume(float(_volume) / float(100))
        clip.play()

    # Play the sound
    _down.append(key)

def on_release(key):
    global _down
    global _am

    sound = _am.get_sound(key, action="release")
    if sound is not None:
        clip = mixer.Sound(sound)
        clip.set_volume(float(_volume) / float(100))
        clip.play()

    _down = [k for k in _down if k != key]

def run(volume: int, profile: str):
    global _am
    global _volume

    _am = AudioManager(Profile(profile))
    _volume = volume

    if _am.prime_audio_clips():
        mixer.init()
        with Listener(on_press=on_press, on_release=on_release) as listener:
            listener.join()