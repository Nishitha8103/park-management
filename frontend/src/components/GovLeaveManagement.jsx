import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
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
  Trash2,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import './GovLeaveManagement.css';

const LEAVE_STATUS_COLORS = {
  Pending: { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
  Approved: { bg: '#edf2ee', text: '#28372b', border: '#cbd7cd' },
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

export default function GovLeaveManagement({ official }) {
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
    if (!official) return;
    setLoading(true);
    try {
      const uId = official._id || official.id;
      const res = await axios.get(`/api/leaves/my?applicantId=${uId}`);
      setLeaves(res.data || []);
    } catch (err) {
      console.error('Error fetching official leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [official]);

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
      const uId = official._id || official.id;
      const formData = new FormData();
      formData.append('applicantId', uId);
      formData.append('applicantModel', 'User');
      formData.append('applicantRole', 'government_official');
      formData.append('applicantName', official.name || 'Government Official');
      formData.append('applicantEmail', official.email || '');
      formData.append('applicantPhone', official.phone || '');
      formData.append('applicantDepartment', official.department || 'Park Inspections & Governance');
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
        setSuccessMsg('Leave application submitted! The Administrator will review your request.');
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
      const uId = official._id || official.id;
      await axios.post('/api/leaves/cancel', { leaveId: cancelTargetLeave._id, applicantId: uId });
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
    <div className="gov-leave-mgmt-container">
      {/* Status Banner */}
      <div className="gov-leave-status-banner">
        <div className="gov-status-banner-info">
          <h3 className="gov-status-banner-title">Official Leave & Availability Dashboard</h3>
          <p className="gov-status-banner-desc">
            Apply for planned leaves or time off. Once approved by the administrator, your profile will be marked <strong>On Leave</strong> and new inspection assignments will be held until your return.
          </p>

          {/* Leave Quota Stat Chips */}
          <div className="gov-leave-quota-summary">
            <div className="gov-quota-chip highlight">
              <span className="gov-quota-label">Annual Quota</span>
              <span className="gov-quota-val">12 Days</span>
            </div>
            <div className="gov-quota-chip">
              <span className="gov-quota-label">Used / Approved</span>
              <span className="gov-quota-val">{approvedDays} Days</span>
            </div>
            <div className="gov-quota-chip remaining">
              <span className="gov-quota-label">Leaves Left</span>
              <span className="gov-quota-val"><strong>{remainingLeaves}</strong> / 12 Days</span>
            </div>
            {pendingCount > 0 && (
              <div className="gov-quota-chip pending">
                <span className="gov-quota-label">Pending Approval</span>
                <span className="gov-quota-val">{pendingCount} Application{pendingCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
        <div className="gov-status-banner-action">
          <button
            className="gov-btn-apply-leave"
            onClick={() => { setShowApplyModal(true); setErrorMsg(''); setSuccessMsg(''); }}
          >
            <Plus size={18} /> Apply for Leave
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="gov-leave-alert success">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="gov-leave-alert error">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* History Table */}
      <div className="gov-leave-history-card">
        <div className="gov-history-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={20} color="#4f6d54" />
            <h4>My Leave Applications & Status</h4>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="gov-table-header-quota-badge">
              Leave Balance: <strong>{remainingLeaves} / 12 Days</strong>
            </span>
            <button className="gov-btn-refresh-leaves" onClick={fetchLeaves} title="Refresh">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="gov-leave-loading">
            <Loader2 className="gov-spin-icon" size={28} />
            <span>Loading leave records...</span>
          </div>
        ) : leaves.length === 0 ? (
          <div className="gov-leave-empty-state">
            <Calendar size={42} color="#8a9e90" />
            <p className="gov-empty-title">No leave applications recorded</p>
            <p className="gov-empty-sub">When you submit a leave request, its approval status, leave type, and admin remarks will appear here.</p>
          </div>
        ) : (
          <div className="gov-leave-table-wrapper">
            <table className="gov-leave-table">
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
                      <td style={{ fontWeight: 700, color: '#1f2a21' }}>
                        <button 
                          style={{ background: 'none', border: 'none', color: '#4f6d54', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                          onClick={() => setSelectedLeaveDetails(l)}
                        >
                          {l.leaveId}
                        </button>
                      </td>
                      <td>
                        <span className="gov-badge-leave-type">{l.leaveType || 'Casual Leave'}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1f2a21' }}>
                          {sDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          {' → '}
                          {eDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span className="gov-duration-pill">{diffDays} Day{diffDays > 1 ? 's' : ''}</span>
                          {l.duration && l.duration !== 'Full Day' && (
                            <span className="gov-badge-duration">{l.duration}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`gov-leave-balance-badge ${remainingLeaves <= 3 ? 'low' : ''}`}>
                          {remainingLeaves} / 12 Left
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', color: '#5e7263' }}>
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
                            className="gov-link-doc"
                            title="View Supporting Document"
                          >
                            <Paperclip size={13} /> Document
                          </a>
                        ) : (
                          <span style={{ color: '#cbd7cd', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span
                          className="gov-leave-status-tag"
                          style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: l.adminRemarks ? '#2d3e30' : '#8a9e90', fontStyle: l.adminRemarks ? 'normal' : 'italic' }}>
                        {l.adminRemarks || 'No remarks yet'}
                      </td>
                      <td>
                        {l.status === 'Pending' ? (
                          <button
                            className="gov-btn-cancel-leave"
                            onClick={() => setCancelTargetLeave(l)}
                            title="Cancel Leave Application"
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            style={{ background: '#f4f7f4', border: '1px solid #cbd7cd', borderRadius: '8px', fontSize: '0.78rem', padding: '4px 10px', cursor: 'pointer', color: '#2d3e30', fontWeight: 600 }}
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
        <div className="gov-leave-modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="gov-leave-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="gov-leave-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="#4f6d54" />
                <h3>Apply for Official Leave / Time Off</h3>
              </div>
              <button className="gov-btn-modal-close" onClick={() => setShowApplyModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApply} className="gov-leave-modal-form">
              {errorMsg && (
                <div className="gov-leave-alert error">
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              <div className="gov-form-info-notice">
                <Info size={18} color="#4f6d54" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Admin approval is required for all official leave requests. Existing inspection assignments can be reassigned to other officers during your absence.
                </span>
              </div>

              {/* 1. Leave Type */}
              <div className="gov-form-field">
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
              <div className="gov-form-row-dates">
                <div className="gov-form-field">
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
                <div className="gov-form-date-separator">→</div>
                <div className="gov-form-field">
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
              <div className="gov-form-field">
                <label>Duration</label>
                <div className="gov-duration-radio-group">
                  {['Full Day', 'Half Day – Morning', 'Half Day – Afternoon'].map((opt) => (
                    <label 
                      key={opt} 
                      className={`gov-duration-radio-label ${duration === opt ? 'active' : ''}`}
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
              <div className="gov-form-field">
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
              <div className="gov-form-field">
                <label>Supporting Document (Optional)</label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                />
                {!supportingFile ? (
                  <div className="gov-upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                    <span className="gov-upload-btn-label">
                      <Paperclip size={16} /> 📎 Upload Document
                    </span>
                    <span className="gov-upload-hint">PDF, DOC, DOCX, JPG or PNG (Max 10MB)</span>
                  </div>
                ) : (
                  <div className="gov-uploaded-file-pill">
                    <div className="gov-file-info">
                      <FileText size={16} />
                      <span>{supportingFile.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#5e7263' }}>
                        ({(supportingFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button 
                      type="button" 
                      className="gov-btn-remove-file" 
                      onClick={removeSelectedFile}
                      title="Remove Document"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* 6. Handover Notes (Optional) */}
              <div className="gov-form-field">
                <label>Handover Notes (Optional)</label>
                <textarea 
                  rows={2}
                  placeholder="Add any instructions for pending assignments..."
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value.replace(/[0-9]/g, ''))}
                />
              </div>

              <div className="gov-leave-modal-actions">
                <button
                  type="button"
                  className="gov-btn-modal-cancel"
                  onClick={() => setShowApplyModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gov-btn-modal-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <><Loader2 className="gov-spin-icon" size={16} /> Submitting...</>
                  ) : (
                    <><Send size={16} /> Submit Leave Request</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Details Modal */}
      {selectedLeaveDetails && (
        <div className="gov-leave-modal-overlay" onClick={() => setSelectedLeaveDetails(null)}>
          <div className="gov-leave-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="gov-leave-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="#4f6d54" />
                <h3>Leave Application Details ({selectedLeaveDetails.leaveId})</h3>
              </div>
              <button className="gov-btn-modal-close" onClick={() => setSelectedLeaveDetails(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8faf8', padding: '1.2rem', borderRadius: '14px', border: '1px solid #d8e2da' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#5e7263', fontWeight: 800, textTransform: 'uppercase' }}>LEAVE TYPE</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1f2a21', marginTop: '3px' }}>
                    {selectedLeaveDetails.leaveType || 'Casual Leave'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#5e7263', fontWeight: 800, textTransform: 'uppercase' }}>DURATION</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1f2a21', marginTop: '3px' }}>
                    {selectedLeaveDetails.duration || 'Full Day'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#5e7263', fontWeight: 800, textTransform: 'uppercase' }}>DATE RANGE</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1f2a21', marginTop: '3px' }}>
                    {new Date(selectedLeaveDetails.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' → '}
                    {new Date(selectedLeaveDetails.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#5e7263', fontWeight: 800, textTransform: 'uppercase' }}>STATUS</div>
                  <div style={{ marginTop: '3px' }}>
                    <span 
                      className="gov-leave-status-tag"
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
                <div style={{ fontSize: '0.8rem', color: '#5e7263', fontWeight: 800, marginBottom: '6px' }}>REASON FOR LEAVE</div>
                <div style={{ background: '#ffffff', border: '1.5px solid #d8e2da', borderRadius: '10px', padding: '0.85rem 1rem', fontSize: '0.9rem', color: '#1f2a21', lineHeight: '1.5' }}>
                  {selectedLeaveDetails.reason}
                </div>
              </div>

              {selectedLeaveDetails.handoverNotes && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#5e7263', fontWeight: 800, marginBottom: '6px' }}>HANDOVER NOTES</div>
                  <div style={{ background: '#edf2ee', border: '1px solid #cbd7cd', borderRadius: '10px', padding: '0.85rem 1rem', fontSize: '0.88rem', color: '#28372b', lineHeight: '1.5' }}>
                    {selectedLeaveDetails.handoverNotes}
                  </div>
                </div>
              )}

              {selectedLeaveDetails.supportingDocument && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#5e7263', fontWeight: 800, marginBottom: '6px' }}>SUPPORTING DOCUMENT</div>
                  <a 
                    href={selectedLeaveDetails.supportingDocument} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="gov-uploaded-file-pill"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="gov-file-info">
                      <Paperclip size={16} />
                      <span>{selectedLeaveDetails.supportingDocumentOriginalName || 'View Attached Supporting Document'}</span>
                    </div>
                    <ExternalLink size={15} color="#4f6d54" />
                  </a>
                </div>
              )}

              {selectedLeaveDetails.adminRemarks && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#5e7263', fontWeight: 800, marginBottom: '6px' }}>ADMINISTRATOR REMARKS</div>
                  <div style={{ background: '#f8faf8', border: '1px solid #cbd7cd', borderRadius: '10px', padding: '0.85rem 1rem', fontSize: '0.88rem', color: '#1f2a21' }}>
                    {selectedLeaveDetails.adminRemarks}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button 
                  className="gov-btn-modal-cancel" 
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
        <div className="gov-leave-modal-overlay" onClick={() => !cancelling && setCancelTargetLeave(null)}>
          <div className="gov-leave-cancel-popup-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="gov-cancel-popup-icon-circle">
              <AlertCircle size={32} color="#dc2626" />
            </div>
            <h3 className="gov-cancel-popup-title">Cancel Leave Application?</h3>
            <p className="gov-cancel-popup-message">
              Are you sure you want to cancel your leave application <strong>{cancelTargetLeave.leaveId}</strong> for <strong>{cancelTargetLeave.leaveType}</strong>? This action cannot be reversed.
            </p>
            <div className="gov-cancel-popup-actions">
              <button 
                type="button"
                className="gov-btn-popup-keep" 
                onClick={() => setCancelTargetLeave(null)}
                disabled={cancelling}
              >
                No, Keep Application
              </button>
              <button 
                type="button"
                className="gov-btn-popup-confirm-cancel" 
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? <Loader2 className="gov-spin-icon" size={16} /> : <Trash2 size={16} />}
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
