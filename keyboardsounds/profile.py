import os
import json
import zipfile
import shutil
import tempfile

from keyboardsounds.root import ROOT

VALID_PROFILE_TYPES = ["video-extract", "files"]

class Profile:
    def __init__(self, name: str):
        self.name = name
        self.path = os.path.join(ROOT, "profiles", self.name)
        self.validate()
        with open(os.path.join(self.path, "profile.json"), "r") as f:
            self.data = json.load(f)

    def validate(self):
        # Validate File Structure

        if not os.path.isdir(self.path):
            raise ValueError(f"Profile '{self.name}' does not exist")
        if not os.path.isfile(self.get_file_path("profile.json")):
            raise ValueError(f"Profile '{self.name}' is corrupted. Missing profile.json.")
    
        with open(os.path.join(self.path, "profile.json"), "r") as f:
            self.data = json.load(f)

        # Validate Required Generic Keys

        required_keys = ["name", "type", "default", "keys", "sounds"]
        for required_key in required_keys:
            if required_key not in self.data:
                raise ValueError(f"Profile '{self.name}' is corrupted. Missing '{required_key}' in profile.json.")
        
        # Validate Type

        if self.data["type"] not in VALID_PROFILE_TYPES:
            raise ValueError(f"Profile '{self.name}' is corrupted. Invalid profile type '{self.data['type']}' in profile.json.")

        # Validate Default

        if type(self.data["default"]) is list:
            for default in self.data["default"]:
                if default is None or default not in [(sound["id"] if "id" in sound else None) for sound in self.data["sounds"]]:
                    raise ValueError(f"Profile '{self.name}' is corrupted. Default sound key '{default}' does not reference a valid id in the sounds array.")
        else:
            if self.data["default"] is None or self.data["default"] not in [(sound["id"] if "id" in sound else None) for sound in self.data["sounds"]]:
                raise ValueError(f"Profile '{self.name}' is corrupted. Default sound key '{self.data['default']}' does not reference a valid id in the sounds array.")
        
        # Validate Sounds

        if self.data["type"] == "video-extract":
            if "video" not in self.data:
                raise ValueError(f"Profile '{self.name}' is corrupted. Missing 'video' in profile.json.")
            if not os.path.isfile(self.get_file_path(self.data["video"])):
                raise ValueError(f"Profile '{self.name}' is corrupted. Missing video file '{self.data['video']}'.")
            for sound in self.data["sounds"]:
                if "id" not in sound:
                    raise ValueError(f"Profile '{self.name}' is corrupted. Missing 'id' in a sound in profile.json.")
                if "start" not in sound:
                    raise ValueError(f"Profile '{self.name}' is corrupted. Missing 'start' in sound '{sound['id']}' in profile.json.")
                if "end" not in sound:
                    raise ValueError(f"Profile '{self.name}' is corrupted. Missing 'end' in sound '{sound['id']}' in profile.json.")
        elif self.data["type"] == "files":
            for sound in self.data["sounds"]:
                if "id" not in sound:
                    raise ValueError(f"Profile '{self.name}' is corrupted. Missing 'id' in a sound in profile.json.")
                if "file" not in sound:
                    raise ValueError(f"Profile '{self.name}' is corrupted. Missing 'file' in sound '{sound['id']}' in profile.json.")
                if not os.path.isfile(self.get_file_path(sound["file"])):
                    raise ValueError(f"Profile '{self.name}' is corrupted. Missing sound file '{sound['file']}' in sound '{sound['id']}' in profile.json.")

        # Validate Keys

        for key in self.data["keys"]:
            if "keys" not in key:
                raise ValueError(f"Profile '{self.name}' is corrupted. Missing 'keys' in one or more key definition in profile.json.")
            if "sound" not in key:
                raise ValueError(f"Profile '{self.name}' is corrupted. Missing 'sound' in one or more key definition in profile.json.")

    def get_file_path(self, name: str):
        return os.path.join(self.path, name)

    @classmethod
    def list(cls):
        return [f.name for f in os.scandir(os.path.join(ROOT, "profiles")) if f.is_dir()]

    @classmethod
    def remove_profile(cls, name: str):
        output_path = os.path.join(ROOT, "profiles", name)
        if os.path.isdir(output_path):
            shutil.rmtree(output_path)
            print("Profile removed.")
        else:
            print("Profile does not exist.")

    @classmethod
    def add_profile(cls, path: str):
        input_path = os.path.abspath(path)
        tmpdir = tempfile.mkdtemp()

        with zipfile.ZipFile(input_path, "r") as zip_ref:
            zip_ref.extractall(tmpdir)

        profile_data = None
        if os.path.isfile(os.path.join(tmpdir, "profile.json")):
            with open(os.path.join(tmpdir, "profile.json"), "r") as f:
                profile_data = json.load(f)

        if not profile_data or "name" not in profile_data:
            shutil.rmtree(tmpdir)
            raise ValueError("Profile is corrupted. Missing or invalid profile.json.")

        name = profile_data["name"]

        print(f"Importing profile from '{input_path}'...")
        output_path = os.path.join(ROOT, "profiles", name)

        shutil.move(tmpdir, output_path)        
        try:
            Profile(name)
            print(f"Successfully imported profile '{name}'.")
        except ValueError as e:
            print(f"Profile '{name}' is invalid. Deleting...")
            shutil.rmtree(output_path)
            print(f"Error: {e}")
            return
        

    
    