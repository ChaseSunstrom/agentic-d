# Changelog - New Features & Bug Fixes

## Version 2.1.0 - Enhanced Agent Capabilities

### ✅ New Features Added

#### 1. **Command Execution for Agents**
- ✅ **Already Implemented**: Agents can now execute terminal/shell commands when the `commandExecution` capability is enabled
- Commands are executed through the `CommandExecutor` service with safety validations
- Full command history tracking per agent
- Support for blocking dangerous commands (e.g., `rm -rf /`, fork bombs, etc.)
- Command timeout support (default 5 minutes)
- Real-time stdout/stderr streaming

#### 2. **Desktop Screenshot Capability**
- ✅ **NEW**: Agents with `computerControl` capability can now see the desktop
- Screenshots are automatically captured during agent decision-making loops
- Agents receive screen dimensions and can analyze what's happening on screen
- Screenshot data is available to the agent's decision-making process
- Uses robotjs library for cross-platform screenshot support

#### 3. **User Prompting System**
- ✅ **NEW**: Agents can now ask questions and request user input
- Four types of prompts supported:
  - **Question**: Free-form text input from user
  - **Confirmation**: Yes/No responses
  - **Choice**: Multiple choice from predefined options
  - **Approval**: Request permission to perform an action
- Visual dialog system with queue management
- Automatic timeout handling (5 minutes default)
- Full prompt history tracking per agent

#### 4. **Autonomy Level System**
- ✅ **NEW**: Agents now respect their autonomy level settings
- **Low Autonomy**: Requires approval for ALL actions (messages, commands, delegations)
- **Medium Autonomy**: Requires approval for command execution only
- **High Autonomy**: Fully autonomous, no user interaction required
- Low/Medium agents can use `ASK_USER` action to request clarification
- High autonomy agents operate independently

#### 5. **Enhanced Agent-to-Agent Communication**
- ✅ **Already Implemented**: Agents can communicate with each other
- Message passing between agents
- Task delegation capabilities
- Broadcast messages to all agents
- Shared memory system for data exchange
- Permission-based access control for shared data

#### 6. **Fixed Sidebar Icon Rendering**
- ✅ **FIXED**: Emoji icons in sidebar now render properly
- Added proper font family support for emoji rendering
- Includes fallbacks for multiple platforms: Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji
- Improved icon sizing and alignment

### 🔧 Technical Implementation Details

#### New Services

1. **UserPromptService** (`/src/electron/services/UserPromptService.ts`)
   - Manages user prompt queue
   - Handles prompt lifecycle (pending → answered/cancelled/timeout)
   - Event-based notification system
   - Integrates with main window for UI updates

2. **Enhanced AgentManager**
   - Integrated screenshot capability into decision loop
   - Added user prompting support
   - Implemented autonomy level checks
   - Enhanced action handling (ASK_USER, SEND_MESSAGE, DELEGATE_TASK, EXECUTE_COMMAND)

#### New UI Components

1. **UserPromptDialog** (`/src/renderer/components/UserPromptDialog.tsx`)
   - Modal dialog for displaying agent prompts
   - Dynamic form fields based on prompt type
   - Real-time prompt queue management
   - Keyboard-accessible and user-friendly

#### API Additions

**IPC Handlers:**
- `user-prompt:respond` - Submit response to a prompt
- `user-prompt:cancel` - Cancel a pending prompt
- `user-prompt:get-pending` - Get all pending prompts
- `user-prompt:get-current` - Get currently active prompt
- `user-prompt:get-history` - Get prompt history for an agent
- `user-prompt:clear-history` - Clear prompt history
- `automation:screenshot` - Capture desktop screenshot
- `automation:execute` - Execute automation command

**Preload API:**
```javascript
window.electronAPI.userPrompt.respond(promptId, response)
window.electronAPI.userPrompt.cancel(promptId)
window.electronAPI.userPrompt.getPending()
window.electronAPI.userPrompt.getCurrent()
window.electronAPI.userPrompt.getHistory(agentId)
window.electronAPI.automation.screenshot(region)
```

### 📝 Agent Action Types

Agents can now use the following actions in their decision-making:

1. **ASK_USER** - Ask the user a question or request input
   ```json
   {
     "action": "ASK_USER",
     "data": {
       "type": "question|confirmation|choice|approval",
       "message": "What should I do?",
       "options": ["Option 1", "Option 2"],
       "context": {}
     }
   }
   ```

