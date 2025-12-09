import { Socket } from "net";
import { app, BrowserWindow, shell, dialog, screen } from 'electron';
import { exec } from 'child_process';
import semver from 'semver';
import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { spawn, spawnSync } from 'child_process';
import fetch from 'node-fetch';
import Store from 'electron-store';
import crypto from 'crypto';
import Mixpanel from 'mixpanel';

const store = new Store();

const kbs = {
	mainWindow: null,
	editorWindowCreateHandler: null,
	editorWindow: null,
	initializeSystemTrayHandler: null,
	openFileDialogIsOpen: false,
	appVersion: null, // this is filed in in main.js from package.json
	simulateProd: false,
	
	// Socket connection management
	_cachedPort: null,
	_cachedLockFilePath: null,
	_requestIdCounter: 0,

	// Validates that a port is a valid number within acceptable range
	validatePort: function(port) {
		if (port === null || port === undefined) {
			return false;
		}
		const portNum = Number(port);
		if (isNaN(portNum) || !isFinite(portNum)) {
			return false;
		}
		// Valid port range: 1-65535
		if (portNum < 1 || portNum > 65535) {
			return false;
		}
		return true;
	},

	// Resolves the lock file path (matches backend logic)
	resolveLockFilePath: function() {
		const homeDir = os.homedir();
		const isWindows = process.platform === 'win32';
		const rootDir = isWindows 
			? path.join(homeDir, 'keyboardsounds')
			: path.join(homeDir, '.keyboardsounds');
		return path.join(rootDir, '.lock');
	},

	// Reads the lock file directly (no CLI call)
	readLockFile: function() {
		try {
			const lockFilePath = this.resolveLockFilePath();
			this._cachedLockFilePath = lockFilePath;
			console.log('[SocketAPI] Reading lock file:', lockFilePath);
			if (!fs.existsSync(lockFilePath)) {
				console.log('[SocketAPI] Lock file does not exist - daemon not running');
				// Clear cached port if lock file doesn't exist
				if (this._cachedPort !== null) {
					this._cachedPort = null;
					console.log('[SocketAPI] Cleared cached port - lock file removed');
				}
				return null;
			}
			const data = fs.readFileSync(lockFilePath, 'utf8');
			const lockData = JSON.parse(data);
			if (lockData.api_port) {
				// Validate port before caching
				if (this.validatePort(lockData.api_port)) {
					const portChanged = this._cachedPort !== lockData.api_port;
					this._cachedPort = lockData.api_port;
					if (portChanged) {
						console.log('[SocketAPI] Port cached/updated:', lockData.api_port);
					}
				} else {
					console.log('[SocketAPI] Lock file contains invalid port:', lockData.api_port);
					// Clear cached port if new port is invalid
					if (this._cachedPort === lockData.api_port) {
						this._cachedPort = null;
						console.log('[SocketAPI] Cleared cached port due to invalid port in lock file');
					}
					// Don't cache invalid port, but still return lockData for other fields
				}
			} else {
				console.log('[SocketAPI] Lock file exists but no API port found');
				// Clear cached port if lock file has no port
				if (this._cachedPort !== null) {
					this._cachedPort = null;
					console.log('[SocketAPI] Cleared cached port - lock file has no port');
				}
			}
			return lockData;
		} catch (err) {
			console.log('[SocketAPI] Failed to read lock file:', err);
			// Clear cached port if lock file read failed
			if (this._cachedPort !== null) {
				this._cachedPort = null;
				console.log('[SocketAPI] Cleared cached port - lock file read failed');
			}
			return null;
		}
	},

	// Checks if daemon is running by attempting socket connection
	checkDaemonRunning: function(port) {
		return new Promise((resolve) => {
			// Validate port before attempting connection
			if (!this.validatePort(port)) {
				console.log(`[SocketAPI] Invalid port for daemon check: ${port}`);
				// Clear cached port if it matches the invalid port
				if (this._cachedPort === port) {
					this._cachedPort = null;
					console.log(`[SocketAPI] Cleared cached port due to invalid port`);
				}
				resolve(false);
				return;
			}

			console.log(`[SocketAPI] Checking if daemon is running on port ${port}...`);
			let socket = null;
			let resolved = false;
			
			try {
				socket = new Socket();
				socket.setTimeout(200);
				
				socket.once('connect', () => {
					try {
						if (!resolved) {
							resolved = true;
							console.log(`[SocketAPI] Daemon is running - socket connection successful on port ${port}`);
							socket.destroy();
							resolve(true);
						}
					} catch (err) {
						console.log(`[SocketAPI] Error in connect handler:`, err);
						if (!resolved) {
							resolved = true;
							resolve(false);
						}
					}
				});
				
				socket.once('error', (err) => {
					try {
						if (!resolved) {
							resolved = true;
							console.log(`[SocketAPI] Daemon check failed - socket connection error on port ${port}:`, err.message);
							// Clear cached port if connection failed (stale lock file)
							if (this._cachedPort === port) {
								this._cachedPort = null;
								console.log(`[SocketAPI] Cleared cached port due to connection failure (stale lock file?)`);
							}
							resolve(false);
						}
					} catch (handlerErr) {
						console.log(`[SocketAPI] Error in error handler:`, handlerErr);
						if (!resolved) {
							resolved = true;
							resolve(false);
						}
					}
				});
				
				socket.once('timeout', () => {
					try {
						if (!resolved) {
							resolved = true;
							console.log(`[SocketAPI] Daemon check timeout - socket connection timed out on port ${port}`);
							// Clear cached port if connection timed out (stale lock file)
							if (this._cachedPort === port) {
								this._cachedPort = null;
								console.log(`[SocketAPI] Cleared cached port due to connection timeout (stale lock file?)`);
							}
							socket.destroy();
							resolve(false);
						}
					} catch (err) {
						console.log(`[SocketAPI] Error in timeout handler:`, err);
						if (!resolved) {
							resolved = true;
							resolve(false);
						}
					}
				});
				
				socket.connect(port, 'localhost');
			} catch (err) {
				console.log(`[SocketAPI] Failed to create socket or connect:`, err);
				if (!resolved) {
					resolved = true;
					// Clear cached port if socket creation failed
					if (this._cachedPort === port) {
						this._cachedPort = null;
						console.log(`[SocketAPI] Cleared cached port due to socket creation failure`);
					}
					if (socket) {
						try {
							socket.destroy();
						} catch (destroyErr) {
							// Ignore destroy errors
						}
					}
					resolve(false);
				}
			}
		});
	},

	// Sends a request via socket API and waits for response
	socketRequest: function(port, command) {
		return new Promise((resolve, reject) => {
			// Validate port before attempting connection
			if (!this.validatePort(port)) {
				console.log(`[SocketAPI] Invalid port for socket request: ${port}`);
				reject(new Error(`Invalid port: ${port}`));
				return;
			}

			const requestId = ++this._requestIdCounter;
			const request = {
				id: requestId,
				...command
			};

			console.log(`[SocketAPI] Sending request #${requestId} via socket (port ${port}):`, command.action);

			let socket = null;
			let responseData = '';
			let resolved = false;

			try {
				socket = new Socket();
				socket.setTimeout(5000); // 5 second timeout

				socket.on('data', (data) => {
					try {
						responseData += data.toString();
						const lines = responseData.split('\n');
						if (lines.length > 1) {
							// We got a complete response
							const responseLine = lines[0];
							try {
								const decoded = Buffer.from(responseLine, 'base64').toString('utf-8');
								const response = JSON.parse(decoded);
								if (response.id === requestId) {
									if (!resolved) {
										resolved = true;
										socket.destroy();
										if (response.error) {
											console.log(`[SocketAPI] Request #${requestId} returned error:`, response.error);
											reject(new Error(response.error));
										} else {
											console.log(`[SocketAPI] Request #${requestId} completed successfully`);
											resolve(response.result);
										}
									}
								}
							} catch (err) {
								if (!resolved) {
									resolved = true;
									socket.destroy();
									console.log(`[SocketAPI] Request #${requestId} failed to parse response:`, err);
									reject(err);
								}
							}
						}
					} catch (err) {
						console.log(`[SocketAPI] Error in data handler:`, err);
						if (!resolved) {
							resolved = true;
							socket.destroy();
							reject(err);
						}
					}
				});

				socket.on('error', (err) => {
					try {
						if (!resolved) {
							resolved = true;
							socket.destroy();
							console.log(`[SocketAPI] Request #${requestId} socket error:`, err.message);
							// Clear cached port if connection failed (stale lock file)
							if (this._cachedPort === port) {
								this._cachedPort = null;
								console.log(`[SocketAPI] Cleared cached port due to socket error (stale lock file?)`);
							}
							reject(err);
						}
					} catch (handlerErr) {
						console.log(`[SocketAPI] Error in error handler:`, handlerErr);
						if (!resolved) {
							resolved = true;
							reject(handlerErr);
						}
					}
				});

				socket.on('timeout', () => {
					try {
						if (!resolved) {
							resolved = true;
							socket.destroy();
							console.log(`[SocketAPI] Request #${requestId} timed out after 5 seconds`);
							// Clear cached port if connection timed out (stale lock file)
							if (this._cachedPort === port) {
								this._cachedPort = null;
								console.log(`[SocketAPI] Cleared cached port due to timeout (stale lock file?)`);
							}
							reject(new Error('Socket request timeout'));
						}
					} catch (err) {
						console.log(`[SocketAPI] Error in timeout handler:`, err);
						if (!resolved) {
							resolved = true;
							reject(new Error('Socket request timeout'));
						}
					}
				});

				socket.on('connect', () => {
					try {
						console.log(`[SocketAPI] Request #${requestId} socket connected, sending request...`);
						const requestJson = JSON.stringify(request);
						const requestB64 = Buffer.from(requestJson).toString('base64');
						socket.write(requestB64 + '\n');
					} catch (err) {
						console.log(`[SocketAPI] Error in connect handler:`, err);
						if (!resolved) {
							resolved = true;
							socket.destroy();
							reject(err);
						}
					}
				});

				socket.connect(port, 'localhost');
			} catch (err) {
				console.log(`[SocketAPI] Failed to create socket or connect:`, err);
				if (!resolved) {
					resolved = true;
					// Clear cached port if socket creation failed
					if (this._cachedPort === port) {
						this._cachedPort = null;
						console.log(`[SocketAPI] Cleared cached port due to socket creation failure`);
					}
					if (socket) {
						try {
							socket.destroy();
						} catch (destroyErr) {
							// Ignore destroy errors
						}
					}
					reject(err);
				}
			}
		});
	},

	// Resolves and caches the absolute path to the kbs executable
	resolveKbsPath: function() {
		const isDev = process.env.NODE_ENV === 'development';
		const runtimePath = isDev 
			? path.join(process.cwd(), '.runtime')
			: path.join(process.resourcesPath, '.runtime');

		const appName = process.platform === 'win32' ? 'kbs.exe' : 'kbs';

		return Promise.resolve(path.join(runtimePath, appName));
	},

	kbsCli: function (cmd, print=true) {
		return new Promise((resolve, reject) => {
			this.resolveKbsPath().then(kbsPath => {
				if (print) {
					console.log(`executing: "${kbsPath}" ${cmd}`);
				}
				exec(`"${kbsPath}" ${cmd}`, (err, stdout, stderr) => {
					if (err) {
						reject(err);
						return;
					}
					resolve((stdout || '').toString());
				});
			}).catch(reject);
		});
	},

	isLinux: function() {
		return Promise.resolve(`${process.platform !== 'win32'}`);
	},

	setSimulateProd: function(val) {
		this.simulateProd = val;
	},

	getBackendVersion: function () {
		return new Promise((resolve, reject) => {
			this.resolveKbsPath().then(kbsPath => {
				exec(`"${kbsPath}" --version`, (err, stdout, stderr) => {
					if (err) {
						return reject(err);
					}
					resolve(String(stdout || '').trim());
				});
			}).catch(reject);
		});
	},

	openInBrowser: function () {
		return Promise.resolve(
			shell.openExternal("https://github.com/nathan-fiscaletti/keyboardsounds?ref=KeyboardSounds%20Application")
		);
	},

	openReleaseInBrowser: function(release) {
		return Promise.resolve(
			shell.openExternal(release.html_url)
		);
	},

	status: function () {
		return new Promise(async (resolve, reject) => {
			console.log('[Status] Checking daemon status...');
			// Try to read lock file first (fast, no process)
			const lockData = this.readLockFile();
			
			if (!lockData || !lockData.api_port) {
				// Daemon not running - return "not running" status via CLI
				// This is less frequent, so CLI is acceptable
				console.log('[Status] Daemon not running - using CLI fallback');
				this.kbsCli('status --short', false).then((stdout) => {
					try {
						const status = JSON.parse(stdout);
						console.log('[Status] CLI status retrieved successfully');
						resolve(status);
					} catch (err) {
						console.log('[Status] Failed to parse CLI status:', err);
						reject(err);
					}
				}).catch((err) => {
					console.log('[Status] CLI status command failed:', err);
					reject(err);
				});
				return;
			}

			// Check if daemon is actually running by testing socket connection
			const isRunning = await this.checkDaemonRunning(lockData.api_port);
			
			if (!isRunning) {
				// Daemon died - fall back to CLI
				console.log('[Status] Daemon check failed - using CLI fallback');
				this.kbsCli('status --short', false).then((stdout) => {
					try {
						const status = JSON.parse(stdout);
						// Clear cached port since daemon is not running
						this._cachedPort = null;
						console.log('[Status] CLI status retrieved (daemon not running)');
						resolve(status);
					} catch (err) {
						console.log('[Status] Failed to parse CLI status:', err);
						reject(err);
					}
				}).catch((err) => {
					console.log('[Status] CLI status command failed:', err);
					reject(err);
				});
				return;
			}

			// Daemon is running - use socket API (fast, no process)
			console.log('[Status] Daemon is running - using socket API');
			try {
				const status = await this.socketRequest(lockData.api_port, {
					action: 'get_status'
				});
				console.log('[Status] Socket API status retrieved successfully');
				resolve(status);
			} catch (err) {
				// Socket request failed - fall back to CLI
				console.log('[Status] Socket request failed, falling back to CLI:', err.message);
				// Clear cached port since socket connection failed (stale lock file)
				if (this._cachedPort === lockData.api_port) {
					this._cachedPort = null;
					console.log('[Status] Cleared cached port due to socket request failure (stale lock file?)');
				}
				this.kbsCli('status --short', false).then((stdout) => {
					try {
						const status = JSON.parse(stdout);
						console.log('[Status] CLI status retrieved after socket failure');
						resolve(status);
					} catch (parseErr) {
						console.log('[Status] Failed to parse CLI status:', parseErr);
						reject(parseErr);
					}
				}).catch((cliErr) => {
					console.log('[Status] CLI status command failed:', cliErr);
					reject(cliErr);
				});
			}
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

	selectDirectory: async function() {
		if (this.openFileDialogIsOpen) {
			return "";
		}

		this.openFileDialogIsOpen = true;
		const res = await dialog.showOpenDialog(this.mainWindow, {
			properties: ['openDirectory']
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

	listAudioFilesInB64: async function(dirB64) {
		try {
			const dir = Buffer.from(dirB64, 'base64').toString();
			const entries = fs.readdirSync(dir, { withFileTypes: true });
			const allowed = new Set(['.wav', '.mp3']);
			const files = entries
				.filter(e => e.isFile())
				.map(e => e.name)
				.filter(name => allowed.has((path.extname(name) || '').toLowerCase()));
			return files;
		} catch (e) {
			console.log('listAudioFilesInB64 error', e);
			return [];
		}
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
		try {
			console.log('[ExecuteDaemonCommand] Executing command:', command.action || command);
			// Try to get port from cached lock file first (fast)
			let port = this._cachedPort;
			
			if (!port) {
				console.log('[ExecuteDaemonCommand] Port not cached, fetching status...');
				// Fall back to status check
				const status = await this.status();
				if (status.status !== 'running') {
					console.log('[ExecuteDaemonCommand] Daemon not running, command rejected');
					return Promise.reject('Keyboard Sounds is not running.');
				}
				port = status.api_port;
				if (port) {
					this._cachedPort = port;
					console.log('[ExecuteDaemonCommand] Port cached from status:', port);
				}
			} else {
				console.log('[ExecuteDaemonCommand] Using cached port:', port);
			}
			
			// Validate port before attempting connection
			if (!this.validatePort(port)) {
				console.log('[ExecuteDaemonCommand] Invalid port:', port);
				return Promise.reject('Invalid API port.');
			}

			// Use fire-and-forget socket command (no response expected)
			console.log('[ExecuteDaemonCommand] Sending fire-and-forget command via socket (port', port + ')');
			let socket = null;
			
			try {
				socket = new Socket();
				let commandSent = false;
				
				socket.on('connect', () => {
					try {
						console.log('[ExecuteDaemonCommand] Socket connected, sending command...');
						if (!commandSent) {
							commandSent = true;
							const commandJson = JSON.stringify(command);
							const commandB64 = Buffer.from(commandJson).toString('base64');
							socket.write(commandB64 + "\n");
							socket.destroy();
							console.log('[ExecuteDaemonCommand] Command sent, socket closed');
						}
					} catch (err) {
						console.log('[ExecuteDaemonCommand] Error in connect handler:', err);
						if (socket) {
							try {
								socket.destroy();
							} catch (destroyErr) {
								// Ignore destroy errors
							}
						}
					}
				});
				
				socket.on('error', (err) => {
					try {
						console.log('[ExecuteDaemonCommand] Socket error:', err.message);
						// Clear cached port if connection failed (stale lock file)
						if (this._cachedPort === port) {
							this._cachedPort = null;
							console.log('[ExecuteDaemonCommand] Cleared cached port due to socket error (stale lock file?)');
						}
						if (socket) {
							try {
								socket.destroy();
							} catch (destroyErr) {
								// Ignore destroy errors
							}
						}
					} catch (handlerErr) {
						console.log('[ExecuteDaemonCommand] Error in error handler:', handlerErr);
					}
				});
				
				socket.on('timeout', () => {
					try {
						console.log('[ExecuteDaemonCommand] Socket timeout');
						// Clear cached port if connection timed out (stale lock file)
						if (this._cachedPort === port) {
							this._cachedPort = null;
							console.log('[ExecuteDaemonCommand] Cleared cached port due to timeout (stale lock file?)');
						}
						if (socket) {
							try {
								socket.destroy();
							} catch (destroyErr) {
								// Ignore destroy errors
							}
						}
					} catch (err) {
						console.log('[ExecuteDaemonCommand] Error in timeout handler:', err);
					}
				});
				
				socket.setTimeout(5000); // 5 second timeout
				socket.connect(port, 'localhost');
			} catch (err) {
				console.log('[ExecuteDaemonCommand] Failed to create socket or connect:', err);
				// Clear cached port if socket creation failed
				if (this._cachedPort === port) {
					this._cachedPort = null;
					console.log('[ExecuteDaemonCommand] Cleared cached port due to socket creation failure');
				}
				if (socket) {
					try {
						socket.destroy();
					} catch (destroyErr) {
						// Ignore destroy errors
					}
				}
				// Don't reject for fire-and-forget commands, just log the error
			}
		} catch (err) {
			console.log('[ExecuteDaemonCommand] Unexpected error:', err);
			// Don't throw uncaught exceptions for fire-and-forget commands
		}
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

	// Pitch Shift persistence
	getPitchShiftEnabled: async function() {
		return Promise.resolve(store.get('pitch_shift_enabled', false));
	},

	getPitchShiftLower: async function() {
		return Promise.resolve(store.get('pitch_shift_lower', -2));
	},

	getPitchShiftUpper: async function() {
		return Promise.resolve(store.get('pitch_shift_upper', 2));
	},

	getPitchShiftProfile: async function() {
		return Promise.resolve(store.get('pitch_shift_profile', 'both'));
	},

	storePitchShiftEnabled: async function(value) {
		store.set('pitch_shift_enabled', value === 'true');
	},

	storePitchShiftRange: async function(lower, upper) {
		try {
			store.set('pitch_shift_lower', Number(lower));
			store.set('pitch_shift_upper', Number(upper));
		} catch (e) {}
	},

	storePitchShiftProfile: async function(profile) {
		const allowed = new Set(['keyboard', 'mouse', 'both']);
		if (!allowed.has(String(profile))) return;
		store.set('pitch_shift_profile', String(profile));
	},

	setVolume: async function(volume) {
		return this.executeDaemonCommand({
			action: 'set_volume',
			volume: Number(volume)
		});
	},

	// Pitch Shift live control (ExternalAPI)
	setPitchShiftRange: async function(lower, upper, profile) {
		const cmd = {
			action: 'set_pitch_shift',
			semitones: `${Number(lower)},${Number(upper)}`,
		};
		if (profile) {
			cmd.profile = String(profile);
		}
		return this.executeDaemonCommand(cmd);
	},

	setPitchShiftProfile: async function(profile) {
		// When changing profile live, include the current semitone range
		const status = await this.status();
		if (status.status !== 'running') {
			return Promise.reject('Keyboard Sounds is not running.');
		}
		const st = status.semitones;
		if (!st) {
			return Promise.reject('Pitch shift is not enabled.');
		}
		let lower = null, upper = null;
		try {
			const parts = String(st).includes(':') ? String(st).split(':') : String(st).split(',');
			if (parts.length === 2) {
				lower = Number(parts[0]);
				upper = Number(parts[1]);
			}
		} catch (e) {}
		if (lower === null || upper === null || Number.isNaN(lower) || Number.isNaN(upper)) {
			return Promise.reject('Invalid semitone range.');
		}
		return this.setPitchShiftRange(lower, upper, profile);
	},

	disablePitchShift: async function() {
		return this.executeDaemonCommand({
			action: 'set_pitch_shift'
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


	setMainWindow: function (mainWindow) {
		this.mainWindow = mainWindow;
	},

	setEditorWindowCreateHandler: function (handler) {
		this.editorWindowCreateHandler = handler;
	},

	setInitializeSystemTrayHandler: function (handler) {
		this.initializeSystemTrayHandler = handler;
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
		return new Promise(async (resolve, reject) => {
			console.log('[GetState] Fetching daemon state...');
			// Try to read lock file first (fast, no process)
			const lockData = this.readLockFile();
			
			if (!lockData || !lockData.api_port) {
				// Daemon not running - use CLI
				console.log('[GetState] Daemon not running - using CLI fallback');
				this.kbsCli('state', false).then((stdout) => {
					try {
						const state = JSON.parse(stdout);
						console.log('[GetState] CLI state retrieved successfully');
						resolve(state);
					} catch (err) {
						console.log('[GetState] Failed to parse CLI state:', err);
						reject(err);
					}
				}).catch((err) => {
					console.log('[GetState] CLI state command failed:', err);
					reject(err);
				});
				return;
			}

			// Check if daemon is actually running
			const isRunning = await this.checkDaemonRunning(lockData.api_port);
			
			if (!isRunning) {
				// Daemon died - fall back to CLI
				console.log('[GetState] Daemon check failed - using CLI fallback');
				this.kbsCli('state', false).then((stdout) => {
					try {
						const state = JSON.parse(stdout);
						this._cachedPort = null;
						console.log('[GetState] CLI state retrieved (daemon not running)');
						resolve(state);
					} catch (err) {
						console.log('[GetState] Failed to parse CLI state:', err);
						reject(err);
					}
				}).catch((err) => {
					console.log('[GetState] CLI state command failed:', err);
					reject(err);
				});
				return;
			}

			// Daemon is running - use socket API (fast, no process)
			console.log('[GetState] Daemon is running - using socket API');
			try {
				const state = await this.socketRequest(lockData.api_port, {
					action: 'get_state'
				});
				console.log('[GetState] Socket API state retrieved successfully');
				resolve(state);
			} catch (err) {
				// Socket request failed - fall back to CLI
				console.log('[GetState] Socket request failed, falling back to CLI:', err.message);
				// Clear cached port since socket connection failed (stale lock file)
				if (this._cachedPort === lockData.api_port) {
					this._cachedPort = null;
					console.log('[GetState] Cleared cached port due to socket request failure (stale lock file?)');
				}
				this.kbsCli('state', false).then((stdout) => {
					try {
						const state = JSON.parse(stdout);
						console.log('[GetState] CLI state retrieved after socket failure');
						resolve(state);
					} catch (parseErr) {
						console.log('[GetState] Failed to parse CLI state:', parseErr);
						reject(parseErr);
					}
				}).catch((cliErr) => {
					console.log('[GetState] CLI state command failed:', cliErr);
					reject(cliErr);
				});
			}
		});
	},

	getInstalledApplications: async function() {
		const apps = await this.kbsCli('list-apps', false)
		return JSON.parse(apps);
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

			if (process.platform !== 'win32') { // isLinux
				animateBounds(this.mainWindow, {
					x: this.mainWindow.getBounds().x,
					y: this.mainWindow.getBounds().y,
					width:  500,
					height: newHeightNum
				});
			} else {
				animateBounds(this.mainWindow, {
					x: width  - 510,
					y: height - newHeightNum - 10,
					width:  500,
					height: newHeightNum
				});
			}

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

		// Adaptive polling: faster when daemon is running, slower when not
		let pollInterval = 1000; // Default 1 second
		let lastDaemonStatus = null;
		let pollCount = 0;
		
		const poll = () => {
			pollCount++;
			// Watch the status and notify the renderer process when it changes
			const performNotify = shouldNotify()
			if (lastKnownPerformNotify !== performNotify) {
				console.log('[Polling] performNotify changed:', performNotify);
				lastKnownPerformNotify = performNotify;
			}
			if (performNotify) {
				// Check if daemon is running by reading lock file (fast check)
				const lockData = this.readLockFile();
				const daemonRunning = lockData && lockData.api_port;
				
				// Adjust polling interval based on daemon status
				if (daemonRunning && lastDaemonStatus !== 'running') {
					pollInterval = 1000; // 1 second when running
					lastDaemonStatus = 'running';
					console.log(`[Polling] Daemon detected as running - switching to fast polling (${pollInterval}ms)`);
				} else if (!daemonRunning && lastDaemonStatus !== 'not_running') {
					pollInterval = 5000; // 5 seconds when not running
					lastDaemonStatus = 'not_running';
					console.log(`[Polling] Daemon detected as not running - switching to slow polling (${pollInterval}ms)`);
				}
				
				if (pollCount % 10 === 0 || lastDaemonStatus === 'running') {
					console.log(`[Polling] Poll #${pollCount} - daemon ${daemonRunning ? 'running' : 'not running'} - using ${daemonRunning ? 'socket API' : 'CLI'} (interval: ${pollInterval}ms)`);
				}
				
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
					// These are less frequent operations, so CLI is acceptable
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
					console.error('[Polling] Failed to fetch state:', err);
				});
			} else {
				if (pollCount % 20 === 0) {
					console.log(`[Polling] Poll #${pollCount} - notifications disabled, skipping`);
				}
			}
			
			// Schedule next poll with adaptive interval
			setTimeout(poll, pollInterval);
		};
		
		// Start polling
		console.log('[Polling] Starting adaptive polling system (initial interval: 1000ms)');
		poll();
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
	}
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
	kbs
};