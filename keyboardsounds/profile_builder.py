import os
import sys
import tempfile
import yaml
import shutil

from typing import List

from enum import Enum
from pynput.keyboard import Listener, Key

from keyboardsounds.profile_validation import SUPPORTED_AUDIO_FORMATS
from keyboardsounds.path_resolver import PathResolver


class SourceEvent(Enum):
    PRESS = "press"
    RELEASE = "release"


class AudioFile:
    def __init__(self, resolver: PathResolver, value: str):
        if not str(value).endswith(tuple(SUPPORTED_AUDIO_FORMATS)):
            raise ValueError(f"Invalid audio file '{value}'.")
        if not os.path.isfile(resolver.get_file_path(value)):
            raise ValueError(f"Missing audio file '{value}'.")
        self.value = value

    def __str__(self) -> str:
        return self.value


class ProfileBuilder(PathResolver):
    def __init__(self, path):
        super().__init__(path)
        self.__audio_files = []
        self.__data = {}
        self.__load_profile_data()
        self.__load_audio_files()

    def exists(self):
        return os.path.isfile(self.get_file_path("profile.yaml"))

    def __load_profile_data(self):
        if self.exists():
            self.__data = yaml.load(
                open(self.get_file_path("profile.yaml"), "r"), Loader=yaml.FullLoader
            )

    def __load_audio_files(self):
        for _, _, files in os.walk(self.root):
            for file in files:
                if file.endswith(tuple(SUPPORTED_AUDIO_FORMATS)):
                    self.__audio_files.append(AudioFile(self, file))

    def set_metadata(self, name: str, author: str, description: str):
        self.__data["profile"] = {
            "name": name,
            "author": author,
            "description": description,
        }
        self.__data["sources"] = []

    def get_metadata(self):
        return self.__data["profile"] if "profile" in self.__data else {}

    def preview_metadata(self):
        return yaml.dump(self.get_metadata())

    def get_audio_files(self) -> List[AudioFile]:
        return self.__audio_files

    def has_audio_file(self, audio_file) -> bool:
        return audio_file in [str(audio_file) for audio_file in self.__audio_files]

    def add_source(
        self, id: str, audio_file: AudioFile, event: SourceEvent = SourceEvent.PRESS
    ):
        if "sources" not in self.__data:
            raise ValueError("You must set meta-data before adding sources.")

        existing_source = {"id": id, "source": str(audio_file)}

        existing_sources = [
            source for source in self.__data["sources"] if source["id"] == id
        ]
        if len(existing_sources) > 0:
            existing_source = existing_sources[0]

        if type(existing_source["source"]) == str:
            if event == SourceEvent.PRESS:
                existing_source["source"] = str(audio_file)
            elif event == SourceEvent.RELEASE:
                existing_press = existing_source["source"]
                existing_source["source"] = {
                    SourceEvent.PRESS.value: existing_press,
                    SourceEvent.RELEASE.value: str(audio_file),
                }
        elif type(existing_source["source"]) == dict:
            if event == SourceEvent.PRESS:
                existing_source["source"][SourceEvent.PRESS.value] = str(audio_file)
            elif event == SourceEvent.RELEASE:
                existing_source["source"][SourceEvent.RELEASE.value] = str(audio_file)

        self.__data["sources"] = [
            source for source in self.__data["sources"] if source["id"] != id
        ]
        self.__data["sources"].append(existing_source)

    def get_sources(self) -> List[dict]:
        return self.__data["sources"] if "sources" in self.__data else []

    def has_source(self, id) -> bool:
        sources = self.get_sources()
        return id in [source["id"] for source in sources]

    def preview_sources(self) -> str:
        return yaml.dump(self.__data["sources"])

    def set_default_source(self, source: any):
        if "keys" not in self.__data:
            self.__data["keys"] = {}
        self.__data["keys"]["default"] = source

    def remove_default_source(self):
        if "keys" in self.__data:
            if "default" in self.__data["keys"]:
                del self.__data["keys"]["default"]

    def has_default_source(self) -> bool:
        return "keys" in self.__data and "default" in self.__data["keys"]

    def add_key_mapping(self, id: str, keys: List[str], source: any):
        if "keys" not in self.__data:
            self.__data["keys"] = {}
        if "other" not in self.__data["keys"]:
            self.__data["keys"]["other"] = []
        other = list(self.__data["keys"]["other"])
        other.append({"id": id, "sound": source, "keys": keys})
        self.__data["keys"]["other"] = other

    def has_key_mapping(self, id: str) -> bool:
        if "keys" not in self.__data:
            return False
        if "other" not in self.__data["keys"]:
            return False
        return id in [mapping["id"] for mapping in self.__data["keys"]["other"]]

    def remove_key_mapping(self, id: str):
        if "keys" not in self.__data:
            return
        if "other" not in self.__data["keys"]:
            return
        self.__data["keys"]["other"] = [
            mapping for mapping in self.__data["keys"]["other"] if mapping["id"] != id
        ]

    def preview_keys_mappings(self) -> str:
        return yaml.dump(self.__data["keys"] if "keys" in self.__data else {})

    def preview(self) -> str:
        return yaml.dump(self.__data)

    def build(self, output: str):
        intermediate_dir = tempfile.mkdtemp()
        intermediate = PathResolver(intermediate_dir)

        print("Writing profile.yaml...")
        profile_file = intermediate.get_file_path("profile.yaml")
        with open(profile_file, "w") as file:
            yaml.dump(self.__data, file)

        used_files = []
        for source in self.__data["sources"]:
            if type(source["source"]) == str:
                used_files.append(source["source"])
            elif type(source["source"]) == dict:
                if SourceEvent.PRESS.value in source["source"]:
                    used_files.append(source["source"][SourceEvent.PRESS.value])
                if SourceEvent.RELEASE.value in source["source"]:
                    used_files.append(source["source"][SourceEvent.RELEASE.value])
        used_files = list(set(used_files))

        for file in used_files:
            print(f"Writing '{file}'...")
            source = self.get_file_path(file)
            destination = intermediate.get_file_path(file)
            if not os.path.isfile(source):
                raise ValueError(f"Missing intermediate audio file '{file}'.")
            shutil.copy(source, destination)

        print(f"Writing archive to '{output}'...")
        shutil.make_archive(output, "zip", intermediate_dir)
        print("Cleaning up...")
        shutil.rmtree(intermediate_dir)


