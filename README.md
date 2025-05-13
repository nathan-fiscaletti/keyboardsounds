https://github.com/user-attachments/assets/e2ed8513-0241-46ce-8a24-43104580d511

# Keyboard Sounds

[![Discord](https://img.shields.io/badge/-Join%20the%20Community-gray?logo=discord&logoColor=%23ffffff&labelColor=%235865f2)](https://discord.gg/gysskqts6z)
[![Sponsor Me](https://img.shields.io/badge/%F0%9F%92%B8-Sponsor%20Me!-blue)](https://github.com/sponsors/nathan-fiscaletti)
[![PyPi](https://badge.fury.io/py/keyboardsounds.svg)](https://badge.fury.io/py/keyboardsounds)
[![License](https://img.shields.io/github/license/nathan-fiscaletti/keyboardsounds.svg)](https://github.com/nathan-fiscaletti/keyboardsounds/blob/master/LICENSE)
[![Downloads](https://static.pepy.tech/badge/keyboardsounds)](https://pepy.tech/project/keyboardsounds)

Keyboard Sounds is a free application that makes any keyboard sound like a Mechanical Keyboard. It includes 11 built in profiles, a profile editor, and application rules.

### Getting Started

- [Install Keyboard Sounds](#installation)
- [Create Custom Profiles](#custom-profiles)
- [Application Rules](#application-rules)
- [Command Line Usage](#command-line-macos-linux-or-windows)

### Helpful Links

- [Uninstall Keyboard Sounds](#uninstalling)
- [Developer Documentation](#development)

## Installation

Keyboard Sounds can be installed as a desktop application or as a Python package. The desktop application is recommended for most users as it is easier to install and use.

### Desktop Application (Windows only)

[⬇️ Download](https://github.com/nathan-fiscaletti/keyboardsounds/releases/latest)

<img align="right" src="./application/main.png" width="250" />

Currently the desktop application is only available for **Windows**. The Python package can be used on any platform that supports Python.

The desktop application still requires the [command line](#command-line-macos-linux-or-windows) to be installed on your system. On first launch, the application will check that both Python and the required Python packages are installed.

  - **Make sure when you install Python that you check the box that says "Add Python to PATH"**.
    > This will allow you to run Python from the command line, which is a requirement for the desktop application to function correctly.

You may need to restart the application after doing this for the changes to take effect.

> For information on uninstalling Keyboard Sounds, see [Uninstall Keyboard Sounds](#uninstalling)

## Features

### Custom Profiles

Keyboard Sounds comes bundled with eleven built-in sound profiles and supports custom profiles in which you can provide your own WAV or MP3 files to be used for the different keys pressed.

Read more about creating and editing profiles [here](./docs/custom-profiles.md).

![Custom Profiles](./application/editor-with-profiles.png)

### Application Rules

<img align="right" src="./docs/app-rules.png" height="350" />

- Keyboard Sounds supports application rules in which you can control the behavior of the sound daemon based on the currently focused application.

- This allows you to do things like only enabling in your text editor or terminal, disabling it for specific games, or localizing the sound effects to a particular application.

- Read more about application rules [here](./docs/app-rules.md).

- _Application rules are currently only available for the Windows platform._

<br><br><br><br><br>

## Command Line (macOS, Linux or Windows)

1. **Install Python**
   
   To install this application as a CLI utility via the Python package, you will need to have Python installed on your system. You can download Python from the [official website](https://www.python.org/).
    
   **Make sure when you install Python that you check the box that says "Add Python to PATH"**.
    
   > This will allow you to run Python from the command line.
2. **Install the Keyboard Sounds CLI**

   After you have installed Python, you can install the Keyboard Sounds CLI by running the following command in your terminal.

   ```sh
   $ pip install keyboardsounds
   ```
3. **Using the CLI**
   
   To use the Keyboard Sounds CLI, run `kbs --help` from your command line terminal.

## Uninstalling

You can uninstall the Keyboard Sounds Desktop Application from the "Apps" section of your system Settings application. 

- Uninstalling the desktop app will **not** remove the Python package from your system, you will need to do this manually if you no longer wish to use the Python package using the following command:

  ```sh
  $ pip uninstall keyboardsounds
  ```

## Development

Documentation for developers who wish to contribute to this project can be found [here](./docs/development.md).

                        
## Stargazers over time

[![Stargazers over time](https://starchart.cc/nathan-fiscaletti/keyboardsounds.svg?variant=adaptive)](https://starchart.cc/nathan-fiscaletti/keyboardsounds)