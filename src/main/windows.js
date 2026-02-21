const { BrowserWindow, screen, nativeTheme } = require('electron');
const path = require('path');

let captureWindow = null;
let dashboardWindow = null;

const isMac = process.platform === 'darwin';
const preloadPath = path.join(__dirname, '..', 'preload', 'preload.js');

function getBackgroundColor() {
  return nativeTheme.shouldUseDarkColors ? '#1c1c1e' : '#fafafa';
}

function getCaptureWindow() {
  if (captureWindow && !captureWindow.isDestroyed()) return captureWindow;

  const opts = {
    width: 520,
    height: 560,
    show: false,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  };

  if (isMac) {
    opts.vibrancy = 'popover';
    opts.visualEffectState = 'active';
  }

  captureWindow = new BrowserWindow(opts);

  captureWindow.loadFile(
    path.join(__dirname, '..', 'renderer', 'capture', 'capture.html')
  );

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
  const [winWidth] = win.getSize();
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

  const opts = {
    width: 700,
    height: 500,
    show: false,
    backgroundColor: getBackgroundColor(),
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  };

  if (isMac) {
    opts.titleBarStyle = 'hiddenInset';
    opts.vibrancy = 'sidebar';
    opts.visualEffectState = 'active';
  }

  dashboardWindow = new BrowserWindow(opts);

  // Update background color when system theme changes
  nativeTheme.on('updated', () => {
    if (dashboardWindow && !dashboardWindow.isDestroyed()) {
      dashboardWindow.setBackgroundColor(getBackgroundColor());
    }
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

function isCaptureWindowVisible() {
  return captureWindow && !captureWindow.isDestroyed() && captureWindow.isVisible();
}

module.exports = {
  getCaptureWindow,
  showCaptureWindow,
  hideCaptureWindow,
  isCaptureWindowVisible,
  getDashboardWindow,
};
