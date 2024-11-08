# Keyboard Sounds: Command Line

Keyboard Sounds has a comprehensive backend that can be used to manage the daemon, application rules, and profiles. This backend can be accessed via the command line interface (CLI) in your terminal application.

## Index

- [Managing the Daemon](#manage-the-daemon)
- [Manage Profiles](#manage-profiles)
- [Managing Application Rules (Windows Only)](#managing-application-rules-windows-only)

## Manage the Daemon

**Start or reconfigure the daemon**

```bash
# Start with default volume of 100%
$ kbs start

# Start or reconfigure with a volume of 50%
$ kbs start -v 50

# Start or reconfigure with a specific profile
$ kbs start -p typewriter
```

**Check the current status of the daemon**

```bash
$ kbs status
```

**Stop the daemon if it is running**

```bash
$ kbs stop
```

## Manage Profiles

```bash
# Create a new profile
$ kbs new -n "My Profile"

# Export an existing profile
$ kbs export-profile -n "My Profile" -o "My Profile.zip"

# List downloadable profiles
$ kbs list-profiles --remote

# List installed profiles
$ kbs list-profiles

# Download a profile
$ kbs download-profile -n myprofile

# Import a profile
$ kbs add-profile -z ./my-profile.zip

# Remove a profile
$ kbs remove-profile -n myprofile
```

## Managing Application Rules (Windows Only)

Keyboard Sounds supports the ability to enable or disable the typing sound effects for specific applications. You can also set a global rule that will be used for all applications that do not have a specific rule set.

**⚠️ Application Rules are only available on Windows**

### Rule Types

- `enable` - Enable sound effects for the application.
- `disable` - Disable sound effects for the application.
- `exclusive` - Only play sound effects for the application.

> The global rule can only be set to `enable` or `disable`. By default, the global rule is set to `enable`.

### Examples

```bash
# Add a rule to disable sound effects for an application
$ kbs add-rule -r disable -a "C:\Program Files\MyApp\MyApp.exe" 

# Remove a rule for an application
$ kbs remove-rule -a "C:\Program Files\MyApp\MyApp.exe"

# List the currently loaded rules
$ kbs list-rules
```

### Set the global rule

> The global rule is used as the fallback for any application that does not have a specific rule set. By default, it is set to `enable`.

```bash
# Set the global rule to disable
$ kbs set-global-rule -r disable

# Retrieve the current global rule
$ kbs get-global-rule
```