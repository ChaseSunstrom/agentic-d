import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import Store from 'electron-store';
import { LLMProviderManager } from './LLMProviderManager';
import { AutomationService } from './AutomationService';
import { ResourceMonitor } from './ResourceMonitor';
import { CostTracker } from './CostTracker';

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
    private costTracker: CostTracker
  ) {
    super();
    this.store = new Store({ name: 'agents' });
    this.agents = new Map();
    this.tasks = new Map();
    this.runningAgents = new Map();
    this.loadAgents();
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
        averageRunTime: 0
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

    const systemContext = {
      agentName: agent.name,
      capabilities: agent.capabilities,
      stats: agent.stats,
      systemResources: await this.resourceMonitor.getResourceUsage()
    };

    const prompt = `${agent.systemPrompt}\n\nYou are an autonomous agent. Based on your objectives and current context, what should you do next?\n\nContext: ${JSON.stringify(systemContext, null, 2)}\n\nRespond with a JSON object containing: { "action": "action_type", "description": "what you'll do", "steps": ["step1", "step2"] }`;

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

      return JSON.parse(response.content);
    } catch (error) {
      console.error('Decision making error:', error);
      return { action: 'idle' };
    }
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

      // If computer control is enabled, execute automation actions
      if (agent.capabilities.computerControl && response.content.includes('AUTOMATION:')) {
        await this.executeAutomationCommands(response.content);
      }

      task.result = response.content;
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
}
