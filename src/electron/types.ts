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

export interface LLMProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'deepseek' | 'local' | 'custom';
  apiKey?: string;
  apiUrl?: string;
  models: string[];
  enabled: boolean;
  config?: any;
}

export interface LocalModel {
  id: string;
  name: string;
  size: string;
  format: string;
  quantization: string;
  path?: string;
  url?: string;
  installed: boolean;
  downloadProgress?: number;
  provider: string;
}
