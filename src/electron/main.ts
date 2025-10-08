import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { AgentManager } from './services/AgentManager';
import { LLMProviderManager } from './services/LLMProviderManager';
import { ModelManager } from './services/ModelManager';
import { AutomationService } from './services/AutomationService';
import { ResourceMonitor } from './services/ResourceMonitor';
import { CostTracker } from './services/CostTracker';
import { AgentCommunication } from './services/AgentCommunication';
import { CommandExecutor } from './services/CommandExecutor';
import { LlamaManager } from './services/LlamaManager';
import { OllamaManager } from './services/OllamaManager';
import { UserPromptService } from './services/UserPromptService';

let mainWindow: BrowserWindow | null = null;
let agentManager: AgentManager;
let llmProviderManager: LLMProviderManager;
let modelManager: ModelManager;
let automationService: AutomationService;
let resourceMonitor: ResourceMonitor;
let costTracker: CostTracker;
let agentCommunication: AgentCommunication;
let commandExecutor: CommandExecutor;
let llamaManager: LlamaManager;
let ollamaManager: OllamaManager;
let userPromptService: UserPromptService;

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
  createWindow();

  // Initialize services
  costTracker = new CostTracker();
  llmProviderManager = new LLMProviderManager(costTracker);
  modelManager = new ModelManager();
  automationService = new AutomationService();
  resourceMonitor = new ResourceMonitor();
  agentCommunication = new AgentCommunication();
  commandExecutor = new CommandExecutor();
  llamaManager = new LlamaManager();
  ollamaManager = new OllamaManager();
  userPromptService = new UserPromptService(mainWindow);
  agentManager = new AgentManager(
    llmProviderManager, 
    automationService, 
    resourceMonitor, 
    costTracker,
    agentCommunication,
    commandExecutor,
    userPromptService
  );

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
    llamaManager?.stopAllServers();
    ollamaManager?.destroy();
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

  // Agent Communication
  ipcMain.handle('agent:send-message', async (_, fromAgentId, toAgentId, content, type) => {
    return await agentManager.sendAgentMessage(fromAgentId, toAgentId, content, type);
  });

  ipcMain.handle('agent:get-messages', async (_, agentId, includeRead) => {
    return await agentManager.getAgentMessages(agentId, includeRead);
  });

  ipcMain.handle('agent:get-tasks', async (_, agentId) => {
    return await agentManager.getAgentTasks(agentId);
  });

  ipcMain.handle('agent:delegate-task', async (_, fromAgentId, toAgentId, description) => {
    return await agentManager.delegateTask(fromAgentId, toAgentId, description);
  });

  // Command Execution
  ipcMain.handle('command:execute', async (_, command, options) => {
    return await commandExecutor.executeCommand(command, options);
  });

  ipcMain.handle('command:kill', async (_, id) => {
    return commandExecutor.killCommand(id);
  });

  ipcMain.handle('command:get-running', async () => {
    return commandExecutor.getRunningCommands();
  });

  ipcMain.handle('command:get-history', async (_, agentId, limit) => {
    return commandExecutor.getHistory(agentId, limit);
  });

  ipcMain.handle('command:is-safe', async (_, command) => {
    return commandExecutor.isCommandSafe(command);
  });

  // Llama.cpp Management
  ipcMain.handle('llama:is-installed', async () => {
    return await llamaManager.isInstalled();
  });

  ipcMain.handle('llama:install', async () => {
    return await llamaManager.installLlamaCpp();
  });

  ipcMain.handle('llama:uninstall', async () => {
    return await llamaManager.uninstallLlamaCpp();
  });

  ipcMain.handle('llama:start-server', async (_, modelPath, config) => {
    return await llamaManager.startServer(modelPath, config);
  });

  ipcMain.handle('llama:stop-server', async (_, id) => {
    return await llamaManager.stopServer(id);
  });

  ipcMain.handle('llama:get-servers', async () => {
    return llamaManager.getRunningServers();
  });

  ipcMain.handle('llama:get-version', async () => {
    return llamaManager.getVersion();
  });

  // Ollama Management
  ipcMain.handle('ollama:check-installation', async () => {
    return await ollamaManager.checkInstallation();
  });

  ipcMain.handle('ollama:is-running', async () => {
    return await ollamaManager.isRunning();
  });

  ipcMain.handle('ollama:start', async () => {
    return await ollamaManager.startOllama();
  });

  ipcMain.handle('ollama:list-models', async () => {
    return await ollamaManager.listModels();
  });

  ipcMain.handle('ollama:pull-model', async (_, modelName) => {
    return await ollamaManager.pullModel(modelName);
  });

  ipcMain.handle('ollama:delete-model', async (_, modelName) => {
    return await ollamaManager.deleteModel(modelName);
  });

  ipcMain.handle('ollama:get-recommended', async () => {
    return ollamaManager.getRecommendedModels();
  });

  ipcMain.handle('ollama:get-model-info', async (_, modelName) => {
    return await ollamaManager.getModelInfo(modelName);
  });

  // Setup event forwarding to renderer
  llamaManager.on('install:progress', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('llama:install-progress', data);
    }
  });

  ollamaManager.on('model:pull:progress', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('ollama:pull-progress', data);
    }
  });

  commandExecutor.on('command:completed', (result) => {
    if (mainWindow) {
      mainWindow.webContents.send('command:completed', result);
    }
  });

  agentCommunication.on('message:sent', (message) => {
    if (mainWindow) {
      mainWindow.webContents.send('agent:message', message);
    }
  });

  // User Prompt APIs
  ipcMain.handle('user-prompt:respond', async (_, promptId, response) => {
    return userPromptService.respondToPrompt(promptId, response);
  });

  ipcMain.handle('user-prompt:cancel', async (_, promptId) => {
    return userPromptService.cancelPrompt(promptId);
  });

  ipcMain.handle('user-prompt:get-pending', async () => {
    return userPromptService.getPendingPrompts();
  });

  ipcMain.handle('user-prompt:get-current', async () => {
    return userPromptService.getCurrentPrompt();
  });

  ipcMain.handle('user-prompt:get-history', async (_, agentId) => {
    return userPromptService.getPromptHistory(agentId);
  });

  ipcMain.handle('user-prompt:clear-history', async () => {
    userPromptService.clearHistory();
  });

  // Automation APIs with screenshot
  ipcMain.handle('automation:screenshot', async (_, region) => {
    return await automationService.executeCommand({
      type: 'screenshot',
      params: region ? { region } : undefined
    });
  });

  ipcMain.handle('automation:execute', async (_, command) => {
    return await automationService.executeCommand(command);
  });
}
