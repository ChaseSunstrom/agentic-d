# New Features & Enhancements

## Version 2.0 - Enhanced Agent Capabilities

### 🤝 Agent Communication System

Agents can now communicate and collaborate with each other!

**Features:**
- **Message Passing**: Agents can send messages to specific agents or broadcast to all agents
- **Message Types**: Support for requests, responses, notifications, and data messages
- **Priority System**: Messages can be tagged with priority levels (low, medium, high, urgent)
- **Shared Memory**: Agents can share data through a common memory space with access controls
- **Task Delegation**: Agents can delegate tasks to other agents

**Usage:**
When creating an agent, enable "Agent Communication" capability. Agents will automatically:
- Check for new messages during their decision loop
- Respond to requests from other agents
- Access shared knowledge stored by other agents
- Delegate tasks to specialized agents

**API:**
```typescript
// Send message from one agent to another
await agentManager.sendAgentMessage(fromAgentId, toAgentId, content, type);

// Get messages for an agent
const messages = await agentManager.getAgentMessages(agentId);

// Delegate task
await agentManager.delegateTask(fromAgentId, toAgentId, taskDescription);

// Shared memory
agentCommunication.setSharedData(key, value, agentId, permissions);
const data = agentCommunication.getSharedData(key, agentId);
```

---

### ⌨️ Command Execution

Agents can now execute terminal commands safely!

**Features:**
- **Safe Execution**: Dangerous commands are automatically blocked
- **Permission System**: Configurable allowed/blocked command lists
- **Timeout Protection**: Commands are automatically killed if they run too long
- **Output Capture**: Full stdout/stderr capture and logging
- **Command History**: Complete history of all executed commands
- **Real-time Monitoring**: View running commands and their status

**Safety Features:**
- Blocks dangerous commands (rm -rf /, mkfs, format, fork bombs, etc.)
- Configurable maximum execution time (default 5 minutes)
- Optional package manager restrictions
- Command validation before execution

**Usage:**
Enable "Command Execution" capability when creating an agent. The agent can execute commands like:
- File operations (ls, cat, grep, etc.)
- Package installations (npm install, pip install, etc.)
- Build commands (npm run, make, etc.)
- Git operations (git status, git pull, etc.)

**UI:**
- Navigate to "Commands" page to view history and execute manual commands
- See real-time command output and exit codes
- Monitor running commands and kill if needed

---

### 🦙 Llama.cpp Direct Integration

Install and run llama.cpp directly from the app!

**Features:**
- **One-Click Installation**: Automatically download and install llama.cpp for your platform
- **Binary Management**: Manage llama-server binaries
- **Server Control**: Start/stop llama.cpp servers with custom configurations
- **Multi-Model Support**: Run multiple models simultaneously on different ports
- **GPU Support**: Configure GPU layers for acceleration
- **Auto-Configuration**: Automatic CPU thread and batch size optimization

**Supported Platforms:**
- Linux (x64, ARM64)
- macOS (x64, Apple Silicon)
- Windows (x64)

**Usage:**
1. Go to Settings or use the llama installation API
2. Click "Install llama.cpp" - it will download the appropriate binary
3. Start a server with your installed GGUF model
4. Use the server URL as a local LLM provider

**API:**
```typescript
// Check if installed
const installed = await llamaManager.isInstalled();

// Install llama.cpp
await llamaManager.installLlamaCpp();

// Start server
const server = await llamaManager.startServer(modelPath, {
  contextSize: 2048,
  threads: 8,
  gpuLayers: 0,
  batchSize: 512
});

// Stop server
await llamaManager.stopServer(serverId);
```

---

### 🦙 Enhanced Ollama Integration

Comprehensive Ollama management built-in!

**Features:**
- **Auto-Detection**: Automatically detects if Ollama is installed
- **Status Monitoring**: Real-time Ollama server status
- **Model Management**: Browse, pull, and delete Ollama models
- **Recommended Models**: Curated list of models optimized for autonomous agents
- **Download Progress**: Real-time progress tracking for model downloads
- **Version Detection**: Shows installed Ollama version

**Recommended Models Include:**
- **Llama 3.3 70B**: Latest Llama model (best quality)
- **Llama 3.2 3B/1B**: Smaller, faster models
- **Qwen 2.5 7B/14B**: Multilingual support
- **Qwen 2.5 Coder**: Best for coding tasks
- **Code Llama 13B**: Specialized for code generation
- **DeepSeek Coder V2**: Advanced coding capabilities
- **Phi-3 Mini**: Microsoft's efficient model
- **Mistral 7B**: Efficient general-purpose model
- **Gemma 2 9B**: Google's latest model

**Usage:**
1. Navigate to the "Ollama" page
2. If not installed, click link to download Ollama
3. Start Ollama if not running
4. Browse recommended models and pull the ones you need
5. Use pulled models with a Local LLM provider pointing to Ollama

