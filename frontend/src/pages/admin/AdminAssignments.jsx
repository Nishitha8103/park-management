import { useState, useEffect } from 'react';
import { Search, Eye, X, RefreshCw, ClipboardList, CheckCircle, Clock, AlertCircle, UserCheck } from 'lucide-react';
import axios from 'axios';

const ITEMS_PER_PAGE = 8;

const statusColor = (status) => {
  switch (status) {
    case 'Assigned':           return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
    case 'In Progress':        return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    case 'Completed':          return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
    case 'Verified':           return { bg: '#f0fdf4', color: '#166534', border: '#86efac' };
    case 'Closed':             return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    case 'Inspection Pending': return { bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' };
    case 'Rejected':
    case 'Rejected by Contractor': return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
    case 'New':                return { bg: '#fefce8', color: '#a16207', border: '#fde68a' };
    case 'Started':            return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
    default:                   return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
  }
};

const PaginationBtn = ({ label, onClick, active, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      minWidth: '32px', height: '32px', borderRadius: '6px',
      border: `1px solid ${active ? '#0f2d52' : '#e2e8f0'}`,
      background: active ? '#0f2d52' : disabled ? '#f8fafc' : '#fff',
      color: active ? '#fff' : disabled ? '#cbd5e1' : '#475569',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: active ? 700 : 500, fontSize: '0.85rem',
      padding: '0 6px', transition: 'all 0.15s'
    }}
  >
    {label}
  </button>
);

