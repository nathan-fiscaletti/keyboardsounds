// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// Import the necessary Electron modules
import { contextBridge, ipcRenderer, shell } from 'electron';

// Exposed protected methods in the render process
contextBridge.exposeInMainWorld(
    // Allowed 'ipcRenderer' methods
    'kbs', {
        // From the render process, send a message to the main process
        execute: (command, channelId) => {
            // Send a message to the main process
            return ipcRenderer.send('kbs', {channelId, command});
        },

        // From the render process, receive a message from the main process
        receive: (channel, func) => {
            const listener = (event, ...args) => func(...args);
            ipcRenderer.on(channel, listener);

            return () => {
                ipcRenderer.removeListener(channel, listener);
            };
        },
    },
);