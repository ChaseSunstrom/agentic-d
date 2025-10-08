# Installation Guide

## System Requirements

### Minimum Requirements
- **OS**: Windows 10/11 or Linux (Ubuntu 20.04+, Debian 10+, Fedora 32+, etc.)
- **Node.js**: 18.x or higher
- **RAM**: 4GB (8GB recommended for local models)
- **Disk Space**: 2GB for app + space for models (2-10GB per model)
- **CPU**: 64-bit processor

### Recommended Requirements
- **RAM**: 16GB (for running multiple agents with local models)
- **CPU**: Multi-core processor (4+ cores)
- **GPU**: Optional but beneficial for local model inference

## Prerequisites

### 1. Install Node.js

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Linux (Fedora):**
```bash
sudo dnf install nodejs
```

**Windows:**
Download from https://nodejs.org/

Verify installation:
```bash
node --version  # Should show v18.x or higher
npm --version   # Should show 9.x or higher
```

### 2. Install Build Tools (for RobotJS)

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install -y build-essential
sudo apt-get install -y libxtst-dev libpng-dev
```

**Linux (Fedora):**
```bash
sudo dnf groupinstall "Development Tools"
sudo dnf install libXtst-devel libpng-devel
```

**Windows:**
```bash
npm install --global windows-build-tools
# OR install Visual Studio Build Tools manually
```

## Installation Steps

### Step 1: Clone or Download the Project

If you have Git:
```bash
git clone <repository-url>
cd autonomous-agent-desktop
```

Or download and extract the ZIP file, then navigate to the directory.

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages. It may take 5-10 minutes depending on your internet speed.

**Note**: If you encounter errors with `robotjs`, see the Troubleshooting section below.

### Step 3: Verify Installation

Run a quick verification:
```bash
npm run build:electron
```

If this completes without errors, the installation was successful!

## Running the Application

### Development Mode

Start the application in development mode:
```bash
npm start
```

This will:
1. Start the React development server on http://localhost:3000
2. Wait for the server to be ready
3. Launch the Electron application
4. Enable hot-reloading for changes

### Production Build

Build the application for distribution:

```bash
# Build for current platform
npm run package

# Build for Linux specifically
npm run package:linux

# Build for Windows specifically
npm run package:win
```

The built application will be in the `release/` directory.

## Post-Installation Setup

### 1. Configure LLM Providers

You'll need at least one LLM provider to use the app. Options:

**Option A: Cloud Provider (Easiest)**
1. Get an API key from:
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com/
   - DeepSeek: https://platform.deepseek.com/

2. In the app:
   - Go to "LLM Providers"
   - Click "Add Provider"
   - Enter your API key
   - Test the connection

**Option B: Local LLM (Free, but requires setup)**
1. Install a local LLM server:
   - **LM Studio** (Easiest): Download from https://lmstudio.ai
   - **Ollama**: `curl -fsSL https://ollama.com/install.sh | sh`
   - **llama.cpp**: Build from source

2. Start the server
3. In the app:
   - Go to "LLM Providers"
   - Add a "Local LLM" provider
   - Use the correct API URL (usually http://localhost:8080 or http://localhost:1234)

### 2. Install Local Models (Optional)

If using local models:
1. Go to "Local Models" in the app
2. Browse available models
3. Click "Install" on any model
4. Wait for download (may take 10-60 minutes per model)

Or scan for existing models:
1. Click "🔍 Scan for Models"
2. The app will find GGUF models in common locations

### 3. Create Your First Agent

1. Go to "Agents"
2. Click "Create Agent"
3. Fill in the details
4. Start the agent!

## Directory Structure After Installation

```
autonomous-agent-desktop/
├── node_modules/           # Dependencies (created by npm install)
├── dist/                   # Built files (created by npm run build)
│   ├── electron/          # Compiled Electron main process
│   └── renderer/          # Compiled React app
├── release/               # Packaged apps (created by npm run package)
├── src/                   # Source code
├── package.json           # Project configuration
└── ...
```

## Configuration Files Location

After first run, configuration is stored in:

**Linux:**
- `~/.config/autonomous-agent-desktop/`
- `~/.autonomous-agent/models/` (downloaded models)

**Windows:**
- `%APPDATA%\autonomous-agent-desktop\`
- `%USERPROFILE%\.autonomous-agent\models\` (downloaded models)

## Troubleshooting

### Issue: RobotJS Won't Install

**Symptoms:**
```
npm ERR! code 1
npm ERR! path .../node_modules/robotjs
```

**Solutions:**

**Linux:**
```bash
# Install required system libraries
sudo apt-get install -y build-essential libxtst-dev libpng-dev

# Clear npm cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Windows:**
```bash
# Install Windows Build Tools
npm install --global windows-build-tools

# Or install Visual Studio Build Tools manually
# Then retry: npm install
```

**Alternative (if still failing):**
Comment out robotjs in package.json temporarily. Automation features won't work, but the rest of the app will.

### Issue: Electron Won't Start

**Symptoms:**
```
Error: Electron failed to install correctly
```

**Solution:**
```bash
# Reinstall Electron
npm install electron --save-dev --force
```

### Issue: Port 3000 Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find and kill the process using port 3000
# Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change the port in webpack.config.js
```

### Issue: Permission Denied Errors (Linux)

**Solution:**
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

### Issue: Out of Memory During Build

**Solution:**
```bash
# Increase Node memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

## Uninstallation

To completely remove the application:

```bash
# Remove the project directory
rm -rf autonomous-agent-desktop/

# Remove configuration files
# Linux:
rm -rf ~/.config/autonomous-agent-desktop/
rm -rf ~/.autonomous-agent/

# Windows:
# Delete %APPDATA%\autonomous-agent-desktop\
# Delete %USERPROFILE%\.autonomous-agent\
```

## Updating

To update to a new version:

```bash
cd autonomous-agent-desktop
git pull  # If using Git
npm install  # Update dependencies
npm run build  # Rebuild
```

## Performance Tips

1. **For Better Performance:**
   - Use local models for cost-free experimentation
   - Limit concurrent agents based on your RAM
   - Monitor resource usage in the Resources tab

2. **For Lower Costs:**
   - Use GPT-3.5-turbo or Claude Haiku for simple tasks
   - Use local models when possible
   - Set lower max_tokens limits
   - Monitor costs in the Resources tab

3. **For Production Use:**
   - Run `npm run package` to create optimized builds
   - Use the packaged app instead of development mode
   - Enable only necessary capabilities for each agent

## Security Notes

- API keys are stored locally using electron-store
- Never share your configuration directory
- Review agent system prompts before enabling high autonomy
- Test computer automation in a safe environment first
- Keep your API keys secure and rotate them regularly

## Getting Help

If you encounter issues not covered here:
1. Check the error message carefully
2. Search for similar issues online
3. Review the README.md for additional information
4. Check that all prerequisites are installed
5. Try the troubleshooting steps above

## Next Steps

Once installed successfully:
1. Read the [QUICKSTART.md](QUICKSTART.md) guide
2. Set up your first LLM provider
3. Create and run your first agent
4. Explore the different pages and features
5. Customize agents for your needs

Happy automating! 🚀
