import React, { useEffect } from 'react';
import { XCircle, CheckCircle, Info } from 'lucide-react';

export default function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast-container ${type}`}>
      <div className="toast-icon">
        {type === 'error' && <XCircle size={24} />}
        {type === 'success' && <CheckCircle size={24} />}
        {type === 'info' && <Info size={24} />}
      </div>
      <div className="toast-content">
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Close">
        &times;
      </button>
    </div>
  );
}
