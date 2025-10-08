import React, { useEffect, useState } from 'react';
import AddProviderModal from '../components/AddProviderModal';

const Providers: React.FC = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const providerList = await (window as any).electronAPI.llm.listProviders();
      setProviders(providerList);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const handleAddProvider = async (providerData: any) => {
    try {
      await (window as any).electronAPI.llm.addProvider(providerData);
      setShowAddModal(false);
      loadProviders();
    } catch (error) {
      console.error('Failed to add provider:', error);
      alert('Failed to add provider');
    }
  };

  const handleTestProvider = async (providerId: string) => {
    try {
      const success = await (window as any).electronAPI.llm.testProvider(providerId);
      alert(success ? 'Provider test successful!' : 'Provider test failed');
    } catch (error) {
      console.error('Provider test failed:', error);
      alert('Provider test failed');
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;
    
    try {
      await (window as any).electronAPI.llm.deleteProvider(providerId);
      loadProviders();
    } catch (error) {
      console.error('Failed to delete provider:', error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>LLM Providers</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Connect to OpenAI, Anthropic, DeepSeek, or custom providers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Provider
        </button>
      </div>

      {providers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔌</div>
          <h3 style={{ marginBottom: '8px' }}>No providers configured</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Add an LLM provider to start using agents
          </p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            Add Your First Provider
          </button>
        </div>
      ) : (
        <div className="grid grid-2">
          {providers.map(provider => (
            <div key={provider.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>{provider.name}</h3>
                  <span style={{ fontSize: '12px', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                    {provider.type}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {provider.enabled && (
                    <span style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%' }}></span>
                  )}
                </div>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Available Models: {provider.models?.length || 0}
                </div>
                {provider.models && provider.models.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {provider.models.slice(0, 3).map((model: string, idx: number) => (
                      <span key={idx} style={{ 
                        fontSize: '11px', 
                        padding: '4px 8px', 
                        background: 'var(--bg-primary)', 
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)'
                      }}>
                        {model}
                      </span>
                    ))}
                    {provider.models.length > 3 && (
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        +{provider.models.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-small" onClick={() => handleTestProvider(provider.id)}>
                  Test Connection
                </button>
                <button className="btn btn-small btn-danger" onClick={() => handleDeleteProvider(provider.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddProviderModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddProvider}
        />
      )}
    </div>
  );
};

export default Providers;
