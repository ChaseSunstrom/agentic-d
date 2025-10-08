import React, { useState } from 'react';

interface CreateAgentModalProps {
  providers: any[];
  onClose: () => void;
  onSubmit: (agentData: any) => void;
}

const CreateAgentModal: React.FC<CreateAgentModalProps> = ({ providers, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [providerId, setProviderId] = useState('');
  const [model, setModel] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant. Your goal is to assist users and complete tasks autonomously.');
  const [computerControl, setComputerControl] = useState(false);
  const [fileSystem, setFileSystem] = useState(false);
  const [network, setNetwork] = useState(false);
  const [agentCommunication, setAgentCommunication] = useState(true);
  const [commandExecution, setCommandExecution] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [autonomyLevel, setAutonomyLevel] = useState<'low' | 'medium' | 'high'>('medium');

  const selectedProvider = providers.find(p => p.id === providerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !providerId || !model) {
      alert('Please fill in all required fields');
      return;
    }

    const agentData = {
      name,
      description,
      llmProvider: providerId,
      model,
      systemPrompt,
      capabilities: {
        computerControl,
        fileSystem,
        network,
        agentCommunication,
        commandExecution
      },
      config: {
        temperature,
        maxTokens,
        maxIterations: 100,
        autonomyLevel
      }
    };

    onSubmit(agentData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Agent</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Agent Name *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Agent"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this agent do?"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">LLM Provider *</label>
            <select
              className="form-select"
              value={providerId}
              onChange={(e) => {
                setProviderId(e.target.value);
                setModel('');
              }}
              required
            >
              <option value="">Select a provider</option>
              {providers.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name} ({provider.type})
                </option>
              ))}
            </select>
          </div>

          {selectedProvider && (
            <div className="form-group">
              <label className="form-label">Model *</label>
              <select
                className="form-select"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
              >
                <option value="">Select a model</option>
                {selectedProvider.models.map((m: string) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">System Prompt</label>
            <textarea
              className="form-textarea"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Capabilities</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={computerControl}
                  onChange={(e) => setComputerControl(e.target.checked)}
                />
                <span>Computer Control (mouse, keyboard, screen)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={fileSystem}
                  onChange={(e) => setFileSystem(e.target.checked)}
                />
                <span>File System Access</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={network}
                  onChange={(e) => setNetwork(e.target.checked)}
                />
                <span>Network Access</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={agentCommunication}
                  onChange={(e) => setAgentCommunication(e.target.checked)}
                />
                <span>Agent Communication (message passing, task delegation)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={commandExecution}
                  onChange={(e) => setCommandExecution(e.target.checked)}
                />
                <span>Command Execution (run terminal commands)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Temperature ({temperature})</label>
              <input
                type="range"
                className="form-input"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Tokens</label>
              <input
                type="number"
                className="form-input"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                min="100"
                max="32000"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Autonomy Level</label>
            <select
              className="form-select"
              value={autonomyLevel}
              onChange={(e) => setAutonomyLevel(e.target.value as any)}
            >
              <option value="low">Low (asks for confirmation frequently)</option>
              <option value="medium">Medium (balanced approach)</option>
              <option value="high">High (fully autonomous)</option>
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Agent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAgentModal;
