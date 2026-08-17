import React, { useState, useEffect, useMemo } from 'react';
import { fetchHistory, deleteInteraction } from '../api';
import {
  Search, FileAudio, Trash2, Clock, TrendingUp,
  ChevronLeft, ChevronRight, ArrowUpDown,
  Mic, BarChart3, Star, FileText
} from 'lucide-react';
import './AllRecordings.css';

const ITEMS_PER_PAGE = 8;

export default function AllRecordings({ refreshTrigger }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const data = await fetchHistory();
        setHistory(data);
      } catch (error) {
        console.error('Failed to fetch recordings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [refreshTrigger]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteInteraction(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      alert('Could not delete item: ' + error.message);
    }
  };

  // Derived stats
  const stats = useMemo(() => {
    const total = history.length;
    const avgCsat = total > 0
      ? (history.reduce((sum, h) => sum + (h.client_satisfaction || 0), 0) / total).toFixed(1)
      : '0.0';
    const sentimentCounts = {};
    history.forEach(h => {
      const label = h.sentiment_label || 'Unknown';
      sentimentCounts[label] = (sentimentCounts[label] || 0) + 1;
    });
    const topSentiment = Object.entries(sentimentCounts)
      .sort((a, b) => b[1] - a[1])[0];
    const totalDuration = history.reduce((sum, h) => sum + (h.duration_seconds || 0), 0);
    return {
      total,
      avgCsat,
      topSentiment: topSentiment ? topSentiment[0] : 'N/A',
      totalDuration: formatDuration(totalDuration),
    };
  }, [history]);

  // Filter + Search + Sort
  const filteredData = useMemo(() => {
    let data = [...history];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(item =>
        item.filename.toLowerCase().includes(q) ||
        (item.transcription && item.transcription.toLowerCase().includes(q))
      );
    }

    // Filter
    if (sentimentFilter !== 'all') {
      data = data.filter(item =>
        item.sentiment_label && item.sentiment_label.toLowerCase() === sentimentFilter
      );
    }

    // Sort
    data.sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'filename':
          aVal = a.filename.toLowerCase();
          bVal = b.filename.toLowerCase();
          return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case 'sentiment_label':
          aVal = (a.sentiment_label || '').toLowerCase();
          bVal = (b.sentiment_label || '').toLowerCase();
          return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case 'client_satisfaction':
          aVal = a.client_satisfaction || 0;
          bVal = b.client_satisfaction || 0;
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        case 'duration_seconds':
          aVal = a.duration_seconds || 0;
          bVal = b.duration_seconds || 0;
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        case 'created_at':
        default:
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });

    return data;
  }, [history, searchQuery, sentimentFilter, sortField, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sentimentFilter, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const thClass = (field) =>
    sortField === field ? 'sorted' : '';

  const sortArrow = (field) =>
    sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕';

  // Unique sentiment labels for filter
  const sentimentOptions = useMemo(() => {
    const labels = new Set(history.map(h => h.sentiment_label).filter(Boolean));
    return ['all', ...Array.from(labels)];
  }, [history]);

  if (isLoading) {
    return (
      <div className="recordings-page">
        <div className="recordings-stats">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="skeleton" style={{ width: 60, height: 24 }} />
                <div className="skeleton" style={{ width: 100, height: 14 }} />
              </div>
            </div>
          ))}
        </div>
        <div className="recordings-table-panel">
          <table className="recordings-table">
            <thead>
              <tr>
                <th>Recording</th><th>Sentiment</th><th>CSAT</th>
                <th>Duration</th><th>Date</th><th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(6)].map((_, idx) => (
                <tr key={idx}>
                  <td><div className="skeleton" style={{ width: 160, height: 20 }} /></td>
                  <td><div className="skeleton" style={{ width: 80, height: 24, borderRadius: 20 }} /></td>
                  <td><div className="skeleton" style={{ width: 80, height: 16 }} /></td>
                  <td><div className="skeleton" style={{ width: 60, height: 16 }} /></td>
                  <td><div className="skeleton" style={{ width: 90, height: 16 }} /></td>
                  <td><div className="skeleton" style={{ width: 24, height: 24 }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="recordings-page">
      {/* Stat Cards */}
      <div className="recordings-stats">
        <div className="stat-card">
          <div className="stat-icon blue"><Mic size={22} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Recordings</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Star size={22} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.avgCsat}</span>
            <span className="stat-label">Average CSAT</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><TrendingUp size={22} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.topSentiment}</span>
            <span className="stat-label">Top Sentiment</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Clock size={22} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalDuration}</span>
            <span className="stat-label">Total Duration</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="recordings-toolbar">
        <div className="recordings-search">
          <Search size={16} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search by filename or transcript..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={sentimentFilter}
          onChange={e => setSentimentFilter(e.target.value)}
        >
          {sentimentOptions.map(opt => (
            <option key={opt} value={opt}>
              {opt === 'all' ? 'All Sentiments' : opt}
            </option>
          ))}
        </select>
        <button
          className={`sort-btn ${sortField === 'created_at' ? 'active' : ''}`}
          onClick={() => handleSort('created_at')}
        >
          <ArrowUpDown size={14} />
          Date {sortField === 'created_at' && (sortDir === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      {/* Table */}
      <div className="recordings-table-panel">
        {filteredData.length === 0 ? (
          <div className="recordings-empty">
            <div className="empty-icon">
              <FileAudio size={36} color="var(--text-secondary)" />
            </div>
            <p>
              {searchQuery || sentimentFilter !== 'all'
                ? 'No recordings match your filters. Try adjusting your search or filter.'
                : 'No recordings yet. Upload your first audio file from the Dashboard.'}
            </p>
          </div>
        ) : (
          <>
            <table className="recordings-table">
              <thead>
                <tr>
                  <th className={thClass('filename')} onClick={() => handleSort('filename')}>
                    Recording <span className="sort-arrow">{sortArrow('filename')}</span>
                  </th>
                  <th className={thClass('sentiment_label')} onClick={() => handleSort('sentiment_label')}>
                    Sentiment <span className="sort-arrow">{sortArrow('sentiment_label')}</span>
                  </th>
                  <th className={thClass('client_satisfaction')} onClick={() => handleSort('client_satisfaction')}>
                    CSAT <span className="sort-arrow">{sortArrow('client_satisfaction')}</span>
                  </th>
                  <th className={thClass('duration_seconds')} onClick={() => handleSort('duration_seconds')}>
                    Duration <span className="sort-arrow">{sortArrow('duration_seconds')}</span>
                  </th>
                  <th className={thClass('created_at')} onClick={() => handleSort('created_at')}>
                    Date <span className="sort-arrow">{sortArrow('created_at')}</span>
                  </th>
                  <th style={{ width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, idx) => {
                  let parsedDiarization = [];
                  try {
                    if (item.diarization_data) {
                      parsedDiarization = JSON.parse(item.diarization_data);
                    }
                  } catch (e) {}

                  const csatVal = item.client_satisfaction;
                  const csatPct = csatVal != null ? (csatVal / 10) * 100 : 0;
                  const csatLevel = csatVal >= 7 ? 'high' : csatVal >= 4 ? 'mid' : 'low';
                  const sentimentClass = (item.sentiment_label || 'neutral').toLowerCase();

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        className={expandedId === item.id ? 'expanded' : ''}
                        style={{ animationDelay: `${idx * 0.04}s` }}
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      >
                        <td>
                          <div className="filename-cell">
                            <div className="filename-icon">
                              <FileAudio size={18} />
                            </div>
                            {item.filename}
                          </div>
                        </td>
                        <td>
                          <span className={`sentiment-pill ${sentimentClass}`}>
                            <span className={`status-dot ${sentimentClass}`} />
                            {item.sentiment_label || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <div className="csat-cell">
                            <div className="csat-bar-bg">
                              <div
                                className={`csat-bar-fill ${csatLevel}`}
                                style={{ width: `${csatPct}%` }}
                              />
                            </div>
                            <span className="csat-value">
                              {csatVal != null ? `${csatVal}/10` : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="duration-cell">
                            <Clock size={14} />
                            {item.duration_seconds
                              ? formatDuration(item.duration_seconds)
                              : '—'}
                          </div>
                        </td>
                        <td>{new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}</td>
                        <td>
                          <button className="delete-btn" onClick={(e) => handleDelete(e, item.id)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                      {expandedId === item.id && (
                        <tr className="expanded-row">
                          <td colSpan="6">
                            <div className="transcript-expand">
                              {/* Meta info */}
                              <div className="transcript-meta">
                                <div className="meta-item">
                                  <span className="meta-label">Sentiment Score</span>
                                  <span className="meta-value">
                                    {item.sentiment_score != null
                                      ? item.sentiment_score.toFixed(3)
                                      : 'N/A'}
                                  </span>
                                </div>
                                <div className="meta-item">
                                  <span className="meta-label">Average Sentiment</span>
                                  <span className="meta-value">
                                    {item.average_sentiment != null
                                      ? item.average_sentiment.toFixed(3)
                                      : 'N/A'}
                                  </span>
                                </div>
                                <div className="meta-item">
                                  <span className="meta-label">Duration</span>
                                  <span className="meta-value">
                                    {item.duration_seconds
                                      ? `${item.duration_seconds.toFixed(1)}s`
                                      : 'N/A'}
                                  </span>
                                </div>
                              </div>

                              <h4><FileText size={16} /> Transcription</h4>
                              <div className="transcript-content">
                                {parsedDiarization.length > 0 ? (
                                  parsedDiarization.map((seg, i) => (
                                    <div key={i} className="diarization-segment">
                                      <strong>{seg.speaker}:</strong> {seg.text}
                                      <span className="diarization-sentiment">({seg.sentiment})</span>
                                    </div>
                                  ))
                                ) : (
                                  item.transcription || <em>No transcription available.</em>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="recordings-pagination">
              <span className="pagination-info">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length} recordings
              </span>
              <div className="pagination-controls">
                <button
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first, last, and pages near current
                    return page === 1 || page === totalPages ||
                      Math.abs(page - currentPage) <= 1;
                  })
                  .reduce((acc, page, idx, arr) => {
                    if (idx > 0 && page - arr[idx - 1] > 1) {
                      acc.push('...');
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: 'var(--text-secondary)' }}>…</span>
                    ) : (
                      <button
                        key={item}
                        className={`page-btn ${currentPage === item ? 'active' : ''}`}
                        onClick={() => setCurrentPage(item)}
                      >
                        {item}
                      </button>
                    )
                  )}
                <button
                  className="page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.round(totalSeconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
