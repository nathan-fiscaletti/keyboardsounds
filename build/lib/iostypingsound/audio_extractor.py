## Utility functions for extracting the keyboard audio clips from the
## iOS video recording.

import subprocess
import wave
import os

from iostypingsound.root import ROOT

def ffmpeg_installed():
    try:
        subprocess.run("ffmpeg -version".split(), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except:
        return False

# Extract samples
def extract(input, start, end, output):
    print(f"\t(wave  ) Extracting {os.path.basename(input)} ({start}s - {end}s) to {os.path.basename(output)}...")
    sounds_dir = os.path.dirname(os.path.realpath(output))
    if not os.path.exists(sounds_dir):
        os.makedirs(sounds_dir)
    source = wave.open(input, 'rb')
    source.setpos(int(start * source.getframerate()))
    frames = int((end - start) * source.getframerate())
    dest = wave.open(output, 'wb')
    dest.setparams(source.getparams())
    dest.writeframes(source.readframes(frames))
    source.close()
    dest.close()

def prime_audio_clips():
    if not ffmpeg_installed():
        print(f"\t(ffmpeg) Error: ffmpeg is not available in path. Please install ffmpeg and try again.")
        return False

    VIDEO_FILE = os.path.join(ROOT, "setup", "ios-video-recording.mp4")
    AUDIO_FILE = os.path.join(ROOT, "setup", "video.wav")

    # Convert video file to wav
    print(f"\t(ffmpeg) Converting {os.path.basename(VIDEO_FILE)} to {os.path.basename(AUDIO_FILE)}...")
    subprocess.run(
        [
            "ffmpeg",
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

    KEY_WAV_FILE = os.path.join(ROOT, "sounds", "key.wav")
    ALT_WAV_FILE = os.path.join(ROOT, "sounds", "alt.wav")
    BACK_WAV_FILE = os.path.join(ROOT, "sounds", "back.wav")

    extract(AUDIO_FILE, 3.377, 3.392, KEY_WAV_FILE)
    extract(AUDIO_FILE, 5.050, 5.073, ALT_WAV_FILE)
    extract(AUDIO_FILE, 6.723, 6.766, BACK_WAV_FILE)

    print(f"\t(fs    ) Removing intermediate {os.path.basename(AUDIO_FILE)} file...")
    os.unlink(AUDIO_FILE)
    return True
