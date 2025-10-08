import { EventEmitter } from 'events';
import axios from 'axios';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import Store from 'electron-store';

const execPromise = promisify(exec);

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified: Date;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaInstallation {
  installed: boolean;
  version?: string;
  path?: string;
  running: boolean;
  apiUrl: string;
}

export class OllamaManager extends EventEmitter {
  private store: Store;
  private apiUrl: string;
  private installCheckInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.store = new Store({ name: 'ollama-manager' });
    this.apiUrl = this.store.get('apiUrl', 'http://localhost:11434') as string;
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Check Ollama status every 30 seconds
    this.installCheckInterval = setInterval(() => {
      this.checkInstallation().catch(console.error);
    }, 30000);
  }

  async checkInstallation(): Promise<OllamaInstallation> {
    const installation: OllamaInstallation = {
      installed: false,
      running: false,
      apiUrl: this.apiUrl
    };

    // Check if Ollama is installed
    try {
      const { stdout } = await execPromise('ollama --version');
      installation.installed = true;
      installation.version = stdout.trim().replace('ollama version ', '');
      
      // Try to find the binary path
      if (os.platform() !== 'win32') {
        const { stdout: whichOutput } = await execPromise('which ollama');
        installation.path = whichOutput.trim();
      }
    } catch (error) {
      // Ollama not in PATH, check common installation locations
      const commonPaths = this.getCommonPaths();
      for (const testPath of commonPaths) {
        if (fs.existsSync(testPath)) {
          installation.installed = true;
          installation.path = testPath;
          
          try {
            const { stdout } = await execPromise(`"${testPath}" --version`);
            installation.version = stdout.trim().replace('ollama version ', '');
          } catch {}
          break;
        }
      }
    }

    // Check if Ollama is running
    if (installation.installed) {
      installation.running = await this.isRunning();
    }

    this.emit('installation:checked', installation);
    return installation;
  }

  private getCommonPaths(): string[] {
    const platform = os.platform();
    
    if (platform === 'win32') {
      return [
        path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Ollama', 'ollama.exe'),
        'C:\\Program Files\\Ollama\\ollama.exe',
        'C:\\Program Files (x86)\\Ollama\\ollama.exe'
      ];
    } else if (platform === 'darwin') {
      return [
        '/usr/local/bin/ollama',
        '/opt/homebrew/bin/ollama',
        path.join(os.homedir(), '.ollama', 'bin', 'ollama')
      ];
    } else {
      return [
        '/usr/local/bin/ollama',
        '/usr/bin/ollama',
        path.join(os.homedir(), '.ollama', 'bin', 'ollama'),
        path.join(os.homedir(), '.local', 'bin', 'ollama')
      ];
    }
  }

  async isRunning(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/tags`, {
        timeout: 2000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async startOllama(): Promise<boolean> {
    const installation = await this.checkInstallation();
    
    if (!installation.installed) {
      throw new Error('Ollama is not installed');
    }

    if (installation.running) {
      return true;
    }

    try {
      // Try to start Ollama
      if (os.platform() === 'darwin') {
        await execPromise('open -a Ollama');
      } else if (os.platform() === 'win32') {
        await execPromise('start ollama serve');
      } else {
        // Linux - try systemctl first, then direct command
        try {
          await execPromise('systemctl --user start ollama');
        } catch {
          exec('ollama serve &');
        }
      }

      // Wait for Ollama to start (up to 10 seconds)
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (await this.isRunning()) {
          this.emit('ollama:started');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to start Ollama:', error);
      return false;
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/tags`);
      return response.data.models.map((model: any) => ({
        name: model.name,
        size: model.size,
        digest: model.digest,
        modified: new Date(model.modified_at),
        details: model.details ? {
          format: model.details.format,
          family: model.details.family,
          parameter_size: model.details.parameter_size,
          quantization_level: model.details.quantization_level
        } : undefined
      }));
    } catch (error) {
      if (!await this.isRunning()) {
        throw new Error('Ollama is not running. Please start Ollama first.');
      }
      throw error;
    }
  }

  async pullModel(modelName: string): Promise<void> {
    if (!await this.isRunning()) {
      throw new Error('Ollama is not running. Please start Ollama first.');
    }

    try {
      this.emit('model:pull:started', { modelName });

      const response = await axios.post(
        `${this.apiUrl}/api/pull`,
        { name: modelName },
        {
          responseType: 'stream',
          timeout: 0 // No timeout for model downloads
        }
      );

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          try {
            const lines = chunk.toString().split('\n').filter(Boolean);
            for (const line of lines) {
              const data = JSON.parse(line);
              
              if (data.status) {
                this.emit('model:pull:progress', {
                  modelName,
                  status: data.status,
                  completed: data.completed,
                  total: data.total,
                  progress: data.total ? Math.round((data.completed / data.total) * 100) : 0
                });
              }

              if (data.status === 'success' || line.includes('success')) {
                this.emit('model:pull:completed', { modelName });
                resolve();
              }
            }
          } catch (error) {
            // Ignore JSON parse errors
          }
        });

        response.data.on('end', () => {
          this.emit('model:pull:completed', { modelName });
          resolve();
        });

        response.data.on('error', (error: Error) => {
          this.emit('model:pull:error', { modelName, error });
          reject(error);
        });
      });
    } catch (error) {
      this.emit('model:pull:error', { modelName, error });
      throw error;
    }
  }

  async deleteModel(modelName: string): Promise<boolean> {
    if (!await this.isRunning()) {
      throw new Error('Ollama is not running. Please start Ollama first.');
    }

    try {
      await axios.delete(`${this.apiUrl}/api/delete`, {
        data: { name: modelName }
      });
      this.emit('model:deleted', { modelName });
      return true;
    } catch (error) {
      console.error('Failed to delete model:', error);
      return false;
    }
  }

  async generate(
    model: string,
    prompt: string,
    options?: {
      temperature?: number;
      top_p?: number;
      top_k?: number;
      stream?: boolean;
    }
  ): Promise<string> {
    if (!await this.isRunning()) {
      throw new Error('Ollama is not running. Please start Ollama first.');
    }

    try {
      const response = await axios.post(`${this.apiUrl}/api/generate`, {
        model,
        prompt,
        stream: false,
        options: {
          temperature: options?.temperature,
          top_p: options?.top_p,
          top_k: options?.top_k
        }
      });

      return response.data.response;
    } catch (error) {
      console.error('Generation error:', error);
      throw error;
    }
  }

  async chat(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options?: {
      temperature?: number;
      top_p?: number;
      top_k?: number;
    }
  ): Promise<string> {
    if (!await this.isRunning()) {
      throw new Error('Ollama is not running. Please start Ollama first.');
    }

    try {
      const response = await axios.post(`${this.apiUrl}/api/chat`, {
        model,
        messages,
        stream: false,
        options: {
          temperature: options?.temperature,
          top_p: options?.top_p,
          top_k: options?.top_k
        }
      });

      return response.data.message.content;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  async getModelInfo(modelName: string): Promise<any> {
    if (!await this.isRunning()) {
      throw new Error('Ollama is not running. Please start Ollama first.');
    }

    try {
      const response = await axios.post(`${this.apiUrl}/api/show`, {
        name: modelName
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get model info:', error);
      throw error;
    }
  }

  // Recommended models for different use cases
  getRecommendedModels(): Array<{ name: string; description: string; size: string }> {
    return [
      { name: 'llama3.3:latest', description: 'Latest Llama 3.3 model (best quality)', size: '~40GB' },
      { name: 'llama3.2:3b', description: 'Llama 3.2 3B (small, fast)', size: '~2GB' },
      { name: 'llama3.2:1b', description: 'Llama 3.2 1B (very fast)', size: '~1GB' },
      { name: 'qwen2.5:7b', description: 'Qwen 2.5 7B (multilingual)', size: '~4.5GB' },
      { name: 'qwen2.5-coder:7b', description: 'Qwen 2.5 Coder (best for coding)', size: '~4.5GB' },
      { name: 'codellama:13b', description: 'Code Llama 13B (code generation)', size: '~7GB' },
      { name: 'mistral:7b', description: 'Mistral 7B (efficient)', size: '~4GB' },
      { name: 'phi3:3.8b', description: 'Phi-3 3.8B (Microsoft, efficient)', size: '~2.3GB' },
      { name: 'gemma2:9b', description: 'Gemma 2 9B (Google)', size: '~5.5GB' },
      { name: 'deepseek-coder-v2:16b', description: 'DeepSeek Coder V2 (advanced coding)', size: '~8.9GB' }
    ];
  }

  setApiUrl(url: string): void {
    this.apiUrl = url;
    this.store.set('apiUrl', url);
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  destroy(): void {
    if (this.installCheckInterval) {
      clearInterval(this.installCheckInterval);
    }
  }
}
