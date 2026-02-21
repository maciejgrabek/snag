const { app } = require('electron');
const tray = require('./tray');
const shortcuts = require('./shortcuts');
const ipc = require('./ipc');
const { showCaptureWindow, hideCaptureWindow, isCaptureWindowVisible, getDashboardWindow } = require('./windows');
const cleanup = require('./cleanup');
const server = require('./server');

// Hide dock icon — pure menubar app
if (app.dock) app.dock.hide();

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showCaptureWindow();
  });
}

app.whenReady().then(() => {
  // Register IPC handlers
  ipc.register();

  // Create tray
  tray.create({
    onShowCapture: () => {
      app.focus({ steal: true });
      showCaptureWindow();
    },
    onShowDashboard: () => {
      app.focus({ steal: true });
      getDashboardWindow();
    },
    onQuit: () => app.quit(),
  });

  // Register global shortcut (toggle)
  shortcuts.register(() => {
    if (isCaptureWindowVisible()) {
      hideCaptureWindow();
    } else {
      app.focus({ steal: true });
      showCaptureWindow();
    }
  });

  // Start background cleanup
  cleanup.startBackground();

  // Start HTTP server
  server.start();
});

app.on('will-quit', () => {
  shortcuts.unregisterAll();
  cleanup.stopBackground();
  server.stop();
  tray.destroy();
});

// Keep app running when all windows close (menubar app)
app.on('window-all-closed', (e) => {
  e.preventDefault();
});