---

### 💾 Expanded Model Library

18 new models added to the downloadable model library!

**New Models:**
- **Llama 3.3 70B Instruct** (40GB) - Latest Meta model
- **Llama 3.2 3B Instruct** (2GB) - Fast, efficient
- **Llama 3.2 1B Instruct** (1GB) - Ultra-fast
- **Code Llama 13B Instruct** (7.5GB) - Code generation
- **Code Llama 7B Instruct** (4GB) - Code generation
- **Qwen 2.5 14B Instruct** (8GB) - Advanced reasoning
- **Qwen 2.5 7B Instruct** (4.5GB) - Balanced performance
- **Qwen 2.5 Coder 7B** (4.5GB) - Code specialist
- **Qwen 2.5 Coder 14B** (8GB) - Advanced code specialist
- **DeepSeek Coder V2 16B** (9GB) - Latest coding model
- **Mistral 7B v0.3** (4.5GB) - Updated Mistral
- **Phi-3.5 Mini** (2.5GB) - Latest Microsoft model
- **Gemma 2 9B** (5.5GB) - Google's instruction model
- **Gemma 2 2B** (1.5GB) - Compact Google model
- **GPT-OSS 120B** (70GB) - 117B parameters, optimized for high reasoning tasks (requires 80GB GPU like H100)
- **GPT-OSS 20B** (12GB) - 21B parameters, designed for lower latency (runs on 16GB consumer hardware)

All models are in GGUF format (Q4_K_M quantization) and can be installed directly from the app.

---

## Enhanced Agent Capabilities Summary

### Updated Agent Interface

Agents now track additional statistics:
- `messagesSent`: Number of messages sent to other agents
- `messagesReceived`: Number of messages received from other agents
- `commandsExecuted`: Number of terminal commands executed

### New Capability Flags

When creating agents, you can now enable:
- `agentCommunication`: Enable inter-agent messaging and delegation
- `commandExecution`: Allow terminal command execution

### Agent Decision Making

Agents now have access to:
- Messages from other agents
- List of available agents for delegation
- Ability to execute commands
- Shared memory/context from the agent network

### Action Types

Agents can now perform these special actions:
- `SEND_MESSAGE`: Send a message to another agent or broadcast
- `DELEGATE_TASK`: Delegate a task to a specific agent
- `EXECUTE_COMMAND`: Run a terminal command
- `SET_SHARED_DATA`: Store data in shared memory
- `GET_SHARED_DATA`: Retrieve data from shared memory

---

## UI Enhancements

### New Pages

1. **Ollama Page** (`/ollama`)
   - Ollama installation status
   - Server control
   - Model management
   - Recommended models with one-click installation

2. **Commands Page** (`/commands`)
   - Command execution interface
   - Real-time command monitoring
   - Complete command history
   - Safety warnings and status indicators

### Updated Components

1. **CreateAgentModal**
   - Added "Agent Communication" checkbox
   - Added "Command Execution" checkbox
   - Updated capability descriptions

2. **AgentCard**
   - Shows new capability badges (💬 Agent Comms, ⌨️ Commands)
   - Displays message statistics (sent/received)
   - Displays command execution count
   - Improved stats layout

3. **Sidebar**
   - Added "Ollama" navigation item (🦙)
   - Added "Commands" navigation item (⌨️)

---

## Installation

### Prerequisites

No changes to prerequisites. The app now includes:
- Automatic llama.cpp installation
- Ollama integration (optional)
- All dependencies bundled

### Setup

```bash
# Install dependencies (including new ones)
npm install

# Start development
npm start

# Build for production
npm run package
```

---

## Security Considerations

### Command Execution Safety

The command execution feature includes multiple safety layers:

1. **Blocked Commands**: Dangerous commands are blocked by default
   - `rm -rf /`, `mkfs`, `dd`, `format`
   - Fork bombs and system destruction commands
   - Can be customized in command permissions

2. **Timeout Protection**: Commands are killed after maximum execution time

3. **Audit Trail**: All commands are logged with:
   - Command text
   - Agent ID (if executed by agent)
   - Exit code
   - Stdout/stderr
   - Timestamp and duration

### Agent Communication Security

1. **Shared Memory Permissions**: 
   - Read/write access control per agent
   - Data expiration support
   - Optional wildcard permissions

2. **Message Validation**:
   - All messages are validated and sanitized
   - Message history is persisted securely
   - Automatic cleanup of old messages (7 days)

---

## API Reference

### New IPC Handlers

