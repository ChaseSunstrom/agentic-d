import React, { useEffect, useState } from 'react';

const Models: React.FC = () => {
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [installedModels, setInstalledModels] = useState<any[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadModels();
    
    // Listen for download progress
    (window as any).electronAPI.model.onDownloadProgress((data: any) => {
      setDownloadProgress(prev => ({
        ...prev,
        [data.modelId]: data.progress
      }));
    });
  }, []);

  const loadModels = async () => {
    try {
      const [available, installed] = await Promise.all([
        (window as any).electronAPI.model.listAvailable(),
        (window as any).electronAPI.model.listInstalled()
      ]);
      setAvailableModels(available);
      setInstalledModels(installed);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handleInstall = async (modelId: string) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [modelId]: 0 }));
      await (window as any).electronAPI.model.install(modelId);
      loadModels();
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[modelId];
        return newProgress;
      });
    } catch (error) {
      console.error('Failed to install model:', error);
      alert('Failed to install model');
    }
  };

  const handleUninstall = async (modelId: string) => {
    if (!confirm('Are you sure you want to uninstall this model?')) return;
    
    try {
      await (window as any).electronAPI.model.uninstall(modelId);
      loadModels();
    } catch (error) {
      console.error('Failed to uninstall model:', error);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const found = await (window as any).electronAPI.model.scan();
      alert(`Found ${found.length} new model(s)`);
      loadModels();
    } catch (error) {
      console.error('Failed to scan for models:', error);
      alert('Failed to scan for models');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Local Models</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Install and manage local LLM models</p>
        </div>
        <button className="btn btn-primary" onClick={handleScan} disabled={isScanning}>
          {isScanning ? 'Scanning...' : '🔍 Scan for Models'}
        </button>
      </div>

      {installedModels.length > 0 && (
        <>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Installed Models</h3>
          <div className="grid grid-2" style={{ marginBottom: '32px' }}>
            {installedModels.map(model => (
              <div key={model.id} className="card">
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{model.name}</h4>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                      {model.size}
                    </span>
                    <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                      {model.format}
                    </span>
                    <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                      {model.quantization}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Provider: {model.provider}
                </div>
                {model.path && (
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '12px', wordBreak: 'break-all' }}>
                    {model.path}
                  </div>
                )}
                <button className="btn btn-small btn-danger" onClick={() => handleUninstall(model.id)}>
                  Uninstall
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Available Models</h3>
      <div className="grid grid-2">
        {availableModels.filter(m => !m.installed).map(model => (
          <div key={model.id} className="card">
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{model.name}</h4>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                  {model.size}
                </span>
                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                  {model.format}
                </span>
                <span style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                  {model.quantization}
                </span>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Provider: {model.provider}
            </div>
            {downloadProgress[model.id] !== undefined ? (
              <div>
                <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                  Downloading: {downloadProgress[model.id]}%
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${downloadProgress[model.id]}%` }}></div>
                </div>
              </div>
            ) : (
              <button className="btn btn-small btn-primary" onClick={() => handleInstall(model.id)}>
                Install
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Models;
