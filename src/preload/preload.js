const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('snag', {
  getClipboardImage: () => ipcRenderer.invoke('snag:get-clipboard-image'),
  saveCapture: (data) => ipcRenderer.invoke('snag:save-capture', data),
  getConfig: () => ipcRenderer.invoke('snag:get-config'),
  updateConfig: (partial) => ipcRenderer.invoke('snag:update-config', partial),
  getDashboardData: () => ipcRenderer.invoke('snag:get-dashboard-data'),
  runCleanup: () => ipcRenderer.invoke('snag:run-cleanup'),
  openDirectoryDialog: () => ipcRenderer.invoke('snag:open-directory-dialog'),
  closeCapture: () => ipcRenderer.send('snag:close-capture'),
  onCaptureShown: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('snag:capture-shown', handler);
    return () => ipcRenderer.removeListener('snag:capture-shown', handler);
  },
});
