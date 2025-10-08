# GPT-OSS Models Integration

## Overview

Two powerful GPT-OSS models have been added to the Autonomous Agent Desktop app, providing options for both high-end reasoning and consumer-grade hardware.

## Available Models

### GPT-OSS 120B

**Specifications:**
- **Parameters**: 117 billion
- **Size (Q4_K_M)**: ~70GB
- **Memory Required**: 80GB GPU RAM (e.g., NVIDIA H100, A100)
- **Use Case**: High-end production, complex reasoning tasks
- **Format**: GGUF Q4_K_M quantization

**Ideal For:**
- Advanced reasoning and problem-solving
- Complex multi-step tasks
- Production environments with high-end hardware
- Tasks requiring maximum model capability
- Enterprise autonomous agents

**Hardware Requirements:**
- NVIDIA H100 (80GB) recommended
- NVIDIA A100 (80GB) also supported
- Data center GPU or cloud instance

**Download URL:**
```
https://huggingface.co/mradermacher/GPT-OSS-120B-GGUF/resolve/main/GPT-OSS-120B.Q4_K_M.gguf
```

---

### GPT-OSS 20B

**Specifications:**
- **Parameters**: 21 billion
- **Size (Q4_K_M)**: ~12GB
- **Memory Required**: 16GB system RAM
- **Use Case**: Consumer hardware, specialized tasks, lower latency
- **Format**: GGUF Q4_K_M quantization

**Ideal For:**
- Running on consumer hardware (gaming PCs, workstations)
- Lower latency responses
- Specialized use cases
- Development and testing
- Cost-effective autonomous agents

**Hardware Requirements:**
- 16GB+ system RAM
- Modern CPU (no GPU required, but GPU acceleration available)
- Consumer-grade hardware (RTX 3060+, 4060+, etc.)

**Download URL:**
```
https://huggingface.co/mradermacher/GPT-OSS-20B-GGUF/resolve/main/GPT-OSS-20B.Q4_K_M.gguf
```

---

## Installation

### Method 1: Through the App (Recommended)

1. Navigate to **"Local Models"** page in the app
2. Scroll to find **GPT-OSS 120B** or **GPT-OSS 20B**
3. Click **"Install"** button
4. Wait for download to complete (progress bar shown)
5. Model will be available for use with agents

### Method 2: Via Ollama

1. Navigate to **"Ollama"** page in the app
2. Ensure Ollama is running
3. Find GPT-OSS models in recommended list
4. Click to pull:
   - `ollama pull gpt-oss-120b:latest`
   - `ollama pull gpt-oss-20b:latest`
5. Use with Local LLM provider

### Method 3: Manual Installation

1. Download GGUF file from HuggingFace
2. Place in `~/.autonomous-agent/models/` directory
3. Click **"Scan for Models"** in the app
4. Model will be auto-detected

---

## Usage

### Creating an Agent with GPT-OSS Models

**For GPT-OSS 120B (High-end):**

```javascript
const agent = await agentManager.createAgent({
  name: 'Advanced Reasoning Agent',
  description: 'High-capability agent for complex tasks',
  llmProvider: 'local-llama',
  model: 'gpt-oss-120b',
  systemPrompt: 'You are an advanced AI assistant with superior reasoning capabilities...',
  capabilities: {
    computerControl: true,
    fileSystem: true,
    network: true,
    agentCommunication: true,
    commandExecution: true
  },
  config: {
    temperature: 0.7,
    maxTokens: 4000,
    maxIterations: 100,
    autonomyLevel: 'high'
  }
});
```

**For GPT-OSS 20B (Consumer):**

```javascript
const agent = await agentManager.createAgent({
  name: 'Efficient Task Agent',
  description: 'Fast, efficient agent for specialized tasks',
  llmProvider: 'local-llama',
  model: 'gpt-oss-20b',
  systemPrompt: 'You are a focused AI assistant optimized for specific tasks...',
  capabilities: {
    computerControl: false,
    fileSystem: true,
    network: true,
    agentCommunication: true,
    commandExecution: true
  },
  config: {
    temperature: 0.5,
    maxTokens: 2000,
    maxIterations: 50,
    autonomyLevel: 'medium'
  }
});
```

---

## Using with Llama.cpp

### GPT-OSS 120B with GPU Acceleration

```javascript
// Start llama.cpp server with GPU layers
const server = await llamaManager.startServer(
  '/path/to/gpt-oss-120b.gguf',
  {
    contextSize: 4096,
    threads: 8,
    gpuLayers: 40,  // Offload to GPU
    batchSize: 512
  }
);

// Server will be available at http://localhost:[auto-assigned-port]
```

### GPT-OSS 20B on Consumer Hardware

```javascript
// Start llama.cpp server with CPU
const server = await llamaManager.startServer(
  '/path/to/gpt-oss-20b.gguf',
  {
    contextSize: 2048,
    threads: 12,
    gpuLayers: 0,   // CPU only
    batchSize: 512
  }
);
```

---

## Performance Expectations

### GPT-OSS 120B

**With H100 GPU:**
- Inference speed: ~20-30 tokens/second
- Context window: 4096+ tokens
- Quality: Excellent reasoning and comprehension

**Use Cases:**
- Complex multi-step reasoning
- Code generation and review
- Research and analysis
- Strategic planning
- Advanced problem-solving

### GPT-OSS 20B

