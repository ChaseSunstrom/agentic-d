export interface ElectronAPI {
  agent: {
    create: (config: any) => Promise<any>;
    start: (agentId: string) => Promise<boolean>;
    stop: (agentId: string) => Promise<boolean>;
    delete: (agentId: string) => Promise<boolean>;
    list: () => Promise<any[]>;
    get: (agentId: string) => Promise<any>;
    update: (agentId: string, updates: any) => Promise<any>;
    onStatusChange: (callback: (data: any) => void) => void;
    onLog: (callback: (data: any) => void) => void;
  };
  llm: {
    addProvider: (config: any) => Promise<any>;
    listProviders: () => Promise<any[]>;
    testProvider: (providerId: string) => Promise<boolean>;
    deleteProvider: (providerId: string) => Promise<boolean>;
  };
  model: {
    listAvailable: () => Promise<any[]>;
    listInstalled: () => Promise<any[]>;
    install: (modelId: string) => Promise<boolean>;
    uninstall: (modelId: string) => Promise<boolean>;
    scan: () => Promise<any[]>;
    onDownloadProgress: (callback: (data: any) => void) => void;
  };
  resources: {
    getUsage: () => Promise<any>;
    getHistory: (duration: string) => Promise<any[]>;
    onUpdate: (callback: (data: any) => void) => void;
  };
  cost: {
    getTotal: () => Promise<number>;
    getByAgent: () => Promise<Record<string, number>>;
    getByProvider: () => Promise<Record<string, number>>;
    getHistory: (duration: string) => Promise<any[]>;
  };
  automation: {
    test: () => Promise<boolean>;
  };
  settings: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
