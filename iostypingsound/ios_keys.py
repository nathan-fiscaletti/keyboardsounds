# Because the iOS keyboard sounds so orgasmic

import os
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'

from pynput.keyboard import Key, Listener
from pygame import mixer

from iostypingsound.audio_extractor import prime_audio_clips
from iostypingsound.audio_extractor import get_sound
from iostypingsound.audio_extractor import Sound

from iostypingsound.root import ROOT

def on_press(key):
    # Default to key.wav
    sound = Sound.Key

    # If key is backspace, use back.wav
    if key == Key.backspace:
        sound = Sound.Back

    # If key is modifier, use alt.wav
    elif key in [
        Key.space, Key.alt, Key.ctrl,
        Key.shift, Key.tab, Key.enter,
        Key.insert, Key.home, Key.page_up,
        Key.page_down, Key.delete, Key.end
    ]:
        sound = Sound.Alt

    # Play the sound
    mixer.Sound(get_sound(sound)).play()

def run():
    success = prime_audio_clips()

    if success:
        mixer.init()

        with Listener(on_press=on_press) as listener:
            listener.join()