const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform,
  localAIStatus: () => ipcRenderer.invoke('ai:status'),
  localAIWarmup: () => ipcRenderer.invoke('ai:warmup'),
  localAIChat: (prompt, requestId) => ipcRenderer.invoke('ai:chat', prompt, requestId),
  localAICancel: requestId => ipcRenderer.send('ai:cancel', requestId),
  localAILog: (event, details) => ipcRenderer.send('ai:diagnostic', { event, details }),
  onLocalAIProgress: callback => {
    if (typeof callback !== 'function') {
      throw new TypeError('O callback de progresso da IA precisa ser uma função.');
    }
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on('ai:progress', listener);
    return () => ipcRenderer.removeListener('ai:progress', listener);
  },
});