class KeyCollector:
    def __init__(self):
        self.__pressed = []
        self.__keys = []

    def __unique_keys(self):
        unique = []
        for key in self.__keys:
            if key not in unique:
                unique.append(key)
        return unique

    def __on_press(self, key):
        key_name = key.name if type(key) == Key else key.char
        if (
            "ctrl" in self.__pressed
            or "ctrl_l" in self.__pressed
            or "ctrl_r" in self.__pressed
        ) and "shift" in self.__pressed:
            if key_name == "delete":
                self.__keys = []
                return False
            if key_name == "enter":
                return False
        self.__pressed.append(key_name)

    def __on_release(self, key):
        key_name = key.name if type(key) == Key else key.char
        if key_name in self.__pressed:
            self.__pressed = [
                pressed for pressed in self.__pressed if pressed != key_name
            ]
            self.__keys.append(key_name)
        self.__report_keys()

    def __report_keys(self):
        print("\rPressed Keys:", end=" ")
        unique = self.__unique_keys()
        if len(unique) > 0:
            for key in unique:
                print(key, end=" ")
                sys.stdout.flush()
        else:
            print("None", end=" ")
            sys.stdout.flush()

    def get_keys(self):
        self.__report_keys()
        with Listener(
            on_press=self.__on_press, on_release=self.__on_release
        ) as listener:
            listener.join()
        print(os.linesep, end="")
        try:
            import termios

            termios.tcflush(sys.stdin, termios.TCIOFLUSH)
        except ImportError:
            import msvcrt

            while msvcrt.kbhit():
                msvcrt.getch()
        return self.__unique_keys()


