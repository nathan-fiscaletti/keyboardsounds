from setuptools import setup

setup(
    name="keyboardsounds",
    version="5.8.9",
    description="Adds the ability to play sounds while typing on any system.",
    author="Nathan Fiscaletti",
    author_email="nate.fiscaletti@gmail.com",
    packages=["keyboardsounds"],
    install_requires=[
        "pygame==2.6.1",
        "pynput==1.7.7",
        "psutil==6.1.0",
        "imageio-ffmpeg==0.5.1",
        "pyyaml==6.0.2",
        "setuptools==75.3.0",
        "requests==2.32.3",
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
            "profiles/profile.template.yaml",
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
