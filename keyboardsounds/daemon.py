import os
import io
import subprocess
from sys import platform
import threading
from queue import Queue

import json
import base64
import time
import random
import warnings
from imageio_ffmpeg import get_ffmpeg_exe

# Configure pydub's ffmpeg/ffprobe discovery and silence its import-time warnings BEFORE importing pydub
try:
    _ffmpeg_bin = get_ffmpeg_exe()
    if _ffmpeg_bin:
        os.environ.setdefault("FFMPEG_BINARY", _ffmpeg_bin)
        os.environ.setdefault("FFPROBE_BINARY", _ffmpeg_bin)
    # Silence pydub utils RuntimeWarnings about missing ffmpeg/ffprobe
    warnings.filterwarnings("ignore", category=RuntimeWarning, module="pydub.utils")
except Exception:
    pass

from pydub import AudioSegment

from pygame import mixer

from pynput.mouse import Button

from keyboardsounds.listener import KeyboardListener, MouseListener

from keyboardsounds.profile import Profile, OneShotProfile
from keyboardsounds.audio_manager import AudioManager
from typing import Optional, Any

WIN32 = platform.lower().startswith("win")

if WIN32:
    from keyboardsounds import app_detector
    from keyboardsounds import app_rules
    from keyboardsounds.app_rules import Action

__am: Optional[AudioManager] = None  # keyboard audio manager
__mam: Optional[AudioManager] = None  # mouse audio manager
__dm: Optional[Any] = None
__volume = 100
__pitch_shift = False
__pitch_shift_lower = -2
__pitch_shift_upper = 2
__pitch_shift_profile = "both"
__down = []
__debug = False
__sound_cache: dict[int, mixer.Sound] = {}  # Cache mixer.Sound objects by bytes id
__cache_lock = threading.Lock()  # Lock for sound cache access
__down_lock = threading.Lock()  # Lock for __down list access
__sound_queue: Optional[Queue] = None  # Queue for sound playback tasks
__sound_workers: list[threading.Thread] = []  # Worker threads for sound playback
__num_sound_workers = 8

# Keep references to listeners so they can be started/stopped dynamically
__kb_listener: Optional[KeyboardListener] = None
__mouse_listener: Optional[MouseListener] = None
try:
    # Ensure pydub knows where ffmpeg is, even if not on PATH
    AudioSegment.converter = get_ffmpeg_exe()
    # Some pydub versions also look at these attributes
    AudioSegment.ffmpeg = AudioSegment.converter  # type: ignore[attr-defined]
    AudioSegment.ffprobe = AudioSegment.converter  # type: ignore[attr-defined]
except Exception:
    # If this fails, pydub will fall back to PATH lookup
    pass