class CliProfileBuilder:
    def __init__(self, path: str, output: str):
        if output is not None and not output.endswith(".zip"):
            print("Error: Output file must be a zip file.")
            exit(1)

        self.__builder = ProfileBuilder(path)
        self.__output = output[:-4] if output is not None else None
        self.__cmd = None
        self.__args = []

    def start(self):
        if not self.__builder.exists():
            self.__collect_metadata()
        else:
            if self.__output is not None:
                self.save()
            else:
                self.__open_command_interface()

    def __collect_metadata(self):
        print(f"{os.linesep}Meta Data{os.linesep}")
        name = input("Profile name: ")
        author = input("Profile author: ")
        description = input("Profile description: ")
        self.__builder.set_metadata(name, author, description)

    def __open_command_interface(self):
        print(f"{os.linesep}Configure Profile (type 'help' for help){os.linesep}")
        while True:
            user_input = input("> ")
            print("")
            input_argv = user_input.split(" ")
            self.__cmd = input_argv[0]
            self.__args = input_argv[1:]

            if not self.__process_command():
                break

    def __process_command(self):
        if self.__cmd == "help":
            return self.__print_help()
        elif self.__cmd == "list":
            return self.__list()
        elif self.__cmd == "metadata":
            return self.__metadata()
        elif self.__cmd == "preview":
            return self.__preview()
        elif self.__cmd == "add":
            return self.__add()
        elif self.__cmd == "remove":
            return self.__remove()
        elif self.__cmd == "save":
            return self.save()
        elif self.__cmd == "cancel":
            return False

    def __add(self) -> bool:
        if len(self.__args) < 1:
            return self.__print_help("Error: Missing arguments.")

        add_type = self.__args[0]
        if add_type not in ["source", "keys", "default-key"]:
            return self.__print_help(
                "Error: Invalid type. Must be one of 'source', 'keys' or 'default-key'."
            )

        if add_type == "keys":
            return self.__add_keys()
        if add_type == "default-key":
            return self.__add_default_key()
        return self.__add_source()

    def __remove(self) -> bool:
        if len(self.__args) < 1:
            return self.__print_help("Error: Missing arguments.")

        remove_type = self.__args[0]
        if remove_type not in ["source", "keys", "default-key"]:
            return self.__print_help(
                "Error: Invalid type. Must be one of 'source', 'keys' or 'default-key'."
            )

        if remove_type == "keys":
            return self.__remove_key_mapping()
        if remove_type == "default-key":
            return self.__remove_default_key()
        return self.__remove_source()

    def __add_source(self) -> bool:
        print("Add Source")
        print("")

        id = None
        while True:
            id = input("Enter Source ID: ")
            if id == "":
                print("Error: No ID provided for new source.")
                return True
            if not self.__builder.has_source(id):
                break
            print("Error: Source ID already in use.")

        press = None
        release = None

        while True:
            in_press = input("Press Sound (leave empty to cancel): ")
            if in_press == "":
                return True
            if not self.__builder.has_audio_file(in_press):
                print("Error: Invalid sound.")
                continue
            press = AudioFile(self.__builder, in_press)
            break

        while True:
            in_release = input("Release Sound (leave empty for none): ")
            if in_release == "":
                break
            if not self.__builder.has_audio_file(in_release):
                print("Error: Invalid sound.")
                continue
            release = AudioFile(self.__builder, in_release)
            break

        self.__builder.add_source(id, press, SourceEvent.PRESS)
        if release is not None:
            self.__builder.add_source(id, release, SourceEvent.RELEASE)

        print("")
        print("Source added.")
        print("")
        print(self.__builder.preview_sources())

        return True

    def __remove_source(self) -> bool:
        id = input("Enter Source ID to Remove: ")
        if id == "":
            print("Error: No ID provided.")
            return True
        if not self.__builder.has_source(id):
            print("Error: Source ID not found.")
            return True
        self.__builder.remove_source(id)
        return True

    def __add_default_key(self):
        print("Add Default Key Mapping")
        print("")
        print(
            "Enter a source ID to include in the default key mapping. Leave empty to finish."
        )
        print("")
        source_ids = []
        source = input("Source ID: ")
        while source != "":
            if not self.__builder.has_source(source):
                print("Error: Invalid source ID.")
            else:
                source_ids.append(source)
            source = input("Source ID: ")

        if len(source_ids) < 1:
            print("")
            print("Error: No source IDs entered. Default key mapping not set.")
            print("")
            return True

        if len(source_ids) == 1:
            self.__builder.set_default_source(source_ids[0])
        else:
            self.__builder.set_default_source(source)

        print("")
        print("Default key mapping set.")
        print("")
        print(self.__builder.preview_keys_mappings())
        return True

    def __remove_default_key(self):
        if self.__builder.has_default_source():
            self.__builder.remove_default_source()
            print("Default source removed.")
        else:
            print("Error: No default source set.")
        return True

    def __add_keys(self):
        print("Add Key Mappings")
        print("")

        id = None
        while True:
            id = input("Enter Key Mapping ID: ")
            if id == "":
                print("Error: No ID provided for new key mapping.")
                return True
            if not self.__builder.has_key_mapping(id):
                break
            print("Error: Key Mapping ID already in use.")

        print("")
        print(" - Press the keys you wish to map to a source.")
        print(
            " - Press 'Control + Shift + DELETE' to cancel. Press 'Control + Shift + Enter' when finished."
        )
        print("")

        key_names = KeyCollector().get_keys()

        if len(key_names) < 1:
            print("")
            print("Error: No key names entered. Key mapping not set.")
            print("")
            return True

        print("")
        print("Enter source IDs to map to the keys. Leave empty to finish.")
        print("")

        source_ids = []
        source_id = input("Source ID: ")
        while source_id != "":
            if not self.__builder.has_source(source_id):
                print("Error: Invalid source ID.")
            else:
                source_ids.append(source_id)
            source_id = input("Source ID: ")

        if len(source_ids) < 1:
            print("")
            print("Error: No source IDs entered. Key mapping not set.")
            print("")
            return True

        if len(source_ids) == 1:
            self.__builder.add_key_mapping(id, key_names, source_ids[0])
        else:
            self.__builder.add_key_mapping(id, key_names, source_ids)

        print("")
        print("Key mapping set.")
        print("")
        print(self.__builder.preview_keys_mappings())
        return True

    def __remove_key_mapping(self):
        id = input("Enter Key Mapping ID to Remove: ")
        if id == "":
            print("Error: No ID provided.")
            return True
        if not self.__builder.has_key_mapping(id):
            print("Error: Key Mapping ID not found.")
            return True
        self.__builder.remove_key_mapping(id)
        return True

    def __list(self) -> bool:
        if len(self.__args) < 1:
            return self.__print_help("Error: Missing arguments.")

        list_type = self.__args[0]
        if list_type not in ["sources", "keys", "sounds"]:
            return self.__print_help(
                "Error: Invalid type. Must be one of 'sources', 'keys' or 'sounds'."
            )

        if list_type == "sources":
            print(self.__builder.preview_sources())
        elif list_type == "keys":
            print(self.__builder.preview_keys_mappings())
        elif list_type == "sounds":
            audio_files = self.__builder.get_audio_files()
            print(yaml.dump([str(audio_file) for audio_file in audio_files]))
        return True

    def __metadata(self) -> bool:
        print(self.__builder.preview_metadata())
        return True

    def __preview(self) -> bool:
        print(self.__builder.preview())
        return True

    def save(self) -> bool:
        if len(self.__args) < 1:
            output = self.__output
        else:
            if not self.__args[0].endswith(".zip"):
                print("Error: Output file must be a zip file.")
                return True
            output = self.__args[0][:-4]

        if output is None:
            print("Error: Output file must be a zip file.")
            return True

        print("")
        try:
            self.__builder.build(output)
        except Exception as e:
            print("Error:", e)
            print("")
            return True
        print("Done.")
        return False

    def __print_help(self, msg: str = None) -> bool:
        if msg is not None:
            print(msg)
            print("")
        print("Available Commands:")
        print("")
        print(" help - print this help")
        print(" metadata - print profile metadata")
        print(" list <sources|keys|sounds> - list sources, keys or sounds")
        print(" preview - preview current profile configuration")
        print(" cancel - quit profile builder without saving")
        print(" add <source|keys> - add a new source or key mapping")
        print(" remove <source|keys> - remove a source or key mapping")
        print(" save - saves the profile to the output file")
        print("")
        return True
