import { Socket } from "net";
import { app, BrowserWindow, shell, dialog, screen } from 'electron';
import { exec } from 'child_process';
import semver from 'semver';
import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { spawn } from 'child_process';
import fetch from 'node-fetch';
import Store from 'electron-store';
import crypto from 'crypto';
import Mixpanel from 'mixpanel';

const store = new Store();

const MinimumPythonVersion = '3.8.0';
const MinimumPythonPackageVersion = '6.0.4';

const ErrPythonVersionUnknown = 'Failed to parse python version';
const ErrPythonMissing = 'Python is not installed';
const ErrPythonVersionMismatch = 'Python Version 3.8 or higher is required';
const ErrPythonPackageMissing = 'KeyboardSounds package is not installed';
const ErrPythonPackageVersionMismatch = `KeyboardSounds python package version ${MinimumPythonPackageVersion} or higher is required.`;

const kbs = {
	mainWindow: null,
	editorWindowCreateHandler: null,
	editorWindow: null,
	openFileDialogIsOpen: false,
	appVersion: null, // this is filed in in main.js from package.json
	simulateProd: false,

	kbsCli: function (cmd, print=true) {
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

	setSimulateProd: function(val) {
		this.simulateProd = val;
	},

	getBackendVersion: function () {
		return this.kbsCli('--version');
	},

	openInBrowser: function () {
		return Promise.resolve(
			shell.openExternal("https://github.com/nathan-fiscaletti/keyboardsounds?ref=KeyboardSounds%20Application")
		);
	},

	status: function () {
		return new Promise((resolve, reject) => {
			this.kbsCli('status --short', false).then((stdout) => {
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
			this.kbsCli('list-profiles --short', false).then((stdout) => {
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

	profileNames: function() {
		return new Promise((resolve, reject) => {
			this.kbsCli('list-profiles --short', false).then((stdout) => {
				try {
					const profiles = JSON.parse(stdout);
					resolve(profiles.map(p => p.name));
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
			this.kbsCli('list-rules --short', false).then((stdout) => {
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
			this.kbsCli('get-global-rule --short', false).then((stdout) => {
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
		return this.kbsCli(`set-global-rule --rule ${action}`);
	},

		getSelfAppPath: function() {
			return Promise.resolve(app.getPath('exe'));
		},

		getSelfRulePath: async function() {
			let p = store.get('self_rule_path', '');
			if (p) { return p; }
			try {
				const rules = await this.rules();
				const exe = app.getPath('exe').toLowerCase();
				const exact = rules.find(r => (r.app_path || '').toLowerCase() === exe);
				if (exact) {
					store.set('self_rule_path', exact.app_path);
					return exact.app_path;
				}
				const fallback = rules.find(r => (r.app_path || '').toLowerCase().endsWith('keyboard sounds.exe'));
				if (fallback) {
					store.set('self_rule_path', fallback.app_path);
					return fallback.app_path;
				}
			} catch (e) {}
			return '';
		},

		setSelfAppRule: async function(mode) {
			try {
				let targetPath = store.get('self_rule_path', '');
				if (!targetPath) {
					try {
						targetPath = await this.getSelfRulePath();
					} catch (_) {}
					if (!targetPath) {
						targetPath = app.getPath('exe');
					}
				}

				if (mode === 'default') {
					try { await this.kbsCli(`remove-rule --app "${targetPath}"`); } catch (_) {}
					store.set('self_rule_path', targetPath);
					return true;
				}

				const rule = mode === 'always' ? 'enable' : 'disable';
				await this.kbsCli(`add-rule --app "${targetPath}" --rule ${rule}`);
				store.set('self_rule_path', targetPath);
				return true;
			} catch (err) {
				console.log('Failed to set self application rule:', err);
				return false;
			}
		},

	ensureSelfAppRule: async function() {
		console.log('Ensuring self application rule is added...');
		const alreadyAdded = store.get('self_rule_added', false);
		if (alreadyAdded) {
			return;
		}

		try {
			const exePath = app.getPath('exe');
			await this.kbsCli(`add-rule --app "${exePath}" --rule enable`);
			store.set('self_rule_added', true);
			store.set('self_rule_path', exePath);
			console.log('Added self application rule and persisted flag.');
		} catch (err) {
			console.log('Failed to add self application rule:', err);
		}
	},

	checkForUpdate: async function() {
		return fetch("https://api.github.com/repos/nathan-fiscaletti/keyboardsounds/releases/latest")
			.then(res => res.json())
			.then(release => {
				if (release.tag_name !== this.appVersion) {
					// Don't count an update as new until it's assets are available.
					const asset = release.assets.find(
						asset => asset.name.includes('Keyboard-Sounds-Setup-windows-x64.exe')
					)

					if (asset === undefined) {
						return null;
					}

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
			await this.kbsCli(`add-profile --zip "${res.filePaths[0]}"`);
		}
		this.openFileDialogIsOpen = false;
		this.mainWindow.show();
		this.mainWindow.focus();
	},

	selectAudioFile: async function() {
		if (this.openFileDialogIsOpen) {
			return "";
		}

		this.openFileDialogIsOpen = true;
		const res = await dialog.showOpenDialog(this.mainWindow, {
			properties: ['openFile'],
			filters: [
				{ name: 'Audio File', extensions: ['wav', 'mp3'] }
			]
		});
		this.openFileDialogIsOpen = false;
		
		// Focus the appropriate window if available
		try {
			if (this.editorWindow) {
				this.editorWindow.focus();
			} else if (this.mainWindow) {
				this.mainWindow.show();
				this.mainWindow.focus();
			}
		} catch (e) {}
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

	getNotifyOnLaunch: async function() {
		return Promise.resolve(store.get('notify_on_launch', true));
	},

	storeNotifyOnLaunch: async function(value) {
		store.set('notify_on_launch', value === 'true');
	},

	getNotifyOnHide: async function() {
		return Promise.resolve(store.get('notify_on_hide', false));
	},

	storeNotifyOnHide: async function(value) {
		store.set('notify_on_hide', value === 'true');
	},

	getNotifyOnUpdate: async function() {
		return Promise.resolve(store.get('notify_on_update', true));
	},

	storeNotifyOnUpdate: async function(value) {
		store.set('notify_on_update', value === 'true');
	},

	storeRunOnStartUp: async function(value) {
		const runOnStartup = value === 'true';

		app.setLoginItemSettings({
			openAtLogin: runOnStartup,
			path: app.getPath('exe'),
		});

		store.set('run_on_startup', runOnStartup);
	},

	getRunOnStartUp: async function() {
		return Promise.resolve(store.get('run_on_startup', false));
	},

	storeEnableDaemonWindow: async function(value) {
		const enableDaemonWindow = value === 'true';
		store.set('enable_daemon_window', enableDaemonWindow);
	},

	getEnableDaemonWindow: async function() {
		return Promise.resolve(store.get('enable_daemon_window', false));
	},

	storeStartSoundDaemonOnStartUp: async function(value) {
		const runSoundsOnStartUp = value === 'true';
		store.set('start_sound_daemon_on_start_up', runSoundsOnStartUp);
	},

	getStartSoundDaemonOnStartUp: async function() {
		return Promise.resolve(store.get('start_sound_daemon_on_start_up', false));
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

	// Mouse profile persistence (no live set command yet)
	getMouseProfile: async function() {
		return Promise.resolve(store.get('mouse_profile', ''));
	},

	storeMouseProfile: async function(profile) {
		store.set('mouse_profile', profile);
	},

	setMouseProfile: async function(profile) {
		return this.executeDaemonCommand({
			action: 'set_mouse_profile',
			profile: profile
		});
	},

	showDaemonWindow: async function(profile) {
		return this.executeDaemonCommand({
			action: 'show_daemon_window',
		})
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

	downloadUpdate: async function() {
		const download = async (url, dest) => {
		  const res = await fetch(url);
		  if (!res.ok) throw new Error(`download failed: ${res.status}`);
		  const fileStream = fs.createWriteStream(dest);
		  await new Promise((resolve, reject) => {
			res.body.pipe(fileStream);
			res.body.on('error', reject);
			fileStream.on('finish', resolve);
		  });
		};

		const update = await this.checkForUpdate();

		if (update.tag_name === this.appVersion) {
			return;
		}

		const asset = update.assets.find(
			asset => asset.name.includes('Keyboard-Sounds-Setup-windows-x64.exe')
		)

		if (asset === undefined) {
			return;
		}

		const downloadUrl = asset.browser_download_url;
		const filePath = path.join(app.getPath('temp'), 'Keyboard-Sounds-Setup-windows-x64.exe');

		// Download the file
		try {
			await download(downloadUrl, filePath);
			spawn(filePath, [], {
				detached: true,
				stdio: 'ignore'
			}).unref();  
			process.exit(0);
		} catch (err) {
			console.log(err);
		}
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

	getState: function() {
		return new Promise((resolve, reject) => {
			this.kbsCli('state', false).then((stdout) => {
				try {
					const state = JSON.parse(stdout);
					resolve(state);
				} catch (err) {
					reject(err);
				}
			}).catch((err) => {
				reject(err);
			});
		});
	},

	getAnalyticsId: async function() {
		let id = store.get('analytics_id', '');
		if (!id) {
			try {
				id = crypto.randomUUID();
			} catch (e) {
				id = Math.random().toString(36).slice(2) + Date.now().toString(36);
			}
			store.set('analytics_id', id);
		}
		return Promise.resolve(id);
	},

	startContainerAnalytics: async function() {
		if (process.env.NODE_ENV === 'development') {
			console.log('disabling analytics (NODE_ENV = development)');
			return true;
		}

		try {
			const token = 'c725f7b4b7fc4d10c58bccf154e6fc31';
			console.log('analytics token', token);
			const mixpanel = Mixpanel.init(token, { debug: true, protocol: 'https', persistence: 'localStorage' });
			const distinctId = await this.getAnalyticsId();
			console.log('analytics distinctId', distinctId);
			console.log('app version', this.appVersion);
			const track = () => mixpanel.track('Application Ping', { distinct_id: distinctId, app_version: this.appVersion });
			track();
			setInterval(track, 24 * 60 * 60 * 1000);
			return true;
		} catch (e) {
			console.log('startContainerAnalytics error', e);
			return false;
		}
	},

	setHeight: function(newHeight) {
		if (process.env.NODE_ENV !== 'development' || this.simulateProd) {
			const { width, height } = screen.getPrimaryDisplay().workAreaSize;

			this.mainWindow.setResizable(true);

			let newHeightNum = 800;
			try {
				newHeightNum = Number(newHeight);
			} catch (e) {}

			animateBounds(this.mainWindow, {
				x: width  - 510,
				y: height - newHeightNum - 10,
				width:  500,
				height: newHeightNum
			});

			this.mainWindow.setResizable(false);
		}
	},

	registerKbsIpcHandler: function (ipcMain, shouldNotify=()=>false) {
		// Listen for incoming IPC messages.
		ipcMain.on('kbs', async (event, data) => {
			const { command, channelId } = data;
			const [commandName, ...commandArgs] = command.split(' ');

			// check if cmd is a member of this
			if (typeof this[commandName] === 'function') {
				console.log(`ipcMain.on(kbs) kbs[channel:${channelId}] (container) ${command}`);
				try {
					const result = await this[commandName](...commandArgs);
					event.reply(`kbs_execute_result_${channelId}`, result);
				} catch (err) {
					console.log(`error running command: ${err}`);
					event.reply(`kbs_execute_result_${channelId}`, err);
				}
			} else if (commandName == "reset_last_known") {
				lastKnownStatus = null;
				lastKnownGlobalAction = null;
				lastKnownAppRules = null;
				lastKnownProfilesKeyboard = null;
				lastKnownProfilesMouse = null;
				lastKnownPerformNotify = null;
			} else {
				console.log(`ipcMain.on kbs[${channelId}] ${command} (cli)`);
				this.kbsCli(command).then((result) => {
					event.reply(`kbs_execute_result_${channelId}`, result);
				}).catch((err) => {
					console.log(`error running command: ${err}`);
					event.reply(`kbs_execute_result_${channelId}`, err);
				});
			}
		});

	   let lastKnownStatus = null;
	   let lastKnownGlobalAction = null;
	   let lastKnownAppRules = null;
	   let lastKnownProfilesKeyboard = null;
	   let lastKnownProfilesMouse = null;
	   let lastKnownPerformNotify = null;

		const notify = (key, val) => {
			console.log(`notify ${key} ${JSON.stringify(val)}`);
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
				this.getState().then(state => {
					const status = state.status;
					const stringifiedStatus = JSON.stringify(status);
					if (lastKnownStatus === null || stringifiedStatus !== lastKnownStatus) {
						console.log('notifying status change');
						notify('kbs-status', status);
						// Update the last known status
						lastKnownStatus = stringifiedStatus;
					}

					const action = state.global_action;
					if (lastKnownGlobalAction === null || action !== lastKnownGlobalAction) {
						console.log('notifying global action change');
						notify('kbs-global-action', action);
						// Update the last known global action
						lastKnownGlobalAction = action;
					}

					const rules = state.rules;
					const stringifiedRules = JSON.stringify(rules)
					if (lastKnownAppRules === null || stringifiedRules !== lastKnownAppRules) {
						console.log('notifying app rules change');
						notify('kbs-app-rules', rules);
						// Update the last known app rules
						lastKnownAppRules = stringifiedRules;
					}

					// Fetch keyboard and mouse profiles separately
					Promise.all([
						this.kbsCli('list-profiles -t keyboard --short', false),
						this.kbsCli('list-profiles -t mouse --short', false),
					]).then(([kbStdout, mouseStdout]) => {
						let kbProfiles = [];
						let mouseProfiles = [];
						try { kbProfiles = JSON.parse(kbStdout); } catch (e) { kbProfiles = []; }
						try { mouseProfiles = JSON.parse(mouseStdout); } catch (e) { mouseProfiles = []; }
						const sKb = JSON.stringify(kbProfiles);
						const sMouse = JSON.stringify(mouseProfiles);
						if (lastKnownProfilesKeyboard === null || sKb !== lastKnownProfilesKeyboard) {
							console.log('notifying keyboard profiles change');
							notify('kbs-profiles-keyboard', kbProfiles);
							lastKnownProfilesKeyboard = sKb;
						}
						if (lastKnownProfilesMouse === null || sMouse !== lastKnownProfilesMouse) {
							console.log('notifying mouse profiles change');
							notify('kbs-profiles-mouse', mouseProfiles);
							lastKnownProfilesMouse = sMouse;
						}
					}).catch(err => {
						console.error('Failed to fetch profiles:', err);
					});
				}).catch(err => {
					console.error('Failed to fetch state:', err);
				});
			}
		}, 1000);
	},

	finalizeProfileEdit: async function(resJsonBase64) {
		const buildData = JSON.parse(Buffer.from(resJsonBase64, 'base64').toString());

		// buildData.profileYaml = the object representing the profile.yaml
		// buildData.sources = array of source file paths

		// create temporary directory
		const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'kbs-editor-'));
		// write the profile.yaml file to it
		console.log(`writing profile.yaml to ${tmpdir}`);
		fs.writeFileSync(path.join(tmpdir, 'profile.yaml'), yaml.dump(buildData.profileYaml));
		// copy each of the source files to the temporary directory
		buildData.sources.forEach(source => {
			console.log(`copying ${source} to ${tmpdir}`);
			fs.copyFileSync(source, path.join(tmpdir, path.basename(source)));
		});
		// build the profile
		const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kbs-editor-output-'));
		console.log(`using output dir ${outputDir}`);
		try {
			console.log(`running bp -d "${tmpdir}" -o "${path.join(outputDir, `${buildData.profileYaml.profile.name}.zip`)}"`);
			await this.kbsCli(`bp -d "${tmpdir}" -o "${path.join(outputDir, `${buildData.profileYaml.profile.name}.zip`)}"`, true);
		} catch (err) {
			console.error('Failed to build profile:', err);
			return;
		}
		// import the profile into keyboard sounds
		try {
			console.log(`running ap -z "${path.join(outputDir, `${buildData.profileYaml.profile.name}.zip`)}"`);
			await this.kbsCli(`ap -z "${path.join(outputDir, `${buildData.profileYaml.profile.name}.zip`)}"`, true);
		} catch (err) {
			console.error('Failed to import profile:', err);
			return;
		}

		// clean up the temporary directory
		console.log('cleaning up temporary directories');
		fs.rmSync(tmpdir, { recursive: true, force: true });
		fs.rmSync(outputDir, { recursive: true, force: true });

		// notify the editor window that the profile has been imported
		return true;
	},
}

/**
 * Smoothly animates a BrowserWindow’s bounds.
 * @param {BrowserWindow} win   – the window to move/resize
 * @param {Object} target       – { x, y, width, height }
 * @param {number} duration     – milliseconds (default 250 ms)
 * @param {(t:number)=>number} ease – easing fn, t ∈ [0,1] (default easeInOutQuad)
 */
function animateBounds(
	win,
	{ x: x1, y: y1, width: w1, height: h1 },
	duration = 250,
	ease = t => t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2 // easeInOutQuad
) {
	const start   = performance.now();
	const { x, y, width, height } = win.getBounds();
  
	// preprocess deltas so we don’t allocate every frame
	const dx = x1 - x,  dy = y1 - y,  dw = w1 - width,  dh = h1 - height;
  
	(function step(now) {
	  const t = Math.min(1, (now - start) / duration);
	  const k = ease(t);
  
	  win.setBounds({
		x: Math.round(x + dx * k),
		y: Math.round(y + dy * k),
		width:  Math.round(width  + dw * k),
		height: Math.round(height + dh * k)
	  });
  
	  if (t < 1) setImmediate(() => step(performance.now()));
	})(start);
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