**With Consumer CPU:**
- Inference speed: ~5-10 tokens/second
- Context window: 2048+ tokens
- Quality: Good for specialized tasks

**With Consumer GPU (RTX 4060):**
- Inference speed: ~15-25 tokens/second
- Context window: 4096 tokens
- Quality: Excellent for size

**Use Cases:**
- Rapid responses
- Specialized domains
- Development and testing
- Cost-effective production
- Edge deployment

---

## Comparison Table

| Feature | GPT-OSS 120B | GPT-OSS 20B |
|---------|--------------|-------------|
| Parameters | 117B | 21B |
| Model Size | 70GB | 12GB |
| RAM Required | 80GB GPU | 16GB System |
| Hardware | Data Center GPU | Consumer PC |
| Inference Speed (GPU) | 20-30 tok/s | 15-25 tok/s |
| Reasoning Quality | Excellent | Good |
| Cost | High | Low |
| Best For | Production | Development |
| Power Consumption | High | Moderate |

---

## Tips & Best Practices

### For GPT-OSS 120B

1. **Use GPU Acceleration**: Essential for reasonable performance
2. **Monitor VRAM**: Keep an eye on GPU memory usage
3. **Adjust Context Size**: Balance between capability and memory
4. **Batch Processing**: Process multiple requests together when possible
5. **Temperature Settings**: Lower (0.5-0.7) for reasoning, higher (0.8-1.0) for creativity

### For GPT-OSS 20B

1. **CPU Optimization**: Use all available CPU threads
2. **Smaller Context**: Keep context window reasonable (2048-4096)
3. **Quick Tasks**: Best for tasks that don't require maximum reasoning
4. **GPU Optional**: Can benefit from consumer GPU but not required
5. **Multiple Instances**: Can run several agents simultaneously

---

## Troubleshooting

### GPT-OSS 120B Issues

**Problem**: Out of memory errors
**Solution**: 
- Ensure you have 80GB+ GPU RAM
- Reduce context size
- Lower batch size
- Close other GPU applications

**Problem**: Slow inference
**Solution**:
- Increase GPU layers
- Check GPU utilization
- Reduce context size
- Update GPU drivers

### GPT-OSS 20B Issues

**Problem**: Slow on CPU
**Solution**:
- Enable all CPU threads
- Close background applications
- Consider using GPU acceleration
- Reduce context size

**Problem**: Quality not as expected
**Solution**:
- Adjust temperature settings
- Provide more context in prompts
- Use system prompts effectively
- Consider upgrading to 120B for complex tasks

---

## Cost Considerations

### GPT-OSS 120B
- **Hardware**: $30,000-40,000 (H100) or $10,000-15,000 (A100)
- **Cloud**: $3-5 per hour (spot instances)
- **Power**: ~400-700W
- **Best ROI**: High-volume production use

### GPT-OSS 20B
- **Hardware**: $1,000-2,000 (consumer PC)
- **Cloud**: $0.50-1.00 per hour
- **Power**: ~200-400W
- **Best ROI**: Development, testing, moderate production

---

## Integration with Agent Features

### Agent Communication
Both models work seamlessly with the agent communication system:
```javascript
// GPT-OSS agents can communicate
agent120b.sendMessage(agent20b.id, 'Analyze this data...');
```

### Command Execution
Both models can safely execute commands:
```javascript
// Models can reason about which commands to run
const result = await commandExecutor.executeCommand('npm install');
```

### Task Delegation
120B can delegate to 20B for efficiency:
```javascript
// 120B does reasoning, delegates execution to 20B
await agent120b.delegateTask(agent20b.id, 'Execute this specific task...');
```

---

## Examples

### Example 1: Multi-Agent System

```javascript
// Create a team with both models
const strategist = await createAgent({
  name: 'Strategic Planner',
  model: 'gpt-oss-120b',
  systemPrompt: 'You plan and strategize complex projects...',
  capabilities: { agentCommunication: true }
});

const executor = await createAgent({
  name: 'Task Executor',
  model: 'gpt-oss-20b',
  systemPrompt: 'You execute specific tasks efficiently...',
  capabilities: { agentCommunication: true, commandExecution: true }
});

// 120B plans, 20B executes
await startAgent(strategist.id);
await startAgent(executor.id);
```

### Example 2: Cost-Optimized Deployment

```javascript
// Use 20B for most tasks, 120B for complex reasoning
const quickAgent = await createAgent({
  model: 'gpt-oss-20b',
  autonomyLevel: 'high'
});

const deepAgent = await createAgent({
  model: 'gpt-oss-120b',
  autonomyLevel: 'low'  // Only when needed
});
```

---

## Future Enhancements

Planned improvements for GPT-OSS model support:
- [ ] Automatic model selection based on task complexity
- [ ] Multi-GPU support for 120B
- [ ] Quantization options (Q5, Q6, Q8)
- [ ] Fine-tuning capabilities
- [ ] Model merging and ensemble
- [ ] Performance profiling tools

---

## Support & Resources

- **HuggingFace**: https://huggingface.co/mradermacher
- **Llama.cpp Docs**: https://github.com/ggerganov/llama.cpp
- **App Issues**: Open issue on GitHub
- **Community**: Join Discord/forum (link in README)

---

## License

GPT-OSS models follow their respective licenses. Check HuggingFace for details.

---

*Last Updated: January 8, 2025*
*App Version: 2.0.1*
