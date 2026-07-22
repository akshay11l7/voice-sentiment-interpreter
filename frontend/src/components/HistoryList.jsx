import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { fetchHistory, deleteInteraction } from '../api';

export default function HistoryList({ refreshTrigger }) {
  const [history, setHistory] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [showTranscriptId, setShowTranscriptId] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchHistory();
        setHistory(data);
      } catch (error) {
        console.error(error);
      }
    };
    loadHistory();
  }, [refreshTrigger]);

  const handleDelete = async (id) => {
    try {
      await deleteInteraction(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      alert("Could not delete item: " + error.message);
    }
  };

  return (
    <div className="panel">
      <h2 className="panel-title">Upload History</h2>
      {history.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>No interactions found.</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Recording</th>
              <th>Status</th>
              <th>CSAT</th>
              <th>Date</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {history.slice(0, 5).map((item) => {
              let parsedDiarization = [];
              try {
                if (item.diarization_data) {
                  parsedDiarization = JSON.parse(item.diarization_data);
                }
              } catch (e) {}
              
              return (
              <React.Fragment key={item.id}>
                <tr 
                  onClick={() => {
                    setExpandedId(expandedId === item.id ? null : item.id);
                    if (expandedId !== item.id) setShowTranscriptId(null);
                  }}
                  style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                >
                  <td>{item.filename}</td>
                  <td>
                    <span className={`status-dot ${item.sentiment_label.toLowerCase()}`}></span>
                    {item.sentiment_label}
                  </td>
                  <td>{item.client_satisfaction !== null && item.client_satisfaction !== undefined ? `${item.client_satisfaction}/10` : 'N/A'}</td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Trash2 
                      size={18} 
                      color="var(--text-secondary)" 
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                    />
                  </td>
                </tr>
                {expandedId === item.id && (
                  <tr>
                    <td colSpan="5" style={{ padding: '16px 24px', backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
                      {showTranscriptId === item.id ? (
                        <>
                          <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>Transcription:</strong>
                          <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.6' }}>
                            {parsedDiarization.length > 0 ? (
                              parsedDiarization.map((seg, i) => (
                                <div key={i} style={{ marginBottom: '8px' }}>
                                  <strong>{seg.speaker}:</strong> {seg.text} <span style={{fontSize: '11px', opacity: 0.7}}>({seg.sentiment})</span>
                                </div>
                              ))
                            ) : (
                              item.transcription || <em>No transcription available.</em>
                            )}
                          </div>
                        </>
                      ) : (
                        <button 
                          className="btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowTranscriptId(item.id);
                          }}
                        >
                          Show Transcript
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )})}
          </tbody>
        </table>
      )}
    </div>
  );
}
