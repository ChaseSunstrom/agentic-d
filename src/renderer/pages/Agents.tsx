import React, { useEffect, useState } from 'react';
import CreateAgentModal from '../components/CreateAgentModal';
import AgentCard from '../components/AgentCard';

const Agents: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => {
    loadAgents();
    loadProviders();
    const interval = setInterval(loadAgents, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadAgents = async () => {
    try {
      const agentList = await (window as any).electronAPI.agent.list();
      setAgents(agentList);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadProviders = async () => {
    try {
      const providerList = await (window as any).electronAPI.llm.listProviders();
      setProviders(providerList);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const handleCreateAgent = async (agentData: any) => {
    try {
      await (window as any).electronAPI.agent.create(agentData);
      setShowCreateModal(false);
      loadAgents();
    } catch (error) {
      console.error('Failed to create agent:', error);
      alert('Failed to create agent');
    }
  };

  const handleStartAgent = async (agentId: string) => {
    try {
      await (window as any).electronAPI.agent.start(agentId);
      loadAgents();
    } catch (error) {
      console.error('Failed to start agent:', error);
    }
  };

  const handleStopAgent = async (agentId: string) => {
    try {
      await (window as any).electronAPI.agent.stop(agentId);
      loadAgents();
    } catch (error) {
      console.error('Failed to stop agent:', error);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    
    try {
      await (window as any).electronAPI.agent.delete(agentId);
      loadAgents();
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Your Agents</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Create and manage autonomous agents</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
          <h3 style={{ marginBottom: '8px' }}>No agents yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Create your first autonomous agent to get started
          </p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            Create Your First Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-2">
          {agents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onStart={handleStartAgent}
              onStop={handleStopAgent}
              onDelete={handleDeleteAgent}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateAgentModal
          providers={providers}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateAgent}
        />
      )}
    </div>
  );
};

export default Agents;
