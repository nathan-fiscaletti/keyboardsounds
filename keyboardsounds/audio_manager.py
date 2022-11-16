## Utility functions for extracting the keyboard audio clips from the
## iOS video recording.

import subprocess
import wave
import os
import io
import random

from imageio_ffmpeg import get_ffmpeg_exe
from pynput.keyboard import Key, KeyCode

from keyboardsounds.profile import Profile

class AudioManager:
    def __init__(self, profile: Profile) -> None:
        self.sounds = {}
        self.profile = profile

    def prime_audio_clips(self) -> bool:
        if self.profile.data["type"] == "video-extract":
            ffmpeg_exe = get_ffmpeg_exe()
            VIDEO_FILE = self.profile.get_file_path(self.profile.data["video"])
            AUDIO_FILE = f"{VIDEO_FILE}.wav"

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

            for sound in self.profile.data["sounds"]:
                self.__extract(sound["id"], AUDIO_FILE, sound["start"], sound["end"])

            os.unlink(AUDIO_FILE)

        elif self.profile.data["type"] == "files":
            for sound in self.profile.data["sounds"]:
                self.__extract(sound["id"], self.profile.get_file_path(sound["file"]))

        return True

    def __extract(self, id, input, start: float = 0.0, end: float = None):
        source = wave.open(input, 'rb')
        source.setpos(int(start * source.getframerate()))
        end = end if end is not None else source.getnframes() / source.getframerate()
        frames = int((end - start) * source.getframerate())
        self.sounds[id] = io.BytesIO()
        dest = wave.open(self.sounds[id], 'wb')
        dest.setparams(source.getparams())
        dest.writeframes(source.readframes(frames))
        source.close()
        self.sounds[id].seek(0)

    def get_sound(self, key):
        for mapping in self.profile.data["keys"]:
            if (key.name if isinstance(key, Key) else key.char) in mapping["keys"]:
                    configured_sound = mapping["sound"]
                    if type(configured_sound) is list:
                        return io.BytesIO(self.sounds[random.choice(configured_sound)].getbuffer().tobytes())
                    else:
                        return io.BytesIO(self.sounds[configured_sound].getbuffer().tobytes())

        configured_default = self.profile.data["default"]
        if type(configured_default) is list:
            return io.BytesIO(self.sounds[random.choice(configured_default)].getbuffer().tobytes())
        return io.BytesIO(self.sounds[configured_default].getbuffer().tobytes())
        
