import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';
import Store from 'electron-store';
import { spawn, ChildProcess } from 'child_process';

export interface LlamaBinary {
  platform: string;
  arch: string;
  url: string;
  version: string;
}

export interface LlamaServer {
  id: string;
  modelPath: string;
  port: number;
  process?: ChildProcess;
  status: 'starting' | 'running' | 'stopped' | 'error';
  startTime?: Date;
  config: {
    contextSize: number;
    threads: number;
    gpuLayers: number;
    batchSize: number;
  };
}

export class LlamaManager extends EventEmitter {
  private store: Store;
  private llamaPath: string;
  private binaryPath: string;
  private servers: Map<string, LlamaServer>;
  
  // Latest llama.cpp release info
  private readonly LLAMA_CPP_VERSION = 'b4356';
  private readonly LLAMA_CPP_REPO = 'ggerganov/llama.cpp';

  constructor() {
    super();
    this.store = new Store({ name: 'llama-manager' });
    this.llamaPath = path.join(os.homedir(), '.autonomous-agent', 'llama');
    this.binaryPath = path.join(this.llamaPath, 'bin');
    this.servers = new Map();
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.llamaPath)) {
      fs.mkdirSync(this.llamaPath, { recursive: true });
    }
    if (!fs.existsSync(this.binaryPath)) {
      fs.mkdirSync(this.binaryPath, { recursive: true });
    }
  }

  private getBinaryUrl(): string {
    const platform = os.platform();
    const arch = os.arch();

    // Determine the appropriate binary based on platform and architecture
    const baseUrl = `https://github.com/${this.LLAMA_CPP_REPO}/releases/download/${this.LLAMA_CPP_VERSION}`;

    if (platform === 'win32') {
      if (arch === 'x64') {
        return `${baseUrl}/llama-${this.LLAMA_CPP_VERSION}-bin-win-vulkan-x64.zip`;
      }
      return `${baseUrl}/llama-${this.LLAMA_CPP_VERSION}-bin-win-avx2-x64.zip`;
    } else if (platform === 'darwin') {
      if (arch === 'arm64') {
        return `${baseUrl}/llama-${this.LLAMA_CPP_VERSION}-bin-macos-arm64.zip`;
      }
      return `${baseUrl}/llama-${this.LLAMA_CPP_VERSION}-bin-macos-x64.zip`;
    } else if (platform === 'linux') {
      if (arch === 'x64') {
        return `${baseUrl}/llama-${this.LLAMA_CPP_VERSION}-bin-ubuntu-x64.zip`;
      } else if (arch === 'arm64') {
        return `${baseUrl}/llama-${this.LLAMA_CPP_VERSION}-bin-ubuntu-aarch64.zip`;
      }
    }

    throw new Error(`Unsupported platform: ${platform} ${arch}`);
  }

  async isInstalled(): Promise<boolean> {
    const serverBinary = this.getServerBinaryPath();
    return fs.existsSync(serverBinary);
  }

  private getServerBinaryPath(): string {
    const platform = os.platform();
    const binaryName = platform === 'win32' ? 'llama-server.exe' : 'llama-server';
    return path.join(this.binaryPath, binaryName);
  }

  async installLlamaCpp(): Promise<boolean> {
    try {
      this.emit('install:started');

      // Check if already installed
      if (await this.isInstalled()) {
        this.emit('install:completed');
        return true;
      }

      // Download the binary
      const downloadUrl = this.getBinaryUrl();
      this.emit('install:downloading', { url: downloadUrl });

      const zipPath = path.join(this.llamaPath, 'llama.zip');
      const response = await axios({
        method: 'GET',
        url: downloadUrl,
        responseType: 'stream',
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            this.emit('install:progress', {
              progress,
              loaded: progressEvent.loaded,
              total: progressEvent.total
            });
          }
        }
      });

      const writer = fs.createWriteStream(zipPath);
      response.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', reject);
      });

      // Extract the zip file
      this.emit('install:extracting');
      const extract = require('extract-zip');
      await extract(zipPath, { dir: this.binaryPath });

      // Make binaries executable on Unix systems
      if (os.platform() !== 'win32') {
        const binaries = fs.readdirSync(this.binaryPath);
        for (const binary of binaries) {
          const binaryPath = path.join(this.binaryPath, binary);
          if (fs.statSync(binaryPath).isFile()) {
            fs.chmodSync(binaryPath, '755');
          }
        }
      }

      // Clean up
      fs.unlinkSync(zipPath);

      this.emit('install:completed');
      return true;
    } catch (error) {
      this.emit('install:error', error);
      console.error('llama.cpp installation error:', error);
      throw error;
    }
  }

  async uninstallLlamaCpp(): Promise<boolean> {
    try {
      // Stop all running servers
      for (const [id, _] of this.servers) {
        await this.stopServer(id);
      }

      // Delete the binary directory
      if (fs.existsSync(this.binaryPath)) {
        fs.rmSync(this.binaryPath, { recursive: true, force: true });
      }

      this.emit('uninstall:completed');
      return true;
    } catch (error) {
      console.error('llama.cpp uninstallation error:', error);
      throw error;
    }
  }

  async startServer(
    modelPath: string,
    config?: Partial<LlamaServer['config']>
  ): Promise<LlamaServer> {
    if (!await this.isInstalled()) {
      throw new Error('llama.cpp is not installed. Please install it first.');
    }

    if (!fs.existsSync(modelPath)) {
      throw new Error(`Model file not found: ${modelPath}`);
    }

    const id = `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const port = await this.findAvailablePort(8080);

    const serverConfig: LlamaServer = {
      id,
      modelPath,
      port,
      status: 'starting',
      config: {
        contextSize: config?.contextSize || 2048,
        threads: config?.threads || Math.max(1, os.cpus().length - 1),
        gpuLayers: config?.gpuLayers || 0,
        batchSize: config?.batchSize || 512
      }
    };

    const serverBinary = this.getServerBinaryPath();
    const args = [
      '-m', modelPath,
      '-c', serverConfig.config.contextSize.toString(),
      '-t', serverConfig.config.threads.toString(),
      '-ngl', serverConfig.config.gpuLayers.toString(),
      '-b', serverConfig.config.batchSize.toString(),
      '--port', port.toString(),
      '--host', '127.0.0.1'
    ];

    const process = spawn(serverBinary, args, {
      cwd: this.binaryPath,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    serverConfig.process = process;
    this.servers.set(id, serverConfig);

    process.stdout?.on('data', (data) => {
      const output = data.toString();
      this.emit('server:log', { id, data: output });
      
      // Check if server is ready
      if (output.includes('HTTP server listening')) {
        serverConfig.status = 'running';
        serverConfig.startTime = new Date();
        this.emit('server:started', serverConfig);
      }
    });

    process.stderr?.on('data', (data) => {
      this.emit('server:error', { id, data: data.toString() });
    });

    process.on('exit', (code) => {
      serverConfig.status = code === 0 ? 'stopped' : 'error';
      this.servers.delete(id);
      this.emit('server:stopped', { id, code });
    });

    // Wait for server to start
    await this.waitForServer(port, 30000);

    return serverConfig;
  }

  async stopServer(id: string): Promise<boolean> {
    const server = this.servers.get(id);
    if (!server || !server.process) {
      return false;
    }

    server.process.kill('SIGTERM');
    
    // Force kill if not stopped after 5 seconds
    setTimeout(() => {
      if (server.process && !server.process.killed) {
        server.process.kill('SIGKILL');
      }
    }, 5000);

    this.servers.delete(id);
    return true;
  }

  async stopAllServers(): Promise<void> {
    const promises = Array.from(this.servers.keys()).map(id => this.stopServer(id));
    await Promise.all(promises);
  }

  getServer(id: string): LlamaServer | undefined {
    return this.servers.get(id);
  }

  getRunningServers(): LlamaServer[] {
    return Array.from(this.servers.values()).filter(s => s.status === 'running');
  }

  private async findAvailablePort(startPort: number): Promise<number> {
    const net = require('net');
    
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.listen(startPort, () => {
        const port = server.address().port;
        server.close(() => resolve(port));
      });
      server.on('error', () => {
        resolve(this.findAvailablePort(startPort + 1));
      });
    });
  }

  private async waitForServer(port: number, timeout: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        await axios.get(`http://127.0.0.1:${port}/health`, { timeout: 1000 });
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    throw new Error('Server failed to start within timeout');
  }

  getVersion(): string {
    return this.LLAMA_CPP_VERSION;
  }

  getBinaryPath(): string {
    return this.binaryPath;
  }
}
