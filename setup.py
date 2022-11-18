from setuptools import setup

setup(
   name='keyboardsounds',
   version='4.1.0',
   description='Adds the ability to play sounds while typing on any system.',
   author='Nathan Fiscaletti',
   author_email='nate.fiscaletti@gmail.com',
   packages=['keyboardsounds'],
   install_requires=['pygame', 'pynput', 'psutil', 'imageio-ffmpeg'],
   package_data={
    'keyboardsounds': [
      'profiles/alpaca/*',
      'profiles/gateron-black-ink/*',
      'profiles/gateron-red-ink/*',
      'profiles/holy-panda/*',
      'profiles/ios/*',
      'profiles/mx-black/*',
      'profiles/mx-blue/*',
      'profiles/mx-brown/*',
      'profiles/mx-speed-silver/*',
      'profiles/telios-v2/*',
      'profiles/typewriter/*',
    ],
   },
   entry_points={
         'console_scripts': [
                'keyboardsounds = keyboardsounds.main:main',
         ],
   },
)