def _to_wav_bytes(input_bytes: bytes) -> bytes:
    """
    Decode arbitrary audio bytes to WAV using ffmpeg (in-memory, no temp files).
    """
    ffmpeg_path = get_ffmpeg_exe()
    cmd = [
        ffmpeg_path,
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        "pipe:0",
        "-f",
        "wav",
        "-ar",
        "44100",
        "-ac",
        "2",
        "pipe:1",
    ]
    proc = subprocess.run(
        cmd, input=input_bytes, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    if proc.returncode != 0 or len(proc.stdout) == 0:
        raise RuntimeError(
            f"ffmpeg decode failed: {proc.stderr.decode('utf-8', errors='ignore')}"
        )
    return proc.stdout


def on_command(command: dict) -> None:
    global __volume
    global __am, __mam
    global __kb_listener, __mouse_listener
    global __pitch_shift, __pitch_shift_lower, __pitch_shift_upper, __pitch_shift_profile
    global __sound_cache
    global __cache_lock

    if "action" in command:
        action = command["action"]
        if action == "set_volume":
            if "volume" in command:
                __volume = command["volume"]
                if __dm is not None:
                    __dm.update_lock_file(
                        __volume,
                        (
                            f"{__pitch_shift_lower}:{__pitch_shift_upper}"
                            if __pitch_shift
                            else None
                        ),
                        __pitch_shift_profile,
                        __am.profile.name if __am is not None else None,
                        __mam.profile.name if __mam is not None else None,
                    )
                print(f"Volume set to {__volume}%")
        elif action == "set_profile":
            if "profile" in command:
                profile = command["profile"]
                try:
                    if profile is None or profile == "":
                        __am = None
                        # Stop keyboard listener if running
                        if __kb_listener is not None:
                            try:
                                __kb_listener.stop()
                            except Exception:
                                pass
                            __kb_listener = None
                        # Clear sound cache when profile changes
                        with __cache_lock:
                            __sound_cache.clear()
                        if __dm is not None:
                            __dm.update_lock_file(
                                __volume,
                                (
                                    f"{__pitch_shift_lower}:{__pitch_shift_upper}"
                                    if __pitch_shift
                                    else None
                                ),
                                __pitch_shift_profile,
                                None,
                                __mam.profile.name if __mam is not None else None,
                            )
                        print("Keyboard profile disabled")
                    else:
                        if __am is not None:
                            __am.set_profile(Profile(profile))
                        else:
                            __am = AudioManager(Profile(profile))
                            # Start keyboard listener if not running
                            if __kb_listener is None:
                                __kb_listener = KeyboardListener(
                                    on_press=__on_press, on_release=__on_release
                                )
                                __kb_listener.start()
                        # Clear sound cache when profile changes
                        with __cache_lock:
                            __sound_cache.clear()
                        if __dm is not None:
                            __dm.update_lock_file(
                                __volume,
                                (
                                    f"{__pitch_shift_lower}:{__pitch_shift_upper}"
                                    if __pitch_shift
                                    else None
                                ),
                                __pitch_shift_profile,
                                profile,
                                __mam.profile.name if __mam is not None else None,
                            )
                        print(f"Profile set to {profile}")
                except ValueError as err:
                    print(f"Error: {err}")
        elif action == "set_mouse_profile":
            if "profile" in command:
                profile = command["profile"]
                try:
                    if profile is None or profile == "":
                        __mam = None
                        # Stop mouse listener if running
                        if __mouse_listener is not None:
                            try:
                                __mouse_listener.stop()
                            except Exception:
                                pass
                            __mouse_listener = None
                        # Clear sound cache when profile changes
                        with __cache_lock:
                            __sound_cache.clear()
                        if __dm is not None:
                            __dm.update_lock_file(
                                __volume,
                                (
                                    f"{__pitch_shift_lower}:{__pitch_shift_upper}"
                                    if __pitch_shift
                                    else None
                                ),
                                __pitch_shift_profile,
                                __am.profile.name if __am is not None else None,
                                None,
                            )
                        print("Mouse profile disabled")
                    else:
                        if __mam is not None:
                            __mam.set_profile(Profile(profile))
                        else:
                            __mam = AudioManager(Profile(profile))
                            # Start mouse listener if not running
                            if __mouse_listener is None:
                                __mouse_listener = MouseListener(
                                    on_click=__on_mouse_click
                                )
                                __mouse_listener.start()
                        # Clear sound cache when profile changes
                        with __cache_lock:
                            __sound_cache.clear()
                        if __dm is not None:
                            __dm.update_lock_file(
                                __volume,
                                (
                                    f"{__pitch_shift_lower}:{__pitch_shift_upper}"
                                    if __pitch_shift
                                    else None
                                ),
                                __pitch_shift_profile,
                                __am.profile.name if __am is not None else None,
                                profile,
                            )
                        print(f"Mouse profile set to {profile}")
                except ValueError as err:
                    print(f"Error: {err}")
        elif action == "show_daemon_window":
            try:
                if __dm is not None:
                    __dm.show_daemon_window()
            except Exception as e:
                print(f"Error: {e}")
        elif action == "set_pitch_shift":
            if "semitones" in command:
                semitones = command["semitones"]

            if semitones is not None and semitones != "":
                __pitch_shift = True
                __pitch_shift_lower, __pitch_shift_upper = map(
                    int, semitones.split(",")
                )
                if "profile" in command:
                    if (
                        command["profile"] != "both"
                        and command["profile"] != "keyboard"
                        and command["profile"] != "mouse"
                    ):
                        __pitch_shift_profile = "both"
                    else:
                        __pitch_shift_profile = command["profile"]
                else:
                    __pitch_shift_profile = "both"
                print(
                    f"Pitch shift set to {__pitch_shift_lower},{__pitch_shift_upper} for {__pitch_shift_profile}"
                )
            else:
                __pitch_shift = False
                __pitch_shift_lower = -2
                __pitch_shift_upper = 2
                __pitch_shift_profile = "both"
                print(f"Pitch shift set to off")
            if __dm is not None:
                __dm.update_lock_file(
                    __volume,
                    semitones,
                    __pitch_shift_profile,
                    __am.profile.name if __am is not None else None,
                    __mam.profile.name if __mam is not None else None,
                )
            print(f"Pitch shift set to {semitones}")


def pitch_shift_from_bytes(buffer, semitones: float) -> mixer.Sound:
    # Ensure buffer is at start
    try:
        buffer.seek(0)
    except Exception:
        pass

    # Detect WAV header (RIFF .... WAVE)
    header = buffer.read(12)
    is_wav = len(header) >= 12 and header[0:4] == b"RIFF" and header[8:12] == b"WAVE"
    try:
        buffer.seek(0)
    except Exception:
        pass

    if not is_wav:
        # Convert to WAV via ffmpeg to avoid reliance on ffprobe and ensure pygame compatibility
        try:
            try:
                buffer.seek(0)
            except Exception:
                pass
            decoded_wav = _to_wav_bytes(buffer.read())
            buffer = io.BytesIO(decoded_wav)
            try:
                buffer.seek(0)
            except Exception:
                pass
        except Exception:
            # If conversion fails, raise to surface the error instead of feeding unsupported bytes to pygame
            raise

    # Load WAV from byte buffer without external tools
    try:
        audio = AudioSegment.from_wav(buffer)
    finally:
        try:
            buffer.seek(0)
        except Exception:
            pass

    # Shift pitch by adjusting frame rate
    new_sample_rate = int(audio.frame_rate * (2.0 ** (semitones / 12.0)))
    pitched = audio._spawn(audio.raw_data, overrides={"frame_rate": new_sample_rate})

    # Resample back to standard playback rate
    pitched = pitched.set_frame_rate(44100)

    # Export into BytesIO for pygame
    buf = io.BytesIO()
    pitched.export(buf, format="wav")
    buf.seek(0)

    return mixer.Sound(file=buf)


def __on_press(key):
    """
    Callback function for key press events.

    When a key is pressed, this function is invoked to play the corresponding
    key press sound. It prevents the same key press sound from being played
    multiple times if the key is already pressed and held down.

    Parameters:
    - key: The key that was pressed.
    """
    global __am
    global __volume
    global __down
    global __down_lock

    with __down_lock:
        if key in __down:
            return
        __down.append(key)

    sound = __am.get_sound(key, action="press")
    __play_sound(sound, "keyboard")


def __on_release(key):
    """
    Callback function for key release events.

    When a key is released, this function is invoked to play the corresponding
    key release sound.

    Parameters:
    - key: The key that was released.
    """
    global __down
    global __am
    global __down_lock

    sound = __am.get_sound(key, action="release")
    __play_sound(sound, "keyboard")

    with __down_lock:
        __down = [k for k in __down if k != key]


def __sound_worker():
    """Worker thread that processes sound playback tasks from the queue."""
    global __sound_queue
    while True:
        try:
            task = __sound_queue.get()
            if task is None:  # Sentinel value to stop the worker
                break
            sound, profile_type = task
            __play_sound_thread(sound, profile_type)
        except Exception as e:
            print(f"Error in sound playback worker: {e}")
            import traceback

            traceback.print_exc()
        finally:
            __sound_queue.task_done()


def __init_sound_workers():
    """Initialize the sound worker threads."""
    global __sound_queue, __sound_workers, __num_sound_workers
    if __sound_queue is None:
        __sound_queue = Queue()
        for i in range(__num_sound_workers):
            worker = threading.Thread(
                target=__sound_worker,
                name=f"sound_player_{i}",
                daemon=False,  # Explicitly set as non-daemon
            )
            worker.start()
            __sound_workers.append(worker)


def __play_sound(sound, profile_type: str):
    """Queue a sound for playback."""
    global __sound_queue
    if __sound_queue is None:
        __init_sound_workers()
    __sound_queue.put((sound, profile_type))


def __play_sound_thread(sound, profile_type: str):
    global __pitch_shift, __pitch_shift_lower, __pitch_shift_upper, __pitch_shift_profile
    global __sound_cache
    global __cache_lock
    global __volume

    if sound is None:
        return

    # Snapshot globals to avoid race conditions when they change mid-execution
    pitch_shift = __pitch_shift
    pitch_shift_lower = __pitch_shift_lower
    pitch_shift_upper = __pitch_shift_upper
    pitch_shift_profile = __pitch_shift_profile
    volume = __volume

    if pitch_shift and (
        pitch_shift_profile == "both" or profile_type == pitch_shift_profile
    ):
        semitones = random.randint(pitch_shift_lower, pitch_shift_upper)
        clip = pitch_shift_from_bytes(sound, semitones)
    else:
        # Cache mixer.Sound objects to avoid recreating them on every keypress
        sound.seek(0)
        sound_bytes = sound.read()
        sound.seek(0)
        cache_key = id(sound_bytes)

        with __cache_lock:
            if cache_key in __sound_cache:
                clip = __sound_cache[cache_key]
            else:
                clip = mixer.Sound(sound)
                __sound_cache[cache_key] = clip

    clip.set_volume(float(volume) / float(100))
    clip.play()


def __on_mouse_click(x, y, button: Button, pressed: bool):
    """
    Callback for mouse click events. Plays sounds for mouse profiles.
    """
    global __mam
    global __volume

    action = "press" if pressed else "release"
    if __mam is None:
        return
    sound = __mam.get_sound(button, action=action)
    if sound is not None:
        __play_sound(sound, "mouse")


if WIN32:

    def __on_focused_application_changed(app_path: str):
        """
        Callback function for detecting focused application changes on Windows.

        It adjusts the AudioManager's state based on the foreground application
        by consulting the app rules.

        Parameters:
        - app_path: The file path of the application that has just gained focus.
        """
        global __debug
        if __debug:
            print(f"focused application changed: {app_path}")

        rules = app_rules.get_rules()

        global __am, __mam
        if __am is None and __mam is None:
            return
        if rules is not None and rules.has_exclusive_rule():
            exclusive = rules.get_exclusive_rule()
            if exclusive is not None and app_path == exclusive.app_path:
                if __am is not None:
                    __am.set_enabled(True)
                if __mam is not None:
                    __mam.set_enabled(True)
            else:
                if __am is not None:
                    __am.set_enabled(False)
                if __mam is not None:
                    __mam.set_enabled(False)
            return

        action = rules.get_action(app_path) if rules is not None else None
        if action == Action.DISABLE:
            if __am is not None:
                __am.set_enabled(False)
            if __mam is not None:
                __mam.set_enabled(False)
        elif action in [Action.ENABLE, Action.EXCLUSIVE]:
            if __am is not None:
                __am.set_enabled(True)
            if __mam is not None:
                __mam.set_enabled(True)


def run(
    dm,
    volume: int,
    profile: Optional[str],
    semitones: Optional[str],
    pitch_shift_profile: Optional[str],
    debug: bool,
    mouse_profile: Optional[str] = None,
):
    """
    Initializes and runs the keyboard sound application.

    This function initializes the AudioManager with a given profile and volume,
    sets up the application detector if on Windows, and starts listening for
    keyboard events.

    Parameters:
    - volume: The volume level for the sound playback.
    - profile: The sound profile to use for the AudioManager.
    """
    global __am, __mam
    global __volume
    global __dm
    global __debug
    global __kb_listener, __mouse_listener
    global __pitch_shift, __pitch_shift_lower, __pitch_shift_upper, __pitch_shift_profile

    __debug = debug

    __volume = volume
    __am = AudioManager(Profile(profile)) if profile is not None else None
    if mouse_profile is not None:
        __mam = AudioManager(Profile(mouse_profile))
    else:
        __mam = None
    __dm = dm

    if semitones is not None:
        __pitch_shift = True
        __pitch_shift_lower, __pitch_shift_upper = map(int, semitones.split(","))
        if pitch_shift_profile is not None:
            __pitch_shift_profile = pitch_shift_profile
        else:
            __pitch_shift_profile = "both"
    else:
        __pitch_shift = False
        __pitch_shift_lower = -2
        __pitch_shift_upper = 2
        __pitch_shift_profile = "both"

    if WIN32:
        app_detector.start_listening(__on_focused_application_changed)

    mixer.init()
    mixer.set_num_channels(32)
    __kb_listener = (
        KeyboardListener(on_press=__on_press, on_release=__on_release)
        if __am is not None
        else None
    )
    __mouse_listener = (
        MouseListener(on_click=__on_mouse_click) if __mam is not None else None
    )
    if __kb_listener is not None:
        __kb_listener.start()
    if __mouse_listener is not None:
        __mouse_listener.start()
    if __debug:

        def stdin_loop(listener):
            print("Run 'quit' to terminate the debug process")
            while (listener is not None) and listener.running:  # type: ignore[attr-defined]
                cmd = input("")
                if cmd == "quit":
                    os._exit(0)

        stdin_loop(__kb_listener or __mouse_listener)
    else:
        if __kb_listener is not None:
            __kb_listener.join()
        if __mouse_listener is not None:
            __mouse_listener.join()


def one_shot(volume: int, press_sound: str, release_sound: str | None):
    global __am

    __am = AudioManager(
        OneShotProfile(press_sound=press_sound, release_sound=release_sound)
    )

    sounds = __am.get_one_shot_sounds()

    clips = []

    mixer.init()

    waitlen = 0
    for sound in sounds:
        if sound is not None:
            clip = mixer.Sound(sound)
            clip.set_volume(float(volume) / float(100))
            clips.append(clip)
            waitlen += clip.get_length()

    for clip in clips:
        clip.set_volume(float(volume) / float(100))
        clip.play()
        time.sleep(0.15)

    time.sleep(waitlen)


def get_audio_manager() -> AudioManager:
    """
    Retrieves the AudioManager instance.

    This function returns the AudioManager instance that is currently in use by
    the application. It is used by the external API to access the AudioManager
    for sound playback.

    Returns:
    - AudioManager: The AudioManager instance.
    """
    global __am
    return __am  # type: ignore[return-value]
