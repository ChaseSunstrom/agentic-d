import React from 'react';

interface AgentCardProps {
  agent: any;
  onStart: (agentId: string) => void;
  onStop: (agentId: string) => void;
  onDelete: (agentId: string) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onStart, onStop, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'var(--success)';
      case 'error':
        return 'var(--error)';
      default:
        return 'var(--text-secondary)';
    }
  };

  return (
    <div className="agent-card">
      <div className="agent-header">
        <div className="agent-name">{agent.name}</div>
        <div className={`agent-status ${agent.status}`}>
          {agent.status}
        </div>
      </div>

      <div className="agent-description">{agent.description}</div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
            {agent.model}
          </span>
          {agent.capabilities.computerControl && (
            <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
              🖱️ Computer Control
            </span>
          )}
          {agent.capabilities.fileSystem && (
            <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
              📁 File System
            </span>
          )}
          {agent.capabilities.network && (
            <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
              🌐 Network
            </span>
          )}
          {agent.capabilities.agentCommunication && (
            <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
              💬 Agent Comms
            </span>
          )}
          {agent.capabilities.commandExecution && (
            <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
              ⌨️ Commands
            </span>
          )}
        </div>
      </div>

      <div className="agent-stats">
        <div className="agent-stat">
          <div className="agent-stat-label">Total Runs</div>
          <div className="agent-stat-value">{agent.stats?.totalRuns || 0}</div>
        </div>
        <div className="agent-stat">
          <div className="agent-stat-label">Tokens</div>
          <div className="agent-stat-value">{(agent.stats?.totalTokens || 0).toLocaleString()}</div>
        </div>
        <div className="agent-stat">
          <div className="agent-stat-label">Cost</div>
          <div className="agent-stat-value">${(agent.stats?.totalCost || 0).toFixed(4)}</div>
        </div>
        {agent.capabilities.agentCommunication && (
          <div className="agent-stat">
            <div className="agent-stat-label">Messages</div>
            <div className="agent-stat-value">
              {agent.stats?.messagesSent || 0} / {agent.stats?.messagesReceived || 0}
            </div>
          </div>
        )}
        {agent.capabilities.commandExecution && (
          <div className="agent-stat">
            <div className="agent-stat-label">Commands</div>
            <div className="agent-stat-value">{agent.stats?.commandsExecuted || 0}</div>
          </div>
        )}
      </div>

      <div className="agent-actions">
        {agent.status === 'running' ? (
          <button className="btn btn-small" onClick={() => onStop(agent.id)}>
            ⏸ Stop
          </button>
        ) : (
          <button className="btn btn-small btn-success" onClick={() => onStart(agent.id)}>
            ▶ Start
          </button>
        )}
        <button className="btn btn-small btn-danger" onClick={() => onDelete(agent.id)}>
          🗑 Delete
        </button>
      </div>
    </div>
  );
};

export default AgentCard;
