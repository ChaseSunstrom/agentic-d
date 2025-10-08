import React, { useEffect, useState } from 'react';

interface Stats {
  totalAgents: number;
  activeAgents: number;
  totalCost: number;
  totalTokens: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalAgents: 0,
    activeAgents: 0,
    totalCost: 0,
    totalTokens: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const agents = await (window as any).electronAPI.agent.list();
      const cost = await (window as any).electronAPI.cost.getTotal();
      
      setStats({
        totalAgents: agents.length,
        activeAgents: agents.filter((a: any) => a.status === 'running').length,
        totalCost: cost,
        totalTokens: agents.reduce((sum: number, a: any) => sum + (a.stats?.totalTokens || 0), 0)
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <div>
      <div className="grid grid-4 mb-4">
        <div className="stat-card">
          <div className="stat-label">Total Agents</div>
          <div className="stat-value">{stats.totalAgents}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Agents</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{stats.activeAgents}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Cost</div>
          <div className="stat-value">${stats.totalCost.toFixed(4)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Tokens</div>
          <div className="stat-value">{stats.totalTokens.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Start</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>1. Add LLM Provider</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Connect your OpenAI, Anthropic, or local LLM provider to get started
                </p>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>2. Create an Agent</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Configure an autonomous agent with specific goals and capabilities
                </p>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>3. Start Agent</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Launch your agent to run autonomously in the background
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">System Overview</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px' }}>CPU Usage</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>--</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '0%' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px' }}>Memory Usage</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>--</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '0%' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px' }}>Disk Usage</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>--</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '0%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
