const { app, ipcMain, shell, BrowserWindow, Menu, Tray, screen, dialog } = require('electron');
const a = require('electron-squirrel-startup');
if (a) process.exit(0);

const path = require('node:path');

import { 
  kbs,
  ErrPythonVersionUnknown,
  ErrPythonMissing,
  ErrPythonVersionMismatch,
  ErrPythonPackageMissing,
  ErrPythonPackageVersionMismatch,
  MinimumPythonVersion,
  MinimumPythonPackageVersion
} from './api/core';

import APP_ICO from './app_icon.png';

const APP_NAME = "Keyboard Sounds";
const AppIcon = path.join(__dirname, APP_ICO);

// Initialize variables to hold the tray and window objects.
let tray = null;
let mainWindow = null;

const toggleWindow = () => {
  // Check if the window exists and isn't destroyed; if so,
  // focus or restore it.
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
      return;
    }

    if (!mainWindow.isVisible()) {
      mainWindow.show();
      return;
    }

    mainWindow.focus();
    return;
  }

  // Get the primary display's work area size
  const appWidth = 500;
  const appHeight = 800;
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  // Calculate the x and y position for the window
  // Position the window on the bottom right of the screen
  const x = width - appWidth - 10;
  const y = height - appHeight - 10;

  var extraVars = {};
  console.log(`process.env.NODE_ENV=${process.env.NODE_ENV}`);
  if (process.env.NODE_ENV === 'development') {
    extraVars = {
      frame: true,
      show: true,
      resizable: true,
      minimizable: true,
      skipTaskbar: false,
      movable: true,
    };
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: x,
    y: y,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    alwaysOnTop: true,
    fullscreenable: false,
    hiddenInMissionControl: true,
    show: false,
    width: 500,
    height: 800,
    skipTaskbar: true,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },

    ...extraVars,
  });

  // Close the window when it loses focus.
  if (process.env.NODE_ENV !== 'development') {
    mainWindow.on('blur', () => {
      if (!kbs.openFileDialogIsOpen) {
        mainWindow.hide();
      }
    });
  }

  // Make links open in browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on("before-input-event", (event, input) => { 
    if(input.code=='F4' && input.alt) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  kbs.appVersion = app.getVersion();

  // Set the main window for use with the IPC handlers
  kbs.setMainWindow(mainWindow);

  // Load IPC handlers
  kbs.registerKbsIpcHandler(ipcMain, () => mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible());

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open developer tools
  // mainWindow.webContents.openDevTools();

  // Dereference the window object when the window is 
  // closed to free up memory.
  if (process.env.NODE_ENV !== 'development') {
    mainWindow.on('closed', () => {
      mainWindow = null; // Dereference the window object
    });
  }
};

