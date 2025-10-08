import React, { useState, useEffect } from 'react';

interface UserPrompt {
  id: string;
  agentId: string;
  agentName: string;
  type: 'question' | 'confirmation' | 'choice' | 'approval';
  title: string;
  message: string;
  options?: string[];
  defaultValue?: string | boolean;
  timestamp: Date;
  status: string;
  context?: any;
}

const UserPromptDialog: React.FC = () => {
  const [currentPrompt, setCurrentPrompt] = useState<UserPrompt | null>(null);
  const [response, setResponse] = useState<string>('');
  const [selectedChoice, setSelectedChoice] = useState<string>('');

  useEffect(() => {
    const electronAPI = (window as any).electronAPI;

    // Listen for new prompts
    electronAPI.userPrompt.onShow((prompt: UserPrompt) => {
      setCurrentPrompt(prompt);
      setResponse('');
      setSelectedChoice(prompt.options?.[0] || '');
    });

    electronAPI.userPrompt.onAnswered((prompt: UserPrompt) => {
      if (currentPrompt?.id === prompt.id) {
        setCurrentPrompt(null);
        setResponse('');
        setSelectedChoice('');
      }
    });

    // Check for existing prompt on mount
    electronAPI.userPrompt.getCurrent().then((prompt: UserPrompt | null) => {
      if (prompt) {
        setCurrentPrompt(prompt);
        setSelectedChoice(prompt.options?.[0] || '');
      }
    });

    return () => {
      // Cleanup if needed
    };
  }, [currentPrompt?.id]);

  const handleRespond = async () => {
    if (!currentPrompt) return;

    const electronAPI = (window as any).electronAPI;
    let finalResponse: any;

    switch (currentPrompt.type) {
      case 'question':
        finalResponse = response;
        break;
      case 'confirmation':
        finalResponse = true;
        break;
      case 'approval':
        finalResponse = true;
        break;
      case 'choice':
        finalResponse = selectedChoice;
        break;
      default:
        finalResponse = response;
    }

    await electronAPI.userPrompt.respond(currentPrompt.id, finalResponse);
    setCurrentPrompt(null);
    setResponse('');
    setSelectedChoice('');
  };

  const handleCancel = async () => {
    if (!currentPrompt) return;

    const electronAPI = (window as any).electronAPI;
    
    if (currentPrompt.type === 'confirmation' || currentPrompt.type === 'approval') {
      await electronAPI.userPrompt.respond(currentPrompt.id, false);
    } else {
      await electronAPI.userPrompt.cancel(currentPrompt.id);
    }
    
    setCurrentPrompt(null);
    setResponse('');
    setSelectedChoice('');
  };

  if (!currentPrompt) {
    return null;
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{currentPrompt.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
              Agent: {currentPrompt.agentName}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{currentPrompt.message}</p>
          
          {currentPrompt.context && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              background: 'var(--bg-tertiary)', 
              borderRadius: '8px',
              fontSize: '13px'
            }}>
              <div style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }}>Context:</div>
              <pre style={{ 
                margin: 0, 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                color: 'var(--text-secondary)'
              }}>
                {JSON.stringify(currentPrompt.context, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {currentPrompt.type === 'question' && (
          <div className="form-group">
            <label className="form-label">Your Response</label>
            <textarea
              className="form-textarea"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type your response..."
              rows={3}
              autoFocus
            />
          </div>
        )}

        {currentPrompt.type === 'choice' && currentPrompt.options && (
          <div className="form-group">
            <label className="form-label">Select an option</label>
            <select
              className="form-select"
              value={selectedChoice}
              onChange={(e) => setSelectedChoice(e.target.value)}
              autoFocus
            >
              {currentPrompt.options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="modal-footer">
          {(currentPrompt.type === 'confirmation' || currentPrompt.type === 'approval') ? (
            <>
              <button className="btn" onClick={handleCancel}>
                Deny
              </button>
              <button className="btn btn-success" onClick={handleRespond}>
                Approve
              </button>
            </>
          ) : (
            <>
              <button className="btn" onClick={handleCancel}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleRespond}
                disabled={currentPrompt.type === 'question' && !response.trim()}
              >
                Submit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPromptDialog;