const AdminAssignments = () => {
  const [complaints, setComplaints]     = useState([]);
  const [contractors, setContractors]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [selectedTask, setSelectedTask] = useState(null);
  const [reassignId, setReassignId]     = useState('');
  const [saving, setSaving]             = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [complaintsRes, contractorsRes] = await Promise.all([
        axios.get('/api/complaints'),
        axios.get('/api/contractors', { headers }).catch(() => ({ data: [] })),
      ]);

      setComplaints(complaintsRes.data || []);
      setContractors(contractorsRes.data || []);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Only show tasks that have been assigned (past "New")
  const assignedComplaints = complaints.filter(c => c.status !== 'New');

  const filtered = assignedComplaints.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (c.complaintNumber || '').toLowerCase().includes(q) ||
      (c.parkName || c.park?.name || '').toLowerCase().includes(q) ||
      (c.category || '').toLowerCase().includes(q) ||
      (c.assignedContractor?.name || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  const openDetail = (task) => {
    setSelectedTask(task);
    setReassignId(task.assignedContractor?._id || task.assignedContractor || '');
  };

  const handleReassign = async () => {
    if (!reassignId) return alert('Please select a contractor');
    try {
      setSaving(true);
      await axios.put(`/api/complaints/${selectedTask._id}`, {
        assignedContractor: reassignId,
        status: 'Assigned'
      });
      alert('Task reassigned successfully!');
      setSelectedTask(null);
      fetchData();
    } catch (err) {
      console.error('Reassign error:', err);
      alert('Failed to reassign. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Summary counts
  const totalAssigned = assignedComplaints.filter(c => c.status === 'Assigned').length;
  const inProgress    = assignedComplaints.filter(c => ['In Progress', 'Started', 'Waiting for Parts'].includes(c.status)).length;
  const completed     = assignedComplaints.filter(c => c.status === 'Completed').length;
  const verified      = assignedComplaints.filter(c => ['Verified', 'Closed'].includes(c.status)).length;

  return (
    <div className="admin-panel" style={{ padding: '1.25rem' }}>

      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <ClipboardList size={22} color="#0f2d52" />
          <h2 style={{ margin: 0, color: '#0f2d52', fontWeight: 700, fontSize: '1.4rem' }}>Task Assignments</h2>
        </div>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
          All complaint tasks assigned to contractors — track progress and manage reassignments
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Assigned',       value: totalAssigned, icon: <UserCheck size={20} />,    bg: '#fff7ed', color: '#c2410c', border: '#fb923c' },
          { label: 'In Progress',    value: inProgress,    icon: <Clock size={20} />,         bg: '#eff6ff', color: '#1d4ed8', border: '#3b82f6' },
          { label: 'Completed',      value: completed,     icon: <CheckCircle size={20} />,   bg: '#f0fdf4', color: '#15803d', border: '#22c55e' },
          { label: 'Verified/Closed',value: verified,      icon: <AlertCircle size={20} />,   bg: '#faf5ff', color: '#7c3aed', border: '#a855f7' },
        ].map(card => (
          <div key={card.label} style={{
            background: card.bg, borderLeft: `4px solid ${card.border}`,
            borderRadius: '10px', padding: '1rem 1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: card.color, marginBottom: '4px' }}>
              {card.icon}
              <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{card.label}</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div style={{
        background: '#fff', padding: '0.875rem 1rem', borderRadius: '10px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: '0.75rem',
        marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center'
      }}>
        <div style={{
          flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center',
          background: '#f8fafc', padding: '0.5rem 0.875rem', borderRadius: '8px',
          border: '1px solid #e2e8f0', gap: '8px'
        }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by complaint ID, park, category or contractor..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '0.875rem', color: '#334155' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          style={{
            padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0',
            background: '#fff', fontSize: '0.875rem', color: '#334155', cursor: 'pointer'
          }}
        >
          <option value="">All Status</option>
          <option value="Assigned">Assigned</option>
          <option value="Started">Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Waiting for Parts">Waiting for Parts</option>
          <option value="Completed">Completed</option>
          <option value="Inspection Pending">Inspection Pending</option>
          <option value="Verified">Verified</option>
          <option value="Rejected">Rejected</option>
          <option value="Rejected by Contractor">Rejected by Contractor</option>
          <option value="Closed">Closed</option>
        </select>

        <button
          onClick={fetchData}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '0.5rem 0.875rem', borderRadius: '8px',
            background: '#0f2d52', color: '#fff', border: 'none',
            cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600
          }}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⏳</div>
            Loading assignments...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            <ClipboardList size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No task assignments found</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
              {searchTerm || statusFilter
                ? 'Try adjusting your search or filter.'
                : 'Assign complaints to contractors from the Complaints page.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['ID', 'Park Name', 'Contractor', 'Complaint Type', 'Assigned Date', 'Status', 'Action'].map(h => (
                    <th key={h} style={{
                      padding: '12px 14px', textAlign: 'left', fontWeight: 700,
                      color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase',
                      letterSpacing: '0.05em', whiteSpace: 'nowrap'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((c, idx) => {
                  const sc = statusColor(c.status);
                  const contractorName = c.assignedContractor?.name || '—';
                  const assignedDate   = c.updatedAt || c.createdAt;

                  return (
                    <tr
                      key={c._id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#fff' : '#fafbfc',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafbfc'}
                    >
                      <td style={{ padding: '13px 14px', fontWeight: 700, color: '#2563eb', whiteSpace: 'nowrap' }}>
                        {c.complaintNumber || '—'}
                      </td>
                      <td style={{ padding: '13px 14px', fontWeight: 600, color: '#0f172a', maxWidth: '180px' }}>
                        {c.parkName || c.park?.name || '—'}
                      </td>
                      <td style={{ padding: '13px 14px', color: contractorName === '—' ? '#94a3b8' : '#334155', fontStyle: contractorName === '—' ? 'italic' : 'normal' }}>
                        {contractorName}
                      </td>
                      <td style={{ padding: '13px 14px', color: '#475569' }}>
                        {c.category || '—'}
                      </td>
                      <td style={{ padding: '13px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDate(assignedDate)}
                      </td>
                      <td style={{ padding: '13px 14px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: '20px', fontSize: '0.76rem', fontWeight: 700,
                          background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                          whiteSpace: 'nowrap'
                        }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '13px 14px' }}>
                        <button
                          onClick={() => openDetail(c)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            background: '#0f2d52', color: '#fff', border: 'none',
                            padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                            fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap'
                          }}
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && filtered.length > 0 && (
          <div style={{
            padding: '0.875rem 1.25rem', borderTop: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#fafbfc', flexWrap: 'wrap', gap: '8px'
          }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} assignments
            </span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <PaginationBtn label="‹" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...'
                    ? <span key={`e${i}`} style={{ padding: '0 4px', color: '#94a3b8' }}>…</span>
                    : <PaginationBtn key={p} label={p} onClick={() => handlePageChange(p)} active={p === currentPage} />
                )
              }
              <PaginationBtn label="›" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
            </div>
          </div>
        )}
      </div>

      {/* Detail / Reassign Modal */}
      {selectedTask && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '700px',
            maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{ background: '#0f2d52', color: '#fff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ClipboardList size={18} />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Task Assignment Details</h3>
                </div>
                <span style={{ fontSize: '0.85rem', color: '#93c5fd' }}>
                  Complaint #{selectedTask.complaintNumber}
                </span>
              </div>
              <button onClick={() => setSelectedTask(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {/* Info Grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem', background: '#f8fafc', padding: '1.25rem',
                borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.5rem'
              }}>
                {[
                  { label: 'Park Name',      value: selectedTask.parkName || selectedTask.park?.name || '—' },
                  { label: 'Complaint Type', value: selectedTask.category || '—' },
                  { label: 'Priority',       value: selectedTask.priority || '—' },
                  { label: 'Current Status', value: selectedTask.status },
                  { label: 'Assigned To',    value: selectedTask.assignedContractor?.name || 'Unassigned' },
                  { label: 'Date',           value: new Date(selectedTask.updatedAt || selectedTask.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 600 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</div>
                <p style={{ margin: 0, color: '#334155', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {selectedTask.description || 'No description provided.'}
                </p>
              </div>

              {/* Rejection Reason */}
              {selectedTask.status === 'Rejected by Contractor' && selectedTask.rejectionReason && (
                <div style={{ background: '#fef2f2', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #fecaca', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason for Rejection</div>
                  <p style={{ margin: 0, color: '#991b1b', fontSize: '0.9rem', lineHeight: '1.6', fontWeight: 500 }}>
                    {selectedTask.rejectionReason}
                  </p>
                </div>
              )}

              {/* Reassign Section */}
              <div style={{ background: '#eff6ff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                <h4 style={{ margin: '0 0 0.75rem', color: '#1d4ed8', fontSize: '0.95rem', fontWeight: 700 }}>
                  Reassign Contractor
                </h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <select
                    value={reassignId}
                    onChange={e => setReassignId(e.target.value)}
                    style={{
                      flex: 1, minWidth: '200px', padding: '0.6rem 1rem', borderRadius: '8px',
                      border: '1px solid #bfdbfe', background: '#fff', fontSize: '0.875rem', color: '#334155'
                    }}
                  >
                    <option value="">— Select Contractor —</option>
                    {contractors.map(con => (
                      <option key={con._id} value={con._id}>
                        {con.name}{con.contractorId ? ` (${con.contractorId})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleReassign}
                    disabled={saving}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: saving ? '#94a3b8' : '#1d4ed8', color: '#fff',
                      border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px',
                      cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.875rem'
                    }}
                  >
                    <UserCheck size={16} />
                    {saving ? 'Saving...' : 'Confirm Reassign'}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
              <button
                onClick={() => setSelectedTask(null)}
                style={{ background: '#64748b', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssignments;

