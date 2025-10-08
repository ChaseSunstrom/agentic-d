import React, { useState } from 'react';

interface AddProviderModalProps {
  onClose: () => void;
  onSubmit: (providerData: any) => void;
}

const AddProviderModal: React.FC<AddProviderModalProps> = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'openai' | 'anthropic' | 'deepseek' | 'local' | 'custom'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [models, setModels] = useState('');

  const presets: Record<string, { name: string; models: string[]; apiUrl?: string }> = {
    openai: {
      name: 'OpenAI',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      apiUrl: 'https://api.openai.com/v1'
    },
    anthropic: {
      name: 'Anthropic',
      models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
    },
    deepseek: {
      name: 'DeepSeek',
      models: ['deepseek-chat', 'deepseek-coder'],
      apiUrl: 'https://api.deepseek.com/v1'
    },
    local: {
      name: 'Local LLM',
      models: ['local-model'],
      apiUrl: 'http://localhost:8080/v1'
    },
    custom: {
      name: 'Custom Provider',
      models: []
    }
  };

  const handleTypeChange = (newType: typeof type) => {
    setType(newType);
    const preset = presets[newType];
    if (preset) {
      if (!name) setName(preset.name);
      if (preset.apiUrl) setApiUrl(preset.apiUrl);
      setModels(preset.models.join(', '));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !type) {
      alert('Please fill in all required fields');
      return;
    }

    if (type !== 'local' && !apiKey && type !== 'custom') {
      alert('API Key is required for cloud providers');
      return;
    }

    const modelList = models.split(',').map(m => m.trim()).filter(m => m);

    const providerData = {
      name,
      type,
      apiKey: apiKey || undefined,
      apiUrl: apiUrl || undefined,
      models: modelList,
      enabled: true
    };

    onSubmit(providerData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add LLM Provider</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Provider Type *</label>
            <select
              className="form-select"
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as any)}
              required
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="deepseek">DeepSeek</option>
              <option value="local">Local LLM</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Provider Name *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My OpenAI Provider"
              required
            />
          </div>

          {type !== 'local' && (
            <div className="form-group">
              <label className="form-label">API Key {type !== 'custom' && '*'}</label>
              <input
                type="password"
                className="form-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                required={type !== 'custom'}
              />
            </div>
          )}

          {(type === 'local' || type === 'custom' || type === 'deepseek') && (
            <div className="form-group">
              <label className="form-label">API URL</label>
              <input
                type="text"
                className="form-input"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
              />
              {type === 'local' && (
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                  Default: http://localhost:8080/v1 (compatible with llama.cpp server, LM Studio, etc.)
                </p>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Available Models (comma-separated)</label>
            <textarea
              className="form-textarea"
              value={models}
              onChange={(e) => setModels(e.target.value)}
              placeholder="gpt-4, gpt-3.5-turbo"
              rows={3}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Provider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProviderModal;
