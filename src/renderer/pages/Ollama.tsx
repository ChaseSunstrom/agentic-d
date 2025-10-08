import React, { useState, useEffect } from 'react';
import { Download, Play, Trash2, RefreshCw, Server, CheckCircle, XCircle } from 'lucide-react';

const Ollama: React.FC = () => {
  const [installation, setInstallation] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState<string | null>(null);
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    loadData();
    
    // Listen for progress updates
    window.electron.on('ollama:pull-progress', (data: any) => {
      setProgress(data);
    });

    return () => {
      window.electron.removeAllListeners('ollama:pull-progress');
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const inst = await window.electron.invoke('ollama:check-installation');
      setInstallation(inst);

      if (inst.running) {
        const modelsList = await window.electron.invoke('ollama:list-models');
        setModels(modelsList);
      }

      const rec = await window.electron.invoke('ollama:get-recommended');
      setRecommended(rec);
    } catch (error) {
      console.error('Failed to load Ollama data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOllama = async () => {
    try {
      const started = await window.electron.invoke('ollama:start');
      if (started) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to start Ollama:', error);
      alert('Failed to start Ollama. Make sure it is installed.');
    }
  };

  const handlePullModel = async (modelName: string) => {
    try {
      setPulling(modelName);
      setProgress(null);
      await window.electron.invoke('ollama:pull-model', modelName);
      await loadData();
    } catch (error) {
      console.error('Failed to pull model:', error);
      alert(`Failed to pull model: ${error}`);
    } finally {
      setPulling(null);
      setProgress(null);
    }
  };

  const handleDeleteModel = async (modelName: string) => {
    if (!confirm(`Are you sure you want to delete ${modelName}?`)) {
      return;
    }

    try {
      await window.electron.invoke('ollama:delete-model', modelName);
      await loadData();
    } catch (error) {
      console.error('Failed to delete model:', error);
      alert(`Failed to delete model: ${error}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <RefreshCw className="spin" size={32} />
        <p>Loading Ollama status...</p>
      </div>
    );
  }

  if (!installation?.installed) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <Server size={64} style={{ margin: '0 auto 20px' }} />
          <h2>Ollama Not Installed</h2>
          <p style={{ marginBottom: '20px' }}>
            Ollama is not installed on this system. Please install Ollama to use local models.
          </p>
          <a 
            href="https://ollama.ai/download" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Download Ollama
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Status Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Ollama Status</h2>
          <button className="btn" onClick={loadData}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Installation Status</div>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} color="#10b981" />
              Installed
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Server Status</div>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {installation.running ? (
                <>
                  <CheckCircle size={20} color="#10b981" />
                  Running
                </>
              ) : (
                <>
                  <XCircle size={20} color="#ef4444" />
                  Stopped
                </>
              )}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Version</div>
            <div className="stat-value">{installation.version || 'Unknown'}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Installed Models</div>
            <div className="stat-value">{models.length}</div>
          </div>
        </div>

        {!installation.running && (
          <div style={{ marginTop: '20px' }}>
            <button className="btn btn-primary" onClick={handleStartOllama}>
              <Play size={16} /> Start Ollama
            </button>
          </div>
        )}
      </div>

      {/* Installed Models */}
      {installation.running && (
        <div className="card">
          <h2>Installed Models</h2>
          {models.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
              No models installed yet. Pull a model from the recommended list below.
            </p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Size</th>
                    <th>Modified</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => (
                    <tr key={model.digest}>
                      <td><strong>{model.name}</strong></td>
                      <td>{(model.size / (1024 * 1024 * 1024)).toFixed(2)} GB</td>
                      <td>{new Date(model.modified).toLocaleString()}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteModel(model.name)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Recommended Models */}
      {installation.running && (
        <div className="card">
          <h2>Recommended Models</h2>
          <p style={{ marginBottom: '20px', color: '#888' }}>
            Popular models that work well for autonomous agents
          </p>

          {pulling && progress && (
            <div style={{ 
              padding: '15px', 
              background: '#1e293b', 
              borderRadius: '8px', 
              marginBottom: '20px',
              border: '1px solid #334155'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Pulling: {pulling}</span>
                <span>{progress.progress || 0}%</span>
              </div>
              <div style={{ 
                height: '8px', 
                background: '#334155', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div 
                  style={{ 
                    height: '100%', 
                    background: '#3b82f6',
                    width: `${progress.progress || 0}%`,
                    transition: 'width 0.3s'
                  }}
                />
              </div>
              <div style={{ marginTop: '8px', fontSize: '14px', color: '#888' }}>
                {progress.status}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: '16px' }}>
            {recommended.map((model) => {
              const isInstalled = models.some(m => m.name.startsWith(model.name.split(':')[0]));
              const isPulling = pulling === model.name;

              return (
                <div 
                  key={model.name}
                  style={{ 
                    padding: '16px', 
                    background: '#1e293b', 
                    borderRadius: '8px',
                    border: '1px solid #334155'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px 0' }}>{model.name}</h3>
                      <p style={{ margin: '0 0 8px 0', color: '#888' }}>{model.description}</p>
                      <div style={{ fontSize: '14px', color: '#888' }}>
                        Size: {model.size}
                      </div>
                    </div>
                    <div>
                      {isInstalled ? (
                        <div style={{ 
                          padding: '6px 12px', 
                          background: '#10b98120',
                          color: '#10b981',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}>
                          Installed
                        </div>
                      ) : (
                        <button
                          className="btn btn-primary"
                          onClick={() => handlePullModel(model.name)}
                          disabled={isPulling}
                        >
                          <Download size={16} />
                          {isPulling ? 'Pulling...' : 'Pull'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Ollama;
