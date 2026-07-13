import React, { useState } from 'react';
import Uploader from './components/Uploader';
import ResultsPanel from './components/ResultsPanel';
import HistoryList from './components/HistoryList';
import { uploadAudio } from './api';
import { LayoutDashboard, History, Settings, Search, Bell } from 'lucide-react';

function App() {
  const [currentResult, setCurrentResult] = useState(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleFileUpload = async (file) => {
    try {
      setIsUploading(true);
      const result = await uploadAudio(file);
      setCurrentResult(result);
      if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl); // Clean up previous
      setCurrentAudioUrl(URL.createObjectURL(file));
      setRefreshHistory(prev => prev + 1);
    } catch (error) {
      alert("Error processing file: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          🎙️ AudioPro
        </div>
        <div className="nav-links">
          <a href="#" className="nav-item active">
            <LayoutDashboard size={20} />
            Dashboard
          </a>
          <a href="#" className="nav-item">
            <History size={20} />
            All Recordings
          </a>
          <a href="#" className="nav-item">
            <Settings size={20} />
            Settings
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <h1>Dashboard</h1>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div className="search-bar">
              <Search size={18} color="var(--text-secondary)" />
              <input type="text" placeholder="Search interactions..." />
            </div>
            <Bell size={20} color="var(--text-secondary)" style={{cursor: 'pointer'}} />
          </div>
        </header>

        <div className="dashboard-grid">
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Uploader onFileSelect={handleFileUpload} isUploading={isUploading} />
            <HistoryList refreshTrigger={refreshHistory} />
          </div>

          {/* Right Column */}
          <div>
            <ResultsPanel result={currentResult} audioUrl={currentAudioUrl} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
