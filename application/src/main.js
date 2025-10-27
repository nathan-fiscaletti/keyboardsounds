const { app, ipcMain, shell, BrowserWindow, Menu, Tray, screen, dialog, Notification, nativeImage } = require('electron');

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
const simulateProd = true;

const getWindowProperties = () => {
  const appWidth = 500;
  const appHeight = 800;
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  let coords = {};

  // Calculate the x and y position for the window
  // Position the window on the bottom right of the screen
  //
  // This only applies to windows.
  if (process.platform === 'win32') {
    coords = {
      x: width - appWidth - 10,
      y: height - appHeight - 10
    };
  }

  // Development / Default State for Window
  const defaultWindowProperties = {
    // Never changes
    hiddenInMissionControl: true,
    fullscreenable: false,
    maximizable: false,

    // Default size
    width: 500,
    height: 800,

    // Changed based on platform / environment
    show: true,
    frame: true,
    resizable: true,
    movable: true,
    minimizable: true,
    alwaysOnTop: true,
    closable: true,

    // System
    ...coords,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  };

  let windowProperties = {...defaultWindowProperties};

  const isLinux = process.platform !== 'win32';
  const isDevelopment = process.env.NODE_ENV === 'development' && !simulateProd;

  // Linux Overrides
  if (isLinux) {
    windowProperties = {
      ...windowProperties,
      alwaysOnTop: isDevelopment, // Only show the window on top in dev.
      resizable: isDevelopment,   // Allow resizing the window in dev.
    };
  }

  // Windows Overrides
  if (!isLinux) {
    windowProperties = {
      ...windowProperties,
      show: isDevelopment,        // Start minimized unless in dev.
      frame: isDevelopment,       // Disable window border and control bar unless in dev.
      resizable: isDevelopment,   // Resizing is handled automatically in prod.
      movable: isDevelopment,     // Position is handled automatically in prod.
      minimizable: isDevelopment, // Window visibility is handled automatically in prod.
      closable: isDevelopment,    // Closing the window is only permitted in dev.
      skipTaskbar: !isDevelopment,          // Hide the app on the task bar in prod.
    };
  }

  return windowProperties;
}

const showWindow = () => {
  console.log('showWindow() called');
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

  // Create the browser window.
  const config = getWindowProperties()
  mainWindow = new BrowserWindow(config);

  if (process.env.NODE_ENV !== 'development' || simulateProd) {
    mainWindow.setMenuBarVisibility(false);
  }

  // Close the window when it loses focus.
  if ((process.env.NODE_ENV !== 'development' || simulateProd) && process.platform === 'win32') {
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
      showWindow();
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
      label: 'Show Keyboard Sounds',
      type: 'normal',
      click: () => showWindow(),
      icon: nativeImage.createFromPath(AppIcon),
    },
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
  tray.on('click', showWindow);

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
      showWindow();
    }
  });
    
  // Create the main window but don't show it yet
  showWindow();
  
  // Wait for the main window to be ready before proceeding
  if (process.platform === 'win32') {
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
  }
  
  // Initialize system tray
  await initializeSystemTrayAndApp();

  // Set up a handler that can be called when wizard completes
  kbs.setInitializeSystemTrayHandler(async () => {
    // When wizard completes, create the main window and initialize tray
    showWindow();
    
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
    const isWindows = process.platform === 'win32';

    if (update !== null) {
      const notifyOnUpdate = await kbs.getNotifyOnUpdate();
      if (notifyOnUpdate) {
        dialog.showMessageBox({
          type: 'info',
          title: 'Keyboard Sounds',
          message: `A new version of Keyboard Sounds is available!`,
          detail: `${kbs.appVersion} → ${update.tag_name}\n\n${isWindows ? "Would you like to install it now? The application will be restarted after the update." : "View a full change log and more information on the GitHub Release Page."}`,
          buttons: [isWindows ? 'Install and relaunch' : 'View on GitHub', 'Remind me later'],
          defaultId: 0,
          cancelId: 1
        }).then(async (response) => {
          if (response.response === 0) {
            if (isWindows) {
              kbs.downloadUpdate();
            } else {
              kbs.openReleaseInBrowser(update);
            }
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