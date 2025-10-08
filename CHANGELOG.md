# Changelog

## [2.0.0] - 2025-01-08

### Major Features Added

#### 🤝 Agent Communication System
- **NEW**: Complete inter-agent communication system
  - Message passing between agents (direct and broadcast)
  - Shared memory/context with access controls  
  - Task delegation system
  - Message types: request, response, notification, data
  - Priority levels: low, medium, high, urgent
  - Automatic message cleanup (7 days retention)

#### ⌨️ Command Execution
- **NEW**: Safe command execution service
  - Execute terminal commands with permission controls
  - Blocked dangerous commands (rm -rf, mkfs, format, etc.)
  - Timeout protection (default 5 minutes)
  - Real-time stdout/stderr capture
  - Complete command history with agent tracking
  - Running command monitoring and kill capability
  - Safety validation before execution

#### 🦙 Llama.cpp Integration  
- **NEW**: Direct llama.cpp installation and management
  - One-click binary installation for Windows, macOS, Linux
  - Automatic platform detection (x64, ARM64, Apple Silicon)
  - Server management (start/stop with custom configs)
  - Multi-model support on different ports
  - GPU acceleration support (configurable layers)
  - Auto-configuration of threads and batch size
  - Installation progress tracking

#### 🦙 Enhanced Ollama Support
- **NEW**: Comprehensive Ollama integration
  - Auto-detection of Ollama installation
  - Server status monitoring
  - Start/stop Ollama service from app
  - Model management (list, pull, delete)
  - 10 recommended models for autonomous agents
  - Real-time download progress
  - Model information and statistics
  - Version detection

### Models Added

16 new GGUF models (Q4_K_M quantization):

**Llama Models:**
- Llama 3.3 70B Instruct (40GB) - Latest Meta model
- Llama 3.2 3B Instruct (2GB) - Fast and efficient
- Llama 3.2 1B Instruct (1GB) - Ultra-fast

**Code Models:**
- Code Llama 13B Instruct (7.5GB)
- Code Llama 7B Instruct (4GB)
- Qwen 2.5 Coder 7B (4.5GB)
- Qwen 2.5 Coder 14B (8GB)
- DeepSeek Coder V2 16B (9GB)

**Qwen Models:**
- Qwen 2.5 14B Instruct (8GB)
- Qwen 2.5 7B Instruct (4.5GB)

**Other Models:**
- Mistral 7B Instruct v0.3 (4.5GB)
- Phi-3.5 Mini Instruct (2.5GB)
- Gemma 2 9B Instruct (5.5GB)
- Gemma 2 2B Instruct (1.5GB)

### Agent Enhancements

**New Capabilities:**
- `agentCommunication`: Enable inter-agent messaging and delegation
- `commandExecution`: Allow terminal command execution

**New Statistics:**
- `messagesSent`: Track messages sent to other agents
- `messagesReceived`: Track messages received from other agents  
- `commandsExecuted`: Track terminal commands executed

**Enhanced Decision Making:**
- Agents now check for new messages during decision loop
- Access to list of available agents for delegation
- Ability to execute commands and receive output
- Access to shared memory/context

### UI Components Added

**New Pages:**
1. **Ollama Page** (`src/renderer/pages/Ollama.tsx`)
   - Installation status display
   - Server control (start/stop)
   - Installed models list
   - Recommended models with one-click pull
   - Real-time download progress

2. **Commands Page** (`src/renderer/pages/Commands.tsx`)
   - Command execution interface
   - Running commands monitoring
   - Complete command history
   - Output/error display with syntax
   - Safety warnings

**Updated Components:**
- `CreateAgentModal.tsx`: Added agent communication and command execution toggles
- `AgentCard.tsx`: Display new capabilities and statistics
- `Sidebar.tsx`: Added Ollama and Commands navigation items
- `App.tsx`: Integrated new pages into routing

### Backend Services Added

1. **AgentCommunication** (`src/electron/services/AgentCommunication.ts`)
   - Message queue management
   - Shared memory with permissions
   - Message routing and delivery
   - Conversation tracking
   - Data expiration handling

2. **CommandExecutor** (`src/electron/services/CommandExecutor.ts`)
   - Command validation and safety checks
   - Process spawning and management
   - Output streaming
   - Execution history
   - Permission system

3. **LlamaManager** (`src/electron/services/LlamaManager.ts`)
   - Binary download and installation
   - Server lifecycle management
   - Port management
   - Configuration handling
   - Progress tracking

4. **OllamaManager** (`src/electron/services/OllamaManager.ts`)
   - Installation detection
   - Server control
   - Model operations
   - Streaming progress
   - Recommended models list

### IPC Handlers Added

**Agent Communication:**
- `agent:send-message`
- `agent:get-messages`
- `agent:get-tasks`
- `agent:delegate-task`

**Command Execution:**
- `command:execute`
- `command:kill`
- `command:get-running`
- `command:get-history`
- `command:is-safe`

**Llama.cpp:**
- `llama:is-installed`
- `llama:install`
- `llama:uninstall`
- `llama:start-server`
- `llama:stop-server`
- `llama:get-servers`
- `llama:get-version`

**Ollama:**
- `ollama:check-installation`
- `ollama:is-running`
- `ollama:start`
- `ollama:list-models`
- `ollama:pull-model`
- `ollama:delete-model`
- `ollama:get-recommended`
- `ollama:get-model-info`

### Dependencies Added

- `extract-zip`: ^2.0.1 - For extracting llama.cpp binaries

### Documentation

- **NEW**: `FEATURES.md` - Comprehensive feature documentation
- **NEW**: `CHANGELOG.md` - Version history and changes
- **UPDATED**: `README.md` - Updated with new features and examples

### Breaking Changes

**Agent Interface:**
- `Agent.capabilities` now includes `agentCommunication` and `commandExecution`
- `Agent.stats` now includes `messagesSent`, `messagesReceived`, `commandsExecuted`

**Note:** Existing agents will need to have these new properties added (defaults to false/0).

### Migration Guide

For existing agents, the app will automatically add default values:
```javascript
capabilities: {
  ...existing,
  agentCommunication: false,
  commandExecution: false
}

stats: {
  ...existing,
  messagesSent: 0,
  messagesReceived: 0,
  commandsExecuted: 0
}
```

### Security

**Command Execution Safety:**
- Blocked commands list includes all destructive operations
- Timeout protection prevents runaway processes
- All commands logged with full audit trail
- Permission system for allowed/blocked commands

**Agent Communication:**
- Shared memory access controls
- Message expiration and cleanup
- Isolated agent permissions

### Performance

- Command execution runs in separate processes
- Llama.cpp servers run on separate ports
- Message queues optimized for quick access
- Shared memory with automatic cleanup

### Bug Fixes

- Fixed agent stats initialization
- Improved error handling in LLM provider calls
- Better handling of agent lifecycle events

### Known Issues

- Llama.cpp installation requires internet connection
- Ollama must be installed separately (app provides download link)
- RobotJS may require build tools on some systems (existing issue)

### Future Roadmap

- Web search integration for agents
- Database query capabilities
- File editing and creation
- Visual workflow builder
- Agent templates and presets
- Multi-modal support (images, audio)
- Agent performance analytics

---

## [1.0.0] - Initial Release

- Multi-LLM provider support (OpenAI, Anthropic, DeepSeek, Local)
- Agent creation and management
- Computer automation (mouse, keyboard, screen)
- Resource monitoring
- Cost tracking
- Local model management
- 6 base GGUF models

---

For detailed feature documentation, see [FEATURES.md](FEATURES.md)
