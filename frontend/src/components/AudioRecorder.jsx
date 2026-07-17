import React, { useState, useRef } from 'react';
import { Mic, Square } from 'lucide-react';

export default function AudioRecorder({ onRecordingComplete, isUploading }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Create a fake file object so the backend accepts it like a regular upload
        const audioFile = new File([audioBlob], `live_recording_${Date.now()}.webm`, { type: 'audio/webm' });
        onRecordingComplete(audioFile);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check your browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button 
        className={`record-btn ${isRecording ? 'recording' : ''}`}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isUploading && !isRecording}
      >
        {isRecording ? <Square size={32} color="white" /> : <Mic size={32} color={isUploading ? "var(--text-secondary)" : "white"} />}
      </button>
      <p style={{ color: isRecording ? 'var(--error-color)' : 'var(--accent-blue)', fontWeight: 500, marginTop: 12 }}>
        {isRecording ? "Recording... Click to Stop" : "Click to Record Voice"}
      </p>
    </div>
  );
}
