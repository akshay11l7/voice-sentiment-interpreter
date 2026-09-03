import React, { useState, useEffect } from 'react';
import { updateUserSettings, fetchUserProfile } from '../api';
import { Cpu, Sliders, User, Save, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import './SettingsPanel.css';

function SettingsPanel({ onError, showSuccess }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const [whisperModel, setWhisperModel] = useState('small');
  const [sentimentModel, setSentimentModel] = useState('j-hartmann/emotion-english-distilroberta-base');
  const [enableDiarization, setEnableDiarization] = useState(true);
  const [enableNoiseReduction, setEnableNoiseReduction] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const profile = await fetchUserProfile();
        setUserProfile(profile);
        setWhisperModel(profile.whisper_model || 'small');
        setSentimentModel(profile.sentiment_model || 'j-hartmann/emotion-english-distilroberta-base');
        setEnableDiarization(profile.enable_diarization !== undefined ? profile.enable_diarization : true);
        setEnableNoiseReduction(profile.enable_noise_reduction !== undefined ? profile.enable_noise_reduction : true);
      } catch (err) {
        console.error("Error loading user settings:", err);
        if (onError) onError("Failed to load user settings: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await updateUserSettings({
        whisper_model: whisperModel,
        sentiment_model: sentimentModel,
        enable_diarization: enableDiarization,
        enable_noise_reduction: enableNoiseReduction,
      });
      setUserProfile(updated);
      if (showSuccess) showSuccess("Settings updated successfully!");
    } catch (err) {
      console.error("Error saving settings:", err);
      if (onError) onError("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-container" style={{ textAlign: 'center', padding: '60px' }}>
        <div className="loader" style={{ margin: '0 auto 16px auto' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      {/* Section 1: AI Model Configuration */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="settings-card">
          <div className="settings-card-header">
            <Cpu size={22} color="var(--accent-blue)" />
            <div>
              <h2>AI Models & Engine Selection</h2>
              <p>Customize the models used for Speech-to-Text transcription and Sentiment classification</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-group">
              <label htmlFor="whisper-select">Whisper Speech-to-Text Model</label>
              <select
                id="whisper-select"
                className="settings-select"
                value={whisperModel}
                onChange={(e) => setWhisperModel(e.target.value)}
              >
                <option value="tiny">Whisper Tiny (Fastest, ~75MB)</option>
                <option value="base">Whisper Base (Balanced, ~140MB)</option>
                <option value="small">Whisper Small (High Precision, ~460MB - Default)</option>
                <option value="medium">Whisper Medium (Maximum Precision, ~1.5GB)</option>
              </select>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Larger models provide higher accuracy on complex audio but require more compute time.
              </span>
            </div>

            <div className="settings-group">
              <label htmlFor="sentiment-select">Sentiment Classifier Model</label>
              <select
                id="sentiment-select"
                className="settings-select"
                value={sentimentModel}
                onChange={(e) => setSentimentModel(e.target.value)}
              >
                <option value="j-hartmann/emotion-english-distilroberta-base">
                  DistilRoBERTa (7 Emotions: Happy, Sad...)
                </option>
                <option value="lxyuan/distilbert-base-multilingual-cased-sentiments-student">
                  DistilBERT (3 Classes: Pos, Neu, Neg)
                </option>
                <option value="cardiffnlp/twitter-roberta-base-sentiment-latest">
                  Twitter RoBERTa (3 Classes: Pos, Neu, Neg)
                </option>
              </select>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Select fine-grained emotion detection or simplified 3-class sentiment analysis.
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Pipeline Processing Toggles */}
        <div className="settings-card">
          <div className="settings-card-header">
            <Sliders size={22} color="var(--purple-color)" />
            <div>
              <h2>Pipeline Processing Toggles</h2>
              <p>Enable or disable specialized processing stages to optimize execution speed</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="settings-toggle-row">
              <div className="settings-toggle-info">
                <h4>Speaker Diarization (Agent vs. Customer)</h4>
                <p>Recognize and distinguish different speakers throughout the conversation</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={enableDiarization}
                  onChange={(e) => setEnableDiarization(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="settings-toggle-row">
              <div className="settings-toggle-info">
                <h4>Audio Noise Reduction</h4>
                <p>Pre-process audio files to suppress ambient noise before transcription</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={enableNoiseReduction}
                  onChange={(e) => setEnableNoiseReduction(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Profile Info */}
        <div className="settings-card">
          <div className="settings-card-header">
            <User size={22} color="var(--success-color)" />
            <div>
              <h2>User & Account Profile</h2>
              <p>View your authenticated workspace credentials</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-group">
              <label>Full Name</label>
              <input
                type="text"
                className="settings-select"
                value={userProfile?.full_name || 'N/A'}
                disabled
                style={{ cursor: 'not-allowed', opacity: 0.8 }}
              />
            </div>
            <div className="settings-group">
              <label>Email Address</label>
              <input
                type="text"
                className="settings-select"
                value={userProfile?.email || 'N/A'}
                disabled
                style={{ cursor: 'not-allowed', opacity: 0.8 }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="settings-footer">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? (
              <>
                <div className="loader" style={{ width: '16px', height: '16px', borderTopColor: '#fff' }}></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SettingsPanel;
