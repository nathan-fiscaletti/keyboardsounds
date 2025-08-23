import subprocess
import wave
import os
import io
import random

from typing import Optional, Any, Dict, List, cast

from imageio_ffmpeg import get_ffmpeg_exe
from pynput.keyboard import Key, KeyCode
from pynput.mouse import Button

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
        self.sounds: Dict[str, Any] = {}
        self.profile = profile
        self.__one_shot_press_sound: Optional[io.BytesIO] = None
        self.__one_shot_release_sound: Optional[io.BytesIO] = None
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
            video_path = cast(str, self.profile.value("profile.video"))
            V_FILE = self.profile.get_child(video_path).get_path()
            A_FILE = f"{V_FILE}.wav"
            subprocess.run(
                [ffmpeg_exe, "-y", "-i", V_FILE, "-f", "wav", "-vn", A_FILE],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            sources = cast(List[Dict[str, Any]], self.profile.value("sources") or [])
            for source in sources:
                sid = cast(str, source["id"])
                start = cast(float, source["start"])
                endv = cast(Optional[float], source["end"])  # type: ignore[assignment]
                self.__extract(sid, A_FILE, start, cast(Optional[float], endv))
            os.unlink(A_FILE)
        elif self.profile.value("profile.type") == "one-shot":
            press = self.profile.value("profile.press")
            release = self.profile.value("profile.release")
            if press is not None:
                self.__extract("one-shot-press", input=cast(str, press))
                pressBytes = self.sounds["one-shot-press"].getbuffer().tobytes()
                pressAudioData = io.BytesIO(pressBytes)
                self.__one_shot_press_sound = pressAudioData
            if release is not None:
                self.__extract("one-shot-release", input=cast(str, release))
                releaseBytes = self.sounds["one-shot-release"].getbuffer().tobytes()
                releaseAudioData = io.BytesIO(releaseBytes)
                self.__one_shot_release_sound = releaseAudioData

        elif self.profile.value("profile.type") == "files":
            sources = cast(List[Dict[str, Any]], self.profile.value("sources") or [])
            for source in sources:
                src = source["source"]
                if isinstance(src, dict):
                    source_id = cast(str, source["id"])
                    press_loc = cast(str, src["press"])
                    press_path = self.profile.get_child(press_loc).get_path()
                    release_loc = cast(Optional[str], src.get("release"))
                    press_id = f"{source_id}__press"
                    release_id = f"{source_id}__release"

                    self.__extract(press_id, press_path)
                    if release_loc is not None:
                        release_path = self.profile.get_child(release_loc).get_path()
                        self.__extract(release_id, release_path)

                    press_snd = self.sounds[press_id].getbuffer().tobytes()
                    release_snd = (
                        self.sounds[release_id].getbuffer().tobytes()
                        if release_id in self.sounds
                        else None
                    )

                    self.sounds[source_id] = {
                        "press": io.BytesIO(press_snd),
                        "release": (
                            io.BytesIO(release_snd) if release_snd is not None else None
                        ),
                    }
                    del self.sounds[press_id]
                    if release_id in self.sounds:
                        del self.sounds[release_id]
                elif type(src) == str:
                    source_id = cast(str, source["id"])
                    path = self.profile.get_child(src).get_path()
                    self.__extract(source_id, path)

    def __extract(self, id, input, start: float = 0.0, end: Optional[float] = None):
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

        # Device-aware mapping
        device = cast(Optional[str], self.profile.value("profile.device")) or "keyboard"
        if device == "mouse":
            return self.__get_mouse_sound(key, action)

        # Keyboard behavior (existing)
        if self.profile.value("keys") is not None:
            if self.profile.value("keys.other") is not None:
                for mapping in cast(
                    List[Dict[str, Any]], self.profile.value("keys.other") or []
                ):
                    keys_list = cast(List[str], mapping.get("keys", []))
                    k_val: Optional[str] = None
                    if isinstance(key, Key):
                        k_val = key.name
                    elif isinstance(key, KeyCode) and key.char is not None:
                        k_val = key.char
                    else:
                        k_val = f"{key}"
                    if k_val is not None and k_val in keys_list:
                        return self.__get_sound(mapping["sound"], action)
            if self.profile.value("keys.default") is not None:
                default_key = self.profile.value("keys.default")
                return self.__get_sound(default_key, action)
        return self.__get_sound(key=None, action=action)

    def get_one_shot_sounds(self) -> list[Optional[io.BytesIO]]:
        return [self.__one_shot_press_sound, self.__one_shot_release_sound]

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

    def __get_sound(self, key=None, action: str = "press") -> Optional[io.BytesIO]:
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
        key_str = cast(str, key)
        return self.__parse_sound(self.sounds[key_str], action)

    def __get_mouse_sound(self, btn, action: str = "press") -> Optional[io.BytesIO]:
        # btn is expected to be pynput.mouse.Button
        button_name = None
        if isinstance(btn, Button):
            if btn == Button.left:
                button_name = "left"
            elif btn == Button.right:
                button_name = "right"
            elif btn == Button.middle:
                button_name = "middle"
        # Fallback: if not a known Button, no sound
        if button_name is None:
            return None

        if self.profile.value("buttons") is not None:
            if self.profile.value("buttons.other") is not None:
                for mapping in cast(
                    List[Dict[str, Any]], self.profile.value("buttons.other") or []
                ):
                    if "buttons" in mapping and button_name in mapping["buttons"]:
                        return self.__get_sound(mapping["sound"], action)
            if self.profile.value("buttons.default") is not None:
                default_btn = self.profile.value("buttons.default")
                return self.__get_sound(default_btn, action)
        return self.__get_sound(key=None, action=action)

    def __parse_sound(self, sound, action: str = "press") -> Optional[io.BytesIO]:
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
            # Only play release if explicitly configured; otherwise, for press
            # fall back to press clip if available
            selected = sound.get(action)
            if selected is None:
                if action == "press":
                    selected = sound.get("press")
                else:
                    return None
            return io.BytesIO(selected.getbuffer().tobytes())
        # Single-clip source: treat as press-only. Do not play on release.
        if action == "release":
            return None
        return io.BytesIO(sound.getbuffer().tobytes())