```typescript
// Agent Communication
'agent:send-message' (fromAgentId, toAgentId, content, type)
'agent:get-messages' (agentId, includeRead)
'agent:get-tasks' (agentId)
'agent:delegate-task' (fromAgentId, toAgentId, description)

// Command Execution
'command:execute' (command, options)
'command:kill' (id)
'command:get-running' ()
'command:get-history' (agentId, limit)
'command:is-safe' (command)

// Llama.cpp Management
'llama:is-installed' ()
'llama:install' ()
'llama:uninstall' ()
'llama:start-server' (modelPath, config)
'llama:stop-server' (id)
'llama:get-servers' ()
'llama:get-version' ()

// Ollama Management
'ollama:check-installation' ()
'ollama:is-running' ()
'ollama:start' ()
'ollama:list-models' ()
'ollama:pull-model' (modelName)
'ollama:delete-model' (modelName)
'ollama:get-recommended' ()
'ollama:get-model-info' (modelName)
```

### Event Handlers

```typescript
// Progress events
'llama:install-progress' (data)
'ollama:pull-progress' (data)
'command:completed' (result)
'agent:message' (message)
```

---

## Examples

### Example 1: Creating a Collaborative Agent Team

```javascript
// Create a research agent
const researchAgent = await agentManager.createAgent({
  name: 'Research Assistant',
  description: 'Researches topics and gathers information',
  llmProvider: 'openai',
  model: 'gpt-4',
  systemPrompt: 'You are a research assistant. Gather information and share findings.',
  capabilities: {
    computerControl: false,
    fileSystem: false,
    network: true,
    agentCommunication: true,
    commandExecution: false
  },
  config: { temperature: 0.7, maxTokens: 2000, maxIterations: 100, autonomyLevel: 'medium' }
});

// Create a coding agent
const codingAgent = await agentManager.createAgent({
  name: 'Code Writer',
  description: 'Writes and tests code',
  llmProvider: 'openai',
  model: 'gpt-4',
  systemPrompt: 'You are a coding assistant. Write clean, tested code.',
  capabilities: {
    computerControl: false,
    fileSystem: true,
    network: false,
    agentCommunication: true,
    commandExecution: true
  },
  config: { temperature: 0.3, maxTokens: 4000, maxIterations: 100, autonomyLevel: 'medium' }
});

// Start both agents - they can now communicate and collaborate!
await agentManager.startAgent(researchAgent.id);
await agentManager.startAgent(codingAgent.id);
```

### Example 2: Safe Command Execution

```javascript
// Execute a safe command
const result = await commandExecutor.executeCommand('ls -la', {
  agentId: 'my-agent-id',
  workingDir: '/home/user/project',
  timeout: 10000
});

console.log(result.stdout); // Command output
console.log(result.exitCode); // 0 for success
```

### Example 3: Using Ollama Models

```javascript
// Check Ollama status
const status = await ollamaManager.checkInstallation();

if (!status.running) {
  await ollamaManager.startOllama();
}

// Pull a recommended model
await ollamaManager.pullModel('llama3.3:latest');

// Use with agent
const agent = await agentManager.createAgent({
  name: 'Local LLM Agent',
  llmProvider: 'local-ollama',
  model: 'llama3.3:latest',
  // ... rest of config
});
```

---

## Troubleshooting

### Llama.cpp Installation Issues

**Problem**: Installation fails or binary not found
**Solution**: 
- Check internet connection
- Ensure sufficient disk space (~500MB)
- On Linux, you may need: `sudo apt-get install unzip`

### Ollama Not Detected

**Problem**: App says Ollama is not installed but it is
**Solution**:
- Ensure Ollama is in your PATH
- Try starting Ollama manually: `ollama serve`
- Check common installation paths in OllamaManager

### Command Execution Blocked

**Problem**: Commands are being blocked that shouldn't be
**Solution**:
- Check the blocked commands list in CommandExecutor
- Use `command:is-safe` to test if a command is allowed
- Modify `defaultPermissions` in CommandExecutor if needed

### Agent Communication Issues

**Problem**: Agents not receiving messages
**Solution**:
- Ensure "Agent Communication" capability is enabled
- Check that both agents are running
- Verify messages are being created in the AgentCommunication service
- Messages are only processed during the agent's decision loop

---

## Performance Tips

1. **Model Selection**: Smaller models (1B-7B) are faster but less capable
2. **GPU Acceleration**: Enable GPU layers in llama.cpp for faster inference
3. **Command Execution**: Use short timeouts for faster feedback
4. **Agent Communication**: Cleanup old messages periodically to save memory
5. **Ollama**: Keep only models you actively use to save disk space

---

## Future Enhancements (Planned)

- [ ] Web search integration for agents
- [ ] Database query capabilities
- [ ] File editing and creation
- [ ] Visual workflow builder
- [ ] Agent templates and presets
- [ ] Multi-modal support (images, audio)
- [ ] Agent performance analytics
- [ ] Collaborative learning between agents
- [ ] Plugin system for custom capabilities

---

## Contributing

We welcome contributions! Areas of interest:
- Additional model integrations
- More command safety rules
- Agent collaboration patterns
- UI/UX improvements
- Performance optimizations

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues, questions, or feature requests, please open an issue on GitHub.
