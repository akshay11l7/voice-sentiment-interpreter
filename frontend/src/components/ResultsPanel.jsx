import React, { useState, useRef, useEffect } from 'react';
import { PlayCircle, PauseCircle, Smile, Frown, Meh, Download, AlertCircle, AlertTriangle } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';

export default function ResultsPanel({ result, audioUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);

  useEffect(() => {
    if (!audioUrl || !waveformRef.current) return;

    // Initialize WaveSurfer
    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(79, 70, 229, 0.4)',
      progressColor: '#4f46e5',
      cursorColor: '#1e1b4b', // Much darker stick
      cursorWidth: 3,         // Thicker stick
      barWidth: 2,
      barGap: 3,
      barRadius: 2,
      height: 48,
      normalize: true,
      hideScrollbar: true,
      interact: true,
    });

    wavesurferRef.current = ws;
    ws.load(audioUrl);

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));
    ws.on('audioprocess', (time) => setCurrentTime(time));
    ws.on('seek', () => setCurrentTime(ws.getCurrentTime()));

    return () => {
      ws.destroy();
    };
  }, [audioUrl]);

  useEffect(() => {
    // Reset states when a new result comes in
    setIsPlaying(false);
    setCurrentTime(0);
  }, [result]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const seekToSegment = (start) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setTime(start);
      wavesurferRef.current.play();
    }
  };

  if (!result) {
    return (
      <div className="panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Upload an audio file to see analysis results.</p>
      </div>
    );
  }

  const { filename, transcription, sentiment_score, sentiment_label } = result;

  let parsedDiarization = [];
  try {
    if (result.diarization_data) {
      parsedDiarization = JSON.parse(result.diarization_data);
    }
  } catch (e) {
    console.error("Failed to parse diarization data:", e);
  }

  const getSentimentConfig = (labelParam) => {
    const labelToUse = labelParam || sentiment_label;
    switch(labelToUse.toLowerCase()) {
      case 'happy': return { className: 'happy', icon: <Smile size={32} /> };
      case 'sad': return { className: 'sad', icon: <Frown size={32} /> };
      case 'angry': return { className: 'angry', icon: <AlertCircle size={32} /> };
      case 'fear': return { className: 'fear', icon: <AlertTriangle size={32} /> };
      case 'disgust': return { className: 'disgust', icon: <Frown size={32} /> };
      case 'surprise': return { className: 'surprise', icon: <Smile size={32} /> };
      default: return { className: 'neutral', icon: <Meh size={32} /> };
    }
  };

  const sentimentConfig = getSentimentConfig(sentiment_label);

  const speakerStats = {};
  parsedDiarization.forEach(segment => {
    const speaker = segment.speaker;
    if (!speakerStats[speaker]) {
      speakerStats[speaker] = { sentiments: {}, totalScore: 0, count: 0 };
    }
    speakerStats[speaker].totalScore += segment.sentiment_score;
    speakerStats[speaker].count += 1;
    speakerStats[speaker].sentiments[segment.sentiment] = (speakerStats[speaker].sentiments[segment.sentiment] || 0) + 1;
  });

  const formatSpeakerName = (speaker) => {
    if (speaker.startsWith('SPEAKER_')) {
      const num = parseInt(speaker.split('_')[1], 10);
      return `Speaker ${num + 1}`;
    }
    return speaker;
  };

  const speakerMetrics = Object.keys(speakerStats).map(speaker => {
    const stats = speakerStats[speaker];
    const avgScore = (stats.totalScore / stats.count).toFixed(2);
    let maxSentiment = 'Neutral';
    let maxCount = 0;
    for (const [sentiment, count] of Object.entries(stats.sentiments)) {
      if (count > maxCount) {
        maxCount = count;
        maxSentiment = sentiment;
      }
    }
    
    return {
      originalId: speaker,
      displayName: formatSpeakerName(speaker),
      avgScore,
      primarySentiment: maxSentiment
    };
  });

  return (
    <div className="panel">
      <h2 className="panel-title">Analysis Results</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Result for: {filename}</p>

      {/* Audio Player Waveform */}
      <h3 style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>Interactive Audio Player</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div onClick={togglePlay} style={{ cursor: audioUrl ? 'pointer' : 'default', display: 'flex', flexShrink: 0 }}>
          {isPlaying ? (
            <PauseCircle size={40} color="var(--accent-blue)" />
          ) : (
            <PlayCircle size={40} color={audioUrl ? "var(--accent-blue)" : "var(--text-secondary)"} />
          )}
        </div>
        <div 
          style={{ 
            flex: 1, 
            minWidth: 0, 
            backgroundColor: 'var(--bg-color)', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            border: '1px solid var(--border-color)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }} 
          ref={waveformRef}
        ></div>
        {audioUrl && (
          <a 
            href={audioUrl} 
            download={result.filename || "audio_recording.webm"} 
            style={{ display: 'flex', cursor: 'pointer', marginLeft: 8, flexShrink: 0 }} 
            title="Download Audio"
          >
            <Download size={24} color="var(--text-secondary)" />
          </a>
        )}
      </div>

      <h3 style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>Sentiment Analysis & Metrics</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 16, paddingBottom: 16 }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 500 }}>Overall Sentiment</p>
          <p style={{ color: 'var(--text-secondary)' }}>Score: {result.average_sentiment !== null && result.average_sentiment !== undefined ? result.average_sentiment : sentiment_score}</p>
        </div>
        <div className={`sentiment-badge ${sentimentConfig.className}`}>
          {sentimentConfig.icon}
          {sentiment_label.toUpperCase()}
        </div>
      </div>

      {speakerMetrics.length > 0 && speakerMetrics.map(speaker => {
        const config = getSentimentConfig(speaker.primarySentiment);
        return (
          <div key={speaker.originalId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 16, paddingBottom: 16 }}>
            <div>
              <p style={{ fontSize: 16, fontWeight: 500 }}>{speaker.displayName}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Avg Score: {speaker.avgScore}</p>
            </div>
            <div className={`sentiment-badge ${config.className}`} style={{ transform: 'scale(0.85)', transformOrigin: 'right center' }}>
              {config.icon}
              {speaker.primarySentiment.toUpperCase()}
            </div>
          </div>
        );
      })}

      {result.client_satisfaction !== null && result.client_satisfaction !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 16, marginTop: 16 }}>
            <div>
            <p style={{ fontSize: 18, fontWeight: 500 }}>Client Satisfaction Score</p>
            <p style={{ color: 'var(--text-secondary)' }}>Based on conversation sentiment</p>
            </div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--accent-blue)' }}>
            {result.client_satisfaction} / 10
            </div>
        </div>
      )}

      <h3 style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 24, marginBottom: 8 }}>Conversation Transcript</h3>
      <div className="transcription-box" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
        {parsedDiarization.length > 0 ? (
          parsedDiarization.map((segment, idx) => {
            const isActive = currentTime >= segment.start && currentTime <= segment.end;
            return (
            <div 
              key={idx} 
              onClick={() => seekToSegment(segment.start)}
              style={{ 
              padding: '12px', 
              borderRadius: '8px', 
              backgroundColor: isActive ? 'rgba(79, 70, 229, 0.15)' : (segment.speaker === 'SPEAKER_00' ? 'rgba(0, 112, 243, 0.05)' : 'var(--bg-color)'),
              border: isActive ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
              alignSelf: segment.speaker === 'SPEAKER_00' ? 'flex-end' : 'flex-start',
              width: '80%',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isActive ? '0 4px 12px rgba(79, 70, 229, 0.1)' : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong>{formatSpeakerName(segment.speaker)}</strong>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span>{new Date(segment.start * 1000).toISOString().substring(14, 19)}</span>
                    <span>{segment.sentiment} ({segment.sentiment_score.toFixed(2)})</span>
                </div>
              </div>
              <div style={{ lineHeight: '1.5' }}>{segment.text}</div>
            </div>
            );
          })
        ) : (
          <div>{transcription || "No speech detected in this audio."}</div>
        )}
      </div>
    </div>
  );
}
