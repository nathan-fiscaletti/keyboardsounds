#!/bin/bash

# Read version from pyproject.toml and generate app-version.txt
python3 -c "
import tomllib

# Read version from pyproject.toml
with open('pyproject.toml', 'rb') as f:
    pyproject = tomllib.load(f)

version = pyproject['project']['version']
parts = version.split('.')
major, minor, patch = parts[0], parts[1], parts[2] if len(parts) > 2 else '0'

print(f'Using version: {version}')

version_file = f'''
def get_version():
    return "{version}"
'''

with open('./keyboardsounds/version.py', 'w') as f:
    f.write(version_file)
print('Generated keyboardsounds/version.py')
"

# Run pyinstaller
pyinstaller --distpath ./kbs-dist kbs-linux.spec

# Create and copy files to application/.runtime
mkdir -p ./application/.runtime
cp -r ./kbs-dist/kbs/* ./application/.runtime