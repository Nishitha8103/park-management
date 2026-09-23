import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  X, 
  Loader2,
  CalendarDays,
  RefreshCw,
  Info,
  Paperclip,
  FileText,
  File,
  Trash2,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import './ContractorLeaveManagement.css';

const LEAVE_STATUS_COLORS = {
  Pending: { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
  Approved: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  Rejected: { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
  Cancelled: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
};

const LEAVE_TYPES = [
  'Casual Leave',
  'Sick / Medical Leave',
  'Earned / Annual Leave',
  'Maternity / Paternity Leave',
  'Compensatory Off',
  'Emergency Leave',
  'Loss of Pay / Unpaid Leave',
  'Other'
];

export default function ContractorLeaveManagement({ contractor }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedLeaveDetails, setSelectedLeaveDetails] = useState(null);

  // Form State
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('Full Day');
  const [reason, setReason] = useState('');
  const [supportingFile, setSupportingFile] = useState(null);
  const [handoverNotes, setHandoverNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef(null);

  const fetchLeaves = async () => {
    if (!contractor) return;
    setLoading(true);
    try {
      const cId = contractor._id || contractor.id;
      const res = await axios.get(`/api/leaves/my?applicantId=${cId}`);
      setLeaves(res.data || []);
    } catch (err) {
      console.error('Error fetching contractor leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [contractor]);

  const resetForm = () => {
    setLeaveType('');
    setStartDate('');
    setEndDate('');
    setDuration('Full Day');
    setReason('');
    setSupportingFile(null);
    setHandoverNotes('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Document size exceeds maximum limit of 10MB.');
        return;
      }
      setSupportingFile(file);
      setErrorMsg('');
    }
  };

  const removeSelectedFile = () => {
    setSupportingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!leaveType) {
      setErrorMsg('Please select a Leave Type.');
      return;
    }

    if (!startDate || !endDate) {
      setErrorMsg('Please specify both From Date and To Date.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setErrorMsg('To Date cannot be earlier than From Date.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Please describe the reason for your leave.');
      return;
    }

    setSubmitting(true);
    try {
      const cId = contractor._id || contractor.id;
      const formData = new FormData();
      formData.append('applicantId', cId);
      formData.append('applicantModel', 'Contractor');
      formData.append('applicantRole', 'contractor');
      formData.append('applicantName', contractor.name || 'Contractor Specialist');
      formData.append('applicantEmail', contractor.email || '');
      formData.append('applicantPhone', contractor.phone || '');
      formData.append('applicantDepartment', contractor.department || 'Maintenance Specialist');
      formData.append('leaveType', leaveType);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('duration', duration);
      formData.append('reason', reason.trim());
      formData.append('handoverNotes', handoverNotes.trim());

      if (supportingFile) {
        formData.append('supportingDocument', supportingFile);
      }

      const res = await axios.post('/api/leaves/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.success) {
        setSuccessMsg('Leave application submitted successfully! The Administrator will review your request.');
        resetForm();
        setShowApplyModal(false);
        fetchLeaves();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to submit leave application.');
    } finally {
      setSubmitting(false);
    }
  };

  const [cancelTargetLeave, setCancelTargetLeave] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const handleConfirmCancel = async () => {
    if (!cancelTargetLeave) return;
    setCancelling(true);
    try {
      const cId = contractor._id || contractor.id;
      await axios.post('/api/leaves/cancel', { leaveId: cancelTargetLeave._id, applicantId: cId });
      setSuccessMsg('Leave application cancelled successfully.');
      setCancelTargetLeave(null);
      fetchLeaves();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to cancel leave request.');
      setCancelTargetLeave(null);
    } finally {
      setCancelling(false);
    }
  };

  // 12 Annual Leaves Calculation
  const TOTAL_LEAVE_QUOTA = 12;
  const approvedDays = leaves
    .filter(l => l.status === 'Approved')
    .reduce((acc, l) => {
      const s = new Date(l.startDate);
      const e = new Date(l.endDate);
      const diff = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
      return acc + diff;
    }, 0);
  const remainingLeaves = Math.max(0, TOTAL_LEAVE_QUOTA - approvedDays);
  const pendingCount = leaves.filter(l => l.status === 'Pending').length;

  return (
    <div className="leave-mgmt-container">
      {/* Availability Status Header Card */}
      <div className="leave-status-banner">
        <div className="status-banner-info">
          <h3 className="status-banner-title">Leave & Availability Dashboard</h3>
          <p className="status-banner-desc">
            Apply for planned leaves or time off. Once approved by the administrator, your profile will be marked <strong>On Leave</strong> and new task assignments will be held until your return.
          </p>

          {/* Leave Quota Stat Chips */}
          <div className="leave-quota-summary">
            <div className="quota-chip highlight">
              <span className="quota-label">Annual Quota</span>
              <span className="quota-val">12 Days</span>
            </div>
            <div className="quota-chip">
              <span className="quota-label">Used / Approved</span>
              <span className="quota-val">{approvedDays} Days</span>
            </div>
            <div className="quota-chip remaining">
              <span className="quota-label">Leaves Left</span>
              <span className="quota-val"><strong>{remainingLeaves}</strong> / 12 Days</span>
            </div>
            {pendingCount > 0 && (
              <div className="quota-chip pending">
                <span className="quota-label">Pending Approval</span>
                <span className="quota-val">{pendingCount} Application{pendingCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        <div className="status-banner-action">
          <button 
            className="btn-apply-leave" 
            onClick={() => { setShowApplyModal(true); setErrorMsg(''); setSuccessMsg(''); }}
          >
            <Plus size={18} /> Apply for Leave
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="leave-alert success">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="leave-alert error">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* History Table */}
      <div className="leave-history-card">
        <div className="history-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={20} color="#65a30d" />
            <h4>My Leave Applications & Status</h4>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="table-header-quota-badge">
              Leave Balance: <strong>{remainingLeaves} / 12 Days</strong>
            </span>
            <button className="btn-refresh-leaves" onClick={fetchLeaves} title="Refresh">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="leave-loading">
            <Loader2 className="spin-icon" size={24} />
            <span>Loading leave records...</span>
          </div>
        ) : leaves.length === 0 ? (
          <div className="leave-empty-state">
            <Calendar size={36} color="#94a3b8" />
            <p className="empty-title">No leave applications recorded</p>
            <p className="empty-sub">When you submit a leave request, its approval status, type, and admin remarks will appear here.</p>
          </div>
        ) : (
          <div className="leave-table-wrapper">
            <table className="leave-table">
              <thead>
                <tr>
                  <th>Leave ID</th>
                  <th>Leave Type</th>
                  <th>Dates (From → To)</th>
                  <th>Duration</th>
                  <th>Leave Balance</th>
                  <th>Reason</th>
                  <th>Document</th>
                  <th>Status</th>
                  <th>Admin Remarks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => {
                  const sDate = new Date(l.startDate);
                  const eDate = new Date(l.endDate);
                  const diffDays = Math.ceil(Math.abs(eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;
                  const colors = LEAVE_STATUS_COLORS[l.status] || LEAVE_STATUS_COLORS.Pending;

                  return (
                    <tr key={l._id}>
                      <td style={{ fontWeight: 700, color: '#1e293b' }}>
                        <button 
                          style={{ background: 'none', border: 'none', color: '#65a30d', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                          onClick={() => setSelectedLeaveDetails(l)}
                        >
                          {l.leaveId}
                        </button>
                      </td>
                      <td>
                        <span className="badge-leave-type">{l.leaveType || 'Casual Leave'}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          {sDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          {' → '}
                          {eDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span className="duration-pill">{diffDays} Day{diffDays > 1 ? 's' : ''}</span>
                          {l.duration && l.duration !== 'Full Day' && (
                            <span className="badge-duration">{l.duration}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`leave-balance-badge ${remainingLeaves <= 3 ? 'low' : ''}`}>
                          {remainingLeaves} / 12 Left
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', color: '#475569' }}>
                        <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={l.reason}>
                          {l.reason}
                        </div>
                      </td>
                      <td>
                        {l.supportingDocument ? (
                          <a 
                            href={l.supportingDocument} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="link-doc"
                            title="View / Download Supporting Document"
                          >
                            <Paperclip size={13} /> Document
                          </a>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span 
                          className="leave-status-tag"
                          style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: l.adminRemarks ? '#334155' : '#94a3b8', fontStyle: l.adminRemarks ? 'normal' : 'italic' }}>
                        {l.adminRemarks || 'No remarks yet'}
                      </td>
                      <td>
                        {l.status === 'Pending' ? (
                          <button 
                            className="btn-cancel-leave" 
                            onClick={() => setCancelTargetLeave(l)}
                            title="Cancel Leave Application"
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.75rem', padding: '3px 8px', cursor: 'pointer', color: '#475569' }}
                            onClick={() => setSelectedLeaveDetails(l)}
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="leave-modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="leave-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="leave-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="#65a30d" />
                <h3>Apply for Leave / Time Off</h3>
              </div>
              <button className="btn-modal-close" onClick={() => setShowApplyModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApply} className="leave-modal-form">
              {errorMsg && (
                <div className="leave-alert error">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              <div className="form-info-notice">
                <Info size={16} color="#0369a1" />
                <span>
                  Admin approval is required for all leave requests. Existing maintenance assignments can be reassigned during your absence.
                </span>
              </div>

              {/* 1. Leave Type */}
              <div className="form-field">
                <label>Leave Type *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  required
                >
                  <option value="" disabled>Select Leave Type ▼</option>
                  {LEAVE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* 2. From Date → To Date */}
              <div className="form-row-dates">
                <div className="form-field">
                  <label>From Date *</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (!endDate || new Date(endDate) < new Date(e.target.value)) {
                        setEndDate(e.target.value);
                      }
                    }} 
                    required 
                  />
                </div>
                <div className="form-date-separator">→</div>
                <div className="form-field">
                  <label>To Date *</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    min={startDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEndDate(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              {/* 3. Duration */}
              <div className="form-field">
                <label>Duration</label>
                <div className="duration-radio-group">
                  {['Full Day', 'Half Day – Morning', 'Half Day – Afternoon'].map((opt) => (
                    <label 
                      key={opt} 
                      className={`duration-radio-label ${duration === opt ? 'active' : ''}`}
                    >
                      <input 
                        type="radio" 
                        name="duration" 
                        value={opt} 
                        checked={duration === opt}
                        onChange={() => setDuration(opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              {/* 4. Reason for Leave */}
              <div className="form-field">
                <label>Reason for Leave *</label>
                <textarea 
                  rows={3}
                  placeholder="Describe reason..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value.replace(/[0-9]/g, ''))}
                  required
                />
              </div>

              {/* 5. Supporting Document (Optional) */}
              <div className="form-field">
                <label>Supporting Document (Optional)</label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                />
                {!supportingFile ? (
                  <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                    <span className="upload-btn-label">
                      <Paperclip size={16} /> 📎 Upload Document
                    </span>
                    <span className="upload-hint">PDF, DOC, DOCX, JPG or PNG (Max 10MB)</span>
                  </div>
                ) : (
                  <div className="uploaded-file-pill">
                    <div className="file-info">
                      <FileText size={16} />
                      <span>{supportingFile.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        ({(supportingFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button 
                      type="button" 
                      className="btn-remove-file" 
                      onClick={removeSelectedFile}
                      title="Remove Document"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* 6. Handover Notes (Optional) */}
              <div className="form-field">
                <label>Handover Notes (Optional)</label>
                <textarea 
                  rows={2}
                  placeholder="Add any instructions for pending assignments..."
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value.replace(/[0-9]/g, ''))}
                />
              </div>

              <div className="leave-modal-actions">
                <button 
                  type="button" 
                  className="btn-modal-cancel" 
                  onClick={() => setShowApplyModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-modal-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="spin-icon" size={16} /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Submit Leave Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Details Modal */}
      {selectedLeaveDetails && (
        <div className="leave-modal-overlay" onClick={() => setSelectedLeaveDetails(null)}>
          <div className="leave-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="leave-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="#65a30d" />
                <h3>Leave Application Details ({selectedLeaveDetails.leaveId})</h3>
              </div>
              <button className="btn-modal-close" onClick={() => setSelectedLeaveDetails(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>LEAVE TYPE</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                    {selectedLeaveDetails.leaveType || 'Casual Leave'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>DURATION</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                    {selectedLeaveDetails.duration || 'Full Day'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>DATE RANGE</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                    {new Date(selectedLeaveDetails.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' → '}
                    {new Date(selectedLeaveDetails.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>STATUS</div>
                  <div style={{ marginTop: '2px' }}>
                    <span 
                      className="leave-status-tag"
                      style={{ 
                        backgroundColor: (LEAVE_STATUS_COLORS[selectedLeaveDetails.status] || LEAVE_STATUS_COLORS.Pending).bg,
                        color: (LEAVE_STATUS_COLORS[selectedLeaveDetails.status] || LEAVE_STATUS_COLORS.Pending).text
                      }}
                    >
                      {selectedLeaveDetails.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>REASON FOR LEAVE</div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', fontSize: '0.9rem', color: '#334155' }}>
                  {selectedLeaveDetails.reason}
                </div>
              </div>

              {selectedLeaveDetails.handoverNotes && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>HANDOVER NOTES</div>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.75rem', fontSize: '0.88rem', color: '#166534' }}>
                    {selectedLeaveDetails.handoverNotes}
                  </div>
                </div>
              )}

              {selectedLeaveDetails.supportingDocument && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>SUPPORTING DOCUMENT</div>
                  <a 
                    href={selectedLeaveDetails.supportingDocument} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="uploaded-file-pill"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="file-info">
                      <Paperclip size={16} />
                      <span>{selectedLeaveDetails.supportingDocumentOriginalName || 'View Attached Supporting Document'}</span>
                    </div>
                    <ExternalLink size={15} color="#15803d" />
                  </a>
                </div>
              )}

              {selectedLeaveDetails.adminRemarks && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>ADMINISTRATOR REMARKS</div>
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem', fontSize: '0.88rem', color: '#1e293b' }}>
                    {selectedLeaveDetails.adminRemarks}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button 
                  className="btn-modal-cancel" 
                  onClick={() => setSelectedLeaveDetails(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Cancel Confirmation Popup Modal */}
      {cancelTargetLeave && (
        <div className="leave-modal-overlay" onClick={() => !cancelling && setCancelTargetLeave(null)}>
          <div className="leave-cancel-popup-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="cancel-popup-icon-circle">
              <AlertCircle size={32} color="#dc2626" />
            </div>
            <h3 className="cancel-popup-title">Cancel Leave Application?</h3>
            <p className="cancel-popup-message">
              Are you sure you want to cancel your leave application <strong>{cancelTargetLeave.leaveId}</strong> for <strong>{cancelTargetLeave.leaveType}</strong>? This action cannot be reversed.
            </p>
            <div className="cancel-popup-actions">
              <button 
                type="button"
                className="btn-popup-keep" 
                onClick={() => setCancelTargetLeave(null)}
                disabled={cancelling}
              >
                No, Keep Application
              </button>
              <button 
                type="button"
                className="btn-popup-confirm-cancel" 
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? <Loader2 className="spin-icon" size={16} /> : <Trash2 size={16} />}
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
