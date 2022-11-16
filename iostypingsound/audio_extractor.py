## Utility functions for extracting the keyboard audio clips from the
## iOS video recording.

import subprocess
import wave
import os
import io
from enum import Enum
from imageio_ffmpeg import get_ffmpeg_exe

from iostypingsound.root import ROOT

class Sound(Enum):
    Key = 1
    Alt = 2
    Back = 3

sounds = {}

def get_sound(key: Sound):
    global sounds
    return io.BytesIO(sounds[key].getbuffer().tobytes())

# Extract samples
def extract(input, start, end, key: Sound):
    source = wave.open(input, 'rb')
    source.setpos(int(start * source.getframerate()))
    frames = int((end - start) * source.getframerate())
    sounds[key] = io.BytesIO()
    dest = wave.open(sounds[key], 'wb')
    dest.setparams(source.getparams())
    dest.writeframes(source.readframes(frames))
    source.close()
    sounds[key].seek(0)

def prime_audio_clips():
    ffmpeg_exe = get_ffmpeg_exe()
    VIDEO_FILE = os.path.join(ROOT, "setup", "ios-video-recording.mp4")
    AUDIO_FILE = os.path.join(ROOT, "setup", "video.wav")

    # Convert video file to wav
    subprocess.run(
        [
            ffmpeg_exe,
            "-y",
            "-i",
            VIDEO_FILE,
            "-f",
            "wav",
            "-vn",
            AUDIO_FILE
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    extract(AUDIO_FILE, 3.377, 3.392, Sound.Key)
    extract(AUDIO_FILE, 5.050, 5.073, Sound.Alt)
    extract(AUDIO_FILE, 6.723, 6.766, Sound.Back)

    os.unlink(AUDIO_FILE)
    return True
