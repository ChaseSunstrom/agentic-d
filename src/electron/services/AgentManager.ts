import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import Store from 'electron-store';
import { LLMProviderManager } from './LLMProviderManager';
import { AutomationService } from './AutomationService';
import { ResourceMonitor } from './ResourceMonitor';
import { CostTracker } from './CostTracker';
import { AgentCommunication } from './AgentCommunication';
import { CommandExecutor } from './CommandExecutor';

export interface Agent {
  id: string;
  name: string;
  description: string;
  llmProvider: string;
  model: string;
  systemPrompt: string;
  capabilities: {
    computerControl: boolean;
    fileSystem: boolean;
    network: boolean;
    agentCommunication: boolean;
    commandExecution: boolean;
  };
  status: 'idle' | 'running' | 'paused' | 'error';
  config: {
    maxTokens: number;
    temperature: number;
    maxIterations: number;
    autonomyLevel: 'low' | 'medium' | 'high';
  };
  stats: {
    totalRuns: number;
    totalTokens: number;
    totalCost: number;
    lastRun?: Date;
    averageRunTime: number;
    messagesSent: number;
    messagesReceived: number;
    commandsExecuted: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentTask {
  id: string;
  agentId: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: string;
  logs: Array<{ timestamp: Date; level: string; message: string }>;
  delegatedFrom?: string; // Agent ID that delegated this task
  delegatedTo?: string; // Agent ID that this task is delegated to
}

export class AgentManager extends EventEmitter {
  private store: Store;
  private agents: Map<string, Agent>;
  private tasks: Map<string, AgentTask>;
  private runningAgents: Map<string, NodeJS.Timeout>;
  
  constructor(
    private llmProviderManager: LLMProviderManager,
    private automationService: AutomationService,
    private resourceMonitor: ResourceMonitor,
    private costTracker: CostTracker,
    private agentCommunication: AgentCommunication,
    private commandExecutor: CommandExecutor
  ) {
    super();
    this.store = new Store({ name: 'agents' });
    this.agents = new Map();
    this.tasks = new Map();
    this.runningAgents = new Map();
    this.loadAgents();
    this.setupCommunicationHandlers();
  }

  private setupCommunicationHandlers(): void {
    // Listen for messages and create tasks when agents receive requests
    this.agentCommunication.on('message:sent', (message: any) => {
      if (message.type === 'request' && message.metadata?.requiresResponse) {
        const agent = this.agents.get(message.toAgentId);
        if (agent && agent.status === 'running') {
          // Create a task for the receiving agent
          const task: AgentTask = {
            id: uuidv4(),
            agentId: message.toAgentId,
            description: `Respond to request from ${message.fromAgentId}: ${message.content}`,
            status: 'pending',
            logs: [],
            delegatedFrom: message.fromAgentId
          };
          this.tasks.set(task.id, task);
        }
      }
    });
  }

  private loadAgents(): void {
    const savedAgents = this.store.get('agents', []) as Agent[];
    savedAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  private saveAgents(): void {
    this.store.set('agents', Array.from(this.agents.values()));
  }

  async createAgent(config: Omit<Agent, 'id' | 'status' | 'stats' | 'createdAt' | 'updatedAt'>): Promise<Agent> {
    const agent: Agent = {
      ...config,
      id: uuidv4(),
      status: 'idle',
      stats: {
        totalRuns: 0,
        totalTokens: 0,
        totalCost: 0,
        averageRunTime: 0,
        messagesSent: 0,
        messagesReceived: 0,
        commandsExecuted: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.agents.set(agent.id, agent);
    this.saveAgents();
    this.emit('agent:created', agent);
    return agent;
  }

  async startAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    if (agent.status === 'running') {
      return false;
    }

    agent.status = 'running';
    agent.updatedAt = new Date();
    this.saveAgents();
    this.emit('agent:status-change', { agentId, status: 'running' });

    // Start the agent loop
    await this.runAgentLoop(agent);
    return true;
  }

  private async runAgentLoop(agent: Agent): Promise<void> {
    const runAgent = async () => {
      if (agent.status !== 'running') {
        return;
      }

      try {
        const startTime = Date.now();
        
        // Get the next task or create a decision task
        const task = await this.getNextTask(agent);
        
        if (task) {
          await this.executeTask(agent, task);
        }

        // Update stats
        const endTime = Date.now();
        const runTime = endTime - startTime;
        agent.stats.totalRuns++;
        agent.stats.averageRunTime = 
          (agent.stats.averageRunTime * (agent.stats.totalRuns - 1) + runTime) / agent.stats.totalRuns;
        agent.stats.lastRun = new Date();
        agent.updatedAt = new Date();
        this.saveAgents();

        // Schedule next iteration
        if (agent.status === 'running') {
          const timeout = setTimeout(runAgent, 5000); // Run every 5 seconds
          this.runningAgents.set(agent.id, timeout);
        }
      } catch (error) {
        console.error(`Agent ${agent.id} error:`, error);
        this.emit('agent:log', {
          agentId: agent.id,
          level: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    };

    runAgent();
  }

  private async getNextTask(agent: Agent): Promise<AgentTask | null> {
    // Check for pending tasks
    const pendingTasks = Array.from(this.tasks.values()).filter(
      task => task.agentId === agent.id && task.status === 'pending'
    );

    if (pendingTasks.length > 0) {
      return pendingTasks[0];
    }

    // If no pending tasks, ask the LLM what to do next
    const decision = await this.makeAgentDecision(agent);
    
    if (decision && decision.action !== 'idle') {
      const task: AgentTask = {
        id: uuidv4(),
        agentId: agent.id,
        description: decision.description,
        status: 'pending',
        logs: []
      };
      this.tasks.set(task.id, task);
      return task;
    }

    return null;
  }

  private async makeAgentDecision(agent: Agent): Promise<any> {
    const provider = this.llmProviderManager.getProvider(agent.llmProvider);
    if (!provider) {
      throw new Error('LLM provider not found');
    }

    // Check for new messages if communication is enabled
    let messages: any[] = [];
    if (agent.capabilities.agentCommunication) {
      messages = this.agentCommunication.getMessages(agent.id, false);
      agent.stats.messagesReceived += messages.length;
      // Mark messages as read
      messages.forEach(msg => this.agentCommunication.markAsRead(msg.id));
    }

    // Get available agents for delegation
    const availableAgents = Array.from(this.agents.values())
      .filter(a => a.id !== agent.id && a.status === 'running')
      .map(a => ({ id: a.id, name: a.name, description: a.description }));

    const systemContext = {
      agentName: agent.name,
      capabilities: agent.capabilities,
      stats: agent.stats,
      systemResources: await this.resourceMonitor.getResourceUsage(),
      newMessages: messages,
      availableAgents: agent.capabilities.agentCommunication ? availableAgents : []
    };

    const capabilitiesPrompt = agent.capabilities.agentCommunication 
      ? '\n\nYou can communicate with other agents using SEND_MESSAGE action.'
      + '\nYou can delegate tasks using DELEGATE_TASK action.'
      : '';
    
    const commandPrompt = agent.capabilities.commandExecution
      ? '\n\nYou can execute terminal commands using EXECUTE_COMMAND action.'
      : '';

    const prompt = `${agent.systemPrompt}\n\nYou are an autonomous agent. Based on your objectives and current context, what should you do next?${capabilitiesPrompt}${commandPrompt}\n\nContext: ${JSON.stringify(systemContext, null, 2)}\n\nRespond with a JSON object containing: { "action": "action_type", "description": "what you'll do", "steps": ["step1", "step2"], "data": {} }`;

    try {
      const response = await provider.complete(agent.model, [
        { role: 'system', content: agent.systemPrompt },
        { role: 'user', content: prompt }
      ], {
        temperature: agent.config.temperature,
        maxTokens: agent.config.maxTokens
      });

      // Track cost
      if (response.usage) {
        const cost = this.costTracker.calculateCost(
          agent.llmProvider,
          agent.model,
          response.usage
        );
        this.costTracker.trackUsage(agent.id, agent.llmProvider, agent.model, response.usage, cost);
        agent.stats.totalTokens += response.usage.totalTokens || 0;
        agent.stats.totalCost += cost;
      }

      const decision = JSON.parse(response.content);
      
      // Handle special actions immediately
      if (decision.action === 'SEND_MESSAGE' && agent.capabilities.agentCommunication) {
        this.agentCommunication.sendMessage(
          agent.id,
          decision.data.toAgentId || 'broadcast',
          decision.data.message,
          decision.data.type || 'notification',
          decision.data.metadata
        );
        agent.stats.messagesSent++;
        this.saveAgents();
      } else if (decision.action === 'DELEGATE_TASK' && agent.capabilities.agentCommunication) {
        await this.delegateTask(agent.id, decision.data.toAgentId, decision.data.taskDescription);
      } else if (decision.action === 'EXECUTE_COMMAND' && agent.capabilities.commandExecution) {
        try {
          const result = await this.commandExecutor.executeCommand(
            decision.data.command,
            { agentId: agent.id }
          );
          agent.stats.commandsExecuted++;
          this.saveAgents();
          decision.commandResult = result;
        } catch (error) {
          console.error('Command execution error:', error);
          decision.commandError = error instanceof Error ? error.message : 'Unknown error';
        }
      }
      
      return decision;
    } catch (error) {
      console.error('Decision making error:', error);
      return { action: 'idle' };
    }
  }

  async delegateTask(fromAgentId: string, toAgentId: string, description: string): Promise<AgentTask> {
    const task: AgentTask = {
      id: uuidv4(),
      agentId: toAgentId,
      description,
      status: 'pending',
      logs: [],
      delegatedFrom: fromAgentId
    };

    this.tasks.set(task.id, task);
    
    // Also send a message to notify the target agent
    this.agentCommunication.sendMessage(
      fromAgentId,
      toAgentId,
      `Task delegated: ${description}`,
      'request',
      { requiresResponse: true }
    );

    this.emit('task:delegated', task);
    return task;
  }

  private async executeTask(agent: Agent, task: AgentTask): Promise<void> {
    task.status = 'running';
    task.startTime = new Date();
    this.emit('agent:log', {
      agentId: agent.id,
      level: 'info',
      message: `Starting task: ${task.description}`,
      timestamp: new Date()
    });

    try {
      const provider = this.llmProviderManager.getProvider(agent.llmProvider);
      if (!provider) {
        throw new Error('LLM provider not found');
      }

      // Execute the task with the LLM
      const response = await provider.complete(agent.model, [
        { role: 'system', content: agent.systemPrompt },
        { role: 'user', content: `Execute this task: ${task.description}\n\nProvide detailed steps and results.` }
      ], {
        temperature: agent.config.temperature,
        maxTokens: agent.config.maxTokens
      });

      // Track cost
      if (response.usage) {
        const cost = this.costTracker.calculateCost(
          agent.llmProvider,
          agent.model,
          response.usage
        );
        this.costTracker.trackUsage(agent.id, agent.llmProvider, agent.model, response.usage, cost);
        agent.stats.totalTokens += response.usage.totalTokens || 0;
        agent.stats.totalCost += cost;
      }

      // Parse the response for special actions
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(response.content);
      } catch {
        parsedResponse = { result: response.content };
      }

      // Handle various action types
      if (parsedResponse.action === 'SEND_MESSAGE' && agent.capabilities.agentCommunication) {
        this.agentCommunication.sendMessage(
          agent.id,
          parsedResponse.data.toAgentId || 'broadcast',
          parsedResponse.data.message,
          parsedResponse.data.type || 'notification',
          parsedResponse.data.metadata
        );
        agent.stats.messagesSent++;
        this.saveAgents();
      } else if (parsedResponse.action === 'EXECUTE_COMMAND' && agent.capabilities.commandExecution) {
        try {
          const cmdResult = await this.commandExecutor.executeCommand(
            parsedResponse.data.command,
            { agentId: agent.id }
          );
          agent.stats.commandsExecuted++;
          this.saveAgents();
          parsedResponse.commandResult = cmdResult;
        } catch (error) {
          parsedResponse.commandError = error instanceof Error ? error.message : 'Unknown error';
        }
      }

      // If computer control is enabled, execute automation actions
      if (agent.capabilities.computerControl && response.content.includes('AUTOMATION:')) {
        await this.executeAutomationCommands(response.content);
      }

      task.result = parsedResponse;
      task.status = 'completed';
      task.endTime = new Date();
      
      this.emit('agent:log', {
        agentId: agent.id,
        level: 'success',
        message: `Task completed: ${task.description}`,
        timestamp: new Date()
      });
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.endTime = new Date();
      
      this.emit('agent:log', {
        agentId: agent.id,
        level: 'error',
        message: `Task failed: ${task.description} - ${task.error}`,
        timestamp: new Date()
      });
    }
  }

  private async executeAutomationCommands(content: string): Promise<void> {
    const automationRegex = /AUTOMATION:\s*(\{[^}]+\})/g;
    const matches = content.matchAll(automationRegex);
    
    for (const match of matches) {
      try {
        const command = JSON.parse(match[1]);
        await this.automationService.executeCommand(command);
      } catch (error) {
        console.error('Automation command error:', error);
      }
    }
  }

  async stopAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    if (agent.status !== 'running') {
      return false;
    }

    agent.status = 'idle';
    agent.updatedAt = new Date();
    this.saveAgents();

    // Clear the running timeout
    const timeout = this.runningAgents.get(agentId);
    if (timeout) {
      clearTimeout(timeout);
      this.runningAgents.delete(agentId);
    }

    this.emit('agent:status-change', { agentId, status: 'idle' });
    return true;
  }

  stopAllAgents(): void {
    this.agents.forEach(agent => {
      if (agent.status === 'running') {
        this.stopAgent(agent.id);
      }
    });
  }

  async deleteAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }

    if (agent.status === 'running') {
      await this.stopAgent(agentId);
    }

    this.agents.delete(agentId);
    this.saveAgents();
    this.emit('agent:deleted', agentId);
    return true;
  }

  async listAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async getAgent(agentId: string): Promise<Agent | null> {
    return this.agents.get(agentId) || null;
  }

  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<Agent | null> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return null;
    }

    Object.assign(agent, updates, { updatedAt: new Date() });
    this.saveAgents();
    this.emit('agent:updated', agent);
    return agent;
  }

  // Get messages for an agent
  async getAgentMessages(agentId: string, includeRead: boolean = false): Promise<any[]> {
    return this.agentCommunication.getMessages(agentId, includeRead);
  }

  // Send message from an agent
  async sendAgentMessage(
    fromAgentId: string,
    toAgentId: string | 'broadcast',
    content: string,
    type: any = 'notification'
  ): Promise<any> {
    const agent = this.agents.get(fromAgentId);
    if (agent) {
      agent.stats.messagesSent++;
      this.saveAgents();
    }
    return this.agentCommunication.sendMessage(fromAgentId, toAgentId, content, type);
  }

  // Get command execution history for an agent
  async getAgentCommandHistory(agentId: string, limit: number = 50): Promise<any[]> {
    return this.commandExecutor.getHistory(agentId, limit);
  }

  // Get all tasks
  async getAllTasks(): Promise<AgentTask[]> {
    return Array.from(this.tasks.values());
  }

  // Get tasks for a specific agent
  async getAgentTasks(agentId: string): Promise<AgentTask[]> {
    return Array.from(this.tasks.values()).filter(task => task.agentId === agentId);
  }
}
