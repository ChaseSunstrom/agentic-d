import { EventEmitter } from 'events';
import { BrowserWindow } from 'electron';

export interface UserPrompt {
  id: string;
  agentId: string;
  agentName: string;
  type: 'question' | 'confirmation' | 'choice' | 'approval';
  title: string;
  message: string;
  options?: string[]; // For choice type
  defaultValue?: string | boolean;
  timestamp: Date;
  status: 'pending' | 'answered' | 'cancelled' | 'timeout';
  response?: any;
  context?: any; // Additional context about what the agent wants to do
}

export class UserPromptService extends EventEmitter {
  private prompts: Map<string, UserPrompt>;
  private mainWindow: BrowserWindow | null;
  private promptQueue: UserPrompt[];
  private currentPrompt: UserPrompt | null;
  private promptTimeout: number = 300000; // 5 minutes default timeout

  constructor(mainWindow?: BrowserWindow | null) {
    super();
    this.prompts = new Map();
    this.mainWindow = mainWindow || null;
    this.promptQueue = [];
    this.currentPrompt = null;
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  async askQuestion(
    agentId: string,
    agentName: string,
    question: string,
    context?: any
  ): Promise<string> {
    const prompt: UserPrompt = {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      agentName,
      type: 'question',
      title: `Question from ${agentName}`,
      message: question,
      timestamp: new Date(),
      status: 'pending',
      context
    };

    return this.queuePrompt(prompt);
  }

  async askConfirmation(
    agentId: string,
    agentName: string,
    message: string,
    context?: any
  ): Promise<boolean> {
    const prompt: UserPrompt = {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      agentName,
      type: 'confirmation',
      title: `Confirmation from ${agentName}`,
      message,
      timestamp: new Date(),
      status: 'pending',
      context
    };

    const response = await this.queuePrompt(prompt);
    return response === true || response === 'yes' || response === 'true';
  }

  async askChoice(
    agentId: string,
    agentName: string,
    question: string,
    options: string[],
    context?: any
  ): Promise<string> {
    const prompt: UserPrompt = {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      agentName,
      type: 'choice',
      title: `Choice from ${agentName}`,
      message: question,
      options,
      timestamp: new Date(),
      status: 'pending',
      context
    };

    return this.queuePrompt(prompt);
  }

  async askApproval(
    agentId: string,
    agentName: string,
    action: string,
    details?: string,
    context?: any
  ): Promise<boolean> {
    const message = details 
      ? `${action}\n\nDetails: ${details}`
      : action;

    const prompt: UserPrompt = {
      id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      agentName,
      type: 'approval',
      title: `Approval Request from ${agentName}`,
      message,
      timestamp: new Date(),
      status: 'pending',
      context
    };

    const response = await this.queuePrompt(prompt);
    return response === true || response === 'approve' || response === 'yes';
  }

  private async queuePrompt(prompt: UserPrompt): Promise<any> {
    this.prompts.set(prompt.id, prompt);
    this.promptQueue.push(prompt);
    this.emit('prompt:created', prompt);

    // Send to renderer
    if (this.mainWindow) {
      this.mainWindow.webContents.send('user-prompt:new', prompt);
    }

    // Process queue if no current prompt
    if (!this.currentPrompt) {
      this.processNextPrompt();
    }

    // Wait for response or timeout
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        if (prompt.status === 'pending') {
          prompt.status = 'timeout';
          this.emit('prompt:timeout', prompt);
          reject(new Error('Prompt timed out'));
        }
      }, this.promptTimeout);

      const checkResponse = () => {
        const updatedPrompt = this.prompts.get(prompt.id);
        if (updatedPrompt && updatedPrompt.status === 'answered') {
          clearTimeout(timeoutHandle);
          resolve(updatedPrompt.response);
        } else if (updatedPrompt && updatedPrompt.status === 'cancelled') {
          clearTimeout(timeoutHandle);
          reject(new Error('Prompt cancelled by user'));
        } else if (updatedPrompt && updatedPrompt.status === 'timeout') {
          clearTimeout(timeoutHandle);
          reject(new Error('Prompt timed out'));
        } else if (updatedPrompt && updatedPrompt.status === 'pending') {
          setTimeout(checkResponse, 100);
        }
      };

      checkResponse();
    });
  }

  private processNextPrompt(): void {
    if (this.promptQueue.length === 0) {
      this.currentPrompt = null;
      return;
    }

    this.currentPrompt = this.promptQueue.shift()!;
    this.emit('prompt:active', this.currentPrompt);
    
    if (this.mainWindow) {
      this.mainWindow.webContents.send('user-prompt:show', this.currentPrompt);
    }
  }

  respondToPrompt(promptId: string, response: any): boolean {
    const prompt = this.prompts.get(promptId);
    if (!prompt || prompt.status !== 'pending') {
      return false;
    }

    prompt.status = 'answered';
    prompt.response = response;
    this.emit('prompt:answered', prompt);

    if (this.mainWindow) {
      this.mainWindow.webContents.send('user-prompt:answered', prompt);
    }

    // Process next prompt in queue
    if (this.currentPrompt?.id === promptId) {
      this.processNextPrompt();
    }

    return true;
  }

  cancelPrompt(promptId: string): boolean {
    const prompt = this.prompts.get(promptId);
    if (!prompt || prompt.status !== 'pending') {
      return false;
    }

    prompt.status = 'cancelled';
    this.emit('prompt:cancelled', prompt);

    if (this.mainWindow) {
      this.mainWindow.webContents.send('user-prompt:cancelled', prompt);
    }

    // Process next prompt in queue
    if (this.currentPrompt?.id === promptId) {
      this.processNextPrompt();
    }

    return true;
  }

  getPendingPrompts(): UserPrompt[] {
    return Array.from(this.prompts.values()).filter(p => p.status === 'pending');
  }

  getPromptHistory(agentId?: string): UserPrompt[] {
    let prompts = Array.from(this.prompts.values());
    if (agentId) {
      prompts = prompts.filter(p => p.agentId === agentId);
    }
    return prompts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getCurrentPrompt(): UserPrompt | null {
    return this.currentPrompt;
  }

  clearHistory(): void {
    // Keep only pending prompts
    const pending = this.getPendingPrompts();
    this.prompts.clear();
    pending.forEach(p => this.prompts.set(p.id, p));
  }

  setPromptTimeout(timeout: number): void {
    this.promptTimeout = timeout;
  }
}
