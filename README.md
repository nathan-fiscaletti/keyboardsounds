# Keyboard Sounds

[![Sponsor Me!](https://img.shields.io/badge/%F0%9F%92%B8-Sponsor%20Me!-blue)](https://github.com/sponsors/nathan-fiscaletti)
[![PyPI version](https://badge.fury.io/py/keyboardsounds.svg)](https://badge.fury.io/py/keyboardsounds)
[![GitHub license](https://img.shields.io/github/license/nathan-fiscaletti/keyboardsounds.svg)](https://github.com/nathan-fiscaletti/keyboardsounds/blob/master/LICENSE)

This python package will add the ability to play sounds while typing anywhere on your system. You can also create [Custom Profiles](#custom-profiles) for customized audio when typing.

## Preview Video

> Click to view a preview of the application.

[![Preview Video](https://github.com/nathan-fiscaletti/keyboardsounds/blob/master/video-preview.png?raw=true)](https://www.youtube.com/watch?v=sWAj8zEk7sQ)

## Installation

**Python 3.7** or higher is required for this application to function. See [Download Python](https://www.python.org/downloads/) for more information on installing Python on your system.

Once you have Python installed, you can install this application by running the following command.

```sh
$ pip install keyboardsounds
```

## Platform Support

|Windows|Linux|macOS|
|---|---|---|
|✅ Supported|✅ Supported|❓ Not Tested|

## Default Sound Profiles

By default, Keyboard Sounds comes with the following profiles pre-loaded.

|Name              | Author                | Description                                             |
|----------------- | --------------------- | ------------------------------------------------------- |
|alpaca            | kbsim                 | Sample of an Alpaca Mechanical Keyboard                 |
|gateron-black-ink | kbsim                 | Sample of Gateron Black Ink key switches                |
|gateron-red-ink   | kbsim                 | Sample of Gateron Red Ink key switches                  |
|holy-panda        | kbsim                 | Sample of Holy Panda key switches                       |
|ios               | Apple, Inc. (Sampled) | Simulates the sounds made by an iPhone or iPad keyboard.|
|mx-black          | kbsim                 | Sample of Cherry MX Black key switches                  |
|mx-blue           | kbsim                 | Sample of Cherry MX Blue key switches                   |
|mx-brown          | kbsim                 | Sample of Cherry MX Brown key switches                  |
|mx-speed-silver   | Mechvibes Community   | Sample audio of MX Speed Silver key switches            |
|telios-v2         | Mechvibes Community   | Sample audio of Telios V2 linear key switches           |
|typewriter        | Mechvibes Community   | Sample audio of an antique typewriter                   |

## Usage

```yaml
Keyboard Sounds vX.X.X

usage: <keyboardsounds|kbs> <action> [params]

  manage daemon:

    <keyboardsounds|kbs> start [-v <volume>] [-p <profile>]
    <keyboardsounds|kbs> stop
    <keyboardsounds|kbs> status

  manage profiles:

    <keyboardsounds|kbs> <ap|add-profile> -z <zipfile>
    <keyboardsounds|kbs> <rp|remove-profile> -n <profile>
    <keyboardsounds|kbs> <lp|list-profiles>
    <keyboardsounds|kbs> <bp|build-profile> -d <sound_dir> -o <zip_file>

  other:

    <keyboardsounds|kbs> [--version|-V]

positional arguments:
  action                The action to perform

optional arguments:
  -h, --help            show this help message and exit
  -v volume, --volume volume
                        volume of the sound effects (0-100), default 100
  -p profile, --profile profile
                        sound profile to use, default 'ios'
  -n name, --name name  name of the profile remove
  -z file, --zip file   path to the zip file containing the profile to add
  -V, --version         show program's version number and exit
  -d directory, --directory directory
                        path to the directory containing the sounds to use for the profile
  -o file, --output file
                        path to the zip file to create
```

### Manage Daemon

**Start the daemon.**

Can also be used to re-start the daemon with an adjusted configuration.

```powershell
# Start with default volume of 100%
$ kbs start
```

```powershell
# Start or reconfigure with a volume of 50%
$ kbs start -v 50
```

```powershell
# Start or reconfigure with a specific profile
$ kbs start -p typewriter
```

**Check the current status of the daemon.**

```powershell
$ kbs status
```

**Stop the daemon if it is running.**

```powershell
$ kbs stop
```

### Manage Profiles

**Add a new profile to the application.**

```powershell
$ kbs add-profile -z ./my-profile.zip
```

**Removes a profile from the application.**

```powershell
$ kbs remove-profile -n myprofile
```

**Lists the currently loaded profiles.**

```powershell
$ kbs list-profiles
```

## Custom Profiles

This application supports custom profiles in which you can provide your own WAV or MP3 files to be used for the different keys pressed.

### Creating a Profile

1. Create a new directory containing the sounds you wish to use.
2. Add a new file to the directory called `profile.yaml`.
3. Follow the example format below to fill the file in.
4. Combine the files into a ZIP file. The files must be at the root of the zip file.

You can then load this profile into the application using the `add-profile` action.

> Note: Alternately you can use the `build-profile` action for an environment with built in validation when creating a new profile.

### Example Profile

```yaml
# General information about your profile, this includes
# name, author and description.
#
# You are only required to provide the "name" field.
profile:
  name: my-profile
  author: Nathan Fiscaletti
  description: Describe the sounds packaged in this profile

# A list of all audio sources used by this profile each
# containing an identifier and a source.
#
# The source can either be the name of an audio file
# packaged with this profile OR a dictionary with two
# keys, one 'press' and one 'release', who's
# corresponding values are names of audio files
# packaged with this profile.
sources:
  - id: key1
    source: sound1.wav
  - id: key2
    source:
      press: sound2.wav
      release: sound3.wav

# An optional mappings of audio sources to
# particular keys on the keyboard.
#
# If you chose to omit the keys section, each time
# a key is pressed on the keyboard a random sound
# from the list of audio sources will be used.
keys:
  # The default value to use for any key not
  # mapped elsewhere in the keys object.
  #
  # If you provide the keys object, you MUST
  # provide a value for the default property.
  #
  # The value for this property can either be
  # the ID of one of the sources you defined
  # above, or an array of IDs.
  default: [ key1, key2 ]

  # A list of mappings of sources to keyboard keys.
  other:
      # The sound to play when one of the keys listed
      # in the keys array is pressed.
      #
      # The value for this property can either be
      # the ID of one of the sources you defined
      # above, or an array of IDs.
    - sound: key1
      # An array of keys that you can press that this
      # sound will be mapped to.
      keys: [ backspace, delete ]

```
