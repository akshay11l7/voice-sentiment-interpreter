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
              <th>Date</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {history.slice(0, 5).map((item) => (
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
                    <td colSpan="4" style={{ padding: '16px 24px', backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
                      {showTranscriptId === item.id ? (
                        <>
                          <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>Transcription:</strong>
                          <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.6' }}>
                            {item.transcription || <em>No transcription available.</em>}
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
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
