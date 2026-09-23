import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, Users, TreePine, AlertTriangle, Plus, Edit2, Trash2 } from 'lucide-react';
import './AdminDashboard.css';
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  // Core Data States
  const [users, setUsers] = useState([]);
  const [parks, setParks] = useState([]);
  const [complaints, setComplaints] = useState([]);

  // Modal Control States
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [showParkModal, setShowParkModal] = useState(false);
  const [editingPark, setEditingPark] = useState(null);

  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);

  // Verification & Session Check
  useEffect(() => {
    const storedAdmin = localStorage.getItem('adminUser');
    if (!storedAdmin) {
      navigate('/login');
    } else {
      setAdmin(JSON.parse(storedAdmin));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // --- Users Operations ---
  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    const form = e.target;
    const updated = {
      ...editingUser,
      name: form.name.value,
      phone: form.phone.value,
      role: form.role.value,
      department: form.department.value
    };

    setUsers(prev => prev.map(u => u.id === editingUser.id ? updated : u));
    setShowUserModal(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  // --- Parks Operations ---
  const handleAddPark = () => {
    setEditingPark({ id: '', name: '', location: '', status: 'Active' });
    setShowParkModal(true);
  };

  const handleEditPark = (park) => {
    setEditingPark(park);
    setShowParkModal(true);
  };

  const handleSavePark = (e) => {
    e.preventDefault();
    const form = e.target;
    if (editingPark.id) {
      // Edit mode
      const updated = {
        ...editingPark,
        name: form.name.value,
        location: form.location.value,
        status: form.status.value
      };
      setParks(prev => prev.map(p => p.id === editingPark.id ? updated : p));
    } else {
      // Add mode
      const newPark = {
        id: String(parks.length + 1),
        name: form.name.value,
        location: form.location.value,
        status: form.status.value
      };
      setParks(prev => [...prev, newPark]);
    }
    setShowParkModal(false);
    setEditingPark(null);
  };

  const handleDeletePark = (id) => {
    if (window.confirm("Are you sure you want to delete this park?")) {
      setParks(prev => prev.filter(p => p.id !== id));
    }
  };

  // --- Complaints Operations ---
  const handleEditComplaint = (complaint) => {
    setEditingComplaint(complaint);
    setShowComplaintModal(true);
  };

  const handleSaveComplaint = (e) => {
    e.preventDefault();
    const form = e.target;
    const updated = {
      ...editingComplaint,
      status: form.status.value,
      assignedTo: form.assignedTo.value
    };
    setComplaints(prev => prev.map(c => c.id === editingComplaint.id ? updated : c));
    setShowComplaintModal(false);
    setEditingComplaint(null);
  };

  if (!admin) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 'bold' }}>Authenticating Admin Session...</div>;
  }

  return (
    <div className="admin-dashboard-page">
      {/* Header bar */}
      <header className="admin-header">
        <div className="container admin-header-content">
          <div className="admin-brand">
            <ShieldCheck size={28} className="admin-text-primary" />
            <h1>SYSTEM MANAGEMENT</h1>
            <span>Admin Control</span>
          </div>
          
          <div className="admin-user-info">
            <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>Admin: {admin.name}</span>
            <button className="btn-admin-logout" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container admin-dashboard-container">
        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} style={{ marginRight: '6px', display: 'inline' }} /> Users Management
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === 'parks' ? 'active' : ''}`}
            onClick={() => setActiveTab('parks')}
          >
            <TreePine size={16} style={{ marginRight: '6px', display: 'inline' }} /> Parks Directory
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => setActiveTab('complaints')}
          >
            <AlertTriangle size={16} style={{ marginRight: '6px', display: 'inline' }} /> Complaints Assignment
          </button>
        </div>

        {/* Tab 1: Users */}
        {activeTab === 'users' && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h3>System Users Registry</h3>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Contact Phone</th>
                    <th>Role Mode</th>
                    <th>Department / Spec</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: '600' }}>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.phone || 'N/A'}</td>
                      <td>
                        <span className={`admin-badge ${u.role === 'admin' ? 'user-role' : u.role === 'contractor' ? 'contractor-role' : 'public-role'}`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{u.department || 'General / None'}</td>
                      <td>
                        <button className="btn-table-action edit" onClick={() => handleEditUser(u)}>
                          <Edit2 size={12} style={{ display: 'inline', marginRight: '4px' }} /> Edit
                        </button>
                        {u.role !== 'admin' && (
                          <button className="btn-table-action delete" onClick={() => handleDeleteUser(u.id)}>
                            <Trash2 size={12} style={{ display: 'inline', marginRight: '4px' }} /> Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Parks */}
        {activeTab === 'parks' && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h3>Municipal Parks Listing</h3>
              <button className="btn-admin-add" onClick={handleAddPark}>
                <Plus size={16} /> Add New Park
              </button>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Park ID</th>
                    <th>Park Name</th>
                    <th>Municipal Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parks.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: '600' }}>{p.id}</td>
                      <td style={{ fontWeight: '600' }}>{p.name}</td>
                      <td>{p.location}</td>
                      <td>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: '700', 
                          color: p.status === 'Active' ? '#16a34a' : '#f97316', 
                          backgroundColor: p.status === 'Active' ? '#dcfce7' : '#ffedd5',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          border: `1px solid ${p.status === 'Active' ? '#bbf7d0' : '#fdba74'}`
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn-table-action edit" onClick={() => handleEditPark(p)}>
                          <Edit2 size={12} style={{ display: 'inline', marginRight: '4px' }} /> Edit
                        </button>
                        <button className="btn-table-action delete" onClick={() => handleDeletePark(p.id)}>
                          <Trash2 size={12} style={{ display: 'inline', marginRight: '4px' }} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Complaints */}
        {activeTab === 'complaints' && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h3>System Complaints Oversight</h3>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Complaint ID</th>
                    <th>Target Park</th>
                    <th>Issue Description</th>
                    <th>Priority Level</th>
                    <th>Work Status</th>
                    <th>Assigned Staff</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: '700' }}>{c.id}</td>
                      <td style={{ fontWeight: '600' }}>{c.park}</td>
                      <td>{c.issue}</td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          color: c.priority === 'High' ? '#ef4444' : c.priority === 'Medium' ? '#f97316' : '#10b981',
                          backgroundColor: c.priority === 'High' ? '#fee2e2' : c.priority === 'Medium' ? '#ffedd5' : '#ecfdf5',
                          border: `1px solid ${c.priority === 'High' ? '#fca5a5' : c.priority === 'Medium' ? '#fdba74' : '#a7f3d0'}`
                        }}>
                          {c.priority}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          color: c.status === 'Pending' ? '#475569' : c.status === 'In Progress' ? '#2563eb' : '#16a34a',
                          backgroundColor: c.status === 'Pending' ? '#f1f5f9' : c.status === 'In Progress' ? '#dbeafe' : '#dcfce7',
                          border: `1px solid ${c.status === 'Pending' ? '#cbd5e1' : c.status === 'In Progress' ? '#bfdbfe' : '#bbf7d0'}`
                        }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: '500', color: c.assignedTo === 'Unassigned' ? '#ef4444' : '#1e293b' }}>
                        {c.assignedTo}
                      </td>
                      <td>
                        <button className="btn-table-action edit" onClick={() => handleEditComplaint(c)}>
                          <Edit2 size={12} style={{ display: 'inline', marginRight: '4px' }} /> Update & Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: Edit User */}
      {showUserModal && editingUser && (
        <div className="admin-modal-overlay">
          <form className="admin-modal" onSubmit={handleSaveUser}>
            <h4>Edit System User Information</h4>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-input-label">Full Name</label>
                <input type="text" className="admin-input-field" name="name" defaultValue={editingUser.name} required />
              </div>
              <div className="admin-form-group">
                <label className="admin-input-label">Phone Number</label>
                <input type="tel" className="admin-input-field" name="phone" defaultValue={editingUser.phone} required />
              </div>
              <div className="admin-form-group">
                <label className="admin-input-label">Role System Access</label>
                <select className="admin-input-field" name="role" defaultValue={editingUser.role}>
                  <option value="public_user">Public User</option>
                  <option value="government_official">Government Official</option>
                  <option value="contractor">Contractor</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-input-label">Department / Specialization</label>
                <input type="text" className="admin-input-field" name="department" defaultValue={editingUser.department} placeholder="e.g. Landscaping, IT Ops" />
              </div>
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="btn-modal-cancel" onClick={() => setShowUserModal(false)}>Cancel</button>
              <button type="submit" className="btn-modal-submit">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Add/Edit Park */}
      {showParkModal && editingPark && (
        <div className="admin-modal-overlay">
          <form className="admin-modal" onSubmit={handleSavePark}>
            <h4>{editingPark.id ? 'Edit Park Record' : 'Register New Park'}</h4>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-input-label">Park Name</label>
                <input type="text" className="admin-input-field" name="name" defaultValue={editingPark.name} required />
              </div>
              <div className="admin-form-group">
                <label className="admin-input-label">Location (Zone/Ward)</label>
                <input type="text" className="admin-input-field" name="location" defaultValue={editingPark.location} onInput={(e) => e.target.value = e.target.value.replace(/[^a-zA-Z0-9\s,.-/#]/g, '')} required />
              </div>
              <div className="admin-form-group">
                <label className="admin-input-label">Park Operation Status</label>
                <select className="admin-input-field" name="status" defaultValue={editingPark.status}>
                  <option value="Active">Active</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="btn-modal-cancel" onClick={() => setShowParkModal(false)}>Cancel</button>
              <button type="submit" className="btn-modal-submit">{editingPark.id ? 'Save Changes' : 'Register Park'}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Update & Assign Complaint */}
      {showComplaintModal && editingComplaint && (
        <div className="admin-modal-overlay">
          <form className="admin-modal" onSubmit={handleSaveComplaint}>
            <h4>Dispatch Complaint & Update Status</h4>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-input-label">Work Status</label>
                <select className="admin-input-field" name="status" defaultValue={editingComplaint.status}>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-input-label">Assign Maintenance Official / Contractor</label>
                <select className="admin-input-field" name="assignedTo" defaultValue={editingComplaint.assignedTo}>
                  <option value="Unassigned">Unassigned</option>
                  {users.filter(u => u.role === 'government_official' || u.role === 'contractor').map(user => (
                    <option key={user.id} value={user.name}>{user.name} ({user.role.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="btn-modal-cancel" onClick={() => setShowComplaintModal(false)}>Cancel</button>
              <button type="submit" className="btn-modal-submit">Save Update</button>
            </div>
          </form>
        </div>
      )}

      {/* Removed Footer */}
    </div>
  );
};

export default AdminDashboard;

