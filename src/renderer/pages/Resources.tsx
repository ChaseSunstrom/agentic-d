import React, { useEffect, useState } from 'react';

const Resources: React.FC = () => {
  const [resources, setResources] = useState<any>(null);
  const [costByAgent, setCostByAgent] = useState<Record<string, number>>({});
  const [costByProvider, setCostByProvider] = useState<Record<string, number>>({});
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    loadResources();
    loadCostData();
    
    const interval = setInterval(loadResources, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadResources = async () => {
    try {
      const usage = await (window as any).electronAPI.resources.getUsage();
      setResources(usage);
    } catch (error) {
      console.error('Failed to load resources:', error);
    }
  };

  const loadCostData = async () => {
    try {
      const [total, byAgent, byProvider] = await Promise.all([
        (window as any).electronAPI.cost.getTotal(),
        (window as any).electronAPI.cost.getByAgent(),
        (window as any).electronAPI.cost.getByProvider()
      ]);
      setTotalCost(total);
      setCostByAgent(byAgent);
      setCostByProvider(byProvider);
    } catch (error) {
      console.error('Failed to load cost data:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>System Resources & Costs</h2>

      <div className="grid grid-3" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-label">CPU Usage</div>
          <div className="stat-value">{resources?.cpu.usage.toFixed(1) || '--'}%</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
            {resources?.cpu.cores} cores • {resources?.cpu.model}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Memory Usage</div>
          <div className="stat-value">{resources?.memory.usagePercent.toFixed(1) || '--'}%</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
            {resources && `${formatBytes(resources.memory.used)} / ${formatBytes(resources.memory.total)}`}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Disk Usage</div>
          <div className="stat-value">{resources?.disk.usagePercent.toFixed(1) || '--'}%</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
            {resources && `${formatBytes(resources.disk.used)} / ${formatBytes(resources.disk.total)}`}
          </div>
        </div>
      </div>

      {resources && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 className="card-title" style={{ marginBottom: '20px' }}>Detailed System Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px' }}>CPU Usage</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{resources.cpu.usage.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${resources.cpu.usage}%` }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px' }}>Memory Usage</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{resources.memory.usagePercent.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${resources.memory.usagePercent}%` }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px' }}>Disk Usage</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{resources.disk.usagePercent.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${resources.disk.usagePercent}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Cost by Agent</h3>
          {Object.keys(costByAgent).length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No cost data available yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(costByAgent).map(([agentId, cost]) => (
                <div key={agentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{agentId.substring(0, 8)}...</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>${(cost as number).toFixed(4)}</span>
                </div>
              ))}
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Total</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-primary)' }}>${totalCost.toFixed(4)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Cost by Provider</h3>
          {Object.keys(costByProvider).length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No cost data available yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(costByProvider).map(([providerId, cost]) => (
                <div key={providerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{providerId}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>${(cost as number).toFixed(4)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Resources;
