import { EventEmitter } from 'events';
import { exec, spawn, ChildProcess } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import Store from 'electron-store';

export interface CommandResult {
  id: string;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  startTime: Date;
  endTime?: Date;
  duration: number;
  workingDir: string;
  agentId?: string;
}

export interface CommandExecution {
  id: string;
  command: string;
  status: 'running' | 'completed' | 'failed' | 'killed';
  process?: ChildProcess;
  result?: CommandResult;
  agentId?: string;
}

export interface CommandPermissions {
  allowedCommands: string[]; // Specific commands allowed, or ['*'] for all
  blockedCommands: string[]; // Commands explicitly blocked
  allowNetwork: boolean;
  allowFileSystem: boolean;
  allowPackageManagers: boolean; // npm, pip, apt, etc.
  maxExecutionTime: number; // milliseconds
  workingDir?: string; // Restrict to specific directory
}

export class CommandExecutor extends EventEmitter {
  private store: Store;
  private executions: Map<string, CommandExecution>;
  private history: CommandResult[];
  private defaultPermissions: CommandPermissions;

  constructor() {
    super();
    this.store = new Store({ name: 'command-executor' });
    this.executions = new Map();
    this.history = [];
    this.defaultPermissions = {
      allowedCommands: ['*'],
      blockedCommands: [
        'rm -rf /',
        'mkfs',
        'dd',
        'format',
        ':(){:|:&};:', // fork bomb
        'sudo rm',
        'sudo dd'
      ],
      allowNetwork: true,
      allowFileSystem: true,
      allowPackageManagers: true,
      maxExecutionTime: 300000 // 5 minutes
    };
    this.loadHistory();
  }

  private loadHistory(): void {
    const saved = this.store.get('history', []) as CommandResult[];
    this.history = saved.slice(-1000); // Keep last 1000 commands
  }

  private saveHistory(): void {
    this.store.set('history', this.history.slice(-1000));
  }

  private generateId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private validateCommand(command: string, permissions: CommandPermissions): { valid: boolean; reason?: string } {
    // Check blocked commands
    for (const blocked of permissions.blockedCommands) {
      if (command.includes(blocked)) {
        return { valid: false, reason: `Command contains blocked pattern: ${blocked}` };
      }
    }

    // Check allowed commands
    if (!permissions.allowedCommands.includes('*')) {
      const cmdName = command.split(' ')[0];
      if (!permissions.allowedCommands.includes(cmdName)) {
        return { valid: false, reason: `Command '${cmdName}' is not in allowed list` };
      }
    }

    // Check package managers
    if (!permissions.allowPackageManagers) {
      const packageManagers = ['npm', 'pip', 'apt', 'apt-get', 'yum', 'brew', 'cargo', 'gem'];
      const cmdName = command.split(' ')[0];
      if (packageManagers.includes(cmdName)) {
        return { valid: false, reason: 'Package manager commands are not allowed' };
      }
    }

    return { valid: true };
  }

