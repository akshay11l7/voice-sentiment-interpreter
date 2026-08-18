import React, { useState } from 'react';
import { Mail, Lock, User, AlertCircle, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { login, register } from '../api';

export default function AuthPage({ onLogin, theme, toggleTheme }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const data = await login(email, password);
        onLogin(data.access_token);
      } else {
        await register(name, email, password);
        const data = await login(email, password);
        onLogin(data.access_token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setError('');
    setPassword('');
    setName('');
    setShowPassword(false);
  };

  return (
    <div className="auth-container">
      {/* Dynamic ambient moving glow blobs */}
      <div className="auth-ambient-bg">
        <div className="glow-blob blob-purple"></div>
        <div className="glow-blob blob-indigo"></div>
        <div className="glow-blob blob-blue"></div>
      </div>

      {/* Floating Theme Toggle */}
      <button 
        type="button" 
        className="auth-theme-toggle" 
        onClick={toggleTheme} 
        aria-label="Toggle theme"
        title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="auth-split-layout">
        {/* Left Side: Brand and Features */}
        <div className="auth-info-panel">
          <div className="auth-info-content">
            <div className="auth-info-brand">
              <span className="brand-badge-icon">🎙️</span>
              <h2>AudioPro</h2>
            </div>
            
            <h1 className="auth-info-title">
              Intelligent Voice Transcription & Sentiment Analysis
            </h1>
            
            <p className="auth-info-description">
              Upload customer interactions or record directly to transcribe text, separate speakers, and analyze emotion using state-of-the-art AI models.
            </p>

            <ul className="auth-features-list">
              <li className="feature-item">
                <div className="feature-icon-wrapper">⚡</div>
                <div className="feature-text">
                  <h3>Whisper-Powered Voice To Text</h3>
                  <p>Get fast, near-perfect transcriptions of long customer calls automatically.</p>
                </div>
              </li>
              <li className="feature-item">
                <div className="feature-icon-wrapper">👥</div>
                <div className="feature-text">
                  <h3>Speaker Diarization</h3>
                  <p>Separate Agent and Customer dialogue to analyze conversational flow.</p>
                </div>
              </li>
              <li className="feature-item">
                <div className="feature-icon-wrapper">🧠</div>
                <div className="feature-text">
                  <h3>RoBERTa Emotion Detection</h3>
                  <p>Deep-learning sentiment mapping for joy, anger, sadness, surprise, and more.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side: Card Form */}
        <div className="auth-card-panel">
          <div className="auth-card panel">
            {/* Logo/Tagline for small screens where the left panel is hidden */}
            <div className="auth-card-brand-mobile">
              <div className="brand-logo-glow">
                <span className="brand-icon">🎙️</span>
              </div>
              <h1>AudioPro</h1>
              <p className="brand-tagline">Voice Sentiment Interpreter</p>
            </div>

            <div className="auth-header">
              <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
              <p>{isLogin ? 'Sign in to your account to continue' : 'Sign up to start analyzing audio'}</p>
            </div>

            {error && (
              <div className="auth-error-box">
                <AlertCircle size={16} className="error-icon" />
                <span className="error-text">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="form-group animate-slide-down">
                  <label htmlFor="name-input">Full Name</label>
                  <div className="input-wrapper">
                    <User size={18} className="input-icon" />
                    <input 
                      id="name-input"
                      type="text" 
                      placeholder="John Doe" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin}
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email-input">Email Address</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input 
                    id="email-input"
                    type="email" 
                    placeholder="you@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password-input">Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input 
                    id="password-input"
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn auth-btn" disabled={isLoading}>
                {isLoading ? (
                  <span className="btn-loading-wrapper">
                    <span className="auth-spinner"></span>
                    Processing...
                  </span>
                ) : (
                  isLogin ? 'Sign In' : 'Sign Up'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button type="button" className="auth-link-btn" onClick={handleModeSwitch}>
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


