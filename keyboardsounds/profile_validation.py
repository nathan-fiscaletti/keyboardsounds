import os

from keyboardsounds.path_resolver import PathResolver
from typing import Any

VALID_PROFILE_TYPES = ["video-extract", "files"]
SUPPORTED_AUDIO_FORMATS = [".wav", ".mp3", ".WAV", ".MP3"]
SUPPORTED_VIDEO_FORMATS = [".mp4", ".MP4"]
VALID_DEVICES = ["keyboard", "mouse"]
SUPPORTED_MOUSE_BUTTONS = ["left", "right", "middle"]


def validate_profile(path_resolver: PathResolver, data: dict):
    # Validate Required Generic Keys

    required_keys = ["profile", "sources"]
    for required_key in required_keys:
        if required_key not in data:
            raise ValueError(
                f"Profile is corrupted. Missing '{required_key}' in profile.yaml."
            )

    # Validate Profile Metadata
    data = __validate_meta_data(path_resolver, data)
    name = data["profile"]["name"]

    # Validate Sources
    __validate_sources(path_resolver, name, data)

    # Validate device-specific mappings
    device = data["profile"].get("device", "keyboard")
    if device == "keyboard":
        __validate_keys(path_resolver, name, data)
    elif device == "mouse":
        __validate_buttons(path_resolver, name, data)

    return data


def __validate_meta_data(path_resolver: PathResolver, data: dict) -> dict:
    if "name" not in data["profile"]:
        raise ValueError(f"Profile is corrupted. Missing 'name' in profile.yaml.")
    if type(data["profile"]["name"]) != str:
        raise ValueError(
            f"Profile is corrupted. 'name' in profile.yaml must be a string."
        )
    name = data["profile"]["name"]
    if "type" in data["profile"]:
        if data["profile"]["type"] not in VALID_PROFILE_TYPES:
            raise ValueError(
                f"Profile '{name}' is corrupted. Invalid 'type' in profile.yaml."
            )
    else:
        data["profile"]["type"] = "files"

    # New: validate and default device
    if "device" in data["profile"]:
        if data["profile"]["device"] not in VALID_DEVICES:
            raise ValueError(
                f"Profile '{name}' is corrupted. Invalid 'device' in profile.yaml. Must be one of {VALID_DEVICES}."
            )
    else:
        data["profile"]["device"] = "keyboard"

    if "author" in data["profile"]:
        if type(data["profile"]["author"]) != str:
            raise ValueError(
                f"Profile '{name}' is corrupted. Invalid 'author' in profile.yaml."
            )
    if "description" in data["profile"]:
        if type(data["profile"]["description"]) != str:
            raise ValueError(
                f"Profile '{name}' is corrupted. Invalid 'description' in profile.yaml."
            )

    if data["profile"]["type"] == "video-extract":
        if "video" not in data["profile"]:
            raise ValueError(
                f"Profile '{name}' is corrupted. Missing 'video' in profile.yaml."
            )
        if type(data["profile"]["video"]) != str:
            raise ValueError(
                f"Profile '{name}' is corrupted. Invalid 'video' in profile.yaml."
            )
        if not str(data["profile"]["video"]).endswith(tuple(SUPPORTED_VIDEO_FORMATS)):
            raise ValueError(
                f"Profile '{name}' is corrupted. Invalid 'video' in profile.yaml."
            )
        if not os.path.isfile(
            path_resolver.get_child(data["profile"]["video"]).get_path()
        ):
            raise ValueError(
                f"Profile '{name}' is corrupted. Missing video file '{data['profile']['video']}' in profile folder."
            )

    return data


def __validate_sources(path_resolver: PathResolver, name: str, data: dict):
    if "sources" not in data:
        raise ValueError(
            f"Profile '{name}' is corrupted. Missing 'sources' in profile.yaml."
        )
    if type(data["sources"]) != list:
        raise ValueError(
            f"Profile '{name}' is corrupted. Invalid 'sources' in profile.yaml."
        )
    for source in data["sources"]:
        __validate_source(path_resolver, name, data, source)


