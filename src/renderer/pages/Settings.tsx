import React, { useState, useEffect } from 'react';

const Settings: React.FC = () => {
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [maxConcurrentAgents, setMaxConcurrentAgents] = useState(5);
  const [autoSaveInterval, setAutoSaveInterval] = useState(60);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const automation = await (window as any).electronAPI.settings.get('automation.enabled');
      const maxAgents = await (window as any).electronAPI.settings.get('agents.maxConcurrent');
      const saveInterval = await (window as any).electronAPI.settings.get('general.autoSaveInterval');
      
      if (automation !== undefined) setAutomationEnabled(automation);
      if (maxAgents !== undefined) setMaxConcurrentAgents(maxAgents);
      if (saveInterval !== undefined) setAutoSaveInterval(saveInterval);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      await (window as any).electronAPI.settings.set('automation.enabled', automationEnabled);
      await (window as any).electronAPI.settings.set('agents.maxConcurrent', maxConcurrentAgents);
      await (window as any).electronAPI.settings.set('general.autoSaveInterval', autoSaveInterval);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    }
  };

  const testAutomation = async () => {
    try {
      const success = await (window as any).electronAPI.automation.test();
      alert(success ? 'Automation test successful! ✓' : 'Automation test failed ✗');
    } catch (error) {
      console.error('Automation test failed:', error);
      alert('Automation test failed ✗');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Settings</h2>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 className="card-title">General Settings</h3>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Auto-save Interval (seconds)</label>
            <input
              type="number"
              className="form-input"
              value={autoSaveInterval}
              onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))}
              min="10"
              max="600"
            />
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
              How often to automatically save agent states and progress
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 className="card-title">Agent Settings</h3>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Maximum Concurrent Agents</label>
            <input
              type="number"
              className="form-input"
              value={maxConcurrentAgents}
              onChange={(e) => setMaxConcurrentAgents(parseInt(e.target.value))}
              min="1"
              max="20"
            />
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
              Maximum number of agents that can run simultaneously
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 className="card-title">Automation Settings</h3>
        <div className="card-body">
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={automationEnabled}
                onChange={(e) => setAutomationEnabled(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span className="form-label" style={{ marginBottom: 0 }}>Enable Computer Automation</span>
            </label>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
              Allow agents to control mouse, keyboard, and other system features
            </p>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button className="btn btn-small" onClick={testAutomation}>
              Test Automation
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">About</h3>
        <div className="card-body">
          <p style={{ marginBottom: '8px' }}><strong>Autonomous Agent Desktop</strong></p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Version 1.0.0</p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '16px' }}>
            A powerful desktop application for running autonomous AI agents with support for multiple LLM providers,
            local models, and computer automation capabilities.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSave}>
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
