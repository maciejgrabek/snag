const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let tray = null;
let flashTimeout = null;

const assetsDir = path.join(__dirname, '..', '..', 'assets');

function getIconPath() {
  if (process.platform === 'win32') {
    return path.join(assetsDir, 'icon.png');
  }
  return path.join(assetsDir, 'IconTemplate.png');
}

function getActiveIconPath() {
  return path.join(assetsDir, 'icon-active.png');
}

function create({ onShowCapture, onShowDashboard, onQuit }) {
  const iconPath = getIconPath();
  const icon = nativeImage.createFromPath(iconPath);
  if (process.platform === 'darwin') icon.setTemplateImage(true);
  tray = new Tray(icon);
  tray.setToolTip('Snag');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Capture...', accelerator: 'CommandOrControl+Shift+X', click: onShowCapture },
    { label: 'Dashboard', click: onShowDashboard },
    { type: 'separator' },
    { label: 'Quit Snag', click: onQuit },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', onShowDashboard);

  return tray;
}

function flash() {
  if (!tray) return;

  try {
    const activeIcon = nativeImage.createFromPath(getActiveIconPath());
    tray.setImage(activeIcon);

    if (flashTimeout) clearTimeout(flashTimeout);
    flashTimeout = setTimeout(() => {
      if (!tray) return;
      const icon = nativeImage.createFromPath(getIconPath());
      if (process.platform === 'darwin') icon.setTemplateImage(true);
      tray.setImage(icon);
    }, 300);
  } catch {
    // Active icon may not exist yet — skip flash
  }
}

function destroy() {
  if (flashTimeout) clearTimeout(flashTimeout);
  if (tray) tray.destroy();
  tray = null;
}

module.exports = { create, flash, destroy };
