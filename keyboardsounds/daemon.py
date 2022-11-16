import os

os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
from pygame import mixer

from pynput.keyboard import Listener

from keyboardsounds.profile import Profile
from keyboardsounds.audio_manager import AudioManager

_am = None
_volume = 100
_repeat = False
_down = []

def on_press(key):
    global _am
    global _volume
    global _down
    global _repeat

    # Play the sound
    if not _repeat:
        if key in _down:
            return
        _down.append(key)
    clip = mixer.Sound(_am.get_sound(key))
    clip.set_volume(float(_volume) / float(100))
    clip.play()

def on_release(key):
    global _down
    global _repeat
    if not _repeat:
        _down = [k for k in _down if k != key]

def run(volume: int, profile: str, repeat: bool):
    global _am
    global _volume
    global _repeat

    _am = AudioManager(Profile(profile))
    _volume = volume
    _repeat = repeat

    if _am.prime_audio_clips():
        mixer.init()
        with Listener(on_press=on_press, on_release=on_release) as listener:
            listener.join()