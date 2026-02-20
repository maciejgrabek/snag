const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');

let tray = null;
let flashTimeout = null;

const iconPath = path.join(__dirname, '..', '..', 'assets', 'IconTemplate.png');
const activeIconPath = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'icon-active.png'
);

function create({ onShowCapture, onShowDashboard, onQuit }) {
  const icon = nativeImage.createFromPath(iconPath);
  icon.setTemplateImage(true);
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
    const activeIcon = nativeImage.createFromPath(activeIconPath);
    tray.setImage(activeIcon);

    if (flashTimeout) clearTimeout(flashTimeout);
    flashTimeout = setTimeout(() => {
      if (!tray) return;
      const icon = nativeImage.createFromPath(iconPath);
      icon.setTemplateImage(true);
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