def __validate_source(path_resolver: PathResolver, name: str, data: dict, source: Any):
    if type(source) != dict:
        raise ValueError(
            f"Profile '{name}' is corrupted. Invalid 'sources' in profile.yaml."
        )
    if "id" not in source:
        raise ValueError(
            f"Profile '{name}' is corrupted. Missing 'id' one or more source in profile.yaml."
        )

    if data["profile"]["type"] == "files":
        if "source" not in source:
            raise ValueError(
                f"Profile '{name}' is corrupted. Missing 'source' one or more source in profile.yaml."
            )
        if type(source["source"]) not in [dict, str]:
            raise ValueError(
                f"Profile '{name}' is corrupted. Invalid 'source' one or more source in profile.yaml."
            )
        if type(source["source"]) == dict:
            if not "press" in source["source"]:
                raise ValueError(
                    f"Profile '{name}' is corrupted. Missing 'press' in source object of one or more sources in profile.yaml."
                )
            if type(source["source"]["press"]) != str:
                raise ValueError(
                    f"Profile '{name}' is corrupted. Invalid 'press' in source object of one or more sources in profile.yaml."
                )
            if not str(source["source"]["press"]).endswith(
                tuple(SUPPORTED_AUDIO_FORMATS)
            ):
                raise ValueError(
                    f"Profile '{name}' is corrupted. Invalid 'press' in source object of one or more sources in profile.yaml."
                )
            if not os.path.isfile(
                path_resolver.get_child(source["source"]["press"]).get_path()
            ):
                raise ValueError(
                    f"Profile '{name}' is corrupted. Missing audio file '{source['source']['press']}' in profile folder."
                )
            if "release" in source["source"]:
                if type(source["source"]["release"]) != str:
                    raise ValueError(
                        f"Profile '{name}' is corrupted. Invalid 'release' in source object of one or more sources in profile.yaml."
                    )
                if not str(source["source"]["release"]).endswith(
                    tuple(SUPPORTED_AUDIO_FORMATS)
                ):
                    raise ValueError(
                        f"Profile '{name}' is corrupted. Invalid 'release' in source object of one or more sources in profile.yaml."
                    )
                if not os.path.isfile(
                    path_resolver.get_child(source["source"]["release"]).get_path()
                ):
                    raise ValueError(
                        f"Profile '{name}' is corrupted. Missing audio file '{source['source']['release']}' in profile folder."
                    )
        elif type(source["source"]) == str:
            if not str(source["source"]).endswith(tuple(SUPPORTED_AUDIO_FORMATS)):
                raise ValueError(
                    f"Profile '{name}' is corrupted. Invalid 'source' in one or more sources in profile.yaml."
                )
            if not os.path.isfile(path_resolver.get_child(source["source"]).get_path()):
                raise ValueError(
                    f"Profile '{name}' is corrupted. Missing audio file '{source['source']}' in profile folder."
                )
    elif data["profile"]["type"] == "video-extract":
        if "start" not in source:
            raise ValueError(
                f"Profile '{name}' is corrupted. Missing 'start' one or more source in profile.yaml."
            )
        if type(source["start"]) != float:
            raise ValueError(
                f"Profile '{name}' is corrupted. Invalid 'start' one or more source in profile.yaml."
            )
        if "end" not in source:
            raise ValueError(
                f"Profile '{name}' is corrupted. Missing 'end' one or more source in profile.yaml."
            )
        if type(source["end"]) != float:
            raise ValueError(
                f"Profile '{name}' is corrupted. Invalid 'end' one or more source in profile.yaml."
            )


def __validate_keys(path_resolver: PathResolver, name: str, data: dict):
    if "keys" in data:
        if type(data["keys"]) != dict:
            raise ValueError(
                f"Profile '{name}' is corrupted. Invalid 'keys' in profile.yaml."
            )
        if "default" in data["keys"]:
            if type(data["keys"]["default"]) not in [str, list]:
                raise ValueError(
                    f"Profile '{name}' is corrupted. Invalid 'default' in keys in profile.yaml."
                )
            if type(data["keys"]["default"]) == str:
                __validate_source_ref(
                    path_resolver, name, data, data["keys"]["default"]
                )
            elif type(data["keys"]["default"]) == list:
                for source_ref in data["keys"]["default"]:
                    __validate_source_ref(path_resolver, name, data, source_ref)
        if "other" in data["keys"]:
            if type(data["keys"]["other"]) != list:
                raise ValueError(
                    f"Profile '{name}' is corrupted. Invalid 'other' in keys in profile.yaml."
                )
            for key in data["keys"]["other"]:
                __validate_key(path_resolver, name, data, key)


