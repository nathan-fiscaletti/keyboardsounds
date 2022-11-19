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
        self.__prime_audio_clips()

    def __prime_audio_clips(self):
        if self.profile.value('profile.type') == "video-extract":
            ffmpeg_exe = get_ffmpeg_exe()
            VIDEO_FILE = self.profile.get_file_path(self.profile.value('profile.video'))
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

            for source in self.profile.value('sources'):
                self.__extract(source["id"], AUDIO_FILE, source["start"], source["end"])

            os.unlink(AUDIO_FILE)

        elif self.profile.value('profile.type') == "files":
            for source in self.profile.value('sources'):
                if type(source["source"]) == dict:
                    self.__extract(f"{source['id']}__press", self.profile.get_file_path(source["source"]["press"]))
                    self.__extract(f"{source['id']}__release", self.profile.get_file_path(source["source"]["release"]))
                    self.sounds[source['id']] = {
                        "press": io.BytesIO(self.sounds[f"{source['id']}__press"].getbuffer().tobytes()),
                        "release": io.BytesIO(self.sounds[f"{source['id']}__release"].getbuffer().tobytes())
                    }
                    del self.sounds[f"{source['id']}__press"]
                    del self.sounds[f"{source['id']}__release"]
                elif type(source["source"]) == str:
                    self.__extract(source["id"], self.profile.get_file_path(source["source"]))

    def __extract(self, id, input, start: float = 0.0, end: float = None):
        if input.endswith(('mp3', 'MP3')):
            source = open(input, 'rb')
            data = source.read()
            source.close()
            self.sounds[id] = io.BytesIO(data)
        else:
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

    def get_sound(self, key, action: str = "press") -> io.BytesIO:
        if self.profile.value('keys') is not None:
            if self.profile.value('keys.other') is not None:
                for mapping in self.profile.value('keys.other'):
                    if (key.name if isinstance(key, Key) else key.char) in mapping["keys"]:
                        return self.__get_sound(mapping["sound"], action)
            if self.profile.value('keys.default') is not None:
                return self.__get_sound(self.profile.value('keys.default'), action)
        return self.__get_sound(key=None, action=action)

    def __get_sound(self, key=None, action: str = "press") -> io.BytesIO:
        if key is None:
            key = list(self.sounds.keys())
        if type(key) is list:
            return self.__parse_sound(self.sounds[random.choice(key)], action)
        return self.__parse_sound(self.sounds[key], action)
    
    def __parse_sound(self, sound, action: str = "press") -> io.BytesIO:
        if type(sound) is dict:
            return io.BytesIO(sound[action].getbuffer().tobytes())
        return io.BytesIO(sound.getbuffer().tobytes()) if action == "press" else None
