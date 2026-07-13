import React, { useRef } from 'react';
import { UploadCloud, Mic } from 'lucide-react';

export default function Uploader({ onFileSelect, isUploading }) {
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="panel">
      <h2 className="panel-title">Start New Analysis</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Upload Audio or Record Voice</p>
      
      {/* Voice Recorder placeholder - For Future */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Mic size={40} color="var(--accent-blue)" />
        <p style={{ color: 'var(--accent-blue)', fontWeight: 500 }}>Microphone Feature Coming Soon</p>
      </div>

      <div 
        className="dropzone" 
        onDrop={handleDrop} 
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud size={40} color="var(--text-secondary)" />
        {isUploading ? (
          <div className="loader"></div>
        ) : (
          <>
            <p style={{ fontSize: 18, color: 'var(--text-secondary)' }}>Drag & Drop Audio File</p>
            <button className="btn" disabled={isUploading}>Browse</button>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Supports MP3, WAV</p>
          </>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="audio/mp3, audio/wav, audio/mpeg, audio/x-wav"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
          }}
        />
      </div>
    </div>
  );
}
