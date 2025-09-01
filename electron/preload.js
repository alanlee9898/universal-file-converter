const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File handling
  onFilesSelected: (callback) => {
    ipcRenderer.on('files-selected', (event, filePaths) => {
      callback(filePaths);
    });
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Platform info
  platform: process.platform,
  
  // File system access
  readFile: async (filePath) => {
    return ipcRenderer.invoke('read-file', filePath);
  }
});
