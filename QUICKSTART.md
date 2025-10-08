# Quick Start Guide

## Getting Started in 5 Minutes

### 1. Install Dependencies

```bash
npm install
```

**Note**: If you encounter issues with `robotjs`, see the troubleshooting section in README.md.

### 2. Start the Application

```bash
npm start
```

This will:
- Start the React development server
- Launch the Electron application
- Open the app window automatically

### 3. Add Your First LLM Provider

1. Click on "LLM Providers" in the sidebar
2. Click "Add Provider"
3. Choose a provider type:
   - **OpenAI**: Enter your API key from https://platform.openai.com/api-keys
   - **Anthropic**: Enter your API key from https://console.anthropic.com/
   - **DeepSeek**: Enter your API key from https://platform.deepseek.com/
   - **Local LLM**: Set up a local server (see below)

4. Click "Add Provider"
5. Click "Test Connection" to verify it works

### 4. Create Your First Agent

1. Click on "Agents" in the sidebar
2. Click "Create Agent"
3. Fill in the details:
   - **Name**: "My First Agent"
   - **Description**: "A helpful assistant"
   - **Provider**: Select the provider you just added
   - **Model**: Choose a model
   - **System Prompt**: Describe what the agent should do
   - **Capabilities**: Enable features you want (computer control, etc.)

4. Click "Create Agent"

### 5. Start Your Agent

1. Find your agent in the list
2. Click the "▶ Start" button
3. Watch it run in the background!

## Using Local Models

### Option 1: Install Through the App

1. Go to "Local Models"
2. Browse available models
3. Click "Install" on any model
4. Wait for download to complete
5. Add a "Local LLM" provider pointing to your local server
6. Use the model with your agents!

### Option 2: Use Existing Models

If you already have models installed (e.g., with LM Studio or Ollama):

1. Make sure your local LLM server is running
2. Go to "Local Models"
3. Click "🔍 Scan for Models"
4. Add a "Local LLM" provider with the correct API URL
5. You're ready to use local models!

## Setting Up Local LLM Servers

### Using llama.cpp Server

```bash
# Download and build llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

# Start the server with your model
./server -m /path/to/model.gguf --host 0.0.0.0 --port 8080
```

### Using LM Studio

1. Download and install LM Studio
2. Load a model
3. Start the local server (default: http://localhost:1234)
4. In the app, use this URL when adding a Local LLM provider

### Using Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama2

# Ollama automatically serves on http://localhost:11434
```

In the app, use `http://localhost:11434/v1` as the API URL.

## Example Agent Configurations

### Research Assistant

- **System Prompt**: "You are a research assistant. Your goal is to search for information, analyze it, and provide comprehensive summaries."
- **Capabilities**: Network
- **Autonomy**: Medium
- **Model**: GPT-4 or Claude 3 Opus

### Code Helper

- **System Prompt**: "You are a coding assistant. Help users write, debug, and optimize code."
- **Capabilities**: File System
- **Autonomy**: Low
- **Model**: DeepSeek Coder or GPT-4

### Automation Agent

- **System Prompt**: "You are an automation agent. Perform repetitive tasks efficiently."
- **Capabilities**: Computer Control, File System
- **Autonomy**: High
- **Model**: GPT-4 Turbo or Claude 3.5 Sonnet

## Tips

- Start with **Low Autonomy** when testing new agents
- Monitor the **Resources** tab to track costs
- Use **Local Models** for cost-free experimentation
- Enable **Computer Control** carefully - test in a safe environment first
- Check the **Dashboard** regularly for agent status and performance

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore different agent configurations
- Try multiple agents running simultaneously
- Set up cost alerts in Settings
- Experiment with local models

## Getting Help

If you encounter issues:
1. Check the console for error messages
2. Review the troubleshooting section in README.md
3. Make sure all dependencies are installed correctly
4. Verify your API keys are valid
5. Test providers using the "Test Connection" button

Happy automating! 🚀
