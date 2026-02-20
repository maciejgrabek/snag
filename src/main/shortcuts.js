const { globalShortcut } = require('electron');
const config = require('./config');

let registeredAccelerator = null;

function register(onCapture) {
  unregister();

  const cfg = config.read();
  const accelerator = cfg.hotkey || 'CommandOrControl+Shift+X';

  const success = globalShortcut.register(accelerator, onCapture);
  if (success) {
    registeredAccelerator = accelerator;
  } else {
    console.warn(`Failed to register global shortcut: ${accelerator}`);
  }

  return success;
}

function unregister() {
  if (registeredAccelerator) {
    globalShortcut.unregister(registeredAccelerator);
    registeredAccelerator = null;
  }
}

function unregisterAll() {
  globalShortcut.unregisterAll();
  registeredAccelerator = null;
}

module.exports = { register, unregister, unregisterAll };
