import os
import yaml
import zipfile
import shutil
import tempfile
import requests

from keyboardsounds.root import ROOT
from keyboardsounds.path_resolver import PathResolver
from keyboardsounds.profile_validation import validate_profile
from keyboardsounds.profile_builder import CliProfileBuilder

PROFILES_REMOTE_URL = "https://api.github.com/repos/nathan-fiscaletti/keyboardsounds/contents/keyboardsounds/profiles?ref=master"
PROFILE_REMOTE_URL = "https://api.github.com/repos/nathan-fiscaletti/keyboardsounds/contents/keyboardsounds/profiles/{name}?ref=master"
PROFILE_DETAIL_URL = "https://raw.githubusercontent.com/nathan-fiscaletti/keyboardsounds/master/keyboardsounds/profiles/{name}/profile.yaml"


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
            raise ValueError(
                f"Profile '{self.name}' is corrupted. Missing profile.yaml."
            )

        with open(self.get_file_path("profile.yaml"), "r") as f:
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
        author = (
            self.__data["profile"]["author"]
            if "author" in self.__data["profile"]
            else None
        )
        description = (
            self.__data["profile"]["description"]
            if "description" in self.__data["profile"]
            else None
        )
        return {"name": name, "author": author, "description": description}

    def export(self, output: str):
        # export profile to zip file
        CliProfileBuilder(self.root, output).save()

    @classmethod
    def list(cls):
        names = [
            f.name for f in os.scandir(os.path.join(ROOT, "profiles")) if f.is_dir()
        ]
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
    def list_remote_profiles(cls):
        response = requests.get(PROFILES_REMOTE_URL)
        if response.status_code != 200:
            raise ValueError("Failed to fetch remote profiles.")
        profile_names = [f["name"] for f in response.json() if f["type"] == "dir"]

        result = []
        # Retrieve `profile.yaml` for the profile
        for profile_name in profile_names:
            response = requests.get(PROFILE_DETAIL_URL.format(name=profile_name))
            if response.status_code != 200:
                raise ValueError(f"Failed to fetch remote profile '{profile_name}'.")
            # parse the yaml file
            profile_data = yaml.safe_load(response.text)
            result.append(profile_data["profile"])
        return result

    @classmethod
    def download_profile(cls, name: str):
        print(f"Retrieving meta-data for profile '{name}'...")
        response = requests.get(PROFILE_REMOTE_URL.format(name=name))
        if response.status_code != 200:
            raise ValueError(f"Failed to fetch remote profile '{name}'.")

        print(f"Downloading profile '{name}'...")
        # Get the profile data
        profile_data = response.json()

        # Create a temporary working directory
        tmpdir = tempfile.mkdtemp()

        # Download the profiles files into the directory
        for file in profile_data:
            if file["type"] == "file":
                response = requests.get(file["download_url"])
                with open(os.path.join(tmpdir, file["name"]), "wb") as f:
                    f.write(response.content)

        # Compress the contents of the directory into a zip file (stored in the temporary directory)
        output_path = os.path.join(tmpdir, f"{name}.zip")
        with zipfile.ZipFile(output_path, "w") as zip_ref:
            for file in os.listdir(tmpdir):
                file_path = os.path.join(tmpdir, file)
                if file_path != output_path:
                    zip_ref.write(file_path, file)

        # Add the profile to the local profiles directory
        err = None
        try:
            Profile.add_profile(output_path)
        except ValueError as e:
            err = e
        finally:
            # Clean up the temporary directory
            shutil.rmtree(tmpdir)
            if err:
                raise err

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

        if (
            not profile_data
            or "profile" not in profile_data
            or "name" not in profile_data["profile"]
        ):
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

    @classmethod
    def create_profile(cls, path: str, name: str):
        if name is None:
            print("Please specify a name for the profile to create.")
            return

        # If no directory is provided, use the current directory and the name
        if path is None:
            dirNameSafeName = name.replace(" ", "_").lower()
            path = os.path.join(os.getcwd(), dirNameSafeName)

        # Make sure the directory doesn't already exist
        if os.path.isdir(path):
            print(f"Directory '{path}' already exists.")
            return

        # Create the directory
        try:
            os.makedirs(path)
        except Exception as e:
            raise ValueError(f"Failed to create directory '{path}'. Error: {e}")

        # Create the profile.yaml file using the template
        profile_file = os.path.join(path, "profile.yaml")
        with open(profile_file, "w") as f:
            with open(
                os.path.join(ROOT, "profiles", "profile.template.yaml"), "r"
            ) as template_file:
                template = template_file.read()
                template = template.replace("{{ name }}", name)
                f.write(template)

        print("")
        print(f"Profile '{name}' created successfully.")
        print("")
        print(f"    Profile Directory: {path}")
        print("")
        print("      - Edit the profile.yaml file to customize the profile.")
        print("      - Add audio files to the directory.")
        print("")
        print(
            "    Use the interactive builder to add sources, keys, and default key mappings."
        )
        print("")
        print(f"        kbs build-profile -path {path}")
        print("")
        print("    Build your profile using the following command:")
        print("")
        print(f"        kbs build-profile -path {path} -o {name}.zip")
        print("")

    @classmethod
    def export_profile(cls, name: str, output: str):
        if name is None:
            print("Please specify a name for the profile to export.")
            return

        try:
            profile = Profile(name)
        except Exception as e:
            print(f"Failed to find profile '{name}'. Error: {e}")
            return

        profile.export(output)
