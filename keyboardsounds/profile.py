import os
import yaml
import zipfile
import shutil
import tempfile

from keyboardsounds.root import ROOT
from keyboardsounds.path_resolver import PathResolver
from keyboardsounds.profile_validation import validate_profile

class Profile(PathResolver):
    def __init__(self, name: str):
        super().__init__(os.path.join(ROOT, "profiles", name))
        self.name = name
        self.__validate()

    def __validate(self):
        # Validate File Structure

        if not os.path.isdir(self.root):
            raise ValueError(f"Profile '{self.name}' does not exist")
        if not os.path.isfile(self.get_file_path("profile.yaml")):
            raise ValueError(f"Profile '{self.name}' is corrupted. Missing profile.yaml.")
    
        with open(self.get_file_path('profile.yaml'), "r") as f:
            data = yaml.safe_load(f)
            self.__data = validate_profile(self, data)

    def value(self, key: str):
        value = self.__data
        map = key.split(".")
        for key in map:
            if key not in value:
                return None
            value = value[key]
        return value

    def data(self):
        return self.__data

    def metadata(self):
        name = self.__data["profile"]["name"]
        author = self.__data["profile"]["author"] if "author" in self.__data["profile"] else None
        description = self.__data["profile"]["description"] if "description" in self.__data["profile"] else None
        return {
            "name": name,
            "author": author,
            "description": description
        }

    @classmethod
    def list(cls):
        names = [f.name for f in os.scandir(os.path.join(ROOT, "profiles")) if f.is_dir()]
        return [Profile(name) for name in names]

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
        if os.path.isfile(os.path.join(tmpdir, "profile.yaml")):
            with open(os.path.join(tmpdir, "profile.yaml"), "r") as f:
                profile_data = yaml.safe_load(f)

        if not profile_data or "profile" not in profile_data or "name" not in profile_data["profile"]:
            shutil.rmtree(tmpdir)
            raise ValueError("Profile is corrupted. Missing or invalid profile.yaml.")
        name = profile_data["profile"]["name"]

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
        

    
    