def __validate_buttons(path_resolver: PathResolver, name: str, data: dict):
    if "buttons" in data:
        if type(data["buttons"]) != dict:
            raise ValueError(
                f"Profile '{name}' is corrupted. Invalid 'buttons' in profile.yaml."
            )
        if "default" in data["buttons"]:
            if type(data["buttons"]["default"]) not in [str, list]:
                raise ValueError(
                    f"Profile '{name}' is corrupted. Invalid 'default' in buttons in profile.yaml."
                )
            if type(data["buttons"]["default"]) == str:
                __validate_source_ref(
                    path_resolver, name, data, data["buttons"]["default"]
                )
            elif type(data["buttons"]["default"]) == list:
                for source_ref in data["buttons"]["default"]:
                    __validate_source_ref(path_resolver, name, data, source_ref)
        if "other" in data["buttons"]:
            if type(data["buttons"]["other"]) != list:
                raise ValueError(
                    f"Profile '{name}' is corrupted. Invalid 'other' in buttons in profile.yaml."
                )
            for button_map in data["buttons"]["other"]:
                __validate_button_map(path_resolver, name, data, button_map)


def __validate_key(path_resolver: PathResolver, name: str, data: dict, key: Any):
    if type(key) not in [str, list, dict]:
        raise ValueError(
            f"Profile '{name}' is corrupted. Invalid 'default' in keys in profile.yaml."
        )
    if "sound" not in key:
        raise ValueError(
            f"Profile '{name}' is corrupted. Missing 'sound' in one or more keys in profile.yaml."
        )
    if type(key["sound"]) not in [list, str]:
        raise ValueError(
            f"Profile '{name}' is corrupted. Invalid 'sound' in one or more keys in profile.yaml."
        )
    if type(key["sound"]) == list:
        for source_ref in key["sound"]:
            __validate_source_ref(path_resolver, name, data, source_ref)
    else:
        __validate_source_ref(path_resolver, name, data, key["sound"])
    pass


def __validate_button_map(
    path_resolver: PathResolver, name: str, data: dict, button_map: Any
):
    if type(button_map) not in [str, list, dict]:
        raise ValueError(
            f"Profile '{name}' is corrupted. Invalid 'other' in buttons in profile.yaml."
        )
    if "sound" not in button_map:
        raise ValueError(
            f"Profile '{name}' is corrupted. Missing 'sound' in one or more buttons.other entries in profile.yaml."
        )
    if type(button_map["sound"]) not in [list, str]:
        raise ValueError(
            f"Profile '{name}' is corrupted. Invalid 'sound' in one or more buttons.other entries in profile.yaml."
        )
    if type(button_map["sound"]) == list:
        for source_ref in button_map["sound"]:
            __validate_source_ref(path_resolver, name, data, source_ref)
    else:
        __validate_source_ref(path_resolver, name, data, button_map["sound"])
    if "buttons" in button_map:
        if type(button_map["buttons"]) != list:
            raise ValueError(
                f"Profile '{name}' is corrupted. Invalid 'buttons' array in buttons.other mapping in profile.yaml."
            )
        # Optionally validate allowed button names
        for b in button_map["buttons"]:
            if type(b) != str:
                raise ValueError(
                    f"Profile '{name}' is corrupted. Invalid button name in buttons.other mapping in profile.yaml."
                )
            if b not in SUPPORTED_MOUSE_BUTTONS:
                raise ValueError(
                    f"Profile '{name}' is corrupted. Unsupported mouse button '{b}' in buttons.other mapping in profile.yaml."
                )


def __validate_source_ref(
    path_resolver: PathResolver, name: str, data: dict, source_ref: Any
):
    if type(source_ref) != str:
        raise ValueError(
            f"Profile '{name}' is corrupted. Invalid 'sound' in one or more keys in profile.yaml."
        )
    if source_ref is None or source_ref not in [
        source["id"] if "id" in source else None for source in data["sources"]
    ]:
        raise ValueError(
            f"Profile '{name}' is corrupted. Invalid 'sound' in one or more keys in profile.yaml."
        )
