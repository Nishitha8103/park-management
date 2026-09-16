import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Shield, 
  Briefcase, 
  HardHat, 
  Users, 
  RefreshCw, 
  X, 
  ExternalLink, 
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import AssignmentHistoryTimeline from '../../components/AssignmentHistoryTimeline';
import './AdminReassignmentRequests.css';

const REASON_BADGE_COLORS = {
  'On Leave': { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  'Not Available': { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
  'Emergency': { bg: '#fdf2f8', text: '#9d174d', border: '#fbcfe8' },
  'Already Assigned to an Urgent Task': { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' },
  'Insufficient Manpower': { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa' },
  'Equipment/Material Unavailable': { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' },
  'Outside My Responsibility': { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  'Other': { bg: '#f8fafc', text: '#334155', border: '#e2e8f0' }
};

export default function AdminReassignmentRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');

  // Detail Modal
  const [viewingRequest, setViewingRequest] = useState(null);

  // Reassign Modal State
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [targetTask, setTargetTask] = useState(null);
  const [targetRequestId, setTargetRequestId] = useState(null);
  const [candidatesData, setCandidatesData] = useState(null);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedNewAssigneeId, setSelectedNewAssigneeId] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [modifyDeadline, setModifyDeadline] = useState(false);
  const [newDeadlineDate, setNewDeadlineDate] = useState('');
  const [deadlineReason, setDeadlineReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/reassignments');
      if (res.data && res.data.requests) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error('Error loading reassignment requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Open Reassign Modal and fetch STRICT role-matched candidates
  const handleOpenReassignModal = async (reqObj) => {
    const taskId = reqObj.task?._id || reqObj.task;
    setTargetTask(reqObj);
    setTargetRequestId(reqObj._id || reqObj.requestId);
    setReassignModalOpen(true);
    setCandidatesLoading(true);
    setActionError('');
    setSelectedNewAssigneeId('');
    setAdminRemarks('');
    setModifyDeadline(false);
    setNewDeadlineDate('');
    setDeadlineReason('');

    try {
      const res = await axios.get(`/api/reassignments/eligible-candidates/${taskId}`);
      if (res.data && res.data.success) {
        setCandidatesData(res.data);
        // Default select first available candidate if present
        const available = (res.data.candidates || []).filter(c => c.isAvailable);
        if (available.length > 0) {
          setSelectedNewAssigneeId(available[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load eligible candidates:', err);
      setActionError('Failed to fetch eligible candidates for this role.');
    } finally {
      setCandidatesLoading(false);
    }
  };

  // Confirm Reassignment
  const handleConfirmReassignment = async (e) => {
    e.preventDefault();
    if (!selectedNewAssigneeId) {
      setActionError('Please select an eligible replacement assignee.');
      return;
    }

    setActionSubmitting(true);
    setActionError('');

    try {
      const adminStored = localStorage.getItem('adminUser');
      const adminObj = adminStored ? JSON.parse(adminStored) : null;
      const adminName = adminObj?.name || 'Administrator';

      const payload = {
        requestId: targetRequestId,
        taskId: targetTask?.task?._id || targetTask?.task,
        newAssigneeId: selectedNewAssigneeId,
        adminName,
        adminRemarks: adminRemarks.trim(),
        newDeadline: modifyDeadline && newDeadlineDate ? newDeadlineDate : undefined,
        deadlineChangeReason: modifyDeadline ? deadlineReason.trim() : undefined
      };

      const res = await axios.post('/api/reassignments/approve', payload);
      if (res.data && res.data.success) {
        alert(res.data.message || 'Task reassigned successfully.');
        setReassignModalOpen(false);
        if (viewingRequest) setViewingRequest(null);
        fetchRequests();
      }
    } catch (err) {
      console.error('Reassignment approval error:', err);
      setActionError(err.response?.data?.message || 'Failed to approve reassignment.');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Confirm Rejection
  const handleConfirmReject = async () => {
    if (!rejectRemarks.trim()) {
      alert('Please provide a reason for declining the reassignment request.');
      return;
    }

    setActionSubmitting(true);
    try {
      const adminStored = localStorage.getItem('adminUser');
      const adminObj = adminStored ? JSON.parse(adminStored) : null;
      const adminName = adminObj?.name || 'Administrator';

      const payload = {
        requestId: rejectingRequestId,
        adminName,
        adminRemarks: rejectRemarks.trim()
      };

      const res = await axios.post('/api/reassignments/reject', payload);
      if (res.data && res.data.success) {
        alert('Reassignment request rejected. Task remains with the original assignee.');
        setRejectModalOpen(false);
        if (viewingRequest) setViewingRequest(null);
        fetchRequests();
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert(err.response?.data?.message || 'Failed to reject request.');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Escalate Task
  const handleEscalateTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to mark this task as Escalated?')) return;
    try {
      const adminStored = localStorage.getItem('adminUser');
      const adminObj = adminStored ? JSON.parse(adminStored) : null;
      const adminName = adminObj?.name || 'Administrator';

      const res = await axios.post('/api/reassignments/escalate', {
        taskId,
        adminName,
        adminRemarks: 'No eligible candidates currently available in zone/ward. Escalated for senior administrative intervention.'
      });

      if (res.data && res.data.success) {
        alert('Task has been Escalated.');
        setReassignModalOpen(false);
        if (viewingRequest) setViewingRequest(null);
        fetchRequests();
      }
    } catch (err) {
      console.error('Error escalating task:', err);
      alert(err.response?.data?.message || 'Failed to escalate task.');
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(r => {
    const q = searchTerm.toLowerCase();
    const matchSearch = 
      (r.requestId || '').toLowerCase().includes(q) ||
      (r.taskTitle || '').toLowerCase().includes(q) ||
      (r.taskComplaintNumber || '').toLowerCase().includes(q) ||
      (r.parkName || '').toLowerCase().includes(q) ||
      (r.requesterName || '').toLowerCase().includes(q) ||
      (r.reason || '').toLowerCase().includes(q);

    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchRole = roleFilter === 'All' || (
      roleFilter === 'contractor' 
        ? ['contractor', 'Contractor'].includes(r.requesterRole) 
        : ['government_official', 'official', 'Government Official'].includes(r.requesterRole)
    );

    return matchSearch && matchStatus && matchRole;
  });

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

  return (
    <div className="admin-reassign-page">
      
      {/* Top Header Banner */}
      <div className="reassign-top-header">
        <div className="header-text-group">
          <div className="portal-badge-row">
            <span className="portal-pill">
              <RotateCcw size={14} /> WORKFLOW MANAGEMENT
            </span>
          </div>
          <h1>Task Reassignment Requests</h1>
          <p>Review inability-to-complete submissions from Contractors and Government Officials with strict role-locked reassignments.</p>
        </div>

        <button className="btn-refresh-reassign" onClick={fetchRequests} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Refresh
        </button>
      </div>

      {/* KPI Counters */}
      <div className="reassign-kpi-row">
        <div className={`reassign-kpi-card ${pendingCount > 0 ? 'pulse-amber' : ''}`}>
          <div className="kpi-icon-box amber"><RotateCcw size={20} /></div>
          <div>
            <span className="kpi-num">{pendingCount}</span>
            <span className="kpi-lbl">Pending Review</span>
          </div>
        </div>

        <div className="reassign-kpi-card">
          <div className="kpi-icon-box green"><CheckCircle2 size={20} /></div>
          <div>
            <span className="kpi-num">{approvedCount}</span>
            <span className="kpi-lbl">Reassigned & Approved</span>
          </div>
        </div>

        <div className="reassign-kpi-card">
          <div className="kpi-icon-box red"><XCircle size={20} /></div>
          <div>
            <span className="kpi-num">{rejectedCount}</span>
            <span className="kpi-lbl">Declined / Maintained</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="reassign-filter-toolbar">
        <div className="reassign-search-box">
          <Search size={16} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Search by Request ID, Task, Park, Assignee, Reason..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="reassign-filters-group">
          <div className="filter-select-wrap">
            <span className="filter-label">Role:</span>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="All">All Roles</option>
              <option value="contractor">Contractors Only</option>
              <option value="government_official">Govt Officials Only</option>
            </select>
          </div>

          <div className="filter-select-wrap">
            <span className="filter-label">Status:</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Escalated">Escalated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="reassign-table-card">
        {loading ? (
          <div className="reassign-loading">
            <RefreshCw size={24} className="spinning text-emerald" />
            <p>Loading reassignment requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="reassign-empty">
            <ShieldCheck size={40} color="#10b981" />
            <h4>No Reassignment Requests Found</h4>
            <p>All tasks are actively being executed without pending reassignment bottlenecks.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="reassign-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Task & Ticket</th>
                  <th>Park</th>
                  <th>Current Assignee</th>
                  <th>Role</th>
                  <th>Reason</th>
                  <th>Requested Date</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((reqItem) => {
                  const isContractor = ['contractor', 'Contractor'].includes(reqItem.requesterRole);
                  const reasonStyle = REASON_BADGE_COLORS[reqItem.reason] || REASON_BADGE_COLORS['Other'];
                  const reqDate = new Date(reqItem.createdAt).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  });
                  const deadlineStr = reqItem.deadline ? new Date(reqItem.deadline).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  }) : 'No Deadline';

                  return (
                    <tr key={reqItem._id} className={reqItem.status === 'Pending' ? 'row-pending' : ''}>
                      <td className="cell-id">
                        <strong>{reqItem.requestId}</strong>
                      </td>
                      <td>
                        <div className="task-cell-content">
                          <span className="task-name">{reqItem.taskTitle}</span>
                          <span className="ticket-no">#{reqItem.taskComplaintNumber}</span>
                        </div>
                      </td>
                      <td>
                        <span className="park-name">{reqItem.parkName}</span>
                      </td>
                      <td>
                        <span className="assignee-name">{reqItem.currentAssigneeName || reqItem.requesterName}</span>
                      </td>
                      <td>
                        <span className={`role-pill ${isContractor ? 'role-contractor' : 'role-official'}`}>
                          {isContractor ? <HardHat size={12} /> : <Users size={12} />}
                          {isContractor ? 'Contractor' : 'Govt Official'}
                        </span>
                      </td>
                      <td>
                        <span 
                          className="reason-badge"
                          style={{ backgroundColor: reasonStyle.bg, color: reasonStyle.text, borderColor: reasonStyle.border }}
                          title={reqItem.explanation || reqItem.reason}
                        >
                          {reqItem.reason}
                        </span>
                      </td>
                      <td className="cell-time">{reqDate}</td>
                      <td className="cell-deadline">
                        <div className="deadline-badge">
                          <Clock size={12} /> {deadlineStr}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill status-${reqItem.status.toLowerCase()}`}>
                          {reqItem.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons-group">
                          <button 
                            className="btn-tbl-view"
                            onClick={() => setViewingRequest(reqItem)}
                            title="View Request Details"
                          >
                            <Eye size={15} /> View
                          </button>

                          {reqItem.status === 'Pending' && (
                            <>
                              <button 
                                className="btn-tbl-approve"
                                onClick={() => handleOpenReassignModal(reqItem)}
                                title="Approve & Select New Assignee"
                              >
                                <CheckCircle2 size={15} /> Reassign
                              </button>
                              <button 
                                className="btn-tbl-reject"
                                onClick={() => {
                                  setRejectingRequestId(reqItem._id || reqItem.requestId);
                                  setRejectRemarks('');
                                  setRejectModalOpen(true);
                                }}
                                title="Decline Reassignment Request"
                              >
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW DETAILS MODAL */}
      {viewingRequest && (
        <div className="reassign-modal-overlay" onClick={() => setViewingRequest(null)}>
          <div className="reassign-modal-card view-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="reassign-modal-header">
              <div className="reassign-title-group">
                <div className="reassign-icon-circle">
                  <FileText size={22} color="#0f766e" />
                </div>
                <div>
                  <h3>Reassignment Request Dossier</h3>
                  <p>Request #{viewingRequest.requestId} — {viewingRequest.taskTitle}</p>
                </div>
              </div>
              <button className="reassign-close-btn" onClick={() => setViewingRequest(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="view-modal-body">
              <div className="view-grid">
                <div className="view-col">
                  <label>Task Ticket</label>
                  <p><strong>{viewingRequest.taskTitle}</strong> (#{viewingRequest.taskComplaintNumber})</p>
                </div>

                <div className="view-col">
                  <label>Park Premises</label>
                  <p>{viewingRequest.parkName}</p>
                </div>

                <div className="view-col">
                  <label>Current Assignee & Role</label>
                  <p>
                    {viewingRequest.currentAssigneeName} 
                    <span className="role-pill" style={{ marginLeft: '6px' }}>
                      {['contractor', 'Contractor'].includes(viewingRequest.requesterRole) ? 'Contractor' : 'Govt Official'}
                    </span>
                  </p>
                </div>

                <div className="view-col">
                  <label>Submission Date</label>
                  <p>{new Date(viewingRequest.createdAt).toLocaleString('en-IN')}</p>
                </div>

                <div className="view-col full-span">
                  <label>Primary Reason</label>
                  <p className="reason-text">{viewingRequest.reason}</p>
                </div>

                {viewingRequest.explanation && (
                  <div className="view-col full-span">
                    <label>Additional Explanation / Bottlenecks</label>
                    <div className="explanation-box">{viewingRequest.explanation}</div>
                  </div>
                )}

                {viewingRequest.attachmentUrl && (
                  <div className="view-col full-span">
                    <label>Evidence / Supporting Attachment</label>
                    <a href={viewingRequest.attachmentUrl} target="_blank" rel="noreferrer" className="attachment-link">
                      <ExternalLink size={14} /> Open Attachment Document
                    </a>
                  </div>
                )}

                {viewingRequest.newAssigneeName && (
                  <div className="view-col full-span reassigned-result-box">
                    <label>Reassigned Replacement</label>
                    <p>
                      Reassigned to <strong>{viewingRequest.newAssigneeName}</strong> on {viewingRequest.reassignedAt ? new Date(viewingRequest.reassignedAt).toLocaleDateString('en-IN') : 'N/A'}.
                    </p>
                    {viewingRequest.adminRemarks && (
                      <p className="admin-remarks-sub">Admin Notes: "{viewingRequest.adminRemarks}"</p>
                    )}
                  </div>
                )}
              </div>

              {/* Assignment Audit Timeline */}
              <AssignmentHistoryTimeline 
                history={viewingRequest.task?.assignmentHistory || []}
                currentAssignee={viewingRequest.currentAssigneeName}
                currentRole={viewingRequest.requesterRole}
              />
            </div>

            <div className="reassign-modal-footer">
              <button className="btn-reassign-cancel" onClick={() => setViewingRequest(null)}>
                Close
              </button>
              {viewingRequest.status === 'Pending' && (
                <button 
                  className="btn-reassign-submit"
                  onClick={() => {
                    const reqObj = viewingRequest;
                    setViewingRequest(null);
                    handleOpenReassignModal(reqObj);
                  }}
                >
                  <CheckCircle2 size={16} /> Approve & Reassign Task
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* APPROVE & REASSIGN CANDIDATE SELECTOR MODAL (ROLE-LOCKED) */}
      {reassignModalOpen && (
        <div className="reassign-modal-overlay" onClick={() => setReassignModalOpen(false)}>
          <div className="reassign-modal-card reassign-action-card" onClick={(e) => e.stopPropagation()}>
            <div className="reassign-modal-header">
              <div className="reassign-title-group">
                <div className="reassign-icon-circle" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
                  <RotateCcw size={22} color="#059669" />
                </div>
                <div>
                  <h3>Select Replacement {candidatesData?.targetRole || 'Assignee'}</h3>
                  <p>Strictly filtered for eligible <strong>{candidatesData?.targetRole || 'Candidates'}</strong> only</p>
                </div>
              </div>
              <button className="reassign-close-btn" onClick={() => setReassignModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div className="reassign-error-alert">
                <AlertTriangle size={18} />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReassignment} className="reassign-form">
              
              {/* Task Summary */}
              <div className="reassign-task-summary">
                <div className="summary-row">
                  <span className="summary-label">Task:</span>
                  <span className="summary-val">{targetTask?.taskTitle} (#{targetTask?.taskComplaintNumber})</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Current:</span>
                  <span className="summary-val">{targetTask?.currentAssigneeName} ({candidatesData?.targetRole})</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Reason:</span>
                  <span className="summary-val reason-highlight">{targetTask?.reason}</span>
                </div>
              </div>

              {/* Dynamic Candidate Selector (ROLE ISOLATED) */}
              <div className="reassign-form-group">
                <label className="reassign-form-label">
                  Select Replacement {candidatesData?.targetRole} <span className="req-star">*</span>
                </label>

                {candidatesLoading ? (
                  <div className="candidates-loading-box">
                    <RefreshCw size={20} className="spinning" />
                    <span>Analyzing eligible {candidatesData?.targetRole || 'candidates'} workload and zone match...</span>
                  </div>
                ) : !candidatesData || (candidatesData.candidates || []).filter(c => c.isAvailable).length === 0 ? (
                  <div className="no-candidates-alert">
                    <AlertTriangle size={24} color="#d97706" />
                    <div>
                      <strong>No suitable replacement {candidatesData?.targetRole || 'assignee'} available.</strong>
                      <p>All eligible personnel in this category are currently on leave or heavily loaded.</p>
                      <button 
                        type="button" 
                        className="btn-escalate-task"
                        onClick={() => handleEscalateTask(targetTask?.task?._id || targetTask?.task)}
                      >
                        <AlertOctagon size={15} /> Escalate Task for Administrative Action
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="candidates-list-scroll">
                    {(candidatesData.candidates || []).map((cand) => (
                      <label 
                        key={cand._id} 
                        className={`candidate-card-item ${selectedNewAssigneeId === cand._id ? 'selected' : ''} ${!cand.isAvailable ? 'disabled' : ''}`}
                      >
                        <input 
                          type="radio" 
                          name="newAssignee" 
                          value={cand._id} 
                          disabled={!cand.isAvailable}
                          checked={selectedNewAssigneeId === cand._id}
                          onChange={(e) => setSelectedNewAssigneeId(e.target.value)}
                        />
                        <div className="candidate-info">
                          <div className="cand-top-row">
                            <span className="cand-name">{cand.name}</span>
                            <span className={`cand-avail-badge ${cand.activeTasks > 5 ? 'heavy' : 'avail'}`}>
                              {cand.availability} ({cand.activeTasks} active)
                            </span>
                          </div>
                          <div className="cand-details-row">
                            <span><MapPin size={12} /> Zone: {cand.zone} | Ward: {cand.ward}</span>
                            {cand.isWardMatch && <span className="match-tag ward-match">🎯 Ward Match</span>}
                            {cand.isZoneMatch && !cand.isWardMatch && <span className="match-tag zone-match">Zone Match</span>}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Preserve or Adjust Deadline */}
              <div className="deadline-control-section">
                <div className="deadline-checkbox-row">
                  <input 
                    type="checkbox" 
                    id="chkModifyDeadline" 
                    checked={modifyDeadline}
                    onChange={(e) => setModifyDeadline(e.target.checked)}
                  />
                  <label htmlFor="chkModifyDeadline">
                    <strong>Adjust Target SLA Deadline</strong> (By default, original SLA deadline is strictly preserved)
                  </label>
                </div>

                {modifyDeadline && (
                  <div className="deadline-edit-box">
                    <div className="reassign-form-group">
                      <label className="reassign-form-label">New Target Deadline</label>
                      <input 
                        type="datetime-local" 
                        className="reassign-input"
                        value={newDeadlineDate}
                        onChange={(e) => setNewDeadlineDate(e.target.value)}
                        required={modifyDeadline}
                      />
                    </div>
                    <div className="reassign-form-group">
                      <label className="reassign-form-label">Reason for Deadline Change</label>
                      <input 
                        type="text" 
                        className="reassign-input"
                        placeholder="e.g. Extended due to material acquisition delay"
                        value={deadlineReason}
                        onChange={(e) => setDeadlineReason(e.target.value)}
                        required={modifyDeadline}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Remarks */}
              <div className="reassign-form-group">
                <label className="reassign-form-label">Administrative Notes & Transition Instructions</label>
                <textarea 
                  className="reassign-textarea"
                  placeholder="Optional instructions for the new assignee..."
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Footer Actions */}
              <div className="reassign-modal-footer">
                <button 
                  type="button" 
                  className="btn-reassign-cancel"
                  onClick={() => setReassignModalOpen(false)}
                  disabled={actionSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-reassign-submit"
                  disabled={actionSubmitting || !selectedNewAssigneeId}
                >
                  {actionSubmitting ? (
                    <>
                      <Loader2 size={16} className="spinning" /> Reassigning...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Confirm Reassignment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalOpen && (
        <div className="reassign-modal-overlay" onClick={() => setRejectModalOpen(false)}>
          <div className="reassign-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="reassign-modal-header">
              <div className="reassign-title-group">
                <div className="reassign-icon-circle" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
                  <XCircle size={22} color="#dc2626" />
                </div>
                <div>
                  <h3>Decline Reassignment Request</h3>
                  <p>Task will remain assigned to the original personnel</p>
                </div>
              </div>
              <button className="reassign-close-btn" onClick={() => setRejectModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="reassign-form" style={{ padding: '1.25rem' }}>
              <div className="reassign-form-group">
                <label className="reassign-form-label">
                  Reason for Declining Request <span className="req-star">*</span>
                </label>
                <textarea
                  className="reassign-textarea"
                  rows={3}
                  placeholder="Explain why this request is declined (e.g. Mandatory duty, alternative support provided, high priority ticket)..."
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  required
                />
              </div>

              <div className="reassign-modal-footer">
                <button 
                  type="button" 
                  className="btn-reassign-cancel"
                  onClick={() => setRejectModalOpen(false)}
                  disabled={actionSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn-tbl-reject"
                  style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: 'bold' }}
                  onClick={handleConfirmReject}
                  disabled={actionSubmitting}
                >
                  {actionSubmitting ? 'Declining...' : 'Decline Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
