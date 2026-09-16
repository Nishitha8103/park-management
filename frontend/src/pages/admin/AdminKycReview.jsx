import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldX, Clock, Eye, CheckCircle2, XCircle, Search, Filter, AlertCircle, X } from 'lucide-react';
import './AdminKycReview.css';

const API_BASE = 'http://localhost:5000';

const statusConfig = {
  pending:  { label: 'Pending', color: '#e65100', bg: '#fff8e1', border: '#ffe082', icon: <Clock size={14} /> },
  verified: { label: 'Verified', color: '#2e7d32', bg: '#e8f5e9', border: '#a5d6a7', icon: <CheckCircle2 size={14} /> },
  rejected: { label: 'Rejected', color: '#c62828', bg: '#ffebee', border: '#ef9a9a', icon: <XCircle size={14} /> },
};

const AdminKycReview = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);    // user being reviewed
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState('');

  const getToken = () => {
    const a = JSON.parse(localStorage.getItem('adminUser') || '{}');
    return a.token || '';
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/kyc/all`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      if (data.success) setRequests(data.requests);
    } catch (err) {
      console.error('KYC fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleAction = async (userId, action) => {
    if (action === 'reject' && !rejectReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/kyc/review/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ action, reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setSelected(null);
        setRejectReason('');
        fetchRequests();
      } else {
        showToast('Error: ' + data.message);
      }
    } catch (err) {
      showToast('Server error.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = requests.filter(r => {
    const matchStatus = filter === 'all' || r.aadhaarKycStatus === filter;
    const matchSearch = !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    all:      requests.length,
    pending:  requests.filter(r => r.aadhaarKycStatus === 'pending').length,
    verified: requests.filter(r => r.aadhaarKycStatus === 'verified').length,
    rejected: requests.filter(r => r.aadhaarKycStatus === 'rejected').length,
  };

  return (
    <div className="admin-kyc-page">
      {/* Toast */}
      {toast && (
        <div className="kyc-toast">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="admin-kyc-header">
        <div className="kyc-header-left">
          <div className="kyc-admin-icon"><ShieldCheck size={24} /></div>
          <div>
            <h1>KYC Review Dashboard</h1>
            <p>Review and verify uploaded Aadhaar documents</p>
          </div>
        </div>
        <div className="kyc-count-badges">
          {Object.entries(counts).map(([key, val]) => (
            <div key={key} className={`kyc-count-badge ${key}`}>
              <span className="count-num">{val}</span>
              <span className="count-lbl">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter + Search */}
      <div className="admin-kyc-controls">
        <div className="kyc-filter-tabs">
          {['all', 'pending', 'verified', 'rejected'].map(s => (
            <button
              key={s}
              className={`kyc-filter-tab ${filter === s ? 'active' : ''} ${s}`}
              onClick={() => setFilter(s)}
              id={`kyc-filter-${s}`}
            >
              {s === 'all' ? <Filter size={14} /> : s === 'pending' ? <Clock size={14} /> : s === 'verified' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
            </button>
          ))}
        </div>
        <div className="kyc-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="kyc-search-input"
          />
        </div>
      </div>

      {/* Table */}
      <div className="admin-kyc-table-wrapper">
        {loading ? (
          <div className="kyc-loading"><div className="kyc-spinner" /><span>Loading KYC requests…</span></div>
        ) : filtered.length === 0 ? (
          <div className="kyc-empty">
            <AlertCircle size={40} />
            <p>No {filter === 'all' ? '' : filter} KYC requests found.</p>
          </div>
        ) : (
          <table className="admin-kyc-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Role</th>
                <th>Aadhaar (Masked)</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const cfg = statusConfig[r.aadhaarKycStatus] || statusConfig.pending;
                return (
                  <tr key={r._id}>
                    <td className="kyc-td-num">{i + 1}</td>
                    <td>
                      <div className="kyc-user-cell">
                        <div className="kyc-avatar">{r.name?.[0]?.toUpperCase() || '?'}</div>
                        <div>
                          <p className="kyc-name">{r.name}</p>
                          <p className="kyc-email">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="kyc-role-pill">{r.role}</span></td>
                    <td><span className="kyc-mono">{r.aadhaarNumber || '—'}</span></td>
                    <td>
                      <span className="kyc-status-chip" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td className="kyc-date">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                    <td>
                      <button
                        className="kyc-view-btn"
                        onClick={() => { setSelected(r); setRejectReason(''); }}
                        id={`kyc-view-${r._id}`}
                      >
                        <Eye size={14} /> Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="kyc-review-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="kyc-review-modal">
            <div className="kyc-review-header">
              <div>
                <h2>Review KYC — {selected.name}</h2>
                <p>{selected.email} · {selected.role}</p>
              </div>
              <button className="kyc-review-close" onClick={() => setSelected(null)}><X size={20} /></button>
            </div>

            <div className="kyc-review-body">
              {/* Aadhaar number */}
              <div className="kyc-review-row">
                <span className="kyc-review-key">Aadhaar Number</span>
                <span className="kyc-review-val kyc-mono">{selected.aadhaarNumber || '—'}</span>
              </div>
              <div className="kyc-review-row">
                <span className="kyc-review-key">Current Status</span>
                <span className="kyc-status-chip" style={{ color: statusConfig[selected.aadhaarKycStatus]?.color, background: statusConfig[selected.aadhaarKycStatus]?.bg, border: `1px solid ${statusConfig[selected.aadhaarKycStatus]?.border}` }}>
                  {statusConfig[selected.aadhaarKycStatus]?.icon} {statusConfig[selected.aadhaarKycStatus]?.label}
                </span>
              </div>

              {/* Document images */}
              <p className="kyc-doc-heading">Uploaded Documents</p>
              <div className="kyc-doc-grid">
                <div className="kyc-doc-card">
                  <p className="kyc-doc-label">Front Side</p>
                  {selected.aadhaarFrontImage ? (
                    <a href={`${API_BASE}${selected.aadhaarFrontImage}`} target="_blank" rel="noreferrer">
                      <img src={`${API_BASE}${selected.aadhaarFrontImage}`} alt="Aadhaar Front" className="kyc-doc-img" />
                    </a>
                  ) : <div className="kyc-doc-missing">No image</div>}
                </div>
                <div className="kyc-doc-card">
                  <p className="kyc-doc-label">Back Side</p>
                  {selected.aadhaarBackImage ? (
                    <a href={`${API_BASE}${selected.aadhaarBackImage}`} target="_blank" rel="noreferrer">
                      <img src={`${API_BASE}${selected.aadhaarBackImage}`} alt="Aadhaar Back" className="kyc-doc-img" />
                    </a>
                  ) : <div className="kyc-doc-missing">No image</div>}
                </div>
              </div>

              {/* Rejection reason (shown if rejecting or already rejected) */}
              {selected.aadhaarKycStatus !== 'verified' && (
                <div className="kyc-reason-box">
                  <label className="kyc-reason-label">Rejection Reason (required if rejecting)</label>
                  <textarea
                    className="kyc-reason-input"
                    placeholder="e.g. Image is blurry, Aadhaar number mismatch…"
                    value={rejectReason || selected.aadhaarKycRejectionReason || ''}
                    onChange={e => setRejectReason(e.target.value)}
                    rows={3}
                    id="kyc-reject-reason-input"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {selected.aadhaarKycStatus === 'pending' && (
              <div className="kyc-review-actions">
                <button
                  className="kyc-action-reject"
                  onClick={() => handleAction(selected._id, 'reject')}
                  disabled={actionLoading}
                  id="kyc-reject-btn"
                >
                  <XCircle size={16} /> {actionLoading ? 'Processing…' : 'Reject'}
                </button>
                <button
                  className="kyc-action-approve"
                  onClick={() => handleAction(selected._id, 'approve')}
                  disabled={actionLoading}
                  id="kyc-approve-btn"
                >
                  <CheckCircle2 size={16} /> {actionLoading ? 'Processing…' : 'Approve KYC'}
                </button>
              </div>
            )}

            {selected.aadhaarKycStatus === 'verified' && (
              <div className="kyc-already-verified">
                <CheckCircle2 size={18} /> KYC already verified for this user.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKycReview;