  async executeCommand(
    command: string,
    options?: {
      agentId?: string;
      workingDir?: string;
      timeout?: number;
      permissions?: Partial<CommandPermissions>;
      env?: Record<string, string>;
    }
  ): Promise<CommandResult> {
    const id = this.generateId();
    const permissions = { ...this.defaultPermissions, ...options?.permissions };
    const workingDir = options?.workingDir || permissions.workingDir || os.homedir();
    const timeout = options?.timeout || permissions.maxExecutionTime;

    // Validate command
    const validation = this.validateCommand(command, permissions);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const startTime = new Date();
    const execution: CommandExecution = {
      id,
      command,
      status: 'running',
      agentId: options?.agentId
    };

    this.executions.set(id, execution);
    this.emit('command:started', { id, command, agentId: options?.agentId });

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let killed = false;

      const childProcess = spawn(command, {
        shell: true,
        cwd: workingDir,
        env: { ...process.env, ...options?.env },
        timeout
      });

      execution.process = childProcess;

      // Set timeout
      const timeoutHandle = setTimeout(() => {
        if (!killed && childProcess && !childProcess.killed) {
          killed = true;
          childProcess.kill('SIGTERM');
          setTimeout(() => {
            if (childProcess && !childProcess.killed) {
              childProcess.kill('SIGKILL');
            }
          }, 5000);
        }
      }, timeout);

      childProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        this.emit('command:stdout', { id, data: output });
      });

      childProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        this.emit('command:stderr', { id, data: output });
      });

      childProcess.on('error', (error) => {
        clearTimeout(timeoutHandle);
        execution.status = 'failed';
        
        const result: CommandResult = {
          id,
          command,
          stdout,
          stderr: stderr + error.message,
          exitCode: null,
          startTime,
          endTime: new Date(),
          duration: Date.now() - startTime.getTime(),
          workingDir,
          agentId: options?.agentId
        };

        execution.result = result;
        this.history.push(result);
        this.saveHistory();
        this.emit('command:error', { id, error });
        
        reject(error);
      });

      childProcess.on('exit', (code, signal) => {
        clearTimeout(timeoutHandle);
        
        const endTime = new Date();
        const result: CommandResult = {
          id,
          command,
          stdout,
          stderr: killed ? stderr + '\nCommand timed out' : stderr,
          exitCode: code,
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
          workingDir,
          agentId: options?.agentId
        };

        execution.status = killed ? 'killed' : (code === 0 ? 'completed' : 'failed');
        execution.result = result;
        
        this.history.push(result);
        this.saveHistory();
        this.executions.delete(id);
        
        this.emit('command:completed', result);
        resolve(result);
      });
    });
  }

  async executeInteractive(
    command: string,
    input: string,
    options?: {
      agentId?: string;
      workingDir?: string;
      permissions?: Partial<CommandPermissions>;
    }
  ): Promise<CommandResult> {
    const id = this.generateId();
    const permissions = { ...this.defaultPermissions, ...options?.permissions };
    const workingDir = options?.workingDir || permissions.workingDir || os.homedir();

    // Validate command
    const validation = this.validateCommand(command, permissions);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const startTime = new Date();

    return new Promise((resolve, reject) => {
      exec(command, {
        cwd: workingDir,
        timeout: permissions.maxExecutionTime
      }, (error, stdout, stderr) => {
        const endTime = new Date();
        const result: CommandResult = {
          id,
          command,
          stdout: stdout.toString(),
          stderr: error ? (stderr.toString() + error.message) : stderr.toString(),
          exitCode: error?.code || 0,
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
          workingDir,
          agentId: options?.agentId
        };

        this.history.push(result);
        this.saveHistory();

        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }).stdin?.write(input);
    });
  }

  killCommand(id: string): boolean {
    const execution = this.executions.get(id);
    if (!execution || !execution.process) {
      return false;
    }

    execution.status = 'killed';
    execution.process.kill('SIGTERM');
    
    setTimeout(() => {
      if (execution.process && !execution.process.killed) {
        execution.process.kill('SIGKILL');
      }
    }, 5000);

    return true;
  }

  getExecution(id: string): CommandExecution | undefined {
    return this.executions.get(id);
  }

  getRunningCommands(): CommandExecution[] {
    return Array.from(this.executions.values());
  }

  getHistory(agentId?: string, limit: number = 100): CommandResult[] {
    let filtered = this.history;
    
    if (agentId) {
      filtered = filtered.filter(cmd => cmd.agentId === agentId);
    }
    
    return filtered.slice(-limit);
  }

  clearHistory(agentId?: string): void {
    if (agentId) {
      this.history = this.history.filter(cmd => cmd.agentId !== agentId);
    } else {
      this.history = [];
    }
    this.saveHistory();
  }

  getPermissions(): CommandPermissions {
    return { ...this.defaultPermissions };
  }

  updatePermissions(permissions: Partial<CommandPermissions>): void {
    Object.assign(this.defaultPermissions, permissions);
  }

  // Utility method to check if a command is safe
  isCommandSafe(command: string): boolean {
    const validation = this.validateCommand(command, this.defaultPermissions);
    return validation.valid;
  }

  // Quick execute for simple commands
  async run(command: string, agentId?: string): Promise<string> {
    const result = await this.executeCommand(command, { agentId });
    if (result.exitCode !== 0) {
      throw new Error(result.stderr || 'Command failed');
    }
    return result.stdout;
  }
}
