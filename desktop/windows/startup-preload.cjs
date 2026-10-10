const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('localStartup', {
  getStatus: () => ipcRenderer.invoke('startup:status'),
  retry: () => ipcRenderer.invoke('startup:retry'),
  continueWithoutAI: () => ipcRenderer.send('startup:continue'),
  onProgress: callback => {
    if (typeof callback !== 'function') {
      throw new TypeError('O callback de progresso do início precisa ser uma função.');
    }
    const listener = (_event, status) => callback(status);
    ipcRenderer.on('startup:progress', listener);
    return () => ipcRenderer.removeListener('startup:progress', listener);
  },
});
