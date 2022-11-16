# iOS Typing Sound

[![Sponsor Me!](https://img.shields.io/badge/%F0%9F%92%B8-Sponsor%20Me!-blue)](https://github.com/sponsors/nathan-fiscaletti)
[![PyPI version](https://badge.fury.io/py/iostypingsound.svg)](https://badge.fury.io/py/iostypingsound)
[![GitHub license](https://img.shields.io/github/license/nathan-fiscaletti/iostypingsound.svg)](https://github.com/nathan-fiscaletti/iostypingsound/blob/master/LICENSE)

This python package will add the iOS Keyboard Typing Sound to your system so that any time you type anywhere on your system, it will sound like an iOS keyboard.

```sh
$ pip install iostypingsound
```

## Preview Video

> Click to view a preview of the application.

[![Preview Video](https://img.youtube.com/vi/r-B0Iqad564/0.jpg)](https://www.youtube.com/watch?v=r-B0Iqad564)

## How are the sounds packaged?

In an effort not to directly distribute the iOS keyboard sound effects this package comes with a video recording of an iOS screen including typing in the recording. This recording is loaded at run-time and the audio clips are extracted and stored in memory for use.

## Usage

```yaml
iOS Typing Sound vX.X.X

Manage the iOS Typing Sound daemon.

usage: iostype [start [-v <volume>]|stop|status]

positional arguments:
  {start,stop,status}

options:
  -h, --help           show this help message and exit
  -v volume            volume of the sound effects (0-100)
  -V, --version        show program's version number and exit
```

### Action: `start`

Starts the daemon if it is not running. Otherwise, can be used to re-start it with an adjusted configuration.

```powershell
# Start with default volume of 100%
$ iostype start
```

```powershell
# Start or reconfigure with a volume of 50%
$ iostype start -v 50
```

### Action: `status`

Checks the current status of the daemon.

```powershell
$ iostype status
```

### Action: `stop`

Stops the daemon if it is running.

```powershell
$ iostype stop
```
