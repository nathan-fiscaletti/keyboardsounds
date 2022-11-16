# Keyboard Sounds

[![Sponsor Me!](https://img.shields.io/badge/%F0%9F%92%B8-Sponsor%20Me!-blue)](https://github.com/sponsors/nathan-fiscaletti)
[![PyPI version](https://badge.fury.io/py/keyboardsounds.svg)](https://badge.fury.io/py/keyboardsounds)
[![GitHub license](https://img.shields.io/github/license/nathan-fiscaletti/keyboardsounds.svg)](https://github.com/nathan-fiscaletti/keyboardsounds/blob/master/LICENSE)

```sh
$ pip install keyboardsounds
```

## Preview Video

> Click to view a preview of the application.

[![Preview Video](https://github.com/nathan-fiscaletti/keyboardsounds/blob/master/video-preview.png?raw=true)](https://www.youtube.com/watch?v=r-B0Iqad564)

## Overview

This python package will add the ability to play sounds while typing anywhere on your system.

By default, it ships with two profiles.

- **ios**: Mimics the sounds made by an iPhone or iPad keyboard.
- **typewriter**: Mimics the sounds of a typewriter.

You can also create [Custom Profiles](#custom-profiles).

## iOS Sounds

In an effort not to directly distribute the iOS keyboard sound effects this package comes with a video recording of an iOS screen including typing in the recording. This recording is loaded at run-time and the audio clips are extracted and stored in memory for use.

> See [AudioManager.prime_audio_clips](./keyboard_sounds/audio_manager.py#L19) for more information.

## Usage

```yaml
Keyboard Sounds v2.2.0

usage:

  manage daemon:

    keyboard-sounds start [-v <volume>] [-p <profile>]
    keyboard-sounds stop
    keyboard-sounds status

  manage profiles:

    keyboard-sounds add-profile -z <zipfile>
    keyboard-sounds remove-profile -n <profile>
    keyboard-sounds list-profiles

  other:

    keyboard-sounds version


positional arguments:
  {start,stop,status,add-profile,remove-profile,list-profiles}
                        The action to perform

options:
  -h, --help            show this help message and exit
  -v volume, --volume volume
                        volume of the sound effects (0-100), default 100
  -p profile, --profile profile
                        sound profile to use, default 'ios'
  -n name, --name name  name of the profile remove
  -z file, --zip file   path to the zip file containing the profile to add
  -V, --version         show program's version number and exit
```

### Manage Daemon

**Action: `start`**

Starts the daemon if it is not running. Otherwise, can be used to re-start it with an adjusted configuration.

```powershell
# Start with default volume of 100%
$ keyboard-sounds start
```

```powershell
# Start or reconfigure with a volume of 50%
$ keyboard-sounds start -v 50
```

**Action: `status`**

Checks the current status of the daemon.

```powershell
$ keyboard-sounds status
```

**Action: `stop`**

Stops the daemon if it is running.

```powershell
$ keyboard-sounds stop
```

### Manage Profiles

**Action: `add-profile`**

Adds a new profile to the application.

```powershell
$ keyboard-sounds add-profile -z ./my-profile.zip
```

**Action: `remove-profile`**

Removes a profile from the application.

```powershell
$ keyboard-sounds remove-profile -n myprofile
```

**Action: `list-profiles`**

Lists the currently loaded profiles.

```powershell
$ keyboard-sounds list-profiles
```

## Custom Profiles

This application supports custom profiles in which you can provide your own WAV files to be used for the different keys pressed.

By default, it ships with two profiles.

- **ios**: Mimics the sounds made by an iPhone or iPad keyboard.
- **typewriter**: Mimics the sounds of a typewriter.

### Creating a Profile

1. Create a new directory containing the sounds you wish to use.
2. Add a new file to the directory called `profile.json`.
3. Follow the example format below to create the profile.
4. Zip the directory into a ZIP file.

You can then add this profile using the `add-profile` action.

### Example Profile

> Note: Comments are not technically valid JSON. Make sure you remove them if you choose to use this example as a starting point for your `profile.json` file.

```json
{
    // The name of the profile.
    "name": "myprofile",

    // Type should always be "files".
    "type": "files",

    // References a sound in the "sounds" array.
    // This will be used as the default value for any key
    // not specified in the "keys" array.
    "default": "key",

    // This is an array of the different sounds available.
    // All sound files should be stored directly in the root
    // of the custom profile directory.
    //
    // Each sound is assigned an ID which can be referenced by
    // either the "default" property or by one of the elements
    // of the "keys" array.
    "sounds": [
        {
            "id": "key",
            "file": "key.wav"
        },
        {
            "id": "alt",
            "file": "alt.wav"
        },
        {
            "id": "back",
            "file": "back.wav"
        }
    ],

    // An array that maps specific keys to specific sounds
    // from the "sounds" array.
    "keys": [
        {
            "sound": "back",
            "keys": [
                "space", "backspace"
            ]
        },
        {
            "sound": "alt",
            "keys": [
                "alt", "ctrl", "shift",
                "tab", "enter", "insert",
                "home", "page_up", "page_down",
                "delete", "end"
            ]
        }
    ]
}
```