import { app, BrowserWindow, Menu, screen } from 'electron';
import path from 'node:path';

function createWindow(): void {
  const { x, y, width, height } = screen.getPrimaryDisplay().bounds;

  const win = new BrowserWindow({
    x,
    y,
    width,
    height,
    resizable: false,
    frame: false,
    title: 'Shadowlands',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  Menu.setApplicationMenu(null);

  win.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      win.setFullScreen(!win.isFullScreen());
    }
  });

  if (app.isPackaged) {
    // Production: load the Vite-built web app from disk.
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    // Development: point at the Vite dev server.
    win.loadURL('http://localhost:5173');
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