const createEditorWindow = () => {
  // Create the browser window.
  const editorWindow = new BrowserWindow({
    width: 1200,
    height: process.env.NODE_ENV === 'development' ? 616 : 600,
    title: "Keyboard Sounds - Profile Editor (beta)",
    backgroundColor: '#121212',
    icon: path.join(__dirname, 'app_icon.png'),
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  if (process.env.NODE_ENV !== 'development') {
    editorWindow.setMenuBarVisibility(false);
  }

  editorWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY + "?editor=true");

  return editorWindow;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  kbs.checkPythonInstallation().then(() => {
    // Verify that Keyboard Sounds back-end is installed and functioning.
    kbs.checkInstallation().then(() => {
      kbs.getBackendVersion().then(version => {
        console.log(`Found Keyboard Sounds backend installation with version: ${version}`);
      }).catch((err) => {
        console.error('Failed to get Keyboard Sounds backend version:', err);
        dialog.showErrorBox('Keyboard Sounds: Error', 'Failed to retrieve Keyboard Sounds backend version.');
        process.exit(1);
      });
    }).catch((err) => {
      console.error('Failed to find Keyboard Sounds backend installation:', err);
      dialog.showErrorBox('Keyboard Sounds: Error', 'Keyboard Sounds backend is not installed or not functioning properly. Please install the Keyboard Sounds backend from https://keyboardsounds.net/ and try again.');
      process.exit(1);
    });
  }).catch((err) => {
    switch (err) {
      case ErrPythonMissing:
        dialog.showMessageBox({
          type: 'error',
          title: 'Python is not installed',
          message: `Please install Python ${MinimumPythonVersion} or later and try again.`,
          buttons: ['Install Python', 'Quit'],
          defaultId: 0,
          cancelId: 1
        }).then((response) => {
          if (response.response === 0) {
            shell.openExternal('https://www.python.org/downloads/');
          }
          process.exit(0);
        });
        break;
      case ErrPythonVersionUnknown:
        dialog.showMessageBox({
          type: 'error',
          title: 'Python version is unknown',
          message: `Please install Python ${MinimumPythonVersion} or later and try again.`,
          buttons: ['Install Python', 'Quit'],
          defaultId: 0,
          cancelId: 1
        }).then((response) => {
          if (response.response === 0) {
            shell.openExternal('https://www.python.org/downloads/');
          }
          process.exit(0);
        });
        break;
      case ErrPythonVersionMismatch:
        dialog.showMessageBox({
          type: 'error',
          title: 'Python version mismatch',
          message: `Please install Python ${MinimumPythonVersion} or later and try again.`,
          buttons: ['Install Python', 'Quit'],
          defaultId: 0,
          cancelId: 1
        }).then((response) => {
          if (response.response === 0) {
            shell.openExternal('https://www.python.org/downloads/');
          }
          process.exit(0);
        });
        break;
      case ErrPythonPackageMissing:
        dialog.showMessageBox({
          type: 'error',
          title: 'Python package missing',
          message: `Please install the keyboardsounds Python package (version ${MinimumPythonPackageVersion} or later) and try again.`,
          buttons: ['Install Python Package', 'Quit'],
          defaultId: 0,
          cancelId: 1
        }).then((response) => {
          if (response.response === 0) {
            kbs.installPythonPackage().then(() => {
              dialog.showMessageBox({
                type: 'info',
                title: 'Python package installed',
                message: `The Keyboard Sounds Python package has been installed successfully. Please restart the application to continue.`,
                buttons: ['Restart Application'],
                defaultId: 0,
                cancelId: 0
              }).then((response) => {
                app.relaunch();
                process.exit(1);
              });
            }).catch(err => {
              console.log(err);
              dialog.showErrorBox('Keyboard Sounds: Error', 'Failed to install the Keyboard Sounds Python package.');
              process.exit(0);
            })
          } else if (response.response === 1) {
            process.exit(0);
          }
        });
        break;
      case ErrPythonPackageVersionMismatch:
        dialog.showMessageBox({
          type: 'error',
          title: 'Python package version mismatch',
          message: `Please install the keyboardsounds Python package (version ${MinimumPythonPackageVersion} or later) and try again.`,
          buttons: ['Install Python Package', 'Quit'],
          defaultId: 0,
          cancelId: 1
        }).then((response) => {
          if (response.response === 0) {
            kbs.installPythonPackage().then(() => {
              dialog.showMessageBox({
                type: 'info',
                title: 'Python package installed',
                message: `The Keyboard Sounds Python package has been installed successfully. Please restart the application to continue.`,
                buttons: ['Restart Application'],
                defaultId: 0,
                cancelId: 0
              }).then((response) => {
                app.relaunch();
                process.exit(1);
              });
            }).catch(err => {
              console.log(err);
              dialog.showErrorBox('Keyboard Sounds: Error', 'Failed to install the Keyboard Sounds Python package.');
              process.exit(0);
            })
          } else if (response.response === 1) {
            process.exit(0);
          }
        });
        break;
      default:
        dialog.showMessageBox({
          type: 'error',
          title: 'Unknown Error',
          message: `Please try again.`,
          buttons: ['Quit'],
          defaultId: 0,
          cancelId: 0
        }).then((response) => {
          process.exit(0);
        }); 
    }
  });

  toggleWindow();
  kbs.setEditorWindowCreateHandler(createEditorWindow);

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      toggleWindow();
    }
  });

  // Create a system tray icon and context menu for the application.
  tray = new Tray(AppIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Create Profile',
      type: 'normal',
      click: () => {
        kbs.showEditorWindow();
      },
    },
    { 
      label: 'Quit',
      type: 'normal',
      click: () => {
        kbs.exec('stop').finally(() => {
          process.exit(0);
        });
      },
    },
  ]);
  tray.setToolTip(APP_NAME);
  tray.setContextMenu(contextMenu);

  // Allow the user to double-click the tray icon to open
  // or focus the application window.
  if (process.env.NODE_ENV !== 'development') {
    tray.on('click', toggleWindow);

    tray.displayBalloon({
      title: APP_NAME,
      content: `${APP_NAME} lives in your system tray.`,
    });
  }
});

// Display a notification when the application is closed
// but still running in the background.
app.on('window-all-closed', () => {
  tray.displayBalloon({
    title: APP_NAME,
    content: `${APP_NAME} is still running in the background.`,
  });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
