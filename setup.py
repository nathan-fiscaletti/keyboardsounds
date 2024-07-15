from setuptools import setup

setup(
    name="keyboardsounds",
    version="5.7.9",
    description="Adds the ability to play sounds while typing on any system.",
    author="Nathan Fiscaletti",
    author_email="nate.fiscaletti@gmail.com",
    packages=["keyboardsounds"],
    install_requires=[
        "pygame==2.5.2",
        "pynput==1.7.6",
        "psutil==5.9.4",
        "imageio-ffmpeg==0.4.6",
        "pyyaml==6.0.1",
        "setuptools==70.0.0",
        "requests==2.32.2",
    ],
    package_data={
        "keyboardsounds": [
            "profiles/alpaca/*",
            "profiles/gateron-black-ink/*",
            "profiles/gateron-red-ink/*",
            "profiles/holy-panda/*",
            "profiles/ios/*",
            "profiles/mx-black/*",
            "profiles/mx-blue/*",
            "profiles/mx-brown/*",
            "profiles/mx-speed-silver/*",
            "profiles/telios-v2/*",
            "profiles/typewriter/*",
            "external_api/*",
        ],
    },
    entry_points={
        "console_scripts": [
            "keyboardsounds = keyboardsounds.main:main",
            "kbs = keyboardsounds.main:main",
        ],
    },
)
