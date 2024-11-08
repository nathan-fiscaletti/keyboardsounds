# Keyboard Sounds: Custom Profiles

This application supports custom profiles in which you can provide your own WAV or MP3 files to be used for the different keys pressed.

## Index

- [Importing a profile](#importing-a-profile)
- [Creating a new Profile](#creating-a-new-profile)
- [Editing a Profile](#editing-a-profile)
- [Compiling a Profile](#compiling-a-profile)
- [Adding a profile to the official repository](#adding-a-profile-to-the-official-repository)

## Importing a profile

Profiles can be imported from a ZIP file using the [`add-profile`](./backend.md#manage-profiles) action.

```bash
$ kbs add-profile -z "./my-profile.zip"
```

## Creating a new Profile

Create a new profile using the following command:

```bash
$ kbs new -n "My Profile"
```

This will create a new directory called `my-profile` using the [example profile](../keyboardsounds/profiles/profile.template.yaml).

> You can optionally customize the directory path by providing the `-d` argument. If this is not provided, a new directory will be created for you in the current working directory.
>
> ```bash
> $ kbs new -n "My Profile" -d "./my-profile"
> ```

Alternatively, you can use the interactive builder to add sources, keys, and default key mappings directly to a new profile before saving it. 

```bash
$ kbs bp -d "./my-profile"
```

## Editing a Profile

- Edit the profile.yaml file to customize the profile.
- Add sound files to the directory.

Alternatively, you can use the interactive builder to add sources, keys, and default key mappings.

```bash
$ kbs bp -d "./my-profile"
```

## Compiling a Profile

- **Using the interactive builder**

  If you are using the interactive builder, you can build the profile using the `save` command. When using the save command, if the interactive builder was opened using an existing profile, you do not need to provide an output file. However, if you are creating a new profile, you must provide an output file.

  ```bash
  save output-file.zip
  ```

- **Manually**
  
  If you are not using the interactive builder, you can build a profile from an existing directory using the following command.

  ```bash
  $ kbs bp -d "./my-profile" -o "./my-profile.zip"
  ```
  
  > Using the `build-profile (bp)` action is recommended instead of creating your own ZIP file as it has built-in validation to ensure the profile is valid.

## Adding a profile to the official repository

If you have created a profile that you think others would enjoy, you can submit it to the official repository. To do this, you will need to create a pull request.

1. Fork the repository.
2. Add your profile to the `profiles` directory.
3. Create a pull request.