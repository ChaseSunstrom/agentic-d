import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import Providers from './pages/Providers';
import Models from './pages/Models';
import Resources from './pages/Resources';
import Settings from './pages/Settings';
import Ollama from './pages/Ollama';
import Commands from './pages/Commands';
import UserPromptDialog from './components/UserPromptDialog';

type Page = 'dashboard' | 'agents' | 'providers' | 'models' | 'resources' | 'settings' | 'ollama' | 'commands';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'agents':
        return <Agents />;
      case 'providers':
        return <Providers />;
      case 'models':
        return <Models />;
      case 'ollama':
        return <Ollama />;
      case 'commands':
        return <Commands />;
      case 'resources':
        return <Resources />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  return (
    <div className="app">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <div className="main-content">
        <div className="header">
          <h1 className="header-title">
            {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
          </h1>
        </div>
        <div className="content">
          {renderPage()}
        </div>
      </div>
      <UserPromptDialog />
    </div>
  );
};

export default App;
