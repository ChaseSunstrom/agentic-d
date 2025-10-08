import { EventEmitter } from 'events';
import Store from 'electron-store';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';

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
  description?: string;
}

export class ModelManager extends EventEmitter {
  private store: Store;
  private modelsPath: string;
  private installedModels: Map<string, LocalModel>;

  // Curated list of popular open-source models
  private availableModels: LocalModel[] = [
    {
      id: 'llama-3.3-70b',
      name: 'Llama 3.3 70B Instruct',
      size: '40GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/bartowski/Llama-3.3-70B-Instruct-GGUF/resolve/main/Llama-3.3-70B-Instruct-Q4_K_M.gguf',
      installed: false,
      provider: 'Meta'
    },
    {
      id: 'llama-3.2-3b',
      name: 'Llama 3.2 3B Instruct',
      size: '2GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf',
      installed: false,
      provider: 'Meta'
    },
    {
      id: 'llama-3.2-1b',
      name: 'Llama 3.2 1B Instruct',
      size: '1GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
      installed: false,
      provider: 'Meta'
    },
    {
      id: 'codellama-13b',
      name: 'Code Llama 13B Instruct',
      size: '7.5GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/TheBloke/CodeLlama-13B-Instruct-GGUF/resolve/main/codellama-13b-instruct.Q4_K_M.gguf',
      installed: false,
      provider: 'Meta'
    },
    {
      id: 'codellama-7b',
      name: 'Code Llama 7B Instruct',
      size: '4GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/resolve/main/codellama-7b-instruct.Q4_K_M.gguf',
      installed: false,
      provider: 'Meta'
    },
    {
      id: 'qwen2.5-14b',
      name: 'Qwen 2.5 14B Instruct',
      size: '8GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/bartowski/Qwen2.5-14B-Instruct-GGUF/resolve/main/Qwen2.5-14B-Instruct-Q4_K_M.gguf',
      installed: false,
      provider: 'Alibaba'
    },
    {
      id: 'qwen2.5-7b',
      name: 'Qwen 2.5 7B Instruct',
      size: '4.5GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/bartowski/Qwen2.5-7B-Instruct-GGUF/resolve/main/Qwen2.5-7B-Instruct-Q4_K_M.gguf',
      installed: false,
      provider: 'Alibaba'
    },
    {
      id: 'qwen2.5-coder-7b',
      name: 'Qwen 2.5 Coder 7B Instruct',
      size: '4.5GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/bartowski/Qwen2.5-Coder-7B-Instruct-GGUF/resolve/main/Qwen2.5-Coder-7B-Instruct-Q4_K_M.gguf',
      installed: false,
      provider: 'Alibaba'
    },
    {
      id: 'qwen2.5-coder-14b',
      name: 'Qwen 2.5 Coder 14B Instruct',
      size: '8GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/bartowski/Qwen2.5-Coder-14B-Instruct-GGUF/resolve/main/Qwen2.5-Coder-14B-Instruct-Q4_K_M.gguf',
      installed: false,
      provider: 'Alibaba'
    },
    {
      id: 'deepseek-coder-v2-16b',
      name: 'DeepSeek Coder V2 16B Instruct',
      size: '9GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/bartowski/DeepSeek-Coder-V2-Instruct-16B-GGUF/resolve/main/DeepSeek-Coder-V2-Instruct-16B-Q4_K_M.gguf',
      installed: false,
      provider: 'DeepSeek'
    },
    {
      id: 'deepseek-coder-6.7b',
      name: 'DeepSeek Coder 6.7B',
      size: '4GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/TheBloke/deepseek-coder-6.7b-instruct-GGUF/resolve/main/deepseek-coder-6.7b-instruct.Q4_K_M.gguf',
      installed: false,
      provider: 'DeepSeek'
    },
    {
      id: 'mistral-7b-v0.3',
      name: 'Mistral 7B Instruct v0.3',
      size: '4.5GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/MaziyarPanahi/Mistral-7B-Instruct-v0.3-GGUF/resolve/main/Mistral-7B-Instruct-v0.3.Q4_K_M.gguf',
      installed: false,
      provider: 'Mistral AI'
    },
    {
      id: 'phi-3.5-mini',
      name: 'Phi-3.5 Mini Instruct',
      size: '2.5GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf',
      installed: false,
      provider: 'Microsoft'
    },
    {
      id: 'phi-3-mini',
      name: 'Phi-3 Mini',
      size: '2GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
      installed: false,
      provider: 'Microsoft'
    },
    {
      id: 'gemma-2-9b',
      name: 'Gemma 2 9B Instruct',
      size: '5.5GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/bartowski/gemma-2-9b-it-GGUF/resolve/main/gemma-2-9b-it-Q4_K_M.gguf',
      installed: false,
      provider: 'Google'
    },
    {
      id: 'gemma-2-2b',
      name: 'Gemma 2 2B Instruct',
      size: '1.5GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
      installed: false,
      provider: 'Google'
    },
    {
      id: 'gpt-oss-120b',
      name: 'GPT-OSS 120B',
      size: '70GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/mradermacher/GPT-OSS-120B-GGUF/resolve/main/GPT-OSS-120B.Q4_K_M.gguf',
      installed: false,
      provider: 'GPT-OSS',
      description: '117B parameters, optimized for high reasoning tasks. Requires 80GB GPU (e.g., NVIDIA H100).'
    },
    {
      id: 'gpt-oss-20b',
      name: 'GPT-OSS 20B',
      size: '12GB',
      format: 'GGUF',
      quantization: 'Q4_K_M',
      url: 'https://huggingface.co/mradermacher/GPT-OSS-20B-GGUF/resolve/main/GPT-OSS-20B.Q4_K_M.gguf',
      installed: false,
      provider: 'GPT-OSS',
      description: '21B parameters, designed for lower latency. Can run on consumer hardware with 16GB memory.'
    }
  ];

