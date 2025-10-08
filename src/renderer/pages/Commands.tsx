import React, { useState, useEffect } from 'react';
import { Terminal, Play, Square, RefreshCw, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const Commands: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [runningCommands, setRunningCommands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCommand, setNewCommand] = useState('');
  const [executing, setExecuting] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('manual');

  useEffect(() => {
    loadData();
    
    // Listen for command completions
    window.electron.on('command:completed', (result: any) => {
      loadData();
    });

    // Refresh every 5 seconds
    const interval = setInterval(loadData, 5000);

    return () => {
      window.electron.removeAllListeners('command:completed');
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const hist = await window.electron.invoke('command:get-history', undefined, 50);
      setHistory(hist);

      const running = await window.electron.invoke('command:get-running');
      setRunningCommands(running);
    } catch (error) {
      console.error('Failed to load command data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!newCommand.trim()) return;

    try {
      setExecuting(true);
      const isSafe = await window.electron.invoke('command:is-safe', newCommand);
      
      if (!isSafe) {
        if (!confirm('This command may be dangerous. Are you sure you want to execute it?')) {
          setExecuting(false);
          return;
        }
      }

      await window.electron.invoke('command:execute', newCommand, {
        agentId: selectedAgentId === 'manual' ? undefined : selectedAgentId
      });
      
      setNewCommand('');
      await loadData();
    } catch (error) {
      console.error('Failed to execute command:', error);
      alert(`Command failed: ${error}`);
    } finally {
      setExecuting(false);
    }
  };

  const handleKill = async (id: string) => {
    try {
      await window.electron.invoke('command:kill', id);
      await loadData();
    } catch (error) {
      console.error('Failed to kill command:', error);
    }
  };

  const getStatusIcon = (exitCode: number | null) => {
    if (exitCode === null) return <Terminal size={16} color="#888" />;
    if (exitCode === 0) return <CheckCircle size={16} color="#10b981" />;
    return <XCircle size={16} color="#ef4444" />;
  };

  if (loading && history.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <RefreshCw className="spin" size={32} />
        <p>Loading command history...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Execute Command Card */}
      <div className="card">
        <h2>Execute Command</h2>
        <p style={{ color: '#888', marginBottom: '20px' }}>
          Run terminal commands directly. Use with caution!
        </p>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Enter command (e.g., ls -la)"
            value={newCommand}
            onChange={(e) => setNewCommand(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !executing) {
                handleExecute();
              }
            }}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleExecute}
            disabled={executing || !newCommand.trim()}
          >
            {executing ? (
              <>
                <RefreshCw size={16} className="spin" /> Executing...
              </>
            ) : (
              <>
                <Play size={16} /> Execute
              </>
            )}
          </button>
        </div>

        <div style={{ 
          padding: '12px', 
          background: '#1e293b', 
          borderRadius: '6px',
          border: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} color="#f59e0b" />
          <span style={{ fontSize: '14px', color: '#f59e0b' }}>
            Commands run with the permissions of the application. Dangerous commands are blocked by default.
          </span>
        </div>
      </div>

      {/* Running Commands */}
      {runningCommands.length > 0 && (
        <div className="card">
          <h2>Running Commands</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {runningCommands.map((cmd) => (
              <div
                key={cmd.id}
                style={{
                  padding: '16px',
                  background: '#1e293b',
                  borderRadius: '8px',
                  border: '1px solid #334155'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontFamily: 'monospace', 
                      marginBottom: '8px',
                      color: '#3b82f6'
                    }}>
                      $ {cmd.command}
                    </div>
                    <div style={{ fontSize: '14px', color: '#888' }}>
                      Status: {cmd.status}
                      {cmd.agentId && ` | Agent: ${cmd.agentId}`}
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleKill(cmd.id)}
                  >
                    <Square size={14} /> Kill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Command History */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Command History</h2>
          <button className="btn" onClick={loadData}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {history.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', padding: '40px 20px' }}>
            No commands executed yet
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map((cmd) => (
              <div
                key={cmd.id}
                style={{
                  padding: '16px',
                  background: '#1e293b',
                  borderRadius: '8px',
                  border: '1px solid #334155'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '8px' }}>
                  {getStatusIcon(cmd.exitCode)}
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontFamily: 'monospace', 
                      marginBottom: '8px',
                      color: cmd.exitCode === 0 ? '#10b981' : '#ef4444'
                    }}>
                      $ {cmd.command}
                    </div>
                    
                    <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>
                      {new Date(cmd.startTime).toLocaleString()} | 
                      Duration: {cmd.duration}ms | 
                      Exit Code: {cmd.exitCode ?? 'N/A'}
                      {cmd.agentId && ` | Agent: ${cmd.agentId}`}
                    </div>

                    {cmd.stdout && (
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#3b82f6', marginBottom: '8px' }}>
                          Show Output
                        </summary>
                        <pre style={{
                          background: '#0f172a',
                          padding: '12px',
                          borderRadius: '6px',
                          overflow: 'auto',
                          maxHeight: '200px',
                          fontSize: '12px',
                          marginTop: '8px'
                        }}>
                          {cmd.stdout}
                        </pre>
                      </details>
                    )}

                    {cmd.stderr && (
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#ef4444', marginBottom: '8px' }}>
                          Show Errors
                        </summary>
                        <pre style={{
                          background: '#0f172a',
                          padding: '12px',
                          borderRadius: '6px',
                          overflow: 'auto',
                          maxHeight: '200px',
                          fontSize: '12px',
                          marginTop: '8px',
                          color: '#ef4444'
                        }}>
                          {cmd.stderr}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Commands;
