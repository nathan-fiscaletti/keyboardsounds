# Keyboard Sounds

[![Sponsor Me!](https://img.shields.io/badge/%F0%9F%92%B8-Sponsor%20Me!-blue)](https://github.com/sponsors/nathan-fiscaletti)
[![PyPI version](https://badge.fury.io/py/keyboardsounds.svg)](https://badge.fury.io/py/keyboardsounds)
[![GitHub license](https://img.shields.io/github/license/nathan-fiscaletti/keyboardsounds.svg)](https://github.com/nathan-fiscaletti/keyboardsounds/blob/master/LICENSE)

```sh
$ pip install keyboardsounds
```

This python package will add the ability to play sounds while typing anywhere on your system. You can also create [Custom Profiles](#custom-profiles) for customized audio when typing.

## Preview Video

> Click to view a preview of the application.

[![Preview Video](https://github.com/nathan-fiscaletti/keyboardsounds/blob/master/video-preview.png?raw=true)](https://www.youtube.com/watch?v=sWAj8zEk7sQ)

## iOS Sounds

In an effort not to directly distribute the iOS keyboard sound effects this package comes with a video recording of an iOS screen including typing in the recording. This recording is loaded at run-time and the audio clips are extracted and stored in memory for use.

> See [AudioManager.prime_audio_clips](./keyboardsounds/audio_manager.py#L19) for more information.

## Usage

```yaml
Keyboard Sounds vX.X.X

usage:

  manage daemon:

    keyboardsounds start [-v <volume>] [-p <profile>] [-r]
    keyboardsounds stop
    keyboardsounds status

  manage profiles:

    keyboardsounds add-profile -z <zipfile>
    keyboardsounds remove-profile -n <profile>
    keyboardsounds list-profiles

  other:

    keyboardsounds version


positional arguments:
  {start,stop,status,add-profile,remove-profile,list-profiles}
                        The action to perform

options:
  -h, --help            show this help message and exit
  -v volume, --volume volume
                        volume of the sound effects (0-100), default 100
  -p profile, --profile profile
                        sound profile to use, default 'ios'
  -r, --repeat          repeat the sound effect when the key is held down
  -n name, --name name  name of the profile remove
  -z file, --zip file   path to the zip file containing the profile to add
  -V, --version         show program's version number and exit
```

### Manage Daemon

**Action: `start`**

Starts the daemon if it is not running. Otherwise, can be used to re-start it with an adjusted configuration.

```powershell
# Start with default volume of 100%
$ keyboardsounds start
```

```powershell
# Start or reconfigure with a volume of 50%
$ keyboardsounds start -v 50
```

```powershell
# Start or reconfigure with a specific profile
$ keyboardsounds start -p typewriter
```

```powershell
# Start or reconfigure to allow for key repeat sounds
$ keyboardsounds start -r
```

**Action: `status`**

Checks the current status of the daemon.

```powershell
$ keyboardsounds status
```

**Action: `stop`**

Stops the daemon if it is running.

```powershell
$ keyboardsounds stop
```

### Manage Profiles

**Action: `add-profile`**

Adds a new profile to the application.

```powershell
$ keyboardsounds add-profile -z ./my-profile.zip
```

**Action: `remove-profile`**

Removes a profile from the application.

```powershell
$ keyboardsounds remove-profile -n myprofile
```

**Action: `list-profiles`**

Lists the currently loaded profiles.

```powershell
$ keyboardsounds list-profiles
```

## Custom Profiles

> 🛈 Custom Profile Builder Coming Soon

This application supports custom profiles in which you can provide your own WAV files to be used for the different keys pressed.

### Creating a Profile

1. Create a new directory containing the sounds you wish to use.
2. Add a new file to the directory called `profile.json`.
3. Follow the example format below to create the profile.
4. Combine the files into a ZIP file. The files must be at the root of the zip file.

You can then add this profile using the `add-profile` action.

### Example Profile

> Note: Comments are technically **not** valid JSON. Make sure you remove them if you choose to use this example as a starting point for your `profile.json` file.

```json
{
    // The name of the profile.
    "name": "myprofile",

    // Type should always be "files".
    "type": "files",

    // References a sound in the "sounds" array.
    // This will be used as the default value for any key
    // not specified in the "keys" array.
    //
    // This can either be a single ID from the "sounds" array
    // or an array of IDs, from which one will be randomly
    // selected each time a key is pressed.
    "default": ["key", "key2"],

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
            "id": "key2",
            "file": "key2.wav"
        },
        {
            "id": "alt",
            "file": "alt.wav"
        },
        {
            "id": "alt2",
            "file": "alt2.wav"
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
            // This can either be a single ID from the "sounds
            // array or an array of IDs, from which one will
            // be randomly selected each time a key is pressed.
            "sound": "back",

            "keys": [
                "space", "backspace"
            ]
        },
        {
            "sound": ["alt", "alt2"],
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