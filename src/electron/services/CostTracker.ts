import Store from 'electron-store';

export interface CostEntry {
  id: string;
  agentId: string;
  providerId: string;
  model: string;
  timestamp: Date;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export interface CostSummary {
  total: number;
  byAgent: Map<string, number>;
  byProvider: Map<string, number>;
  byModel: Map<string, number>;
}

// Pricing per 1M tokens (approximate values as of 2024)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-4': { input: 30, output: 60 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'gpt-4o': { input: 5, output: 15 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  
  // Anthropic
  'claude-3-opus': { input: 15, output: 75 },
  'claude-3-sonnet': { input: 3, output: 15 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
  'claude-3-5-sonnet': { input: 3, output: 15 },
  
  // DeepSeek
  'deepseek-chat': { input: 0.14, output: 0.28 },
  'deepseek-coder': { input: 0.14, output: 0.28 },
  
  // Local models (free)
  'local': { input: 0, output: 0 }
};

export class CostTracker {
  private store: Store;
  private entries: CostEntry[] = [];

  constructor() {
    this.store = new Store({ name: 'cost-tracking' });
    this.loadEntries();
  }

  private loadEntries(): void {
    this.entries = this.store.get('entries', []) as CostEntry[];
  }

  private saveEntries(): void {
    this.store.set('entries', this.entries);
  }

  calculateCost(providerId: string, model: string, usage: { promptTokens: number; completionTokens: number }): number {
    // Local models are free
    if (providerId.includes('local')) {
      return 0;
    }

    // Find pricing for the model
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-3.5-turbo']; // Default fallback
    
    const inputCost = (usage.promptTokens / 1_000_000) * pricing.input;
    const outputCost = (usage.completionTokens / 1_000_000) * pricing.output;
    
    return inputCost + outputCost;
  }

  trackUsage(
    agentId: string,
    providerId: string,
    model: string,
    usage: { promptTokens: number; completionTokens: number; totalTokens: number },
    cost: number
  ): void {
    const entry: CostEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      providerId,
      model,
      timestamp: new Date(),
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      cost
    };

    this.entries.push(entry);
    
    // Keep only last 10000 entries
    if (this.entries.length > 10000) {
      this.entries = this.entries.slice(-10000);
    }
    
    this.saveEntries();
  }

  async getTotalCost(): Promise<number> {
    return this.entries.reduce((sum, entry) => sum + entry.cost, 0);
  }

  async getCostByAgent(): Promise<Record<string, number>> {
    const costMap: Record<string, number> = {};
    
    this.entries.forEach(entry => {
      if (!costMap[entry.agentId]) {
        costMap[entry.agentId] = 0;
      }
      costMap[entry.agentId] += entry.cost;
    });
    
    return costMap;
  }

  async getCostByProvider(): Promise<Record<string, number>> {
    const costMap: Record<string, number> = {};
    
    this.entries.forEach(entry => {
      if (!costMap[entry.providerId]) {
        costMap[entry.providerId] = 0;
      }
      costMap[entry.providerId] += entry.cost;
    });
    
    return costMap;
  }

  async getHistory(duration: string = '24h'): Promise<CostEntry[]> {
    const now = Date.now();
    let cutoff: number;

    switch (duration) {
      case '1h':
        cutoff = now - 60 * 60 * 1000;
        break;
      case '6h':
        cutoff = now - 6 * 60 * 60 * 1000;
        break;
      case '24h':
        cutoff = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        cutoff = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        cutoff = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        cutoff = now - 24 * 60 * 60 * 1000;
    }

    return this.entries.filter(entry => new Date(entry.timestamp).getTime() >= cutoff);
  }

  async getSummary(): Promise<CostSummary> {
    const total = await this.getTotalCost();
    const byAgent = new Map(Object.entries(await this.getCostByAgent()));
    const byProvider = new Map(Object.entries(await this.getCostByProvider()));
    
    const byModel = new Map<string, number>();
    this.entries.forEach(entry => {
      const current = byModel.get(entry.model) || 0;
      byModel.set(entry.model, current + entry.cost);
    });

    return { total, byAgent, byProvider, byModel };
  }
}
