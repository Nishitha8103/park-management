import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Users,
  Clock,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Loader2,
  X,
  User,
  Info,
  CalendarDays,
  HardHat,
  Building2,
  Eye,
  FileText,
  DollarSign,
  ArrowRight,
  UserCheck,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import './AdminLeaveManagement.css';

const STATUS_COLORS = {
  Pending:   { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
  Approved:  { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  Rejected:  { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
  Cancelled: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
};

const DEDUCTION_STATUS_COLORS = {
  'Not Applicable': { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
  'Pending':        { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  'Calculated':     { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' }
};

const ROLE_LABEL = {
  contractor: 'Contractor',
  Contractor: 'Contractor',
  government_official: 'Govt. Official',
  'Government Official': 'Govt. Official',
  official: 'Govt. Official',
};

export default function AdminLeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Active leave summary
  const [activeOnLeave, setActiveOnLeave] = useState([]);
  const [activeLoading, setActiveLoading] = useState(false);

  // View Details / Action Modal
  const [activeModal, setActiveModal] = useState(null); // { leave, mode: 'view' | 'approve' | 'reject' }
  const [adminRemarks, setAdminRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Replacement staff & task reassignment state inside modal
  const [replacementStaff, setReplacementStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [selectedReplacements, setSelectedReplacements] = useState({}); // { [taskId]: staffId }
  const [reassigningTaskId, setReassigningTaskId] = useState(null);
  const [reassignMsg, setReassignMsg] = useState({}); // { [taskId]: msg }

  const adminUser = (() => {
    try { return JSON.parse(localStorage.getItem('adminUser') || '{}'); } catch { return {}; }
  })();

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (roleFilter !== 'All') params.role = roleFilter;
      const res = await axios.get('/api/leaves', { params });
      setLeaves(res.data?.leaves || []);
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveOnLeave = async () => {
    setActiveLoading(true);
    try {
      const res = await axios.get('/api/leaves/active-on-leave');
      setActiveOnLeave(res.data?.activeLeaves || []);
    } catch (err) {
      console.error(err);
    } finally {
      setActiveLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchActiveOnLeave();
  }, [statusFilter, roleFilter]);

  // Open Modal (View Details or Direct Approve/Reject)
  const openModal = async (leave, mode = 'view') => {
    setActiveModal({ leave, mode });
    setAdminRemarks(leave.adminRemarks || '');
    setActionMsg('');
    setSelectedReplacements({});
    setReassignMsg({});

    // Fetch available replacement staff for task reassignment
    const isContractor = ['contractor', 'Contractor'].includes(leave.applicantRole);
    setLoadingStaff(true);
    try {
      const res = await axios.get('/api/leaves/replacement-staff', {
        params: {
          role: isContractor ? 'contractor' : 'official',
          currentApplicantId: leave.applicantId
        }
      });
      setReplacementStaff(res.data?.staff || []);
    } catch (err) {
      console.error('Error fetching replacement staff:', err);
      setReplacementStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setAdminRemarks('');
    setActionMsg('');
    setSelectedReplacements({});
    setReassignMsg({});
  };

  const handleAction = async (targetAction) => {
    if (!activeModal) return;
    setActionLoading(true);
    setActionMsg('');
    try {
      const endpoint = targetAction === 'approve' ? '/api/leaves/approve' : '/api/leaves/reject';
      const res = await axios.post(endpoint, {
        leaveId: activeModal.leave._id,
        adminRemarks: adminRemarks.trim() || undefined,
        reviewerName: adminUser.name || 'Administrator'
      });
      if (res.data?.success) {
        setActionMsg(res.data.message || 'Done!');
        setTimeout(() => {
          closeModal();
          fetchLeaves();
          fetchActiveOnLeave();
        }, 1200);
      }
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassignTask = async (taskId) => {
    const newAssigneeId = selectedReplacements[taskId];
    if (!newAssigneeId) {
      setReassignMsg({ ...reassignMsg, [taskId]: { error: 'Please select a replacement staff member.' } });
      return;
    }

    setReassigningTaskId(taskId);
    setReassignMsg({ ...reassignMsg, [taskId]: null });

    try {
      const res = await axios.post('/api/leaves/reassign-task', {
        complaintId: taskId,
        newAssigneeId,
        reviewerName: adminUser.name || 'Administrator'
      });

      if (res.data?.success) {
        setReassignMsg({
          ...reassignMsg,
          [taskId]: { success: res.data.message || 'Task reassigned successfully!' }
        });

        // Update local modal leave state so task count decreases or updates
        if (activeModal?.leave) {
          const updatedTasks = (activeModal.leave.activeTaskList || []).filter(t => t._id !== taskId);
          setActiveModal({
            ...activeModal,
            leave: {
              ...activeModal.leave,
              activeTaskList: updatedTasks,
              activeTaskCount: Math.max(0, activeModal.leave.activeTaskCount - 1)
            }
          });
        }
      }
    } catch (err) {
      setReassignMsg({
        ...reassignMsg,
        [taskId]: { error: err.response?.data?.message || 'Failed to reassign task.' }
      });
    } finally {
      setReassigningTaskId(null);
    }
  };

  const filtered = leaves.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.leaveId?.toLowerCase().includes(q) ||
      l.applicantName?.toLowerCase().includes(q) ||
      l.applicantEmail?.toLowerCase().includes(q) ||
      l.reason?.toLowerCase().includes(q)
    );
  });

  const pendingCount = leaves.filter(l => l.status === 'Pending').length;

  return (
    <div className="admin-leave-page">
      {/* Page Header */}
      <div className="admin-leave-header">
        <div className="admin-leave-header-left">
          <CalendarDays size={28} color="#6366f1" />
          <div>
            <h1>Leave Management</h1>
            <p>Review leave balances, salary deductions, active task loads, and reassign tasks</p>
          </div>
        </div>
        <button className="btn-refresh" onClick={() => { fetchLeaves(); fetchActiveOnLeave(); }}>
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="admin-leave-summary-row">
        <div className="summary-card summary-pending">
          <div className="summary-icon"><Clock size={24} /></div>
          <div>
            <p className="summary-value" style={{ color: '#ffffff', fontSize: '2.1rem', fontWeight: 800, margin: 0 }}>{pendingCount}</p>
            <p className="summary-label" style={{ color: '#fef3c7', fontWeight: 700, margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending Review</p>
          </div>
        </div>
        <div className="summary-card summary-active">
          <div className="summary-icon"><Users size={24} /></div>
          <div>
            <p className="summary-value" style={{ color: '#ffffff', fontSize: '2.1rem', fontWeight: 800, margin: 0 }}>{activeOnLeave.length}</p>
            <p className="summary-label" style={{ color: '#e0e7ff', fontWeight: 700, margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Currently On Leave</p>
          </div>
        </div>
        <div className="summary-card summary-contractor">
          <div className="summary-icon"><HardHat size={24} /></div>
          <div>
            <p className="summary-value" style={{ color: '#ffffff', fontSize: '2.1rem', fontWeight: 800, margin: 0 }}>{leaves.filter(l => ['contractor', 'Contractor'].includes(l.applicantRole)).length}</p>
            <p className="summary-label" style={{ color: '#dcfce7', fontWeight: 700, margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contractor Leaves</p>
          </div>
        </div>
        <div className="summary-card summary-official">
          <div className="summary-icon"><Building2 size={24} /></div>
          <div>
            <p className="summary-value" style={{ color: '#ffffff', fontSize: '2.1rem', fontWeight: 800, margin: 0 }}>{leaves.filter(l => !['contractor', 'Contractor'].includes(l.applicantRole)).length}</p>
            <p className="summary-label" style={{ color: '#f3e8ff', fontWeight: 700, margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Official Leaves</p>
          </div>
        </div>
      </div>

      {/* Currently On Leave Banner */}
      {activeOnLeave.length > 0 && (
        <div className="admin-leave-active-banner">
          <div className="active-banner-title">
            <AlertTriangle size={18} color="#f59e0b" />
            <strong>Staff Currently On Leave ({activeOnLeave.length})</strong>
          </div>
          <div className="active-leave-pills">
            {activeOnLeave.map(al => (
              <span key={al._id} className="active-leave-pill">
                {['contractor', 'Contractor'].includes(al.applicantRole) ? <HardHat size={13} /> : <Building2 size={13} />}
                {al.applicantName}
                <span className="pill-dates">
                  until {new Date(al.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="admin-leave-filters">
        <div className="filter-search">
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by name, email, leave ID, reason..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          <div className="filter-group">
            <Filter size={15} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="filter-group">
            <Users size={15} />
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="All">All Roles</option>
              <option value="contractor">Contractors Only</option>
              <option value="official">Officials Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admin Table */}
      <div className="admin-leave-table-card">
        {loading ? (
          <div className="leave-loading-state">
            <Loader2 className="spin-icon" size={28} />
            <span>Loading leave records & balance metrics...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="leave-empty-state">
            <Calendar size={40} color="#cbd5e1" />
            <p>No leave requests found matching your filters.</p>
          </div>
        ) : (
          <div className="admin-leave-table-wrapper">
            <table className="admin-leave-table">
              <thead>
                <tr>
                  <th>Leave ID</th>
                  <th>Applicant</th>
                  <th>Role</th>
                  <th>Leave Type & Dates</th>
                  <th>Leave Balance (Used / 12)</th>
                  <th>Remaining Leave</th>
                  <th>Salary Deduction</th>
                  <th>Active Tasks</th>
                  <th>Pending Tasks</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(leave => {
                  const sDate = new Date(leave.startDate);
                  const eDate = new Date(leave.endDate);
                  const colors = STATUS_COLORS[leave.status] || STATUS_COLORS.Pending;
                  const dedColors = DEDUCTION_STATUS_COLORS[leave.salaryDeductionStatus] || DEDUCTION_STATUS_COLORS['Not Applicable'];
                  const isContractor = ['contractor', 'Contractor'].includes(leave.applicantRole);

                  const reqDays = leave.requestedDays || 1;
                  const usedDays = leave.approvedLeaveUsed || 0;
                  const remainingDays = leave.remainingLeave ?? Math.max(0, 12 - usedDays);
                  const unpaidDays = leave.unpaidLeaveDays || 0;
                  const deductionAmt = leave.salaryDeductionAmount || 0;

                  return (
                    <tr key={leave._id} className={leave.status === 'Pending' ? 'row-pending' : ''}>
                      <td className="cell-leave-id">{leave.leaveId}</td>
                      <td className="cell-applicant">
                        <div className="applicant-info">
                          <div className="applicant-avatar">
                            {isContractor ? <HardHat size={15} /> : <Building2 size={15} />}
                          </div>
                          <div>
                            <p className="applicant-name">{leave.applicantName}</p>
                            <p className="applicant-email">{leave.applicantEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-tag ${isContractor ? 'role-contractor' : 'role-official'}`}>
                          {ROLE_LABEL[leave.applicantRole] || leave.applicantRole}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span className="leave-type-tag">{leave.leaveType || 'Casual Leave'}</span>
                          <span className="cell-dates">
                            {sDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} → {eDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            <span className="duration-pill">{reqDays}d</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="balance-used-box">
                          <strong>{usedDays} / 12</strong> days used
                        </div>
                      </td>
                      <td>
                        <span className={`rem-leave-pill ${remainingDays > 0 ? 'rem-ok' : 'rem-zero'}`}>
                          {remainingDays} days left
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 700, color: unpaidDays > 0 ? '#dc2626' : '#10b981', fontSize: '0.88rem' }}>
                            ₹{deductionAmt.toLocaleString('en-IN')}
                          </span>
                          <span
                            className="deduction-status-pill"
                            style={{ backgroundColor: dedColors.bg, color: dedColors.text, border: `1px solid ${dedColors.border}` }}
                          >
                            {leave.salaryDeductionStatus || 'Not Applicable'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {leave.totalActiveTasks > 0 ? (
                          <span className="task-count-badge task-count-warn">
                            <AlertTriangle size={12} /> {leave.totalActiveTasks} Active
                          </span>
                        ) : (
                          <span className="task-count-badge task-count-ok">
                            <CheckCircle2 size={12} /> None
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: leave.pendingTasksCount > 0 ? '#f59e0b' : '#64748b' }}>
                            {leave.pendingTasksCount || 0} Pending
                          </span>
                          {leave.tasksDueDuringLeaveCount > 0 && (
                            <span className="task-due-warning" title="Tasks with deadline during requested leave">
                              ⚠️ {leave.tasksDueDuringLeaveCount} Due in Leave
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className="leave-status-badge"
                          style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                        >
                          {leave.status}
                        </span>
                      </td>
                      <td className="cell-actions">
                        <div className="action-btns">
                          <button
                            className="btn-action btn-view"
                            onClick={() => openModal(leave, 'view')}
                            title="View Full Details & Task Reassignment"
                          >
                            <Eye size={14} /> Details
                          </button>
                          {leave.status === 'Pending' && (
                            <>
                              <button
                                className="btn-action btn-approve"
                                onClick={() => openModal(leave, 'approve')}
                                title="Approve Leave"
                              >
                                <CheckCircle2 size={14} /> Approve
                              </button>
                              <button
                                className="btn-action btn-reject"
                                onClick={() => openModal(leave, 'reject')}
                                title="Reject Leave"
                              >
                                <XCircle size={14} /> Reject
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

      {/* Detailed Leave & Reassignment Modal */}
      {activeModal && (
        <div className="admin-leave-modal-overlay" onClick={closeModal}>
          <div className="admin-leave-modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CalendarDays size={24} color="#6366f1" />
                <div>
                  <h3>Leave Request Details & Task Review</h3>
                  <p className="modal-subhead">Leave ID: <strong>{activeModal.leave.leaveId}</strong></p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>

            <div className="modal-body">
              {/* Applicant Profile Summary */}
              <div className="modal-applicant-card">
                <div className="applicant-avatar lg-avatar">
                  {['contractor', 'Contractor'].includes(activeModal.leave.applicantRole) ? <HardHat size={22} /> : <Building2 size={22} />}
                </div>
                <div className="applicant-details">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 className="applicant-title">{activeModal.leave.applicantName}</h4>
                    <span className={`role-tag ${['contractor', 'Contractor'].includes(activeModal.leave.applicantRole) ? 'role-contractor' : 'role-official'}`}>
                      {ROLE_LABEL[activeModal.leave.applicantRole] || activeModal.leave.applicantRole}
                    </span>
                  </div>
                  <p className="applicant-subtext">
                    Email: {activeModal.leave.applicantEmail || 'N/A'} | Phone: {activeModal.leave.applicantPhone || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Leave Application Overview */}
              <div className="modal-section-box">
                <h4 className="section-title"><FileText size={16} /> Leave Application Info</h4>
                <div className="modal-grid-2">
                  <div className="info-item">
                    <span className="info-label">Leave Type:</span>
                    <span className="info-val highlight-purple">{activeModal.leave.leaveType || 'Casual Leave'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Duration:</span>
                    <span className="info-val">{activeModal.leave.duration || 'Full Day'} ({activeModal.leave.requestedDays || 1} day(s))</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Leave Dates:</span>
                    <span className="info-val">
                      {new Date(activeModal.leave.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' → '}
                      {new Date(activeModal.leave.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Supporting Doc:</span>
                    {activeModal.leave.supportingDocument ? (
                      <a href={activeModal.leave.supportingDocument} target="_blank" rel="noopener noreferrer" className="doc-link">
                        📎 {activeModal.leave.supportingDocumentOriginalName || 'View Document'}
                      </a>
                    ) : (
                      <span className="info-val text-muted">None attached</span>
                    )}
                  </div>
                  <div className="info-item full-width">
                    <span className="info-label">Reason for Leave:</span>
                    <span className="info-val">{activeModal.leave.reason}</span>
                  </div>
                  {activeModal.leave.handoverNotes && (
                    <div className="info-item full-width">
                      <span className="info-label">Handover Notes:</span>
                      <span className="info-val text-teal">{activeModal.leave.handoverNotes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Leave Balance Section */}
              <div className="modal-section-box balance-box">
                <h4 className="section-title"><DollarSign size={16} /> Leave Balance & Salary Deduction Summary</h4>
                <div className="balance-grid">
                  <div className="balance-metric">
                    <span className="b-label">Annual Allowance</span>
                    <span className="b-val">12 Days</span>
                  </div>
                  <div className="balance-metric">
                    <span className="b-label">Approved Leave Used</span>
                    <span className="b-val">{activeModal.leave.approvedLeaveUsed || 0} Days</span>
                  </div>
                  <div className="balance-metric">
                    <span className="b-label">Remaining Paid Leave</span>
                    <span className="b-val text-green">{activeModal.leave.remainingLeave ?? 12} Days</span>
                  </div>
                  <div className="balance-metric">
                    <span className="b-label">Current Requested</span>
                    <span className="b-val text-indigo">{activeModal.leave.requestedDays || 1} Days</span>
                  </div>
                  <div className="balance-metric">
                    <span className="b-label">Balance After Approval</span>
                    <span className="b-val">{activeModal.leave.balanceAfterApproval || 0} Days</span>
                  </div>
                  <div className="balance-metric">
                    <span className="b-label">Additional Unpaid Leave</span>
                    <span className="b-val text-red">{activeModal.leave.unpaidLeaveDays || 0} Days</span>
                  </div>
                  <div className="balance-metric">
                    <span className="b-label">Salary Deduction</span>
                    <span className="b-val text-red">₹{(activeModal.leave.salaryDeductionAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="balance-metric">
                    <span className="b-label">Deduction Status</span>
                    <span className="b-val deduction-tag">{activeModal.leave.salaryDeductionStatus || 'Not Applicable'}</span>
                  </div>
                </div>

                {/* Warning Alert if request exceeds paid allowance */}
                {(activeModal.leave.unpaidLeaveDays || 0) > 0 && (
                  <div className="unpaid-warning-alert">
                    <AlertTriangle size={18} color="#dc2626" />
                    <div>
                      <strong>Salary Deduction Warning:</strong>
                      <p>
                        This leave request exceeds the applicant's annual paid allowance by <strong>{activeModal.leave.unpaidLeaveDays} day(s)</strong>.
                        Approving this request will calculate an unpaid leave salary deduction of <strong>₹{(activeModal.leave.salaryDeductionAmount || 0).toLocaleString('en-IN')}</strong> (at ₹1,000 / day).
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pending Tasks & Reassignment Section */}
              <div className="modal-section-box task-box">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h4 className="section-title"><ClipboardList size={16} /> Active & Pending Tasks Overview</h4>
                  <div className="task-summary-badges">
                    <span className="ts-badge">Total Active: {activeModal.leave.totalActiveTasks || 0}</span>
                    <span className="ts-badge ts-pending">Pending: {activeModal.leave.pendingTasksCount || 0}</span>
                    <span className="ts-badge ts-due">Due in Leave: {activeModal.leave.tasksDueDuringLeaveCount || 0}</span>
                  </div>
                </div>

                {activeModal.leave.activeTaskList && activeModal.leave.activeTaskList.length > 0 ? (
                  <div className="task-reassign-list">
                    <p className="reassign-instruction">
                      Review active tasks assigned to this employee. You can reassign eligible tasks to another available {['contractor', 'Contractor'].includes(activeModal.leave.applicantRole) ? 'Contractor' : 'Government Official'}.
                    </p>
                    {activeModal.leave.activeTaskList.map(task => {
                      const isDueInLeave = task.slaDeadline && new Date(task.slaDeadline) >= new Date(activeModal.leave.startDate) && new Date(task.slaDeadline) <= new Date(activeModal.leave.endDate);

                      return (
                        <div key={task._id} className={`task-item-card ${isDueInLeave ? 'task-due-highlight' : ''}`}>
                          <div className="task-item-header">
                            <div>
                              <span className="task-id-badge">#{task.complaintNumber}</span>
                              <span className="task-category">{task.category}</span>
                              {task.parkName && <span className="task-park">📍 {task.parkName}</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              {isDueInLeave && <span className="badge-due-leave">⚠️ Due During Leave</span>}
                              <span className="task-status">{task.status}</span>
                            </div>
                          </div>
                          <p className="task-desc">{task.description}</p>
                          {task.slaDeadline && (
                            <p className="task-deadline">
                              Deadline: {new Date(task.slaDeadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}

                          {/* Reassignment Controls */}
                          <div className="reassign-controls-row">
                            <span className="reassign-label"><UserCheck size={14} /> Reassign to:</span>
                            <select
                              value={selectedReplacements[task._id] || ''}
                              onChange={e => setSelectedReplacements({ ...selectedReplacements, [task._id]: e.target.value })}
                              disabled={reassigningTaskId === task._id || loadingStaff}
                              className="reassign-select"
                            >
                              <option value="">Select available {['contractor', 'Contractor'].includes(activeModal.leave.applicantRole) ? 'Contractor' : 'Government Official'}...</option>
                              {replacementStaff.map(staff => (
                                <option key={staff._id} value={staff._id}>
                                  {staff.name} {staff.companyName ? `(${staff.companyName})` : ''} {staff.department ? `[${staff.department}]` : ''}
                                </option>
                              ))}
                            </select>

                            <button
                              className="btn-reassign-submit"
                              onClick={() => handleReassignTask(task._id)}
                              disabled={reassigningTaskId === task._id || !selectedReplacements[task._id]}
                            >
                              {reassigningTaskId === task._id ? <Loader2 className="spin-icon" size={14} /> : <ArrowRight size={14} />}
                              Reassign
                            </button>
                          </div>

                          {reassignMsg[task._id] && (
                            <div className={`reassign-feedback ${reassignMsg[task._id].error ? 'feedback-error' : 'feedback-success'}`}>
                              {reassignMsg[task._id].error || reassignMsg[task._id].success}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="tasks-empty-notice">
                    <CheckCircle2 size={20} color="#10b981" />
                    <span>This applicant has no active or pending tasks requiring reassignment.</span>
                  </div>
                )}
              </div>

              {/* Admin Remarks & Decision Actions */}
              <div className="modal-remarks-field">
                <label>Admin Remarks {activeModal.mode === 'reject' ? '*' : '(Optional)'}</label>
                <textarea
                  rows={3}
                  placeholder={activeModal.mode === 'approve' ? 'e.g. Approved. Leave balance updated and handover confirmed.' : 'e.g. Rejected due to pending high priority park maintenance tasks.'}
                  value={adminRemarks}
                  onChange={e => setAdminRemarks(e.target.value)}
                />
              </div>

              {actionMsg && (
                <div className={`modal-action-msg ${actionMsg.includes('fail') || actionMsg.includes('error') ? 'msg-error' : 'msg-success'}`}>
                  {actionMsg}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={closeModal} disabled={actionLoading}>
                Close
              </button>
              {activeModal.leave.status === 'Pending' && (
                <>
                  <button
                    className="btn-modal-submit btn-reject-submit"
                    onClick={() => handleAction('reject')}
                    disabled={actionLoading || (activeModal.mode === 'reject' && !adminRemarks.trim())}
                  >
                    {actionLoading ? <Loader2 className="spin-icon" size={16} /> : <XCircle size={16} />} Reject Leave
                  </button>
                  <button
                    className="btn-modal-submit btn-approve-submit"
                    onClick={() => handleAction('approve')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 className="spin-icon" size={16} /> : <CheckCircle2 size={16} />} Approve Leave
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
