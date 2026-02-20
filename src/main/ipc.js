const { ipcMain, dialog } = require('electron');
const path = require('path');
const capture = require('./capture');
const config = require('./config');
const gitignore = require('./gitignore');
const cleanup = require('./cleanup');
const { hideCaptureWindow } = require('./windows');
const tray = require('./tray');

function register() {
  ipcMain.handle('snag:get-clipboard-image', () => {
    const result = capture.getClipboardImage();
    if (!result) return null;
    // Don't send fullBuffer over IPC — just preview
    return { previewBase64: result.previewBase64, width: result.width, height: result.height };
  });

  ipcMain.handle('snag:get-config', () => {
    return config.read();
  });

  ipcMain.handle('snag:save-capture', async (_event, { projectPath, description, details, tags }) => {
    try {
      // Read clipboard image fresh (full resolution)
      const image = capture.getClipboardImage();
      const imageBuffer = image ? image.fullBuffer : null;

      const result = capture.saveCaptureToProject({
        projectPath,
        description,
        details,
        tags,
        imageBuffer,
      });

      // Update config with MRU project
      config.touchProject(projectPath);

      // Ensure .snag/ is in .gitignore
      gitignore.ensureSnagIgnored(projectPath);

      // Flash tray icon
      tray.flash();

      // Play sound
      playSound();

      return { success: true, ...result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('snag:update-config', (_event, partial) => {
    return config.update(partial);
  });

  ipcMain.handle('snag:get-dashboard-data', () => {
    const cfg = config.read();
    const projects = cfg.projects.map((p) => ({
      path: p,
      name: path.basename(p),
      stats: cleanup.getProjectStats(p),
    }));
    return { projects, config: cfg };
  });

  ipcMain.handle('snag:run-cleanup', () => {
    return cleanup.sweepAll();
  });

  ipcMain.handle('snag:open-directory-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      message: 'Choose a project directory',
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
  });

  ipcMain.on('snag:close-capture', () => {
    hideCaptureWindow();
  });
}

function playSound() {
  try {
    const { exec } = require('child_process');
    if (process.platform === 'darwin') {
      exec('afplay /System/Library/Sounds/Tink.aiff', () => {});
    } else if (process.platform === 'win32') {
      exec('powershell -c "(New-Object Media.SoundPlayer \'C:\\Windows\\Media\\notify.wav\').PlaySync()"', () => {});
    }
  } catch {
    // Non-fatal
  }
}

module.exports = { register };
