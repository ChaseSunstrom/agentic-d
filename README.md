# Autonomous Agent Desktop

A powerful desktop application for running autonomous AI agents with multiple LLM providers, local model support, and computer automation capabilities.

## ✨ What's New in v2.0

- **🤝 Agent Communication**: Agents can message each other, share knowledge, and delegate tasks
- **⌨️ Command Execution**: Agents can safely execute terminal commands
- **🦙 Llama.cpp Integration**: One-click installation and management of llama.cpp
- **🦙 Enhanced Ollama Support**: Full Ollama integration with recommended models
- **💾 18 New Models**: Including Llama 3.3, Qwen 2.5, CodeLlama, GPT-OSS 120B/20B, and more
- **📊 Enhanced Stats**: Track messages sent/received and commands executed

👉 **[See Full Feature Documentation](FEATURES.md)**

## Features

### 🤖 Autonomous Agents
- Create and manage multiple AI agents with custom goals and behaviors
- Run agents in the background continuously
- Monitor agent activity, costs, and performance in real-time
- Configurable autonomy levels (low, medium, high)
- **NEW**: Inter-agent communication and task delegation
- **NEW**: Command execution capabilities

### 🔌 Multiple LLM Providers
- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **DeepSeek**: DeepSeek Chat, DeepSeek Coder
- **Local Models**: Support for locally hosted LLMs via llama.cpp, LM Studio, Ollama, etc.
- **Custom Providers**: Add any OpenAI-compatible API

### 💾 Local Model Management
- Download and install popular open-source models directly in the app
- Support for GGUF format models (Llama, Mistral, Phi, Qwen, Gemma, etc.)
- Automatic scanning for existing models on your system
- Easy model management (install, uninstall, auto-detect)
- **NEW**: 18 total models including Llama 3.3, Qwen 2.5, CodeLlama, GPT-OSS 120B/20B
- **NEW**: Direct llama.cpp installation and server management
- **NEW**: Full Ollama integration with recommended models

### 🖱️ Computer Automation
- Full mouse and keyboard control
- Screen capture and analysis
- Agents can interact with applications and automate tasks
- Configurable safety settings
- **NEW**: Terminal command execution with safety controls
- **NEW**: Command history and monitoring

### 📊 Resource Monitoring
- Real-time CPU, memory, and disk usage tracking
- Network activity monitoring
- Historical resource usage graphs
- Cost tracking per agent and provider

### 💰 Cost Tracking
- Automatic cost calculation for all LLM API calls
- Break down costs by agent, provider, and model
- Token usage statistics
- Budget monitoring and alerts

### 🤝 Agent Collaboration (NEW)
- **Message Passing**: Agents can send messages to each other or broadcast to all
- **Shared Memory**: Agents can share data with access controls
- **Task Delegation**: Agents can assign tasks to other specialized agents
- **Conversation History**: Track all inter-agent communications

### ⌨️ Command Execution (NEW)
- **Safe Execution**: Blocked dangerous commands by default
- **Real-time Monitoring**: View running commands and their output
- **Complete History**: Audit trail of all executed commands
- **Timeout Protection**: Automatic command termination after max time

## Installation

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Windows or Linux operating system

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd autonomous-agent-desktop
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

### Building for Production

Build for your current platform:
```bash
npm run package
```

Build for specific platforms:
```bash
npm run package:linux
npm run package:win
```

## Usage

### 1. Add an LLM Provider

Navigate to the "LLM Providers" section and click "Add Provider". Choose from:
- OpenAI (requires API key)
- Anthropic (requires API key)
- DeepSeek (requires API key)
- Local LLM (requires local server running)
- Custom provider

### 2. Install Local Models (Optional)

Go to "Local Models" to:
- Browse available open-source models
- Install models with one click
- Scan for existing models on your system
- Manage installed models

### 3. Create an Agent

Navigate to "Agents" and click "Create Agent":
- Give your agent a name and description
- Choose an LLM provider and model
- Write a system prompt defining the agent's behavior
- Enable capabilities:
  - Computer control (mouse, keyboard, screen)
  - File system access
  - Network access
  - **Agent communication** (message passing, task delegation)
  - **Command execution** (run terminal commands)
