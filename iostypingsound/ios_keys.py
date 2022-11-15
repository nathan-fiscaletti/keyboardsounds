# Because the iOS keyboard sounds so orgasmic

import os
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'

from pynput.keyboard import Key, Listener
from pygame import mixer

from iostypingsound.audio_extractor import prime_audio_clips
from iostypingsound.root import ROOT

def on_press(key):
    # Default to key.wav
    sound = f"{ROOT}/sounds/key.wav"

    # If key is backspace, use back.wav
    if key == Key.backspace:
        sound = f"{ROOT}/sounds/back.wav"

    # If key is modifier, use alt.wav
    elif key in [
        Key.space, Key.alt, Key.ctrl,
        Key.shift, Key.tab, Key.enter,
        Key.insert, Key.home, Key.page_up,
        Key.page_down, Key.delete, Key.end
    ]:
        sound = f"{ROOT}/sounds/alt.wav"

    # Play the sound
    mixer.Sound(sound).play()

def run():
    print("")
    print("Running Setup...")
    print("")
    success = prime_audio_clips()

    if success:
        print("")
        print("Starting Service...")
        print("")

        mixer.init()
        print("\t(pygame) Audio Mixer Initialized")

        KEY_WAV_FILE = os.path.join(ROOT, "sounds", "key.wav")
        ALT_WAV_FILE = os.path.join(ROOT, "sounds", "alt.wav")
        BACK_WAV_FILE = os.path.join(ROOT, "sounds", "back.wav")

        print(f"\t(fs    ) Key:\t{KEY_WAV_FILE}")
        print(f"\t(fs    ) Alt:\t{ALT_WAV_FILE}")
        print(f"\t(fs    ) Back:\t{BACK_WAV_FILE}")

        with Listener(on_press=on_press) as listener:
            print(f"\t(pynput) Keyboard Listener Initialized")
            print("")
            listener.join()

    else:
        print("")