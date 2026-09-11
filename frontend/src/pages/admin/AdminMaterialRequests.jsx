import { useState, useEffect } from 'react';
import { Package, CheckCircle, XCircle, Clock, MessageSquare, AlertTriangle, User, Info, ShieldCheck, HelpCircle } from 'lucide-react';

const PRIORITY_COLORS = {
  Low:    { bg: '#dbeafe', color: '#1d4ed8' },
  Medium: { bg: '#fef3c7', color: '#92400e' },
  High:   { bg: '#fce7f3', color: '#9d174d' },
  Urgent: { bg: '#fee2e2', color: '#991b1b' },
};

const STATUS_COLORS = {
  Pending:  { bg: '#fef3c7', color: '#92400e' },
  Approved: { bg: '#dcfce7', color: '#15803d' },
  Rejected: { bg: '#fee2e2', color: '#991b1b' },
};

const REJECTION_PRESETS = [
  'Insufficient municipal inventory/budget for this month.',
  'Duplicate request already submitted for this park.',
  'Quantity requested exceeds standard allowance — please resubmit with detailed estimate.',
  'Unjustified material request for current assigned park maintenance work.'
];

const AdminMaterialRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [reviewModal, setReviewModal] = useState({ open: false, request: null, status: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const getToken = () => {
    try {
      return JSON.parse(localStorage.getItem('adminUser'))?.token;
    } catch (e) {
      return null;
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/material-requests', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const openReview = (req, status) => {
    setReviewModal({ open: true, request: req, status, notes: '' });
  };

  const submitReview = async () => {
    if (!reviewModal.status) return;
    
    // Require rejection reason if status is Rejected
    if (reviewModal.status === 'Rejected' && !reviewModal.notes.trim()) {
      showMsg('error', 'Please provide a reason for rejecting the material request.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/material-requests/${reviewModal.request._id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ status: reviewModal.status, adminNotes: reviewModal.notes })
      });
      const data = await res.json();
      if (res.ok) {
        showMsg('success', `Material request ${reviewModal.status.toLowerCase()} successfully.`);
        setReviewModal({ open: false, request: null, status: '', notes: '' });
        fetchRequests();
      } else {
        showMsg('error', data.message || 'Failed to update request.');
      }
    } catch {
      showMsg('error', 'Server error.');
    } finally {
      setSubmitting(false);
    }
  };

  const counts = {
    All: requests.length,
    Pending: requests.filter(r => r.status === 'Pending').length,
    Approved: requests.filter(r => r.status === 'Approved').length,
    Rejected: requests.filter(r => r.status === 'Rejected').length,
  };

  const filtered = filterStatus === 'All' ? requests : requests.filter(r => r.status === filterStatus);

  return (
    <div style={{ padding: '1.5rem', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
            <Package size={28} color="#16a34a" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>Material Requests Management</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Review, approve, or reject contractor maintenance material requests.</p>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {message.text && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.85rem 1.25rem', borderRadius: '10px',
          fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem',
          background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: message.type === 'success' ? '#15803d' : '#991b1b',
          border: `1.5px solid ${message.type === 'success' ? '#bbf7d0' : '#fca5a5'}`,
        }}>
          {message.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
          {message.text}
        </div>
      )}

      {/* Status Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {Object.entries(counts).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFilterStatus(k)}
            style={{
              padding: '0.55rem 1.25rem', borderRadius: '20px', border: '2px solid',
              borderColor: filterStatus === k ? '#16a34a' : '#cbd5e1',
              background: filterStatus === k ? '#16a34a' : 'white',
              color: filterStatus === k ? 'white' : '#475569',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            {k} <span style={{
              background: filterStatus === k ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
              borderRadius: '10px', padding: '1px 8px', fontSize: '0.75rem',
              color: filterStatus === k ? 'white' : '#64748b',
            }}>{v}</span>
          </button>
        ))}
      </div>

      {/* Material Requests List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem', color: '#94a3b8' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <p>Loading requests…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '4rem', color: '#94a3b8', textAlign: 'center', background: 'white', borderRadius: '14px', border: '1.5px solid #e2e8f0' }}>
          <Package size={52} color="#cbd5e1" />
          <h3 style={{ color: '#475569', margin: 0 }}>No {filterStatus !== 'All' ? filterStatus.toLowerCase() : ''} material requests</h3>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8' }}>Material requests submitted by contractors will appear here for review.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(req => (
            <div key={req._id} style={{
              background: 'white', borderRadius: '14px',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden',
            }}>
              {/* Card Header */}
              <div style={{ padding: '1rem 1.25rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{req.materialName}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '0.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: '10px',
                        background: STATUS_COLORS[req.status]?.bg,
                        color: STATUS_COLORS[req.status]?.color,
                      }}>
                        {req.status === 'Pending' ? <Clock size={12}/> : req.status === 'Approved' ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                        {req.status}
                      </span>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                        background: PRIORITY_COLORS[req.priority]?.bg,
                        color: PRIORITY_COLORS[req.priority]?.color,
                      }}>{req.priority} Priority</span>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Requested: {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Approve/Reject Buttons */}
                  {req.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => openReview(req, 'Approved')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '0.5rem 1.1rem', borderRadius: '8px',
                          background: '#10b981', color: '#ffffff',
                          border: 'none', fontWeight: 700,
                          fontSize: '0.82rem', cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(16,185,129,0.3)'
                        }}
                      >
                        <CheckCircle size={15}/> Approve
                      </button>
                      <button
                        onClick={() => openReview(req, 'Rejected')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '0.5rem 1.1rem', borderRadius: '8px',
                          background: '#ef4444', color: '#ffffff',
                          border: 'none', fontWeight: 700,
                          fontSize: '0.82rem', cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(239,68,68,0.3)'
                        }}
                      >
                        <XCircle size={15}/> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '1.15rem 1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '0.85rem' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contractor</p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <User size={15} color="#2563eb"/>{req.contractorName || req.contractor?.name || '—'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity</p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', fontWeight: 800, color: '#059669' }}>{req.quantity} {req.unit}</p>
                  </div>
                  {req.parkName && (
                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Park Location</p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{req.parkName}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason & Justification</p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.88rem', color: '#374151', lineHeight: 1.6, background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #f1f5f9' }}>{req.reason}</p>
                </div>

                {/* Admin Notes / Rejection Reason Display */}
                {req.adminNotes && (
                  <div style={{
                    marginTop: '0.85rem', padding: '0.85rem 1rem', borderRadius: '10px',
                    background: req.status === 'Approved' ? '#f0fdf4' : '#fef2f2',
                    color: req.status === 'Approved' ? '#166534' : '#991b1b',
                    border: `1.5px solid ${req.status === 'Approved' ? '#bbf7d0' : '#fca5a5'}`,
                    fontSize: '0.86rem', display: 'flex', alignItems: 'flex-start', gap: '8px',
                  }}>
                    <MessageSquare size={16} style={{ marginTop: '2px', flexShrink: 0 }}/>
                    <div>
                      <strong>{req.status === 'Approved' ? '✅ Admin Approval Note:' : '❌ Admin Rejection Reason:'}</strong>
                      <div style={{ marginTop: '2px', lineHeight: 1.5 }}>{req.adminNotes}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal with Presets */}
      {reviewModal.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }} onClick={() => setReviewModal({ ...reviewModal, open: false })}>
          <div style={{
            background: 'white', borderRadius: '16px', width: '100%', maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            
            <div style={{
              padding: '1.25rem 1.5rem',
              background: reviewModal.status === 'Approved' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
            }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem', fontWeight: 800 }}>
                {reviewModal.status === 'Approved' ? <CheckCircle size={22}/> : <XCircle size={22}/>}
                {reviewModal.status} Material Request
              </h3>
              <p style={{ margin: '0.3rem 0 0', opacity: 0.9, fontSize: '0.88rem' }}>
                Item: <strong>{reviewModal.request?.materialName}</strong> ({reviewModal.request?.quantity} {reviewModal.request?.unit})
              </p>
            </div>

            <div style={{ padding: '1.5rem' }}>
              
              {reviewModal.status === 'Rejected' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Quick Select Rejection Reason:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {REJECTION_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReviewModal(prev => ({ ...prev, notes: preset }))}
                        style={{
                          textAlign: 'left', padding: '0.45rem 0.75rem', borderRadius: '6px',
                          border: '1px solid #e2e8f0', background: '#f8fafc',
                          color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        💡 {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#374151', marginBottom: '0.5rem' }}>
                {reviewModal.status === 'Rejected' ? 'Rejection Reason (Required) *' : 'Approval / Delivery Notes (Optional)'}
              </label>
              <textarea
                rows={4}
                style={{
                  width: '100%', padding: '0.65rem 0.9rem', border: '1.5px solid #cbd5e1',
                  borderRadius: '8px', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box',
                  outline: 'none'
                }}
                placeholder={
                  reviewModal.status === 'Approved'
                    ? 'e.g. Approved. Materials will be delivered to park central store by Friday.'
                    : 'e.g. Request rejected because quantity exceeds standard monthly allocation for this park.'
                }
                value={reviewModal.notes}
                onChange={e => setReviewModal(prev => ({ ...prev, notes: e.target.value }))}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setReviewModal({ open: false, request: null, status: '', notes: '' })}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitReview}
                  disabled={submitting}
                  style={{
                    padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none',
                    background: reviewModal.status === 'Approved' ? '#10b981' : '#ef4444',
                    color: 'white', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Saving…' : `Confirm ${reviewModal.status}`}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminMaterialRequests;
