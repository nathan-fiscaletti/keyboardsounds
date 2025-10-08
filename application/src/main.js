const { app, ipcMain, shell, BrowserWindow, Menu, Tray, screen, dialog } = require('electron');

import path from 'path';

const a = require('electron-squirrel-startup');
if (a) process.exit(0);

import { 
  kbs
} from './api/core';

import APP_ICO from './app_icon.png';

const APP_NAME = "Keyboard Sounds";
const AppIcon = path.join(__dirname, APP_ICO);

// Initialize variables to hold the tray and window objects.
let tray = null;
let mainWindow = null;
let justShownWindow = false;

// When enabled, even if NODE_ENV=development, the application will still
// act as if it is running in a production state.
const simulateProd = false;

const toggleWindow = () => {
  console.log('toggleWindow() called');
  // Check if the window exists and isn't destroyed; if so,
  // focus or restore it.
  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log(`mainWindow exists - isMinimized: ${mainWindow.isMinimized()}, isVisible: ${mainWindow.isVisible()}`);
    if (mainWindow.isMinimized()) {
      console.log('Restoring minimized window');
      mainWindow.restore();
      return;
    }

    if (!mainWindow.isVisible()) {
      console.log('Showing hidden window');
      justShownWindow = true;
      mainWindow.show();
      // Reset the flag after a short delay to allow the window to gain focus
      setTimeout(() => { justShownWindow = false; }, 200);
      return;
    }

    console.log('Focusing visible window');
    mainWindow.focus();
    return;
  }

  console.log('Creating new mainWindow');

  // Get the primary display's work area size
  const appWidth = 500;
  const appHeight = 800;
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  // Calculate the x and y position for the window
  // Position the window on the bottom right of the screen
  const x = width - appWidth - 10;
  const y = height - appHeight - 10;

  var extraVars = {};
  console.log(`(container) process.env.NODE_ENV=${process.env.NODE_ENV}`);
  if (process.env.NODE_ENV === 'development' && !simulateProd) {
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
  if (process.env.NODE_ENV !== 'development' || simulateProd) {
    mainWindow.on('blur', async () => {
      // Don't hide if we just showed the window (prevents race condition)
      if (justShownWindow) {
        console.log('Ignoring blur event - window was just shown');
        return;
      }
      
      if (!kbs.openFileDialogIsOpen) {
        console.log('Window lost focus - hiding');
        mainWindow.hide();
        const notifyOnHide = await kbs.getNotifyOnHide();
        if (notifyOnHide) {
          tray.displayBalloon({
            title: APP_NAME,
            content: `${APP_NAME} is running in the background.`,
          });
        }
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

  kbs.setSimulateProd(simulateProd);

  // Set the main window for use with the IPC handlers
  kbs.setMainWindow(mainWindow);

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open developer tools
  // mainWindow.webContents.openDevTools();

  // Dereference the window object when the window is 
  // closed to free up memory.
  if (process.env.NODE_ENV !== 'development' || simulateProd) {
    mainWindow.on('closed', () => {
      mainWindow = null; // Dereference the window object
    });
  }
};

// Ensure only a single instance of the app is running
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      mainWindow.focus();
    } else {
      toggleWindow();
    }
  });
}

const createEditorWindow = () => {
  // Create the browser window.
  const editorWindow = new BrowserWindow({
    width: 1200,
    height: process.env.NODE_ENV === 'development' && !simulateProd ? 616 : 600,
    title: "Keyboard Sounds - Profile Editor (beta)",
    backgroundColor: '#121212',
    icon: path.join(__dirname, 'app_icon.png'),
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  if (process.env.NODE_ENV !== 'development' || simulateProd) {
    editorWindow.setMenuBarVisibility(false);
  }

  editorWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY + "?editor=true");

  return editorWindow;
};

// Initialize the system tray and launch the main application
const initializeSystemTrayAndApp = async () => {
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
      label: 'Show Daemon Window',
      type: 'normal',
      click: () => {
        kbs.showDaemonWindow();
      }
    },
    { 
      label: 'Quit',
      type: 'normal',
      click: () => {
        kbs.kbsCli('stop').finally(() => {
          process.exit(0);
        });
      },
    },
  ]);
  tray.setToolTip(APP_NAME);
  tray.setContextMenu(contextMenu);

  // Allow the user to click the tray icon to open or focus the application window
  tray.on('click', toggleWindow);

  // Show notification on launch (production only)
  if (process.env.NODE_ENV !== 'development' || simulateProd) {
    const notifyOnLaunch = await kbs.getNotifyOnLaunch();
    if (notifyOnLaunch) {
      tray.displayBalloon({
        title: APP_NAME,
        content: `${APP_NAME} is running in the background.`,
      });
    }
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  kbs.appVersion = app.getVersion();
  // Start container-level analytics (no renderer network required)
  try { await kbs.startContainerAnalytics(); } catch (_) {}

  kbs.setEditorWindowCreateHandler(createEditorWindow);

  // Register IPC handlers early so both wizard and main window can use them
  kbs.registerKbsIpcHandler(ipcMain, () => mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible());

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      toggleWindow();
    }
  });
    
  // Create the main window but don't show it yet
  toggleWindow();
  
  // Wait for the main window to be ready before proceeding
  await new Promise((resolve) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.webContents.isLoading()) {
        mainWindow.webContents.once('did-finish-load', () => {
          mainWindow.hide();
          resolve();
        });
      } else {
        mainWindow.hide();
        resolve();
      }
    } else {
      resolve();
    }
  });
  
  // Initialize system tray
  await initializeSystemTrayAndApp();

  // Set up a handler that can be called when wizard completes
  kbs.setInitializeSystemTrayHandler(async () => {
    // When wizard completes, create the main window and initialize tray
    toggleWindow();
    
    // Wait for the main window to be ready
    await new Promise((resolve) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.webContents.isLoading()) {
          mainWindow.webContents.once('did-finish-load', () => {
            mainWindow.hide();
            resolve();
          });
        } else {
          mainWindow.hide();
          resolve();
        }
      } else {
        resolve();
      }
    });
    
    // Initialize system tray
    await initializeSystemTrayAndApp();
  });
});

// Display a notification when the application is closed
// but still running in the background.
app.on('window-all-closed', async () => {
  const notifyOnHide  = await kbs.getNotifyOnHide();
  if (notifyOnHide) {
    tray.displayBalloon({
      title: APP_NAME,
      content: `${APP_NAME} is running in the background.`,
    });
  }
});

async function runUpdateCheck() {
  try {
    const update = await kbs.checkForUpdate();
    if (update !== null) {
      const notifyOnUpdate = await kbs.getNotifyOnUpdate();
      if (notifyOnUpdate) {
        dialog.showMessageBox({
          type: 'info',
          title: 'Keyboard Sounds',
          message: `A new version of Keyboard Sounds is available!`,
          detail: `${kbs.appVersion} → ${update.tag_name}\n\nWould you like to install it now? The application will be restarted after the update.`,
          buttons: ['Install and relaunch', 'Remind me later'],
          defaultId: 0,
          cancelId: 1
        }).then(async (response) => {
          if (response.response === 0) {
            kbs.downloadUpdate();
          }
        });
      }
    }
  } catch (e) {
    console.log(e);
  }
}

// Check for updates periodically
runUpdateCheck();
setTimeout(runUpdateCheck, 86400 * 1000);

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.