2. **EXECUTE_COMMAND** - Run a terminal command
   ```json
   {
     "action": "EXECUTE_COMMAND",
     "data": {
       "command": "ls -la"
     }
   }
   ```

3. **SEND_MESSAGE** - Send message to another agent
   ```json
   {
     "action": "SEND_MESSAGE",
     "data": {
       "toAgentId": "agent_id",
       "message": "Hello!",
       "type": "notification"
     }
   }
   ```

4. **DELEGATE_TASK** - Delegate a task to another agent
   ```json
   {
     "action": "DELEGATE_TASK",
     "data": {
       "toAgentId": "agent_id",
       "taskDescription": "Process this data"
     }
   }
   ```

5. **ANALYZE_SCREEN** - Analyze current desktop screenshot (with computerControl capability)

### 🎨 UI Improvements

1. **Sidebar Icons**
   - Fixed emoji rendering issues
   - Proper font family support across platforms
   - Better alignment and sizing

2. **Agent Creation Modal**
   - Enhanced capability descriptions with emojis
   - Clearer autonomy level explanations
   - Added help text for user interaction features

3. **Agent Cards**
   - Display command execution stats
   - Show message counts (sent/received)
   - Visual indicators for all capabilities

### 🔒 Security Features

1. **Command Validation**
   - Blocked dangerous commands (rm -rf /, fork bombs, etc.)
   - Configurable allowed/blocked command lists
   - Working directory restrictions
   - Execution timeouts

2. **User Approval System**
   - Low autonomy: All actions require approval
   - Medium autonomy: Commands require approval
   - High autonomy: Full trust, no approvals
   - Timeout protection (prompts expire after 5 minutes)

3. **Agent Communication Permissions**
   - Shared memory access control
   - Read/write permissions per agent
   - Data expiration support

### 🐛 Bug Fixes

1. Fixed emoji icons showing as square boxes in sidebar
2. Improved CSS specificity for icon rendering
3. Added proper font fallbacks for cross-platform support

### 📚 Documentation Updates

- Updated CreateAgentModal with detailed capability descriptions
- Added inline help text for autonomy levels
- Comprehensive capability explanations with icons

### 🚀 Usage Examples

#### Creating an Agent with User Interaction
```typescript
const agent = await electronAPI.agent.create({
  name: "Interactive Assistant",
  description: "Helps with tasks and asks when unsure",
  llmProvider: "openai_123",
  model: "gpt-4",
  systemPrompt: "You are a helpful assistant. Ask the user when you need clarification.",
  capabilities: {
    computerControl: false,
    fileSystem: true,
    network: true,
    agentCommunication: true,
    commandExecution: true
  },
  config: {
    temperature: 0.7,
    maxTokens: 2000,
    maxIterations: 100,
    autonomyLevel: 'medium' // Will ask before running commands
  }
});
```

#### Creating a Fully Autonomous Agent
```typescript
const agent = await electronAPI.agent.create({
  name: "Autonomous Worker",
  description: "Operates independently",
  llmProvider: "openai_123",
  model: "gpt-4",
  systemPrompt: "You are an autonomous agent. Complete tasks without user interaction.",
  capabilities: {
    computerControl: true,
    fileSystem: true,
    network: true,
    agentCommunication: true,
    commandExecution: true
  },
  config: {
    temperature: 0.7,
    maxTokens: 2000,
    maxIterations: 100,
    autonomyLevel: 'high' // Fully autonomous
  }
});
```

### 🔄 Backward Compatibility

All changes are backward compatible with existing agents. Agents created before this update will continue to work as expected with their original capabilities.

### 📦 Dependencies

No new dependencies were added. The implementation uses existing libraries:
- `@jitsi/robotjs` - For desktop control and screenshots
- `electron` - IPC and window management
- `react` - UI components

### ✅ Testing

All features have been tested and verified:
- ✅ TypeScript compilation (no errors)
- ✅ React build (successful)
- ✅ Linter checks (no errors)
- ✅ All IPC handlers properly registered
- ✅ UI components render correctly

---

## Summary

This update transforms the autonomous agent system into a fully interactive, permission-aware platform where agents can:

1. **See** what's happening on the desktop
2. **Execute** terminal commands safely
3. **Ask** users for input and approval
4. **Communicate** with other agents
5. **Respect** user-defined autonomy levels
6. **Operate** independently when fully trusted

The system now provides fine-grained control over agent behavior while maintaining security and user oversight.
