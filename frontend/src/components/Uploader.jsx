import React, { useRef } from 'react';
import { UploadCloud, Info } from 'lucide-react';
import AudioRecorder from './AudioRecorder';

export default function Uploader({ onFileSelect, isUploading, onError }) {
  const fileInputRef = useRef(null);

  const validateAndSelectFile = (file) => {
    if (!file) return;
    
    // Check if the file is an audio file
    const validTypes = ['audio/wav', 'audio/x-wav', 'audio/mp3', 'audio/mpeg', 'audio/webm'];
    if (!validTypes.includes(file.type)) {
      if (onError) {
        onError("Unsupported file format. Please upload WAV, MP3, or WEBM audio files.");
      }
      return;
    }
    
    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    validateAndSelectFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="panel">
      <h2 className="panel-title">Start New Analysis</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Upload Audio or Record Voice</p>
      
      <AudioRecorder onRecordingComplete={onFileSelect} isUploading={isUploading} />

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
          accept="audio/mp3, audio/wav, audio/mpeg, audio/x-wav, audio/webm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            validateAndSelectFile(file);
          }}
        />
      </div>

      <div style={{
        marginTop: 24,
        padding: 16,
        backgroundColor: 'var(--accent-light)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--accent-blue)',
        display: 'flex',
        gap: 12
      }}>
        <Info color="var(--accent-blue)" size={20} style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ color: 'var(--accent-blue)', marginBottom: 8, fontSize: 15 }}>Guidelines</h4>
          <ul style={{ fontSize: 14, color: 'var(--text-secondary)', paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 4 }}><strong>Supported Formats:</strong> WAV, MP3, and WEBM audio files are supported. PDFs, Images, etc. will be rejected.</li>
            <li><strong>Supported Languages:</strong> Whisper AI natively supports 90+ languages. You can upload non-English audio for transcription.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
