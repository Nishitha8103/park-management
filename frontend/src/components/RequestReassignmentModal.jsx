import React, { useState } from 'react';
import { 
  AlertTriangle, 
  RotateCcw, 
  X, 
  Upload, 
  CheckCircle2, 
  HelpCircle,
  FileText,
  Clock,
  Send,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import './RequestReassignmentModal.css';

const REASON_OPTIONS = [
  'On Leave',
  'Not Available',
  'Emergency',
  'Already Assigned to an Urgent Task',
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
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !task) return null;

  const isContractor = ['contractor', 'Contractor'].includes(userRole);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setErrorMsg('Please select a reason for reassignment.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const requesterId = user?._id || user?.id || (isContractor ? task.assignedContractor?._id || task.assignedContractor : task.assignedOfficial?._id || task.assignedOfficial);
      const requesterName = user?.name || (isContractor ? 'Contractor' : 'Government Official');

      const payload = {
        taskId: task._id,
        requesterId: String(requesterId),
        requesterName,
        requesterRole: isContractor ? 'contractor' : 'government_official',
        reason,
        explanation: explanation.trim(),
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
              <RotateCcw size={22} color="#d97706" />
            </div>
            <div>
              <h3>Request Task Reassignment</h3>
              <p>Notify Administrator that you cannot complete this assigned task</p>
            </div>
          </div>
          <button className="reassign-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Task Summary Banner */}
        <div className="reassign-task-summary">
          <div className="summary-row">
            <span className="summary-label">Task:</span>
            <span className="summary-val">{task.category || task.issueTitle || 'Maintenance Task'} (#{task.complaintNumber || task.id})</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Park:</span>
            <span className="summary-val">{task.parkName || task.park?.name || 'Park Premises'}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Role:</span>
            <span className="summary-val role-badge">{isContractor ? 'Contractor Task' : 'Official Inspection'}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="reassign-error-alert">
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="reassign-form">
          {/* Reason Selection */}
          <div className="reassign-form-group">
            <label className="reassign-form-label">
              Primary Reason for Inability to Complete <span className="req-star">*</span>
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
              Additional Explanation / Details
            </label>
            <textarea
              className="reassign-textarea"
              rows={4}
              placeholder="Please describe why you cannot undertake or finish this task, current bottlenecks, or expected availability date..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>

          {/* Optional Attachment URL / Evidence */}
          <div className="reassign-form-group">
            <label className="reassign-form-label">
              Optional Attachment / Evidence (Document or Image Link)
            </label>
            <input
              type="text"
              className="reassign-input"
              placeholder="e.g. Leave letter link, medical certificate, or site hindrance photo"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
            />
          </div>

          {/* SLA Notice */}
          <div className="reassign-sla-notice">
            <Clock size={15} color="#0284c7" />
            <span>
              <strong>Note:</strong> Submitting a reassignment request does not automatically reset the SLA deadline. The Administrator will review and assign an eligible replacement {isContractor ? 'Contractor' : 'Government Official'}.
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
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spinning" /> Submitting...
                </>
              ) : (
                <>
                  <Send size={16} /> Submit Reassignment Request
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
