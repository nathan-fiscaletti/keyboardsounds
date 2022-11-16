import os

os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
from pygame import mixer

from pynput.keyboard import Listener

from keyboard_sounds.profile import Profile
from keyboard_sounds.audio_manager import AudioManager

_am = None
_volume = 100

def on_press(key):
    global _am
    global _volume

    # Play the sound
    clip = mixer.Sound(_am.get_sound(key))
    clip.set_volume(float(_volume) / float(100))
    clip.play()

def run(volume: int, profile: str):
    global _am
    global _volume

    _am = AudioManager(Profile(profile))
    _volume = volume

    if _am.prime_audio_clips():
        mixer.init()
        with Listener(on_press=on_press) as listener:
            listener.join()