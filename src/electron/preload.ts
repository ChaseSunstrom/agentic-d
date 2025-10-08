import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Agent APIs
  agent: {
    create: (config: any) => ipcRenderer.invoke('agent:create', config),
    start: (agentId: string) => ipcRenderer.invoke('agent:start', agentId),
    stop: (agentId: string) => ipcRenderer.invoke('agent:stop', agentId),
    delete: (agentId: string) => ipcRenderer.invoke('agent:delete', agentId),
    list: () => ipcRenderer.invoke('agent:list'),
    get: (agentId: string) => ipcRenderer.invoke('agent:get', agentId),
    update: (agentId: string, updates: any) => ipcRenderer.invoke('agent:update', agentId, updates),
    onStatusChange: (callback: (data: any) => void) => {
      ipcRenderer.on('agent:status-change', (_, data) => callback(data));
    },
    onLog: (callback: (data: any) => void) => {
      ipcRenderer.on('agent:log', (_, data) => callback(data));
    }
  },
  
  // LLM Provider APIs
  llm: {
    addProvider: (config: any) => ipcRenderer.invoke('llm:add-provider', config),
    listProviders: () => ipcRenderer.invoke('llm:list-providers'),
    testProvider: (providerId: string) => ipcRenderer.invoke('llm:test-provider', providerId),
    deleteProvider: (providerId: string) => ipcRenderer.invoke('llm:delete-provider', providerId)
  },
  
  // Model APIs
  model: {
    listAvailable: () => ipcRenderer.invoke('model:list-available'),
    listInstalled: () => ipcRenderer.invoke('model:list-installed'),
    install: (modelId: string) => ipcRenderer.invoke('model:install', modelId),
    uninstall: (modelId: string) => ipcRenderer.invoke('model:uninstall', modelId),
    scan: () => ipcRenderer.invoke('model:scan'),
    onDownloadProgress: (callback: (data: any) => void) => {
      ipcRenderer.on('model:download-progress', (_, data) => callback(data));
    }
  },
  
  // Resource APIs
  resources: {
    getUsage: () => ipcRenderer.invoke('resources:get-usage'),
    getHistory: (duration: string) => ipcRenderer.invoke('resources:get-history', duration),
    onUpdate: (callback: (data: any) => void) => {
      ipcRenderer.on('resources:update', (_, data) => callback(data));
    }
  },
  
  // Cost APIs
  cost: {
    getTotal: () => ipcRenderer.invoke('cost:get-total'),
    getByAgent: () => ipcRenderer.invoke('cost:get-by-agent'),
    getByProvider: () => ipcRenderer.invoke('cost:get-by-provider'),
    getHistory: (duration: string) => ipcRenderer.invoke('cost:get-history', duration)
  },
  
  // Automation APIs
  automation: {
    test: () => ipcRenderer.invoke('automation:test')
  },
  
  // Settings APIs
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value)
  }
});
