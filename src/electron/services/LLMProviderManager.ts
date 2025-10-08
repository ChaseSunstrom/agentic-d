import Store from 'electron-store';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { CostTracker } from './CostTracker';

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

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface CompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export class LLMProviderManager {
  private store: Store;
  private providers: Map<string, LLMProvider>;
  private clients: Map<string, any>;

  constructor(private costTracker: CostTracker) {
    this.store = new Store({ name: 'llm-providers' });
    this.providers = new Map();
    this.clients = new Map();
    this.loadProviders();
  }

  private loadProviders(): void {
    const savedProviders = this.store.get('providers', []) as LLMProvider[];
    savedProviders.forEach(provider => {
      this.providers.set(provider.id, provider);
      this.initializeClient(provider);
    });
  }

  private saveProviders(): void {
    this.store.set('providers', Array.from(this.providers.values()));
  }

  private initializeClient(provider: LLMProvider): void {
    switch (provider.type) {
      case 'openai':
        this.clients.set(provider.id, new OpenAI({
          apiKey: provider.apiKey,
          baseURL: provider.apiUrl
        }));
        break;
      case 'anthropic':
        this.clients.set(provider.id, new Anthropic({
          apiKey: provider.apiKey
        }));
        break;
      case 'deepseek':
        this.clients.set(provider.id, new OpenAI({
          apiKey: provider.apiKey,
          baseURL: provider.apiUrl || 'https://api.deepseek.com/v1'
        }));
        break;
      case 'custom':
      case 'local':
        // Will use axios for custom endpoints
        break;
    }
  }

  async addProvider(config: Omit<LLMProvider, 'id'>): Promise<LLMProvider> {
    const provider: LLMProvider = {
      ...config,
      id: `${config.type}_${Date.now()}`
    };

    this.providers.set(provider.id, provider);
    this.initializeClient(provider);
    this.saveProviders();
    return provider;
  }

  async listProviders(): Promise<LLMProvider[]> {
    return Array.from(this.providers.values());
  }

  getProvider(providerId: string): any {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return null;
    }

    return {
      provider,
      complete: async (
        model: string,
        messages: Message[],
        options: CompletionOptions = {}
      ): Promise<CompletionResponse> => {
        return await this.complete(providerId, model, messages, options);
      }
    };
  }

  private async complete(
    providerId: string,
    model: string,
    messages: Message[],
    options: CompletionOptions
  ): Promise<CompletionResponse> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    const client = this.clients.get(providerId);

    switch (provider.type) {
      case 'openai':
      case 'deepseek':
        return await this.completeOpenAI(client, model, messages, options);
      case 'anthropic':
        return await this.completeAnthropic(client, model, messages, options);
      case 'local':
        return await this.completeLocal(provider, model, messages, options);
      case 'custom':
        return await this.completeCustom(provider, model, messages, options);
      default:
        throw new Error('Unsupported provider type');
    }
  }

  private async completeOpenAI(
    client: OpenAI,
    model: string,
    messages: Message[],
    options: CompletionOptions
  ): Promise<CompletionResponse> {
    const response = await client.chat.completions.create({
      model,
      messages: messages as any,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      },
      model: response.model
    };
  }

  private async completeAnthropic(
    client: Anthropic,
    model: string,
    messages: Message[],
    options: CompletionOptions
  ): Promise<CompletionResponse> {
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const response = await client.messages.create({
      model,
      system: systemMessage?.content,
      messages: userMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000
    });

    const content = response.content[0];
    const textContent = content.type === 'text' ? content.text : '';

    return {
      content: textContent,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      model: response.model
    };
  }

  private async completeLocal(
    provider: LLMProvider,
    model: string,
    messages: Message[],
    options: CompletionOptions
  ): Promise<CompletionResponse> {
    // This would integrate with node-llama-cpp or similar
    const response = await axios.post(provider.apiUrl || 'http://localhost:8080/v1/chat/completions', {
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000
    });

    return {
      content: response.data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: response.data.usage?.prompt_tokens || 0,
        completionTokens: response.data.usage?.completion_tokens || 0,
        totalTokens: response.data.usage?.total_tokens || 0
      },
      model: response.data.model
    };
  }

  private async completeCustom(
    provider: LLMProvider,
    model: string,
    messages: Message[],
    options: CompletionOptions
  ): Promise<CompletionResponse> {
    if (!provider.apiUrl) {
      throw new Error('API URL required for custom provider');
    }

    const response = await axios.post(provider.apiUrl, {
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
      ...provider.config
    }, {
      headers: provider.apiKey ? {
        'Authorization': `Bearer ${provider.apiKey}`
      } : {}
    });

    return {
      content: response.data.choices?.[0]?.message?.content || response.data.content || '',
      usage: response.data.usage ? {
        promptTokens: response.data.usage.prompt_tokens || 0,
        completionTokens: response.data.usage.completion_tokens || 0,
        totalTokens: response.data.usage.total_tokens || 0
      } : undefined,
      model: response.data.model || model
    };
  }

  async testProvider(providerId: string): Promise<boolean> {
    try {
      const result = await this.complete(providerId, 'test', [
        { role: 'user', content: 'Hello, respond with OK' }
      ], { maxTokens: 10 });
      return result.content.length > 0;
    } catch (error) {
      console.error('Provider test failed:', error);
      return false;
    }
  }

  async deleteProvider(providerId: string): Promise<boolean> {
    const deleted = this.providers.delete(providerId);
    this.clients.delete(providerId);
    if (deleted) {
      this.saveProviders();
    }
    return deleted;
  }
}
