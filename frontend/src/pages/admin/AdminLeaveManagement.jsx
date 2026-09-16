import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Users,
  Briefcase,
  Clock,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Loader2,
  X,
  Send,
  User,
  Info,
  CalendarDays,
  HardHat,
  Building2,
  ClipboardList
} from 'lucide-react';
import axios from 'axios';
import './AdminLeaveManagement.css';

const STATUS_COLORS = {
  Pending:   { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
  Approved:  { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
  Rejected:  { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca' },
  Cancelled: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
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

  // Action modal
  const [actionModal, setActionModal] = useState(null); // { leave, action: 'approve'|'reject' }
  const [adminRemarks, setAdminRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

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

  const openActionModal = (leave, action) => {
    setActionModal({ leave, action });
    setAdminRemarks('');
    setActionMsg('');
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    setActionMsg('');
    try {
      const endpoint = actionModal.action === 'approve' ? '/api/leaves/approve' : '/api/leaves/reject';
      const res = await axios.post(endpoint, {
        leaveId: actionModal.leave._id,
        adminRemarks: adminRemarks.trim() || undefined,
        reviewerName: adminUser.name || 'Administrator'
      });
      if (res.data?.success) {
        setActionMsg(res.data.message || 'Done!');
        setTimeout(() => {
          setActionModal(null);
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
          <CalendarDays size={28} color="#4f46e5" />
          <div>
            <h1>Leave Management</h1>
            <p>Review and manage leave requests from Contractors and Government Officials</p>
          </div>
        </div>
        <button className="btn-refresh" onClick={() => { fetchLeaves(); fetchActiveOnLeave(); }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="admin-leave-summary-row">
        <div className="summary-card summary-pending">
          <div className="summary-icon"><Clock size={24} /></div>
          <div>
            <p className="summary-value">{pendingCount}</p>
            <p className="summary-label">Pending Review</p>
          </div>
        </div>
        <div className="summary-card summary-active">
          <div className="summary-icon"><Users size={24} /></div>
          <div>
            <p className="summary-value">{activeOnLeave.length}</p>
            <p className="summary-label">Currently On Leave</p>
          </div>
        </div>
        <div className="summary-card summary-contractor">
          <div className="summary-icon"><HardHat size={24} /></div>
          <div>
            <p className="summary-value">{leaves.filter(l => ['contractor', 'Contractor'].includes(l.applicantRole)).length}</p>
            <p className="summary-label">Contractor Leaves</p>
          </div>
        </div>
        <div className="summary-card summary-official">
          <div className="summary-icon"><Building2 size={24} /></div>
          <div>
            <p className="summary-value">{leaves.filter(l => !['contractor', 'Contractor'].includes(l.applicantRole)).length}</p>
            <p className="summary-label">Official Leaves</p>
          </div>
        </div>
      </div>

      {/* Currently On Leave Banner */}
      {activeOnLeave.length > 0 && (
        <div className="admin-leave-active-banner">
          <div className="active-banner-title">
            <AlertTriangle size={18} color="#b45309" />
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

      {/* Table */}
      <div className="admin-leave-table-card">
        {loading ? (
          <div className="leave-loading-state">
            <Loader2 className="spin-icon" size={28} />
            <span>Loading leave requests...</span>
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
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Duration</th>
                  <th>Reason</th>
                  <th>Document</th>
                  <th>Active Tasks</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(leave => {
                  const sDate = new Date(leave.startDate);
                  const eDate = new Date(leave.endDate);
                  const diffDays = Math.ceil(Math.abs(eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;
                  const colors = STATUS_COLORS[leave.status] || STATUS_COLORS.Pending;
                  const isContractor = ['contractor', 'Contractor'].includes(leave.applicantRole);

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
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3730a3', background: '#e0e7ff', padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                          {leave.leaveType || 'Casual Leave'}
                        </span>
                      </td>
                      <td className="cell-dates">
                        <div>{sDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                        <div className="date-arrow">→</div>
                        <div>{eDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span className="duration-badge">{diffDays}d</span>
                          {leave.duration && leave.duration !== 'Full Day' && (
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{leave.duration}</span>
                          )}
                        </div>
                      </td>
                      <td className="cell-reason" title={leave.reason}>
                        <div style={{ maxWidth: '180px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {leave.reason}
                        </div>
                      </td>
                      <td>
                        {leave.supportingDocument ? (
                          <a 
                            href={leave.supportingDocument} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#4f46e5', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Open Attached Document"
                          >
                            📎 Doc
                          </a>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td className="cell-tasks">
                        {leave.activeTaskCount > 0 ? (
                          <span className="task-count-badge task-count-warn">
                            <AlertTriangle size={13} /> {leave.activeTaskCount} active
                          </span>
                        ) : (
                          <span className="task-count-badge task-count-ok">
                            <CheckCircle2 size={13} /> None
                          </span>
                        )}
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
                        {leave.status === 'Pending' ? (
                          <div className="action-btns">
                            <button
                              className="btn-action btn-approve"
                              onClick={() => openActionModal(leave, 'approve')}
                              title="Approve Leave"
                            >
                              <CheckCircle2 size={15} /> Approve
                            </button>
                            <button
                              className="btn-action btn-reject"
                              onClick={() => openActionModal(leave, 'reject')}
                              title="Reject Leave"
                            >
                              <XCircle size={15} /> Reject
                            </button>
                          </div>
                        ) : (
                          <div>
                            {leave.adminRemarks && (
                              <span className="admin-remark-text" title={leave.adminRemarks}>
                                {leave.adminRemarks.length > 30 ? leave.adminRemarks.slice(0, 30) + '...' : leave.adminRemarks}
                              </span>
                            )}
                            {!leave.adminRemarks && <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>—</span>}
                          </div>
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

      {/* Action Modal */}
      {actionModal && (
        <div className="admin-leave-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="admin-leave-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {actionModal.action === 'approve'
                  ? <CheckCircle2 size={22} color="#16a34a" />
                  : <XCircle size={22} color="#dc2626" />}
                <h3>{actionModal.action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActionModal(null)}><X size={20} /></button>
            </div>

            <div className="modal-body">
              {/* Leave Summary */}
              <div className="modal-leave-summary">
                <div className="summary-row">
                  <span className="sum-label">Applicant:</span>
                  <span className="sum-val">{actionModal.leave.applicantName} ({ROLE_LABEL[actionModal.leave.applicantRole] || actionModal.leave.applicantRole})</span>
                </div>
                <div className="summary-row">
                  <span className="sum-label">Leave Type:</span>
                  <span className="sum-val" style={{ fontWeight: 700, color: '#4f46e5' }}>{actionModal.leave.leaveType || 'Casual Leave'}</span>
                </div>
                <div className="summary-row">
                  <span className="sum-label">Duration:</span>
                  <span className="sum-val">{actionModal.leave.duration || 'Full Day'}</span>
                </div>
                <div className="summary-row">
                  <span className="sum-label">Leave Period:</span>
                  <span className="sum-val">
                    {new Date(actionModal.leave.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {' → '}
                    {new Date(actionModal.leave.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="sum-label">Reason:</span>
                  <span className="sum-val">{actionModal.leave.reason}</span>
                </div>
                {actionModal.leave.handoverNotes && (
                  <div className="summary-row">
                    <span className="sum-label">Handover Notes:</span>
                    <span className="sum-val" style={{ color: '#0f766e', fontWeight: 600 }}>{actionModal.leave.handoverNotes}</span>
                  </div>
                )}
                {actionModal.leave.supportingDocument && (
                  <div className="summary-row">
                    <span className="sum-label">Attachment:</span>
                    <a 
                      href={actionModal.leave.supportingDocument} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="sum-val"
                      style={{ color: '#4f46e5', textDecoration: 'underline', fontWeight: 600 }}
                    >
                      📎 {actionModal.leave.supportingDocumentOriginalName || 'View Document'}
                    </a>
                  </div>
                )}
                {actionModal.leave.activeTaskCount > 0 && (
                  <div className="modal-task-warning">
                    <AlertTriangle size={16} color="#b45309" />
                    <span>This staff member has <strong>{actionModal.leave.activeTaskCount}</strong> active task(s). If approved, you may need to reassign them.</span>
                  </div>
                )}
              </div>

              {actionModal.action === 'approve' && (
                <div className="modal-approve-info">
                  <Info size={16} color="#0369a1" />
                  <span>Approving will mark this staff member as <strong>'On Leave'</strong> and prevent new task assignments during the leave period.</span>
                </div>
              )}

              <div className="modal-remarks-field">
                <label>Admin Remarks {actionModal.action === 'reject' ? '*' : '(Optional)'}</label>
                <textarea
                  rows={3}
                  placeholder={actionModal.action === 'approve' ? 'e.g. Approved. Please ensure handover.' : 'e.g. Declined due to operational requirements...'}
                  value={adminRemarks}
                  onChange={e => setAdminRemarks(e.target.value)}
                  required={actionModal.action === 'reject'}
                />
              </div>

              {actionMsg && (
                <div className={`modal-action-msg ${actionMsg.includes('fail') || actionMsg.includes('error') ? 'msg-error' : 'msg-success'}`}>
                  {actionMsg}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={() => setActionModal(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button
                className={`btn-modal-submit ${actionModal.action === 'approve' ? 'btn-approve-submit' : 'btn-reject-submit'}`}
                onClick={handleAction}
                disabled={actionLoading || (actionModal.action === 'reject' && !adminRemarks.trim())}
              >
                {actionLoading ? (
                  <><Loader2 className="spin-icon" size={16} /> Processing...</>
                ) : actionModal.action === 'approve' ? (
                  <><CheckCircle2 size={16} /> Confirm Approval</>
                ) : (
                  <><XCircle size={16} /> Confirm Rejection</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