- Configure parameters (temperature, max tokens, autonomy level)

### 4. Start Your Agent

Click "Start" on any agent to begin running it autonomously. The agent will:
- Make decisions based on its system prompt
- Execute tasks in the background
- Log all activities
- Track costs and resource usage

### 5. Monitor Performance

Use the Dashboard to:
- View active agents
- Monitor system resources
- Track costs
- View recent activity

### 6. Manage Ollama Models (Optional)

Navigate to "Ollama" page to:
- Check Ollama installation status
- Start/stop Ollama service
- Pull recommended models optimized for agents
- Manage installed models

### 7. Execute Commands (Optional)

Navigate to "Commands" page to:
- Execute terminal commands manually
- View command history
- Monitor running commands
- See command output and errors

## Configuration

Configuration is stored locally in:
- Linux: `~/.config/autonomous-agent-desktop/`
- Windows: `%APPDATA%\autonomous-agent-desktop\`

## Security & Safety

- Agents run in a sandboxed environment
- Computer automation can be disabled in settings
- All agent actions are logged
- API keys are stored securely using electron-store

## Architecture

### Tech Stack
- **Frontend**: React + TypeScript
- **Desktop Framework**: Electron
- **LLM Integration**: OpenAI SDK, Anthropic SDK
- **Local Models**: node-llama-cpp
- **Automation**: RobotJS
- **Resource Monitoring**: systeminformation

### Project Structure
```
autonomous-agent-desktop/
├── src/
│   ├── electron/          # Electron main process
│   │   ├── main.ts        # Main entry point
│   │   ├── preload.ts     # Preload script for IPC
│   │   └── services/      # Core services
│   │       ├── AgentManager.ts
│   │       ├── LLMProviderManager.ts
│   │       ├── ModelManager.ts
│   │       ├── AutomationService.ts
│   │       ├── ResourceMonitor.ts
│   │       └── CostTracker.ts
│   └── renderer/          # React frontend
│       ├── components/    # Reusable components
│       ├── pages/         # Main pages
│       └── styles.css     # Global styles
├── package.json
├── tsconfig.json
└── webpack.config.js
```

## Quick Start for New Features

### Agent Communication Example
```javascript
// Create two agents with communication enabled
const agent1 = await createAgent({
  name: 'Research Agent',
  capabilities: { agentCommunication: true, ... }
});

const agent2 = await createAgent({
  name: 'Writing Agent', 
  capabilities: { agentCommunication: true, ... }
});

// Start both - they can now message each other!
await startAgent(agent1.id);
await startAgent(agent2.id);
```

### Command Execution Example
```javascript
// Create agent with command execution
const agent = await createAgent({
  name: 'DevOps Agent',
  capabilities: { commandExecution: true, ... }
});

// Agent can now run commands like:
// - ls, cat, grep
// - npm install, pip install
// - git status, git pull
// All with safety controls
```

### Ollama Setup
1. Navigate to "Ollama" page
2. If not installed, click download link
3. Start Ollama
4. Pull recommended models (e.g., llama3.3, qwen2.5-coder)
5. Use with "Local LLM" provider

## Troubleshooting

### RobotJS installation issues
If you encounter issues installing robotjs, you may need to install build tools:

**Linux:**
```bash
sudo apt-get install libxtst-dev libpng-dev
```

**Windows:**
```bash
npm install --global windows-build-tools
```

### Local model not working
Make sure you have a local LLM server running (llama.cpp, LM Studio, Ollama) and the API URL is configured correctly in the provider settings.

### Command execution blocked
Some commands are blocked for safety. Check the Commands page to test if a command is safe, or modify the blocked commands list in settings.

### Ollama not detected
Ensure Ollama is installed and in your PATH. Try running `ollama serve` manually first.

### Llama.cpp installation fails
Check your internet connection and ensure you have ~500MB free disk space. On Linux, install `unzip` if not present.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Disclaimer

This application can control your computer when automation is enabled. Use responsibly and at your own risk. Always review and test agents in a safe environment before giving them full autonomy.
