import React, { useState, useRef } from 'react';
import { 
  AlertTriangle, 
  X, 
  Upload, 
  Send, 
  Loader2, 
  Check 
} from 'lucide-react';
import axios from 'axios';
import './RequestReassignmentModal.css';

const REASON_OPTIONS = [
  'On Leave',
  'Not Available',
  'Emergency',
  'Already Assigned to Urgent Task',
  'Insufficient Manpower',
  'Equipment/Material Unavailable',
  'Outside My Responsibility',
  'Other'
];

export default function RequestReassignmentModal({
  isOpen,
  onClose,
  task,
  user,
  userRole = 'contractor', // 'contractor' | 'government_official'
  onSuccess
}) {
  const [reason, setReason] = useState('On Leave');
  const [explanation, setExplanation] = useState('');
  const [wantsReassignment, setWantsReassignment] = useState('yes'); // 'yes' | 'no'
  
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const isContractor = ['contractor', 'Contractor'].includes(userRole);

  if (!isOpen || !task) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachmentFile(file);
    setUploadingFile(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('attachment', file);

      const res = await axios.post('/api/reassignments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.fileUrl) {
        setAttachmentUrl(res.data.fileUrl);
      }
    } catch (err) {
      console.error('File upload failed:', err);
      setErrorMsg('Failed to upload attachment file. You can still submit without it.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setErrorMsg('Please select a Reason for Rejection / Reassignment.');
      return;
    }

    if (!explanation.trim()) {
      setErrorMsg('Please provide an Additional Explanation why you cannot complete this task.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const requesterId = user?._id || user?.id || (isContractor ? task.assignedContractor?._id || task.assignedContractor : task.assignedOfficial?._id || task.assignedOfficial);
      const requesterName = user?.name || (isContractor ? 'Contractor' : 'Government Official');

      const payload = {
        taskId: task._id || task.id,
        requesterId: String(requesterId),
        requesterName,
        requesterRole: isContractor ? 'contractor' : 'government_official',
        reason,
        explanation: explanation.trim(),
        wantsReassignment: wantsReassignment === 'yes',
        attachmentUrl: attachmentUrl || null
      };

      const res = await axios.post('/api/reassignments/request', payload);
      if (res.data && res.data.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      console.error('Failed to submit reassignment request:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reassign-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="reassign-modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="reassign-modal-header">
          <div className="reassign-title-group">
            <div className="reassign-icon-circle">
              <AlertTriangle size={22} color="#dc2626" />
            </div>
            <div>
              <h3>Decline / Request Reassignment</h3>
              <p>Job <strong>{task.complaintNumber || task.id}</strong> at <strong>{task.parkName || task.park || 'Park'}</strong></p>
            </div>
          </div>
          <button className="reassign-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="reassign-error-alert" style={{ margin: '1rem 1.5rem 0' }}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="reassign-form">
          {/* Reason for Rejection / Reassignment */}
          <div className="reassign-form-group">
            <label className="reassign-form-label">
              Reason for Rejection / Reassignment <span className="req-star">*</span>
            </label>
            <select 
              className="reassign-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              {REASON_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Additional Explanation */}
          <div className="reassign-form-group">
            <label className="reassign-form-label">
              Additional Explanation <span className="req-star">*</span>
            </label>
            <textarea
              className="reassign-textarea"
              rows={3}
              placeholder="Please explain why you cannot complete this task. (Example: I am unavailable due to approved leave from 17 Sep to 18 Sep.)"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              required
            />
          </div>

          {/* Do you want this task to be reassigned? */}
          <div className="reassign-form-group">
            <label className="reassign-form-label">
              Do you want this task to be reassigned? <span className="req-star">*</span>
            </label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: wantsReassignment === 'yes' ? '600' : 'normal', color: wantsReassignment === 'yes' ? '#0f172a' : '#64748b' }}>
                <input 
                  type="radio" 
                  name="wantsReassignment" 
                  value="yes" 
                  checked={wantsReassignment === 'yes'} 
                  onChange={() => setWantsReassignment('yes')} 
                />
                Yes, Request Reassignment
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: wantsReassignment === 'no' ? '600' : 'normal', color: wantsReassignment === 'no' ? '#0f172a' : '#64748b' }}>
                <input 
                  type="radio" 
                  name="wantsReassignment" 
                  value="no" 
                  checked={wantsReassignment === 'no'} 
                  onChange={() => setWantsReassignment('no')} 
                />
                No
              </label>
            </div>
          </div>

          {/* Attachment (Optional) */}
          <div className="reassign-form-group">
            <label className="reassign-form-label">
              Attachment (Optional)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                {uploadingFile ? <Loader2 size={15} className="spinning" /> : <Upload size={15} />}
                {uploadingFile ? 'Uploading...' : 'Upload File / Image'}
              </button>

              {attachmentFile && (
                <span style={{ fontSize: '0.82rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={14} /> {attachmentFile.name}
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
              Upload supporting document/image if required (Leave letter, site hindrance photo, etc.).
            </span>
          </div>

          {/* Footer Actions */}
          <div className="reassign-modal-footer">
            <button 
              type="button" 
              className="btn-reassign-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-reassign-submit"
              style={{ background: '#dc2626', borderColor: '#dc2626' }}
              disabled={submitting || uploadingFile}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spinning" /> Submitting...
                </>
              ) : (
                <>
                  <Send size={16} /> Submit Rejection Request
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

