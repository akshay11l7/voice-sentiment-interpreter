import React, { useState, useEffect } from 'react';
import Uploader from './components/Uploader';
import ResultsPanel from './components/ResultsPanel';
import HistoryList from './components/HistoryList';
import { uploadAudio, fetchUserProfile } from './api';
import { LayoutDashboard, History, Settings, Search, Bell, LogOut } from 'lucide-react';
import Toast from './components/Toast';
import ThemeToggle from './components/ThemeToggle';
import AuthPage from './components/AuthPage';
import AuditLogs from './components/AuditLogs';
import AllRecordings from './components/AllRecordings';
import SettingsPanel from './components/SettingsPanel';
import { ShieldAlert } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentResult, setCurrentResult] = useState(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('isAuthenticated') === 'true');
  const [userProfile, setUserProfile] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const loadProfile = async () => {
        try {
          const profile = await fetchUserProfile();
          setUserProfile(profile);
        } catch (error) {
          console.error("Failed to load user profile:", error);
        }
      };
      loadProfile();
    } else {
      setUserProfile(null);
      setIsSidebarOpen(false);
    }
  }, [isAuthenticated]);

  const username = userProfile ? (userProfile.full_name || userProfile.email || 'User') : 'User';
  const userInitial = username.charAt(0).toUpperCase();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const showError = (msg) => setToast({ message: msg, type: 'error' });
  const showSuccess = (msg) => setToast({ message: msg, type: 'success' });

  const handleFileUpload = async (file, task = 'transcribe') => {
    try {
      setIsUploading(true);
      const result = await uploadAudio(file, task);
      setCurrentResult(result);
      if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl); // Clean up previous
      setCurrentAudioUrl(URL.createObjectURL(file));
      setRefreshHistory(prev => prev + 1);
      showSuccess("Audio successfully processed!");
    } catch (error) {
      showError("Error processing file: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
  };

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <AuthPage 
          theme={theme}
          toggleTheme={toggleTheme}
          onLogin={(token) => {
            setIsAuthenticated(true);
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('token', token);
          }} 
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-user-section">
          <div className="sidebar-avatar">{userInitial}</div>
          <div className="sidebar-username">{username}</div>
        </div>
        <div className="nav-links">
          <a href="#" className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>
            <LayoutDashboard size={20} />
            Dashboard
          </a>
          <a href="#" className={`nav-item ${activeTab === 'recordings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('recordings'); }}>
            <History size={20} />
            All Recordings
          </a>
          <a href="#" className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('logs'); }}>
            <ShieldAlert size={20} />
            Activity Logs
          </a>
          <a href="#" className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }}>
            <Settings size={20} />
            Settings
          </a>
          <a href="#" className="nav-item" onClick={handleLogout} style={{ marginTop: 'auto', color: 'var(--error-color)' }}>
            <LogOut size={20} />
            Logout
          </a>
        </div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1>
              {activeTab === 'dashboard' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span>🎙️</span> AudioPro
                </span>
              ) : activeTab === 'recordings' ? (
                'All Recordings'
              ) : activeTab === 'logs' ? (
                'Activity Logs'
              ) : (
                'Settings'
              )}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div className="search-bar">
              <Search size={18} color="var(--text-secondary)" />
              <input type="text" placeholder="Search interactions..." />
            </div>
            <Bell size={20} color="var(--text-secondary)" style={{cursor: 'pointer'}} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isSidebarOpen && (
                <span className="profile-greeting-text">
                  Hi, {username}!
                </span>
              )}
              <div 
                className="profile-trigger" 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
              >
                {userInitial}
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <div className="dashboard-grid">
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Uploader 
                onFileSelect={handleFileUpload} 
                isUploading={isUploading} 
                onError={showError} 
              />
              <HistoryList 
                refreshTrigger={refreshHistory} 
                onViewAnalysis={(item) => {
                  setCurrentResult(item);
                  setCurrentAudioUrl(null); // Clear audio url since we are viewing historical text
                }}
              />
            </div>

            {/* Right Column */}
            <div>
              <ResultsPanel result={currentResult} audioUrl={currentAudioUrl} />
            </div>
          </div>
        ) : activeTab === 'recordings' ? (
          <div className="recordings-view">
            <AllRecordings refreshTrigger={refreshHistory} />
          </div>
        ) : activeTab === 'logs' ? (
          <div className="logs-view">
            <AuditLogs />
          </div>
        ) : activeTab === 'settings' ? (
          <div className="settings-view">
            <SettingsPanel onError={showError} showSuccess={showSuccess} />
          </div>
        ) : null}
      </main>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: '' })} 
      />
    </div>
  );
}

export default App;
