import React, { useState, useRef, useEffect } from 'react';
import { PlayCircle, PauseCircle, Smile, Frown, Meh, Download, AlertCircle, AlertTriangle } from 'lucide-react';

export default function ResultsPanel({ result, audioUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Reset playing state if a new result comes in
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, [result]);

  const togglePlay = () => {
    if (!audioUrl || !audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  if (!result) {
    return (
      <div className="panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Upload an audio file to see analysis results.</p>
      </div>
    );
  }

  const { filename, transcription, sentiment_score, sentiment_label } = result;

  const getSentimentConfig = () => {
    switch(sentiment_label.toLowerCase()) {
      case 'happy': return { className: 'happy', icon: <Smile size={32} /> };
      case 'sad': return { className: 'sad', icon: <Frown size={32} /> };
      case 'angry': return { className: 'angry', icon: <AlertCircle size={32} /> };
      case 'fear': return { className: 'fear', icon: <AlertTriangle size={32} /> };
      case 'disgust': return { className: 'disgust', icon: <Frown size={32} /> };
      case 'surprise': return { className: 'surprise', icon: <Smile size={32} /> };
      default: return { className: 'neutral', icon: <Meh size={32} /> };
    }
  };

  const sentimentConfig = getSentimentConfig();

  return (
    <div className="panel">
      <h2 className="panel-title">Analysis Results</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Result for: {filename}</p>

      {/* Audio Player Fake Waveform */}
      <h3 style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>Audio Player</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={handleEnded} style={{ display: 'none' }} />}
        <div onClick={togglePlay} style={{ cursor: audioUrl ? 'pointer' : 'default', display: 'flex' }}>
          {isPlaying ? (
            <PauseCircle size={40} color="var(--accent-blue)" />
          ) : (
            <PlayCircle size={40} color={audioUrl ? "var(--accent-blue)" : "var(--text-secondary)"} />
          )}
        </div>
        <div style={{ flex: 1, height: 40, backgroundImage: 'repeating-linear-gradient(90deg, var(--border-color), var(--border-color) 2px, transparent 2px, transparent 6px)', opacity: 0.5 }}></div>
        {audioUrl && (
          <a 
            href={audioUrl} 
            download={result.filename || "audio_recording.webm"} 
            style={{ display: 'flex', cursor: 'pointer', marginLeft: 8 }} 
            title="Download Audio"
          >
            <Download size={24} color="var(--text-secondary)" />
          </a>
        )}
      </div>

      <h3 style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>Transcribed Text</h3>
      <div className="transcription-box">
        {transcription || "No speech detected in this audio."}
      </div>

      <h3 style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>Sentiment Analysis</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 500 }}>Sentiment Score</p>
          <p style={{ color: 'var(--text-secondary)' }}>Score: {sentiment_score}</p>
        </div>
        <div className={`sentiment-badge ${sentimentConfig.className}`}>
          {sentimentConfig.icon}
          {sentiment_label.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
