# Agent Features & Capabilities Guide

## 🤖 Agent Capabilities

### 1. Computer Control 🖱️
**What it does:**
- Control mouse and keyboard
- **NEW:** Capture desktop screenshots
- See exactly what's on the screen
- Get screen dimensions
- Monitor pixel colors

**Use cases:**
- UI automation
- Visual verification
- Screen monitoring
- Desktop interaction

**How agents use it:**
Agents with this capability automatically receive screenshots during their decision-making process. They can see the desktop and analyze what's happening.

---

### 2. Command Execution ⌨️
**What it does:**
- Run terminal/shell commands
- Execute scripts
- Install packages
- Manage processes

**Safety features:**
- Dangerous commands are blocked (rm -rf /, fork bombs, etc.)
- Execution timeout (5 minutes default)
- Command validation
- Full history tracking

**Autonomy levels:**
- **Low:** Every command requires user approval
- **Medium:** Every command requires user approval
- **High:** Commands execute without approval

**Use cases:**
- System administration
- File operations
- Package management
- Process monitoring

---

### 3. Agent Communication 💬
**What it does:**
- Send messages to other agents
- Delegate tasks
- Share data through shared memory
- Broadcast to all agents

**Features:**
- Message types: request, response, notification, data
- Priority levels
- Read receipts
- Message history

**Autonomy levels:**
- **Low:** Message sending requires approval
- **Medium:** Messages sent without approval
- **High:** Messages sent without approval

**Use cases:**
- Multi-agent collaboration
- Task distribution
- Knowledge sharing
- Coordinated actions

---

### 4. File System Access 📁
**What it does:**
- Read files
- Write files
- Create directories
- Monitor file changes

**Use cases:**
- Data processing
- Configuration management
- Log analysis
- File organization

---

### 5. Network Access 🌐
**What it does:**
- Make HTTP requests
- Download files
- API interactions
- Web scraping

**Use cases:**
- Data fetching
- API integration
- Web monitoring
- Content retrieval

---

## 🎚️ Autonomy Levels

### Low Autonomy
**Behavior:**
- Requires approval for **ALL** actions
- Commands need approval
- Messages need approval
- Task delegations need approval
- Best for: Testing, sensitive operations, learning agent behavior

**When to use:**
- First time using an agent
- Testing new configurations
- Sensitive environments
- Learning agent capabilities

---

### Medium Autonomy
**Behavior:**
- Requires approval for **commands only**
- Messages sent without approval
- Task delegations sent without approval
- Best for: Balanced control and automation

**When to use:**
- Production environments
- When you trust the agent but want control over system commands
- Standard operations

---

### High Autonomy
**Behavior:**
- **No approval required** for any actions
- Fully autonomous operation
- Best for: Trusted, well-tested agents

**When to use:**
- Fully trusted agents
- Repetitive tasks
- Background monitoring
- Proven configurations

---

## 💬 User Interaction Features

### ASK_USER Action
Agents can ask you questions when they need help or clarification.

**Question Types:**

1. **Free-form Question**
   - Agent asks an open-ended question
   - You provide a text response
   - Example: "What directory should I use?"

2. **Confirmation**
   - Agent asks yes/no
   - You approve or deny
   - Example: "Should I proceed with this action?"

3. **Multiple Choice**
   - Agent provides options
   - You select one
   - Example: "Which file format? [JSON, XML, CSV]"

4. **Approval Request**
   - Agent requests permission
   - You approve or deny
   - Example: "May I execute: npm install?"

**Features:**
- Visual dialog system
- 5-minute timeout
- Queue management
- Full history

---

## 🎯 Best Practices

### Setting Up Your First Agent

1. **Start with Low Autonomy**
   - Watch how the agent behaves
   - Understand its decision-making
   - Approve actions you're comfortable with

2. **Enable Only Needed Capabilities**
   - Don't give all permissions at once
   - Start minimal, add as needed
   - Less is more secure

3. **Use Clear System Prompts**
   - Tell the agent exactly what to do
   - Set clear boundaries
   - Define success criteria

4. **Monitor Agent Stats**
   - Check command count
   - Review messages sent
   - Monitor token usage
   - Watch costs

---

### Multi-Agent Collaboration

**Example Setup:**

