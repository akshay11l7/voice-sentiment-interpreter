import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../api';
import { Clock, User, LogIn, Upload, Trash2, ShieldAlert } from 'lucide-react';
import './AuditLogs.css'; // Let's use a separate CSS for modularity or inline styling

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getAuditLogs();
        setLogs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, []);

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'LOGIN': return <LogIn size={16} className="log-icon login" />;
      case 'REGISTER': return <User size={16} className="log-icon register" />;
      case 'UPLOAD': return <Upload size={16} className="log-icon upload" />;
      case 'DELETE': return <Trash2 size={16} className="log-icon delete" />;
      default: return <ShieldAlert size={16} className="log-icon default" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="audit-logs-container">
        <h2>Activity Logs</h2>
        <div className="skeleton-container">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-row skeleton-animate"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="audit-logs-container error-state">
        <p>Error loading logs: {error}</p>
      </div>
    );
  }

  return (
    <div className="audit-logs-container fade-in">
      <div className="audit-header">
        <h2>Activity Logs</h2>
        <span className="log-count">{logs.length} Actions Recorded</span>
      </div>
      
      {logs.length === 0 ? (
        <div className="empty-logs">
          <Clock size={48} color="var(--text-secondary)" />
          <p>No activity recorded yet.</p>
        </div>
      ) : (
        <div className="logs-timeline">
          {logs.map((log) => (
            <div key={log.id} className="log-item slide-up">
              <div className="log-icon-wrapper">
                {getActionIcon(log.action_type)}
              </div>
              <div className="log-content">
                <div className="log-title">
                  <span className="action-badge">{log.action_type}</span>
                  <span className="log-time">{formatDate(log.created_at)}</span>
                </div>
                <p className="log-description">{log.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
