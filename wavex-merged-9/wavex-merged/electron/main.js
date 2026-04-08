/**
 * Wavex — Electron Desktop App
 * Windows · macOS · Linux
 */

const { app, BrowserWindow, Menu, shell, Tray, nativeImage,
        ipcMain, Notification, session } = require('electron');
const path = require('path');
const fs   = require('fs');

// ── Keep single instance ──
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); process.exit(0); }

let mainWindow = null;
let tray       = null;

// ── Icon path helper ──
function iconPath(name = 'icon') {
  const base = path.join(__dirname, '..', 'build-assets', 'icons');
  if (process.platform === 'win32')   return path.join(base, 'icon.ico');
  if (process.platform === 'darwin')  return path.join(base, 'icon-512.png');
  return path.join(base, 'icon-256.png');
}

// ══════════════════════════════════════════
//  CREATE MAIN WINDOW
// ══════════════════════════════════════════
function createWindow() {
  // Restore saved bounds
  const bounds = loadBounds();

  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth:  380,
    minHeight: 600,
    title:     'Wavex',
    icon:      iconPath(),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0d0d1f',
    show: false,
    webPreferences: {
      nodeIntegration:     false,
      contextIsolation:    true,
      webSecurity:         true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the app
  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  // Show when ready (avoids white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (bounds.maximized) mainWindow.maximize();
  });

  // Save window bounds on resize/move
  mainWindow.on('resize',   saveBounds);
  mainWindow.on('move',     saveBounds);
  mainWindow.on('maximize', saveBounds);

  // Handle external links → open in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http') || url.startsWith('https')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  // ── App Menu ──
  buildMenu();
}

// ══════════════════════════════════════════
//  MENU
// ══════════════════════════════════════════
function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: 'Wavex',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit', label: 'Exit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [{ type: 'separator' }, { role: 'front' }] : [{ role: 'close' }]),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Wavex',
          click: () => {
            mainWindow?.webContents.executeJavaScript(`
              if(typeof showToast==='function') showToast('Wavex Desktop v2.0 🖥️');
            `);
          },
        },
        {
          label: 'Report Issue',
          click: () => shell.openExternal('https://github.com/wavex/wavex/issues'),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ══════════════════════════════════════════
//  TRAY (System tray icon)
// ══════════════════════════════════════════
function createTray() {
  const img = nativeImage.createFromPath(iconPath());
  const trayImg = img.resize({ width: 16, height: 16 });
  tray = new Tray(trayImg);
  tray.setToolTip('Wavex');

  const menu = Menu.buildFromTemplate([
    {
      label: 'Open Wavex',
      click: () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
        else createWindow();
      },
    },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuiting = true; app.quit(); } },
  ]);

  tray.setContextMenu(menu);
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });
}

// ══════════════════════════════════════════
//  WINDOW BOUNDS PERSISTENCE
// ══════════════════════════════════════════
const boundsFile = path.join(app.getPath('userData'), 'window-bounds.json');

function loadBounds() {
  try {
    const data = JSON.parse(fs.readFileSync(boundsFile, 'utf8'));
    return { width: data.width||1280, height: data.height||800,
             x: data.x, y: data.y, maximized: data.maximized||false };
  } catch { return { width: 1280, height: 800 }; }
}

function saveBounds() {
  if (!mainWindow) return;
  const b = mainWindow.getBounds();
  const maximized = mainWindow.isMaximized();
  try { fs.writeFileSync(boundsFile, JSON.stringify({...b, maximized})); } catch {}
}

// ══════════════════════════════════════════
//  NOTIFICATIONS (Desktop)
// ══════════════════════════════════════════
ipcMain.on('show-notification', (event, { title, body, icon }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body, icon: iconPath() }).show();
  }
});

// ══════════════════════════════════════════
//  APP EVENTS
// ══════════════════════════════════════════
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => { app.isQuiting = true; });
