import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HardHat, Menu, LogOut, Package, Plus, X, CheckCircle, Clock, XCircle, Trash2, AlertTriangle } from 'lucide-react';
import ContractorSidebar from '../components/ContractorSidebar';
import './ContractorMaterialRequests.css';

const PRIORITY_COLORS = {
  Low:    { bg: '#dbeafe', color: '#1d4ed8' },
  Medium: { bg: '#fef3c7', color: '#92400e' },
  High:   { bg: '#fce7f3', color: '#9d174d' },
  Urgent: { bg: '#fee2e2', color: '#991b1b' },
};

const STATUS_ICONS = {
  Pending:  <Clock size={14} />,
  Approved: <CheckCircle size={14} />,
  Rejected: <XCircle size={14} />,
};

const STATUS_COLORS = {
  Pending:  { bg: '#fef3c7', color: '#92400e' },
  Approved: { bg: '#dcfce7', color: '#15803d' },
  Rejected: { bg: '#fee2e2', color: '#991b1b' },
};

const UNITS = ['units', 'kg', 'liters', 'meters', 'pieces', 'bags', 'rolls', 'boxes', 'pairs', 'sets'];

const defaultForm = {
  materialName: '',
  quantity: '',
  unit: 'units',
  priority: 'Medium',
  reason: '',
  parkName: '',
};

