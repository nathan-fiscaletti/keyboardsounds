import { Socket } from "net";
import { BrowserWindow, shell, dialog } from 'electron';
import { exec } from 'child_process';
import semver from 'semver';

import Store from 'electron-store';

const store = new Store();

const ErrPythonVersionUnknown = 'Failed to parse python version';
const ErrPythonMissing = 'Python is not installed';
const ErrPythonVersionMismatch = 'Python Version 3.0 or higher is required';
const ErrPythonPackageMissing = 'KeyboardSounds package is not installed';
const ErrPythonPackageVersionMismatch = 'KeyboardSounds package version mismatch';

const MinimumPythonVersion = '3.8.0';
const MinimumPythonPackageVersion = '5.7.2';

const kbs = {
    mainWindow: null,
    editorWindowCreateHandler: null,
    editorWindow: null,
    openFileDialogIsOpen: false,
    appVersion: '1.0.0',

    exec: function (cmd, print=true) {
        return new Promise((resolve, reject) => {
            if (print) {
                console.log(`executing: kbs ${cmd}`);
            }

            exec(`kbs ${cmd}`, (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(stdout);
            });
        });
    },

    getBackendVersion: function () {
        return this.exec('--version');
    },

    openInBrowser: function () {
        return Promise.resolve(
            shell.openExternal("https://github.com/nathan-fiscaletti/keyboardsounds")
        );
    },

    status: function () {
        return new Promise((resolve, reject) => {
            this.exec('status --short', false).then((stdout) => {
                try {
                    const status = JSON.parse(stdout);
                    resolve(status);
                } catch (err) {
                    reject(err);
                }
            }).catch((err) => {
                reject(err);
            });
        });
    },

    profiles: function() {
        return new Promise((resolve, reject) => {
            this.exec('list-profiles --short', false).then((stdout) => {
                try {
                    const profiles = JSON.parse(stdout);
                    resolve(profiles);
                } catch (err) {
                    reject(err);
                }
            }).catch((err) => {
                reject(err);
            });
        });
    },

    rules: function() {
        return new Promise((resolve, reject) => {
            this.exec('list-rules --short', false).then((stdout) => {
                try {
                    const rules = JSON.parse(stdout);
                    resolve(rules);
                } catch (err) {
                    reject(err);
                }
            }).catch((err) => {
                reject(err);
            });
        });
    },

    getAppVersion: function() {
        return Promise.resolve(this.appVersion);
    },

    getGlobalAction: function() {
        return new Promise((resolve, reject) => {
            this.exec('get-global-rule --short', false).then((stdout) => {
                try {
                    const ga = JSON.parse(stdout);
                    resolve(ga.global_action);
                } catch (err) {
                    reject(err);
                }
            }).catch((err) => {
                reject(err);
            });
        });
    },

    setGlobalAction: function(action) {
        return this.exec(`set-global-rule --rule ${action}`);
    },

    checkForUpdate: async function() {
        return fetch("https://api.github.com/repos/nathan-fiscaletti/keyboardsounds/releases/latest")
            .then(res => res.json())
            .then(release => {
                if (release.tag_name !== this.appVersion) {
                    return release
                }

                return null;
            })
            .catch(err => { console.log(err) });
    },

    importProfile: async function() {
        if (this.openFileDialogIsOpen) {
            return;
        }

        this.openFileDialogIsOpen = true;
        const res = await dialog.showOpenDialog(this.mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'Keyboard Sounds Profile', extensions: ['zip'] }
            ]
        });
        if (!res.canceled) {
            await this.exec(`add-profile --zip "${res.filePaths[0]}"`);
        }
        this.openFileDialogIsOpen = false;
        this.mainWindow.show();
        this.mainWindow.focus();
    },

    selectAudioFile: async function() {
        const res = await dialog.showOpenDialog(this.mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'Audio File', extensions: ['wav', 'mp3'] }
            ]
        });

        this.editorWindow.focus();
        if (!res.canceled) {
            return res.filePaths[0];
        }
        return "";
    },

    selectExecutableFile: async function() {
        if (this.openFileDialogIsOpen) {
            return;
        }

        this.openFileDialogIsOpen = true;
        const res = await dialog.showOpenDialog(this.mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'Executable', extensions: ['exe'] }
            ]
        });
        this.openFileDialogIsOpen = false;
        this.mainWindow.show();
        this.mainWindow.focus();
        if (!res.canceled) {
            return res.filePaths[0];
        }
        return "";
    },

    selectExportPath: async function(profileToExport) {
        if (this.openFileDialogIsOpen) {
            return;
        }

        this.openFileDialogIsOpen = true;
        const res = await dialog.showSaveDialog(this.mainWindow, {
            title: `Export Profile '${profileToExport}'`,
            defaultPath: `${profileToExport}.zip`,
            filters: [
                { name: 'Zip Archive', extensions: ['zip'] }
            ]
        });
        this.openFileDialogIsOpen = false;
        this.mainWindow.show();
        this.mainWindow.focus();
        if (!res.canceled) {
            return res.filePath
        }
        return "";
    },

    executeDaemonCommand: async function(command) {
        const status = await this.status();
        if (status.status !== 'running') {
            return Promise.reject('Keyboard Sounds is not running.');
        }

        const port = status.api_port;
        const socket = new Socket();
        socket.connect(port, 'localhost', () => {
            socket.write(Buffer.from(JSON.stringify(command)).toString('base64') + "\n");
            socket.destroy();
        });
    },

    getVolume: async function() {
        return Promise.resolve(store.get('volume', 75));
    },

    storeVolume: async function(volume) {
        store.set('volume', Number(volume));
    },

    setVolume: async function(volume) {
        return this.executeDaemonCommand({
            action: 'set_volume',
            volume: Number(volume)
        });
    },

    getProfile: async function() {
        return Promise.resolve(store.get('profile', ''));
    },

    storeProfile: async function(profile) {
        store.set('profile', profile);
    },

    setProfile: async function(profile) {
        return this.executeDaemonCommand({
            action: 'set_profile',
            profile: profile
        });
    },

    checkPythonInstallation: function () {
        return new Promise((resolve, reject) => {
            exec('python --version', (err, stdout, stderr) => {
                if (err) {
                    console.log(ErrPythonMissing, err);
                    reject(ErrPythonMissing);
                    return;
                }

                const output = stderr || stdout;

                if (!output.startsWith('Python')) {
                    console.log(ErrPythonVersionUnknown, output);
                    reject(ErrPythonVersionUnknown);
                    return;
                }

                if (!semver.satisfies(MinimumPythonVersion, '<=' + output.match(/Python (.*)/)[1])) {
                    console.log(ErrPythonVersionMismatch, output);
                    reject(ErrPythonVersionMismatch);
                    return;
                }

                // Check for keyboardsounds package
                exec('pip show keyboardsounds', (err, stdout, stderr) => {
                    if (err) {
                        console.log(ErrPythonPackageMissing, err);
                        reject(ErrPythonPackageMissing);
                        return;
                    }

                    if (!semver.satisfies(MinimumPythonPackageVersion, '<=' + stdout.match(/Version: (.*)/)[1])) {
                        console.log(ErrPythonPackageVersionMismatch, stdout);
                        reject(ErrPythonPackageVersionMismatch);
                        return;
                    }

                    resolve();
                });
            });
        });
    },

    installPythonPackage: function () {
        return new Promise((resolve, reject) => {
            exec('pip install --upgrade keyboardsounds', (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        });
    },

    checkInstallation: function () {
        return new Promise((resolve, reject) => {
            this.getBackendVersion().then(_ => {
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    },

    setMainWindow: function (mainWindow) {
        this.mainWindow = mainWindow;
    },

    setEditorWindowCreateHandler: function (handler) {
        this.editorWindowCreateHandler = handler;
    },

    showEditorWindow: function() {
        if (!this.editorWindow) {
            this.editorWindow = this.editorWindowCreateHandler();
            // Make links open in browser.
            this.editorWindow.webContents.setWindowOpenHandler(({ url }) => {
                shell.openExternal(url);
                return { action: 'deny' };
            });

            // When the window is closed, set this.editorWindow to null
            this.editorWindow.on('closed', () => {
                this.editorWindow = null;
            });
        }
        this.editorWindow.show();
        this.editorWindow.focus();
    },

    registerKbsIpcHandler: function (ipcMain, shouldNotify=()=>false) {
        // Listen for incoming IPC messages.
        ipcMain.on('kbs', async (event, data) => {
            console.log('ipcMain.on kbs');
            const { command, channelId } = data;

            const [commandName, ...commandArgs] = command.split(' ');

            // check if cmd is a member of this
            if (typeof this[commandName] === 'function') {
                try {
                    const result = await this[commandName](...commandArgs);
                    event.reply(`kbs_execute_result_${channelId}`, result);
                } catch (err) {
                    event.reply(`kbs_execute_result_${channelId}`, err);
                }
            } else if (commandName == "reset_last_known") {
                lastKnownStatus = null;
                lastKnownGlobalAction = null;
                lastKnownAppRules = null;
                lastKnownProfiles = null;
                lastKnownPerformNotify = null;
            } else {
                // attempt to execute the command directly
                this.exec(command).then((result) => {
                    event.reply(`kbs_execute_result_${channelId}`, result);
                }).catch((err) => {
                    event.reply(`kbs_execute_result_${channelId}`, err);
                });
            }
        });

       let lastKnownStatus = null;
       let lastKnownGlobalAction = null;
       let lastKnownAppRules = null;
       let lastKnownProfiles = null;
       let lastKnownPerformNotify = null;

        const notify = (key, val) => {
            console.log(`notify ${key} ${val}`);
            BrowserWindow.getAllWindows().forEach(window => {
                console.log(`window ${window.id}`);
                window.webContents.send(key, val);
            });
        };

        setInterval(() => {
            // Watch the status and notify the renderer process when it changes
            const performNotify = shouldNotify()
            if (lastKnownPerformNotify !== performNotify) {
                console.log('performNotify', performNotify);
                lastKnownPerformNotify = performNotify;
            }
            if (performNotify) {
                this.status().then((status) => {
                    const stringifiedStatus = JSON.stringify(status);
                    if (lastKnownStatus === null || stringifiedStatus !== lastKnownStatus) {
                        console.log('notifying status change');
                        notify('kbs-status', status);
                        // Update the last known status
                        lastKnownStatus = stringifiedStatus;
                    }
                }).catch((err) => {
                    console.error('Failed to fetch status:', err);
                });

                // Watch the app rules and notify the renderer process when they change
                this.getGlobalAction().then((action) => {
                    if (lastKnownGlobalAction === null || action !== lastKnownGlobalAction) {
                        console.log('notifying global action change');
                        notify('kbs-global-action', action);
                        // Update the last known global action
                        lastKnownGlobalAction = action;
                    }
                }).catch((err) => {
                    console.error('Failed to fetch global action:', err);
                });

                // Watch the rules and notify the renderer process when they change
                this.rules().then((rules) => {
                    const stringifiedRules = JSON.stringify(rules)
                    if (lastKnownAppRules === null || stringifiedRules !== lastKnownAppRules) {
                        console.log('notifying app rules change');
                        notify('kbs-app-rules', rules);
                        // Update the last known app rules
                        lastKnownAppRules = stringifiedRules;
                    }
                }).catch((err) => {
                    console.error('Failed to fetch app rules:', err);
                });

                // Watch the profiles and notify the renderer process when they change
                this.profiles().then((profiles) => {
                    const stringifiedProfiles = JSON.stringify(profiles);
                    if (lastKnownProfiles === null || stringifiedProfiles !== lastKnownProfiles) {
                        console.log('notifying profiles change');
                        notify('kbs-profiles', profiles);
                        // Update the last known profiles
                        lastKnownProfiles = stringifiedProfiles;
                    }
                }).catch((err) => {
                    console.error('Failed to fetch profiles:', err);
                });
            }
        }, 1000);
    },
}

export { 
    kbs,
    ErrPythonVersionUnknown,
    ErrPythonMissing,
    ErrPythonVersionMismatch,
    ErrPythonPackageMissing,
    ErrPythonPackageVersionMismatch,
    MinimumPythonVersion,
    MinimumPythonPackageVersion,
};