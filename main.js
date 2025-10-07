const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let miniWindow;
let notificationWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 320,
    height: 800,
    minWidth: 280,
    minHeight: 600,
    maxWidth: 350,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    frame: true,
    title: 'Clock'
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (miniWindow) {
      miniWindow.close();
    }
  });
}

function createMiniWindow(data) {
  if (miniWindow) {
    miniWindow.focus();
    miniWindow.webContents.send('update-timer', data);
    return;
  }

  miniWindow = new BrowserWindow({
    width: 100,
    height: 140,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    x: 100,
    y: 100
  });

  // Giữ cửa sổ luôn ở trên cùng ngay cả khi Windows+D
  miniWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  miniWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  miniWindow.loadFile('mini.html');

  miniWindow.on('closed', () => {
    miniWindow = null;
  });

  miniWindow.webContents.on('did-finish-load', () => {
    miniWindow.webContents.send('update-timer', data);
  });
}

function createNotificationWindow(message, type) {
  if (notificationWindow) {
    notificationWindow.close();
  }

  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  notificationWindow = new BrowserWindow({
    width: 320,
    height: 120,
    x: width - 340,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  notificationWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  notificationWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  notificationWindow.loadFile('notification.html');

  notificationWindow.webContents.on('did-finish-load', () => {
    notificationWindow.webContents.send('show-notification', { message, type });
  });

  // Auto close after 5 seconds
  setTimeout(() => {
    if (notificationWindow) {
      notificationWindow.close();
      notificationWindow = null;
    }
  }, 5000);

  notificationWindow.on('closed', () => {
    notificationWindow = null;
  });
}

ipcMain.on('open-mini-window', (event, data) => {
  createMiniWindow(data);
});

ipcMain.on('close-mini-window', () => {
  if (miniWindow) {
    miniWindow.close();
    miniWindow = null;
  }
});

ipcMain.on('update-mini-timer', (event, data) => {
  if (miniWindow) {
    miniWindow.webContents.send('update-timer', data);
  }
});

ipcMain.on('minimize-main', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('start-timer-from-mini', () => {
  if (mainWindow) {
    mainWindow.webContents.send('start-timer');
  }
});

ipcMain.on('pause-timer-from-mini', () => {
  if (mainWindow) {
    mainWindow.webContents.send('pause-timer');
  }
});

ipcMain.on('skip-timer-from-mini', () => {
  if (mainWindow) {
    mainWindow.webContents.send('skip-timer');
  }
});

ipcMain.on('show-notification', (event, data) => {
  createNotificationWindow(data.message, data.type);
});

ipcMain.on('close-notification', () => {
  if (notificationWindow) {
    notificationWindow.close();
    notificationWindow = null;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
