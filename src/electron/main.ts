import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { AgentManager } from './services/AgentManager';
import { LLMProviderManager } from './services/LLMProviderManager';
import { ModelManager } from './services/ModelManager';
import { AutomationService } from './services/AutomationService';
import { ResourceMonitor } from './services/ResourceMonitor';
import { CostTracker } from './services/CostTracker';

let mainWindow: BrowserWindow | null = null;
let agentManager: AgentManager;
let llmProviderManager: LLMProviderManager;
let modelManager: ModelManager;
let automationService: AutomationService;
let resourceMonitor: ResourceMonitor;
let costTracker: CostTracker;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#1a1a1a',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1a1a1a',
      symbolColor: '#ffffff',
      height: 40
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Initialize services
  costTracker = new CostTracker();
  llmProviderManager = new LLMProviderManager(costTracker);
  modelManager = new ModelManager();
  automationService = new AutomationService();
  resourceMonitor = new ResourceMonitor();
  agentManager = new AgentManager(llmProviderManager, automationService, resourceMonitor, costTracker);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  setupIPC();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    agentManager.stopAllAgents();
    app.quit();
  }
});

function setupIPC(): void {
  // Agent Management
  ipcMain.handle('agent:create', async (_, agentConfig) => {
    return await agentManager.createAgent(agentConfig);
  });

  ipcMain.handle('agent:start', async (_, agentId) => {
    return await agentManager.startAgent(agentId);
  });

  ipcMain.handle('agent:stop', async (_, agentId) => {
    return await agentManager.stopAgent(agentId);
  });

  ipcMain.handle('agent:delete', async (_, agentId) => {
    return await agentManager.deleteAgent(agentId);
  });

  ipcMain.handle('agent:list', async () => {
    return await agentManager.listAgents();
  });

  ipcMain.handle('agent:get', async (_, agentId) => {
    return await agentManager.getAgent(agentId);
  });

  ipcMain.handle('agent:update', async (_, agentId, updates) => {
    return await agentManager.updateAgent(agentId, updates);
  });

  // LLM Provider Management
  ipcMain.handle('llm:add-provider', async (_, providerConfig) => {
    return await llmProviderManager.addProvider(providerConfig);
  });

  ipcMain.handle('llm:list-providers', async () => {
    return await llmProviderManager.listProviders();
  });

  ipcMain.handle('llm:test-provider', async (_, providerId) => {
    return await llmProviderManager.testProvider(providerId);
  });

  ipcMain.handle('llm:delete-provider', async (_, providerId) => {
    return await llmProviderManager.deleteProvider(providerId);
  });

  // Local Model Management
  ipcMain.handle('model:list-available', async () => {
    return await modelManager.listAvailableModels();
  });

  ipcMain.handle('model:list-installed', async () => {
    return await modelManager.listInstalledModels();
  });

  ipcMain.handle('model:install', async (_, modelId) => {
    return await modelManager.installModel(modelId);
  });

  ipcMain.handle('model:uninstall', async (_, modelId) => {
    return await modelManager.uninstallModel(modelId);
  });

  ipcMain.handle('model:scan', async () => {
    return await modelManager.scanForModels();
  });

  ipcMain.on('model:download-progress', (event, modelId) => {
    modelManager.on('download-progress', (progress) => {
      if (mainWindow) {
        mainWindow.webContents.send('model:download-progress', progress);
      }
    });
  });

  // Resource Monitoring
  ipcMain.handle('resources:get-usage', async () => {
    return await resourceMonitor.getResourceUsage();
  });

  ipcMain.handle('resources:get-history', async (_, duration) => {
    return await resourceMonitor.getHistory(duration);
  });

  // Cost Tracking
  ipcMain.handle('cost:get-total', async () => {
    return await costTracker.getTotalCost();
  });

  ipcMain.handle('cost:get-by-agent', async () => {
    return await costTracker.getCostByAgent();
  });

  ipcMain.handle('cost:get-by-provider', async () => {
    return await costTracker.getCostByProvider();
  });

  ipcMain.handle('cost:get-history', async (_, duration) => {
    return await costTracker.getHistory(duration);
  });

  // Automation
  ipcMain.handle('automation:test', async () => {
    return await automationService.testAutomation();
  });

  // Settings
  ipcMain.handle('settings:get', async (_, key) => {
    const Store = require('electron-store');
    const store = new Store();
    return store.get(key);
  });

  ipcMain.handle('settings:set', async (_, key, value) => {
    const Store = require('electron-store');
    const store = new Store();
    store.set(key, value);
  });
}
