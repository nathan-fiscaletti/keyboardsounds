import subprocess
import wave
import os
import io
import random

from typing import Optional

from imageio_ffmpeg import get_ffmpeg_exe
from pynput.keyboard import Key, KeyCode

from keyboardsounds.profile import Profile


class AudioManager:
    def __init__(self, profile: Profile) -> None:
        """
        Initializes the AudioManager with a given profile.

        Parameters:
        - profile (Profile): The profile object containing configuration
                             settings such as audio sources and key mappings.

        The constructor initializes the internal state, loads the sound clips
        based on the provided profile, and sets up the audio manager.
        """
        self.sounds = {}
        self.profile = profile
        self.__prime_audio_clips()
        self.__enabled = True

    def set_profile(self, profile: Profile):
        """
        Sets a new profile for the AudioManager.

        Parameters:
        - profile (Profile): The new profile to be set for the AudioManager.

        This method allows for changing the profile associated with the
        AudioManager instance, updating the sound clips and key mappings
        accordingly.
        """
        self.sounds = {}
        self.profile = profile
        self.__prime_audio_clips()

    def __prime_audio_clips(self):
        """
        Primes audio clips based on the profile configuration.

        This private method reads the profile configuration to determine the
        type of audio sources (e.g., video files, individual audio files) and
        prepares the audio clips accordingly. It might involve converting video
        files to audio, extracting specific segments from audio files, and
        organizing them for playback.

        No parameters or return values as it modifies the internal state of the
        AudioManager instance.
        """
        if self.profile.value("profile.type") == "video-extract":
            ffmpeg_exe = get_ffmpeg_exe()
            V_FILE = self.profile.get_file_path(self.profile.value("profile.video"))
            A_FILE = f"{V_FILE}.wav"
            subprocess.run(
                [ffmpeg_exe, "-y", "-i", V_FILE, "-f", "wav", "-vn", A_FILE],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            for source in self.profile.value("sources"):
                self.__extract(source["id"], A_FILE, source["start"], source["end"])
            os.unlink(A_FILE)
        elif self.profile.value("profile.type") == "files":
            for source in self.profile.value("sources"):
                if isinstance(source["source"], dict):
                    source_id = source["id"]
                    press_loc = source["source"]["press"]
                    press_path = self.profile.get_file_path(press_loc)
                    release_loc = source["source"]["release"]
                    release_path = self.profile.get_file_path(release_loc)
                    press_id = f"{source_id}__press"
                    release_id = f"{source_id}__release"

                    self.__extract(press_id, press_path)
                    self.__extract(release_id, release_path)

                    press_snd = self.sounds[press_id].getbuffer().tobytes()
                    release_snd = self.sounds[release_id].getbuffer().tobytes()

                    self.sounds[source_id] = {
                        "press": io.BytesIO(press_snd),
                        "release": io.BytesIO(release_snd),
                    }
                    del self.sounds[press_id]
                    del self.sounds[release_id]
                elif type(source["source"]) == str:
                    source_id = source["id"]
                    path = self.profile.get_file_path(source["source"])
                    self.__extract(source_id, path)

    def __extract(self, id, input, start: float = 0.0, end: float = None):
        """
        Extracts and prepares an audio clip from the specified input source.

        Parameters:
        - id (str): An identifier for the audio clip.
        - input (str): The file path of the input audio or video file.
        - start (float, optional): The start time in seconds from which the
                                   audio clip should be extracted.
                                   Defaults to 0.0.
        - end (float, optional):   The end time in seconds till which the audio
                                   clip should be extracted. If None, the clip
                                   is extracted till the end of the file.

        This method handles both audio and video files, extracting the required
        segment and storing it in memory for quick access. The extracted audio
        clip is associated with the provided id.
        """
        if input.endswith(("mp3", "MP3")):
            source = open(input, "rb")
            data = source.read()
            source.close()
            self.sounds[id] = io.BytesIO(data)
        else:
            source = wave.open(input, "rb")
            source.setpos(int(start * source.getframerate()))
            end = end or source.getnframes() / source.getframerate()
            frames = int((end - start) * source.getframerate())
            self.sounds[id] = io.BytesIO()
            dest = wave.open(self.sounds[id], "wb")
            dest.setparams(source.getparams())
            dest.writeframes(source.readframes(frames))
            source.close()
            self.sounds[id].seek(0)

    def get_sound(self, key, action: str = "press") -> Optional[io.BytesIO]:
        """
        Retrieves the sound clip associated with a particular key and action.

        Parameters:
        - key:                    The key for which the sound needs to be
                                  retrieved. Can be an instance of
                                  pynput.keyboard.Key or KeyCode, or a
                                  character.
        - action (str, optional): The type of action, either 'press' or
                                  'release'. Defaults to 'press'.

        Returns:
        - (Optional[io.BytesIO]): A BytesIO object containing the sound clip if
                                  available and AudioManager is enabled;
                                  otherwise, None.

        This method looks up the sound clip based on the provided key and
        action, taking into account any custom mappings defined in the profile.
        If no specific sound is mapped for the key, a default or random sound
        might be returned based on the profile configuration.
        """
        if not self.__enabled:
            return None

        if self.profile.value("keys") is not None:
            if self.profile.value("keys.other") is not None:
                for mapping in self.profile.value("keys.other"):
                    k_val = key.name if isinstance(key, Key) else key.char
                    if k_val in mapping["keys"]:
                        return self.__get_sound(mapping["sound"], action)
            if self.profile.value("keys.default") is not None:
                default_key = self.profile.value("keys.default")
                return self.__get_sound(default_key, action)
        return self.__get_sound(key=None, action=action)

    def set_enabled(self, enabled: bool) -> None:
        """
        Enables or disables the AudioManager.

        Parameters:
        - enabled (bool): A boolean flag to enable (True) or disable (False)
                          the AudioManager.

        When disabled, the AudioManager will not return any sound clips for key
        events. This method allows for dynamic enabling/disabling of the
        AudioManager at runtime.
        """
        self.__enabled = enabled

    def __get_sound(self, key=None, action: str = "press") -> io.BytesIO:
        """
        A private method to retrieve a sound clip based on a key and action.

        Parameters:
        - key (optional):         The key for which to retrieve the sound. If
                                  None, a random key's sound will be selected.
        - action (str, optional): The type of action, either 'press' or
                                  'release'. Defaults to 'press'.

        Returns:
        - (io.BytesIO): A BytesIO object containing the sound clip.

        This method encapsulates the logic for determining the appropriate sound
        clip based on the key and action, including handling default and random
        sound selection.
        """
        if key is None:
            key = list(self.sounds.keys())
        if type(key) is list:
            return self.__parse_sound(self.sounds[random.choice(key)], action)
        return self.__parse_sound(self.sounds[key], action)

    def __parse_sound(self, sound, action: str = "press") -> io.BytesIO:
        """
        Converts a sound clip into a BytesIO object suitable for playback.

        Parameters:
        - sound:                  The sound clip to be parsed. Can be a direct
                                  audio clip or a dictionary containing 'press'
                                  and 'release' clips.
        - action (str, optional): The type of action, either 'press' or
                                  'release'. Defaults to 'press'.

        Returns:
        - (io.BytesIO): A BytesIO object containing the sound clip ready for
                        playback.

        This method processes the sound clip, ensuring it is in the correct
        format for playback. If the sound clip is a dictionary (containing
        separate clips for key press and release), the appropriate clip is
        selected based on the action.
        """
        if type(sound) is dict:
            return io.BytesIO(sound[action].getbuffer().tobytes())
        elif action == "press":
            return io.BytesIO(sound.getbuffer().tobytes())
        return None