```
Agent 1: "Data Collector"
- Capabilities: Network, File System
- Autonomy: High
- Role: Fetch data from APIs

Agent 2: "Data Processor"
- Capabilities: File System, Command Execution
- Autonomy: Medium
- Role: Process and analyze data

Agent 3: "Reporter"
- Capabilities: File System, Agent Communication
- Autonomy: High
- Role: Generate reports and notify other agents
```

**Communication Flow:**
1. Data Collector fetches data → saves to file
2. Data Collector sends message to Data Processor
3. Data Processor reads file → processes data → runs analysis commands
4. Data Processor delegates reporting task to Reporter
5. Reporter generates report → broadcasts to all agents

---

## 🔒 Security Considerations

### Command Execution Safety

**Blocked by default:**
- `rm -rf /` - System deletion
- Fork bombs - Resource exhaustion
- `mkfs`, `dd`, `format` - Disk formatting
- Sudo commands with dangerous operations

**Best practices:**
- Use Medium or Low autonomy for agents with command execution
- Review command history regularly
- Set appropriate timeout values
- Limit working directory if possible

---

### Agent Communication Security

**Shared Memory Permissions:**
- Read permissions (who can read)
- Write permissions (who can write)
- Expiration times
- Access control per agent

**Best practices:**
- Grant minimum necessary permissions
- Use expiration for temporary data
- Review shared memory regularly
- Clear sensitive data after use

---

## 📊 Monitoring & Debugging

### Agent Stats
Each agent tracks:
- Total runs
- Total tokens used
- Total cost
- Messages sent/received
- Commands executed
- Average run time

### Logs
- Real-time log streaming
- Error tracking
- Action history
- Decision explanations

### Command History
- Full command log per agent
- Execution times
- Exit codes
- stdout/stderr output

---

## 🚀 Quick Start Examples

### Example 1: Interactive File Organizer
```
Name: File Organizer
Capabilities: File System
Autonomy: Medium
System Prompt: "Organize files by type. Ask the user which folder to organize."

This agent will:
- Ask which folder to organize
- Scan files
- Ask for confirmation before moving files
- Provide summary when done
```

### Example 2: System Monitor
```
Name: System Monitor
Capabilities: Command Execution, Computer Control
Autonomy: High
System Prompt: "Monitor system resources. Alert if CPU > 90% or memory > 80%."

This agent will:
- Run monitoring commands
- Capture screenshots if issues detected
- Alert automatically
- Log all findings
```

### Example 3: Multi-Agent Web Scraper
```
Agent 1: URL Collector
Capabilities: Network, Agent Communication
Autonomy: High
System Prompt: "Collect URLs from sitemap. Send to Content Fetcher agent."

Agent 2: Content Fetcher
Capabilities: Network, File System, Agent Communication
Autonomy: High
System Prompt: "Fetch content from URLs sent by URL Collector. Save to files."

These agents will:
- Work together automatically
- Distribute workload
- Share results
- Complete task without user interaction
```

---

## 🆘 Troubleshooting

### Agent Not Responding
- Check if agent is running (status should be "running")
- Review logs for errors
- Check LLM provider connection
- Verify model is accessible

### Commands Not Executing
- Check if commandExecution capability is enabled
- Verify autonomy level allows commands
- Check command isn't blocked for security
- Review command history for errors

### Prompts Not Showing
- Verify autonomy level isn't "high"
- Check browser console for errors
- Ensure main window is visible
- Check prompt history

### Agents Not Communicating
- Check if agentCommunication is enabled on both agents
- Verify both agents are running
- Check message history
- Review shared memory permissions

---

## 📖 Additional Resources

- **CHANGELOG.md** - Full list of changes and features
- **README.md** - Installation and setup guide
- **Agent logs** - Real-time agent behavior
- **Command history** - Execution records
- **Cost tracker** - Usage and pricing

---

## 🎓 Learning Path

1. **Week 1:** Create simple agent with low autonomy, no dangerous capabilities
2. **Week 2:** Add file system and network, practice with medium autonomy
3. **Week 3:** Enable command execution, learn approval flow
4. **Week 4:** Create multi-agent system with communication
5. **Week 5:** Add computer control, practice with screenshots
6. **Week 6:** Build fully autonomous agent system for specific task

---

*Remember: Start small, test thoroughly, scale gradually!*
