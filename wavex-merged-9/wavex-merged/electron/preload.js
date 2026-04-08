/**
 * Wavex Electron — Preload Script
 * Secure bridge between renderer (web) and main process
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Send desktop notifications via Electron (more reliable than web API)
  showNotification: (title, body, icon) => {
    ipcRenderer.send('show-notification', { title, body, icon });
  },

  // Platform info
  platform: process.platform,  // 'win32' | 'darwin' | 'linux'
  isElectron: true,
});
