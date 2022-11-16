from setuptools import setup

setup(
   name='iostypingsound',
   version='2.1.0',
   description='Adds the iOS Typing Sound to your system',
   author='Nathan Fiscaletti',
   author_email='nate.fiscaletti@gmail.com',
   packages=['iostypingsound'],
   install_requires=['pygame', 'pynput', 'psutil', 'imageio-ffmpeg'],
   package_data={
    'iostypingsound': [
      'setup/*'
    ],
   },
   entry_points={
         'console_scripts': [
                'iostype = iostypingsound.main:main',
         ],
   },
)
