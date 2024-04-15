# Keyboard Sounds

[![Sponsor Me!](https://img.shields.io/badge/%F0%9F%92%B8-Sponsor%20Me!-blue)](https://github.com/sponsors/nathan-fiscaletti)
[![PyPI version](https://badge.fury.io/py/keyboardsounds.svg)](https://badge.fury.io/py/keyboardsounds)
[![GitHub license](https://img.shields.io/github/license/nathan-fiscaletti/keyboardsounds.svg)](https://github.com/nathan-fiscaletti/keyboardsounds/blob/master/LICENSE)
[![Downloads](https://static.pepy.tech/badge/keyboardsounds)](https://pepy.tech/project/keyboardsounds)
[![Downloads](https://static.pepy.tech/badge/keyboardsounds/month)](https://pepy.tech/project/keyboardsounds)

This python package will add the ability to play sounds while typing anywhere on your system. You can also create [Custom Profiles](#custom-profiles) for customized audio when typing.

[Work in Progress Desktop Application](https://github.com/nathan-fiscaletti/keyboardsounds-desktop)

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

- [Managing the Daemon](#manage-the-daemon)
- [Managing Application Rules](#managing-application-rules)
- [Manage Profiles](#manage-profiles)
- [Custom Profiles](#custom-profiles)

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

  manage rules:

    <keyboardsounds|kbs> <ar|add-rule> -r <rule> -a <app>
    <keyboardsounds|kbs> <rr|remove-rule> -a <app>
    <keyboardsounds|kbs> <lr|list-rules>
    <keyboardsounds|kbs> <sr|set-global-rule> -r <rule>
    <keyboardsounds|kbs> <gr|get-global-rule>

  other:

    <keyboardsounds|kbs> [--version|-V]


positional arguments:
  action                The action to perform

options:
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
  -a app, --app app     absolute path to the application to add the rule for
  -r rule, --rule rule  rule to apply. must be one of 'enable', 'disable', or 'exclusive'
```

### Manage the Daemon

**Start the daemon.**

Can also be used to re-start the daemon with an adjusted configuration.

```bash
# Start with default volume of 100%
$ kbs start
```

```bash
# Start or reconfigure with a volume of 50%
$ kbs start -v 50
```

```bash
# Start or reconfigure with a specific profile
$ kbs start -p typewriter
```

**Check the current status of the daemon.**

```bash
$ kbs status
```

**Stop the daemon if it is running.**

```bash
$ kbs stop
```

### Managing Application Rules

Keyboard Sounds supports the ability to enable or disable the typing sound effects for specific applications. You can also set a global rule that will be used for all applications that do not have a specific rule set.

**⚠️ Application Rules are only available on Windows.**

#### Rule Types

- `enable` - Enable sound effects for the application.
- `disable` - Disable sound effects for the application.
- `exclusive` - Only play sound effects for the application.

> The global rule can only be set to `enable` or `disable`. By default, the global rule is set to `enable`.

**Add a new rule for an application.**

```bash
$ kbs add-rule -r enable -a "C:\Program Files\MyApp\MyApp.exe" 
```

**Remove a rule for an application.**

```bash
$ kbs remove-rule -a "C:\Program Files\MyApp\MyApp.exe"
```

**Lists the currently loaded rules.**

```bash
$ kbs list-rules
```

**Set the global rule.**

> The global rule is used as the fallback for any application that does not have a specific rule set. By default, it is set to `enable`.

```bash
$ kbs set-global-rule -r disable
```

**Get the current global rule.**

```bash
$ kbs get-global-rule
```

### Manage Profiles

**Add a new profile to the application.**

```bash
$ kbs add-profile -z ./my-profile.zip
```

**Removes a profile from the application.**

```bash
$ kbs remove-profile -n myprofile
```

**Lists the currently loaded profiles.**

```bash
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

## Development

This section is intended for developers who wish to contribute to this project. Follow the steps below to set up your development environment and start contributing.

### Prerequisites

- [Git](https://git-scm.com/downloads)
- [Python](https://www.python.org/) (version 3.7 or higher)
- [pip](https://pip.pypa.io/en/stable/installing/) (Python package installer)
- [virtualenv](https://virtualenv.pypa.io/en/latest/installation.html) (optional, but recommended)

### Setting Up the Development Environment

1. **Clone the Repository**

   Begin by cloning the repository to your local machine using Git:

   ```bash
   git clone https://github.com/nathan-fiscaletti/keyboardsounds.git
   ```

2. **Navigate to the Project Directory**

   Change to the project directory:

   ```bash
   cd keyboardsounds
   ```

3. **Create a Virtual Environment (Optional)**

   It's recommended to create a virtual environment to keep dependencies required by different projects separate. If you have `virtualenv` installed, create a virtual environment:

   ```bash
   virtualenv venv
   ```

   Activate the virtual environment:

   - On Windows:
     ```cmd
     .\venv\Scripts\activate
     ```
   - On Unix or MacOS:
     ```bash
     source venv/bin/activate
     ```

4. **Install Dependencies**

   Install the project dependencies using `pip`:

   ```bash
   pip install -r requirements.txt
   ```

### Running the Project Locally

It is recommended that you install the package in editable mode to allow you to make changes to the code and see the changes reflected in the application.

- To install the package in editable mode, use the following command:

  ```bash
  pip install -e .
  ```

  This command will install the package in editable mode, allowing you to make changes to the code and see the changes reflected in the application.

### Contributing

Contributions are what make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

#### Submitting Pull Requests

1. Fork the repository and create your branch from `master`.
2. If you've added code, ensure your code adheres to the project's coding conventions.
4. Update documentation as necessary.
5. Submit your pull request with a detailed description of your changes.

### Getting Help

Should you have any questions or encounter issues, feel free to open an issue on the repository, and I'll do my best to address it.
