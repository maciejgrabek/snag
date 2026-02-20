const { BrowserWindow, screen } = require('electron');
const path = require('path');

let captureWindow = null;
let dashboardWindow = null;

const preloadPath = path.join(__dirname, '..', 'preload', 'preload.js');

function getCaptureWindow() {
  if (captureWindow && !captureWindow.isDestroyed()) return captureWindow;

  captureWindow = new BrowserWindow({
    width: 520,
    height: 480,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    vibrancy: 'popover',
    visualEffectState: 'active',
    transparent: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  captureWindow.loadFile(
    path.join(__dirname, '..', 'renderer', 'capture', 'capture.html')
  );

  captureWindow.on('blur', () => {
    if (captureWindow && !captureWindow.isDestroyed()) {
      captureWindow.hide();
    }
  });

  captureWindow.on('closed', () => {
    captureWindow = null;
  });

  return captureWindow;
}

function showCaptureWindow() {
  const win = getCaptureWindow();

  // Position center-top of the display where cursor is
  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  const { x, y, width } = display.workArea;
  const [winWidth, winHeight] = win.getSize();
  const posX = Math.round(x + (width - winWidth) / 2);
  const posY = y + 80;

  win.setPosition(posX, posY);
  win.show();
  win.focus();

  // Signal renderer to refresh
  win.webContents.send('snag:capture-shown');
}

function hideCaptureWindow() {
  if (captureWindow && !captureWindow.isDestroyed()) {
    captureWindow.hide();
  }
}

function getDashboardWindow() {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.show();
    dashboardWindow.focus();
    return dashboardWindow;
  }

  dashboardWindow = new BrowserWindow({
    width: 700,
    height: 500,
    show: false,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'sidebar',
    visualEffectState: 'active',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  dashboardWindow.loadFile(
    path.join(__dirname, '..', 'renderer', 'dashboard', 'dashboard.html')
  );

  dashboardWindow.once('ready-to-show', () => {
    dashboardWindow.show();
  });

  dashboardWindow.on('closed', () => {
    dashboardWindow = null;
  });

  return dashboardWindow;
}

module.exports = {
  getCaptureWindow,
  showCaptureWindow,
  hideCaptureWindow,
  getDashboardWindow,
};
