# Autonomous Agent Desktop

A powerful desktop application for running autonomous AI agents with multiple LLM providers, local model support, and computer automation capabilities.

## Features

### 🤖 Autonomous Agents
- Create and manage multiple AI agents with custom goals and behaviors
- Run agents in the background continuously
- Monitor agent activity, costs, and performance in real-time
- Configurable autonomy levels (low, medium, high)

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

### 🖱️ Computer Automation
- Full mouse and keyboard control
- Screen capture and analysis
- Agents can interact with applications and automate tasks
- Configurable safety settings

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
- Enable capabilities (computer control, file system, network)
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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Disclaimer

This application can control your computer when automation is enabled. Use responsibly and at your own risk. Always review and test agents in a safe environment before giving them full autonomy.
