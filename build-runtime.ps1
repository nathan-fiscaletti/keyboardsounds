python -c "
import tomllib

# Read version from pyproject.toml
with open('pyproject.toml', 'rb') as f:
    pyproject = tomllib.load(f)

version = pyproject['project']['version']
parts = version.split('.')
major, minor, patch = parts[0], parts[1], parts[2] if len(parts) > 2 else '0'

print(f'Using version: {version}')

version_file = f'''
VSVersionInfo(
    ffi=FixedFileInfo(
    filevers=({major}, {minor}, {patch}, 0),
    prodvers=({major}, {minor}, {patch}, 0),
    mask=0x3f,
    flags=0x0,
    OS=0x40004,
    fileType=0x1,
    subtype=0x0,
    date=(0, 0)
    ),
    kids=[
    StringFileInfo(
        [
        StringTable(
        '040904B0',
        [StringStruct('CompanyName', 'Nathan Fiscaletti'),
        StringStruct('FileDescription', 'Keyboard Sounds'),
        StringStruct('FileVersion', '{version}'),
        StringStruct('InternalName', 'kbs'),
        StringStruct('LegalCopyright', 'Copyright (c) 2025 Nathan Fiscaletti'),
        StringStruct('OriginalFilename', 'kbs.exe'),
        StringStruct('ProductName', 'Keyboard Sounds'),
        StringStruct('ProductVersion', '{version}')])
        ]),
    VarFileInfo([VarStruct('Translation', [1033, 1200])])
    ]
)
'''
with open('app-version.txt', 'w') as f:
    f.write(version_file)
print('Generated app-version.txt')
"

pyinstaller --distpath ./kbs-dist kbs.spec

New-Item -ItemType Directory -Force -Path ./application/.runtime
Copy-Item -Path ./kbs-dist/kbs/* -Destination ./application/.runtime -Recurse -Force