const ContractorMaterialRequests = () => {
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [message, setMessage] = useState({ type: '', text: '' });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const handleLogout = () => { localStorage.removeItem('contractorUser'); navigate('/contractor/login'); };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  useEffect(() => {
    const stored = localStorage.getItem('contractorUser');
    if (!stored) { navigate('/contractor/login'); return; }
    const user = JSON.parse(stored);
    setContractor(user);
    fetchRequests(user);
  }, [navigate]);

  const fetchRequests = async (user) => {
    try {
      const res = await fetch('/api/material-requests/my', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.materialName || !form.quantity || !form.reason) {
      showMsg('error', 'Please fill all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/material-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${contractor.token}`
        },
        body: JSON.stringify({
          ...form,
          quantity: Number(form.quantity),
        })
      });
      const data = await res.json();
      if (res.ok) {
        showMsg('success', 'Material request submitted successfully!');
        setForm(defaultForm);
        setShowForm(false);
        fetchRequests(contractor);
      } else {
        showMsg('error', data.message || 'Failed to submit request.');
      }
    } catch {
      showMsg('error', 'Server error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      const res = await fetch(`/api/material-requests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${contractor.token}` }
      });
      if (res.ok) {
        showMsg('success', 'Request deleted.');
        setRequests(prev => prev.filter(r => r._id !== id));
      } else {
        const d = await res.json();
        showMsg('error', d.message || 'Failed to delete.');
      }
    } catch {
      showMsg('error', 'Server error.');
    }
  };

  const filtered = filterStatus === 'All' ? requests : requests.filter(r => r.status === filterStatus);
  const counts = {
    All: requests.length,
    Pending: requests.filter(r => r.status === 'Pending').length,
    Approved: requests.filter(r => r.status === 'Approved').length,
    Rejected: requests.filter(r => r.status === 'Rejected').length,
  };

  return (
    <div className="contractor-dashboard-page">
      <ContractorSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} handleLogout={handleLogout} contractor={contractor} />

      <div className={`contractor-main-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="contractor-header">
          <div className="container contractor-header-content">
            <div className="contractor-brand">
              <button className="contractor-menu-toggle" onClick={toggleSidebar}><Menu size={24} /></button>
              <HardHat size={28} className="contractor-text-primary" />
              <h1>PARK MAINTENANCE</h1>
              <span>Portal</span>
            </div>
            <div className="contractor-user-info">
              <div className="contractor-user-details">
                <h4 className="contractor-user-name">{contractor?.name}</h4>
                <p className="contractor-user-role">
                  {contractor?.maintenanceSkills?.length > 0 ? contractor.maintenanceSkills.join(', ') : 'Maintenance Contractor'}
                </p>
              </div>
              <button className="btn-contractor-logout" onClick={handleLogout}><LogOut size={16} /> Logout</button>
            </div>
          </div>
        </header>

        <div className="mr-page container">
          {/* Header */}
          <div className="mr-page-header">
            <div className="mr-title">
              <Package size={28} className="mr-title-icon" />
              <div>
                <h2>Material & Resource Requests</h2>
                <p>Request materials needed for your maintenance tasks</p>
              </div>
            </div>
            <button className="mr-add-btn" onClick={() => setShowForm(true)}>
              <Plus size={18} /> New Request
            </button>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`mr-alert mr-alert--${message.type}`}>
              {message.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
              {message.text}
            </div>
          )}

          {/* Stats */}
          <div className="mr-stats">
            {Object.entries(counts).map(([k, v]) => (
              <button key={k} className={`mr-stat-pill ${filterStatus === k ? 'active' : ''}`} onClick={() => setFilterStatus(k)}>
                <span className="mr-stat-num">{v}</span>
                <span className="mr-stat-label">{k}</span>
              </button>
            ))}
          </div>

          {/* Submission Form Modal */}
          {showForm && (
            <div className="mr-modal-overlay" onClick={() => setShowForm(false)}>
              <div className="mr-modal" onClick={e => e.stopPropagation()}>
                <div className="mr-modal-header">
                  <h3><Package size={20}/> New Material Request</h3>
                  <button onClick={() => setShowForm(false)}><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className="mr-form">
                  <div className="mr-form-grid">
                    <div className="mr-form-group">
                      <label>Material Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. PVC Pipes, Garden Soil, Electrical Cable"
                        value={form.materialName}
                        onChange={e => setForm(p => ({ ...p, materialName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="mr-form-group">
                      <label>Park / Location</label>
                      <input
                        type="text"
                        placeholder="e.g. J.P. Nagar 4th Phase Park"
                        value={form.parkName}
                        onChange={e => setForm(p => ({ ...p, parkName: e.target.value }))}
                      />
                    </div>
                    <div className="mr-form-group">
                      <label>Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 10"
                        value={form.quantity}
                        onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="mr-form-group">
                      <label>Unit</label>
                      <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="mr-form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Priority</label>
                      <div className="mr-priority-pills">
                        {['Low','Medium','High','Urgent'].map(p => (
                          <button
                            key={p} type="button"
                            className={`mr-priority-pill ${form.priority === p ? 'active' : ''}`}
                            style={form.priority === p ? { background: PRIORITY_COLORS[p].bg, color: PRIORITY_COLORS[p].color, borderColor: PRIORITY_COLORS[p].color } : {}}
                            onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                          >{p}</button>
                        ))}
                      </div>
                    </div>
                    <div className="mr-form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Reason / Purpose *</label>
                      <textarea
                        rows={3}
                        placeholder="Explain why this material is needed and how it will be used..."
                        value={form.reason}
                        onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="mr-form-actions">
                    <button type="button" className="mr-cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
                    <button type="submit" className="mr-submit-btn" disabled={submitting}>
                      {submitting ? 'Submitting…' : <><Package size={16}/> Submit Request</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Requests List */}
          {loading ? (
            <div className="mr-loading"><div className="mr-spinner"></div><p>Loading requests…</p></div>
          ) : filtered.length === 0 ? (
            <div className="mr-empty">
              <Package size={52} />
              <h3>{filterStatus === 'All' ? 'No requests yet' : `No ${filterStatus} requests`}</h3>
              <p>Click "New Request" to submit your first material request to the admin.</p>
              <button className="mr-add-btn" onClick={() => setShowForm(true)}><Plus size={16}/> New Request</button>
            </div>
          ) : (
            <div className="mr-list">
              {filtered.map(req => (
                <div key={req._id} className="mr-card">
                  <div className="mr-card-header">
                    <div className="mr-card-title-row">
                      <h3 className="mr-card-name">{req.materialName}</h3>
                      <span className="mr-priority-badge" style={{ background: PRIORITY_COLORS[req.priority]?.bg, color: PRIORITY_COLORS[req.priority]?.color }}>
                        {req.priority}
                      </span>
                    </div>
                    <div className="mr-card-status-row">
                      <span className="mr-status-badge" style={{ background: STATUS_COLORS[req.status]?.bg, color: STATUS_COLORS[req.status]?.color }}>
                        {STATUS_ICONS[req.status]} {req.status}
                      </span>
                      <span className="mr-card-date">{new Date(req.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                    </div>
                  </div>

                  <div className="mr-card-body">
                    <div className="mr-card-meta">
                      <span><strong>Quantity:</strong> {req.quantity} {req.unit}</span>
                      {req.parkName && <span><strong>Park:</strong> {req.parkName}</span>}
                    </div>
                    <p className="mr-card-reason"><strong>Reason:</strong> {req.reason}</p>
                    {req.adminNotes && (
                      <div className={`mr-admin-note mr-admin-note--${req.status.toLowerCase()}`}>
                        <strong>Admin Response:</strong> {req.adminNotes}
                        {req.reviewedAt && <span className="mr-reviewed-at"> · {new Date(req.reviewedAt).toLocaleDateString('en-IN')}</span>}
                      </div>
                    )}
                  </div>

                  {req.status === 'Pending' && (
                    <div className="mr-card-actions">
                      <button className="mr-delete-btn" onClick={() => handleDelete(req._id)}>
                        <Trash2 size={14}/> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

              </div>
    </div>
  );
};

export default ContractorMaterialRequests;