  constructor() {
    super();
    this.store = new Store({ name: 'models' });
    this.modelsPath = path.join(os.homedir(), '.autonomous-agent', 'models');
    this.installedModels = new Map();
    this.ensureModelsDirectory();
    this.loadInstalledModels();
  }

  private ensureModelsDirectory(): void {
    if (!fs.existsSync(this.modelsPath)) {
      fs.mkdirSync(this.modelsPath, { recursive: true });
    }
  }

  private loadInstalledModels(): void {
    const installed = this.store.get('installed', []) as LocalModel[];
    installed.forEach(model => {
      this.installedModels.set(model.id, model);
    });
  }

  private saveInstalledModels(): void {
    this.store.set('installed', Array.from(this.installedModels.values()));
  }

  async listAvailableModels(): Promise<LocalModel[]> {
    return this.availableModels.map(model => ({
      ...model,
      installed: this.installedModels.has(model.id)
    }));
  }

  async listInstalledModels(): Promise<LocalModel[]> {
    return Array.from(this.installedModels.values());
  }

  async installModel(modelId: string): Promise<boolean> {
    const model = this.availableModels.find(m => m.id === modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    if (this.installedModels.has(modelId)) {
      return false; // Already installed
    }

    if (!model.url) {
      throw new Error('Model URL not available');
    }

    try {
      const modelPath = path.join(this.modelsPath, `${modelId}.gguf`);
      
      // Download the model
      const response = await axios({
        method: 'GET',
        url: model.url,
        responseType: 'stream',
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            this.emit('download-progress', {
              modelId,
              progress,
              loaded: progressEvent.loaded,
              total: progressEvent.total
            });
          }
        }
      });

      const writer = fs.createWriteStream(modelPath);
      response.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', reject);
      });

      // Mark as installed
      const installedModel: LocalModel = {
        ...model,
        path: modelPath,
        installed: true
      };

      this.installedModels.set(modelId, installedModel);
      this.saveInstalledModels();
      this.emit('model-installed', installedModel);

      return true;
    } catch (error) {
      console.error('Model installation error:', error);
      throw error;
    }
  }

  async uninstallModel(modelId: string): Promise<boolean> {
    const model = this.installedModels.get(modelId);
    if (!model || !model.path) {
      return false;
    }

    try {
      if (fs.existsSync(model.path)) {
        fs.unlinkSync(model.path);
      }

      this.installedModels.delete(modelId);
      this.saveInstalledModels();
      this.emit('model-uninstalled', modelId);

      return true;
    } catch (error) {
      console.error('Model uninstallation error:', error);
      throw error;
    }
  }

  async scanForModels(): Promise<LocalModel[]> {
    const foundModels: LocalModel[] = [];

    try {
      // Scan the models directory for GGUF files
      const files = fs.readdirSync(this.modelsPath);
      
      for (const file of files) {
        if (file.endsWith('.gguf')) {
          const filePath = path.join(this.modelsPath, file);
          const stats = fs.statSync(filePath);
          
          const model: LocalModel = {
            id: file.replace('.gguf', ''),
            name: file.replace('.gguf', '').replace(/-/g, ' '),
            size: `${(stats.size / (1024 * 1024 * 1024)).toFixed(2)}GB`,
            format: 'GGUF',
            quantization: 'Unknown',
            path: filePath,
            installed: true,
            provider: 'Manual'
          };

          if (!this.installedModels.has(model.id)) {
            this.installedModels.set(model.id, model);
            foundModels.push(model);
          }
        }
      }

      if (foundModels.length > 0) {
        this.saveInstalledModels();
      }

      // Also scan common model directories
      const commonPaths = [
        path.join(os.homedir(), '.cache', 'lm-studio', 'models'),
        path.join(os.homedir(), '.ollama', 'models'),
        path.join(os.homedir(), 'models')
      ];

      for (const dir of commonPaths) {
        if (fs.existsSync(dir)) {
          try {
            const files = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
            for (const file of files) {
              if (file.isFile() && file.name.endsWith('.gguf')) {
                const filePath = path.join(file.path || dir, file.name);
                const stats = fs.statSync(filePath);
                
                const modelId = file.name.replace('.gguf', '');
                if (!this.installedModels.has(modelId)) {
                  const model: LocalModel = {
                    id: modelId,
                    name: modelId.replace(/-/g, ' '),
                    size: `${(stats.size / (1024 * 1024 * 1024)).toFixed(2)}GB`,
                    format: 'GGUF',
                    quantization: 'Unknown',
                    path: filePath,
                    installed: true,
                    provider: 'Manual'
                  };
                  
                  this.installedModels.set(modelId, model);
                  foundModels.push(model);
                }
              }
            }
          } catch (err) {
            // Skip directories we can't read
            console.warn(`Could not scan directory ${dir}:`, err);
          }
        }
      }

      if (foundModels.length > 0) {
        this.saveInstalledModels();
      }

      return foundModels;
    } catch (error) {
      console.error('Model scan error:', error);
      return foundModels;
    }
  }

  getModelPath(modelId: string): string | null {
    const model = this.installedModels.get(modelId);
    return model?.path || null;
  }
}
