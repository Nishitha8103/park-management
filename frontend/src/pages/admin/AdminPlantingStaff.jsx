import { useState, useEffect } from 'react';
import { 
  TreePine, 
  UserPlus, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Search, 
  Plus, 
  CheckSquare, 
  Calendar, 
  HeartPulse, 
  Droplets,
  Tag
} from 'lucide-react';

const AdminPlantingStaff = () => {
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'inventory' | 'tasks'
  
  // Data States
  const [staffList, setStaffList] = useState([]);
  const [parks, setParks] = useState([]);
  const [floraList, setFloraList] = useState([]);
  const [taskList, setTaskList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showFloraModal, setShowFloraModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Forms State
  const [staffForm, setStaffForm] = useState({
    name: '', username: '', email: '', password: '', assignedParks: []
  });
  const [floraForm, setFloraForm] = useState({
    park: '', species: '', scientificName: '', type: 'Tree', healthStatus: 'Healthy', locationInPark: '', wateringFrequencyDays: 2, notes: ''
  });
  const [taskForm, setTaskForm] = useState({
    park: '', flora: '', assignedTo: '', taskType: 'Watering', priority: 'Medium', dueDate: new Date().toISOString().split('T')[0], instructions: ''
  });

  const [msg, setMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const getAuthToken = () => {
    try {
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      if (adminUser?.token) return adminUser.token;
      const plantingUser = JSON.parse(localStorage.getItem('plantingUser') || '{}');
      if (plantingUser?.token) return plantingUser.token;
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user?.token) return user.token;
    } catch (e) {}
    return localStorage.getItem('token') || '';
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      const [parksRes, staffRes, floraRes, tasksRes] = await Promise.all([
        fetch('/api/parks'),
        fetch('/api/flora/staff', { headers }),
        fetch('/api/flora', { headers }),
        fetch('/api/flora/tasks/all', { headers })
      ]);

      if (parksRes.ok) {
        const pData = await parksRes.json();
        setParks(Array.isArray(pData) ? pData : pData.parks || []);
      }
      if (staffRes.ok) {
        setStaffList(await staffRes.json());
      }
      if (floraRes.ok) {
        setFloraList(await floraRes.json());
      }
      if (tasksRes.ok) {
        setTaskList(await tasksRes.json());
      }
    } catch (err) {
      console.error("Error fetching admin planting data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      const token = getAuthToken();
      const res = await fetch('/api/flora/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(staffForm)
      });
      const data = await res.json();

      if (res.ok) {
        setMsg({ type: 'success', text: 'Planting Staff member created successfully!' });
        setStaffForm({ name: '', username: '', email: '', password: '', assignedParks: [] });
        setShowStaffModal(false);
        fetchInitialData();
      } else {
        setMsg({ type: 'error', text: data.message || 'Failed to create staff member.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Server error while creating staff member.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFlora = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      const token = getAuthToken();
      const res = await fetch('/api/flora', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(floraForm)
      });
      const data = await res.json();

      if (res.ok) {
        setMsg({ type: 'success', text: 'Flora item added successfully!' });
        setShowFloraModal(false);
        fetchInitialData();
      } else {
        setMsg({ type: 'error', text: data.message || 'Failed to add flora.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Server error adding flora.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      const token = getAuthToken();
      const res = await fetch('/api/flora/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskForm)
      });
      const data = await res.json();

      if (res.ok) {
        setMsg({ type: 'success', text: 'Maintenance task created successfully!' });
        setShowTaskModal(false);
        fetchInitialData();
      } else {
        setMsg({ type: 'error', text: data.message || 'Failed to create task.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Server error creating task.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleParkCheckbox = (parkId) => {
    setStaffForm(prev => {
      const isSelected = prev.assignedParks.includes(parkId);
      return {
        ...prev,
        assignedParks: isSelected 
          ? prev.assignedParks.filter(id => id !== parkId)
          : [...prev.assignedParks, parkId]
      };
    });
  };

  const filteredStaff = staffList.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFlora = floraList.filter(f => 
    f.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.scientificName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.locationInPark?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTasks = taskList.filter(t => 
    t.taskType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.park?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <TreePine color="#16a34a" size={32} />
            Planting & Flora Management
          </h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
            Hire planting staff, monitor citywide tree & plant inventory, and oversee park maintenance tasks.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {activeTab === 'staff' && (
            <button 
              onClick={() => setShowStaffModal(true)}
              style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <UserPlus size={18} /> Add Planting Staff
            </button>
          )}
          {activeTab === 'inventory' && (
            <button 
              onClick={() => {
                setFloraForm({ park: parks.length > 0 ? parks[0]._id : '', species: '', scientificName: '', type: 'Tree', healthStatus: 'Healthy', locationInPark: '', wateringFrequencyDays: 2, notes: '' });
                setShowFloraModal(true);
              }}
              style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={18} /> Add Flora Item
            </button>
          )}
          {activeTab === 'tasks' && (
            <button 
              onClick={() => {
                setTaskForm({ park: parks.length > 0 ? parks[0]._id : '', flora: '', assignedTo: staffList.length > 0 ? staffList[0]._id : '', taskType: 'Watering', priority: 'Medium', dueDate: new Date().toISOString().split('T')[0], instructions: '' });
                setShowTaskModal(true);
              }}
              style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <CheckSquare size={18} /> Create Task
            </button>
          )}
        </div>
      </div>

      {msg.text && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          backgroundColor: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: msg.type === 'success' ? '#166534' : '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {msg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {msg.text}
        </div>
      )}

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Planting Staff</div>
          <div style={{ fontSize: '1.875rem', fontWeight: '700', color: '#16a34a', marginTop: '0.25rem' }}>{staffList.length}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Parks Covered</div>
          <div style={{ fontSize: '1.875rem', fontWeight: '700', color: '#2563eb', marginTop: '0.25rem' }}>{parks.length}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Flora Tracked</div>
          <div style={{ fontSize: '1.875rem', fontWeight: '700', color: '#059669', marginTop: '0.25rem' }}>{floraList.length}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Active Tasks</div>
          <div style={{ fontSize: '1.875rem', fontWeight: '700', color: '#d97706', marginTop: '0.25rem' }}>
            {taskList.filter(t => t.status !== 'Completed').length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb' }}>
        <button 
          onClick={() => { setActiveTab('staff'); setSearchTerm(''); }}
          style={{ padding: '0.75rem 1.25rem', border: 'none', borderBottom: activeTab === 'staff' ? '3px solid #16a34a' : 'none', fontWeight: '600', color: activeTab === 'staff' ? '#16a34a' : '#6b7280', background: 'transparent', cursor: 'pointer' }}
        >
          👥 Planting Staff Members ({staffList.length})
        </button>
        <button 
          onClick={() => { setActiveTab('inventory'); setSearchTerm(''); }}
          style={{ padding: '0.75rem 1.25rem', border: 'none', borderBottom: activeTab === 'inventory' ? '3px solid #16a34a' : 'none', fontWeight: '600', color: activeTab === 'inventory' ? '#16a34a' : '#6b7280', background: 'transparent', cursor: 'pointer' }}
        >
          🌳 Flora Inventory ({floraList.length})
        </button>
        <button 
          onClick={() => { setActiveTab('tasks'); setSearchTerm(''); }}
          style={{ padding: '0.75rem 1.25rem', border: 'none', borderBottom: activeTab === 'tasks' ? '3px solid #16a34a' : 'none', fontWeight: '600', color: activeTab === 'tasks' ? '#16a34a' : '#6b7280', background: 'transparent', cursor: 'pointer' }}
        >
          📋 Maintenance Tasks ({taskList.length})
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ backgroundColor: 'white', padding: '0.875rem 1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Search size={18} color="#9ca3af" />
        <input 
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }}
        />
      </div>

      {/* TAB 1: STAFF LIST */}
      {activeTab === 'staff' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading Planting Staff...</div>
          ) : filteredStaff.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <Shield size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p>No Planting Staff members found.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563', fontSize: '0.875rem' }}>
                  <th style={{ padding: '0.875rem 1.5rem' }}>Staff Name</th>
                  <th style={{ padding: '0.875rem 1.5rem' }}>Email / Username</th>
                  <th style={{ padding: '0.875rem 1.5rem' }}>Assigned Parks</th>
                  <th style={{ padding: '0.875rem 1.5rem' }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => (
                  <tr key={staff._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '600', color: '#111827' }}>{staff.name}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#4b5563' }}>
                      <div>{staff.email}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>@{staff.username}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {staff.assignedParks && staff.assignedParks.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {staff.assignedParks.map((p) => (
                            <span key={p._id || p} style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MapPin size={12} /> {p.name || 'Park'}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' }}>No Parks Assigned</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }}>
                        Planting Staff
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 2: FLORA INVENTORY */}
      {activeTab === 'inventory' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading Flora Inventory...</div>
          ) : filteredFlora.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <TreePine size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p>No Flora items logged yet.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563', fontSize: '0.875rem' }}>
                  <th style={{ padding: '0.875rem 1.5rem' }}>Species / Name</th>
                  <th style={{ padding: '0.875rem 1.5rem' }}>Type</th>
                  <th style={{ padding: '0.875rem 1.5rem' }}>Park / Location</th>
                  <th style={{ padding: '0.875rem 1.5rem' }}>Health Status</th>
                  <th style={{ padding: '0.875rem 1.5rem' }}>Watering Freq.</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlora.map((item) => (
                  <tr key={item._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '600', color: '#111827' }}>
                      <div>{item.species}</div>
                      {item.scientificName && <div style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>{item.scientificName}</div>}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: '#374151' }}>{item.type}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#4b5563' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={14} color="#059669" /> {item.park?.name || 'Park'}
                      </div>
                      {item.locationInPark && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.locationInPark}</div>}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: '600', padding: '0.25rem 0.6rem', borderRadius: '9999px',
                        backgroundColor: item.healthStatus === 'Healthy' ? '#dcfce7' : item.healthStatus === 'Critical' ? '#fee2e2' : '#fef9c3',
                        color: item.healthStatus === 'Healthy' ? '#15803d' : item.healthStatus === 'Critical' ? '#b91c1c' : '#a16207'
                      }}>
                        {item.healthStatus}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: '#4b5563', fontSize: '0.85rem' }}>
                      Every {item.wateringFrequencyDays || 2} days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 3: TASKS LIST */}
      {activeTab === 'tasks' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading Maintenance Tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <CheckSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p>No maintenance tasks created yet.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', color: '#4b5563', fontSize: '0.875rem' }}>
                  <th style={{ padding: '0.875rem 1.5rem' }}>Task Type</th>
                  <th style={{ padding: '0.875rem 1.5rem' }}>Park / Target Flora</th>
                  <th style={{ padding: '0.875rem 1.5rem' }}>Assigned To</th>
                  <th style={{ padding: '0.875rem 1.5rem' }}>Priority</th>
                  <th style={{ padding: '0.875rem 1.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '600', color: '#111827' }}>{task.taskType}</td>
                    <td style={{ padding: '1rem 1.5rem', color: '#4b5563' }}>
                      <div>{task.park?.name || 'Park'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{task.flora?.species || 'General Flora'}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: '#374151' }}>{task.assignedTo?.name || 'Staff'}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.5rem', borderRadius: '4px',
                        backgroundColor: task.priority === 'High' ? '#fee2e2' : '#f0fdf4',
                        color: task.priority === 'High' ? '#dc2626' : '#166534'
                      }}>
                        {task.priority || 'Medium'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: '600', padding: '0.25rem 0.6rem', borderRadius: '9999px',
                        backgroundColor: task.status === 'Completed' ? '#dcfce7' : task.status === 'In Progress' ? '#fef9c3' : '#fee2e2',
                        color: task.status === 'Completed' ? '#15803d' : task.status === 'In Progress' ? '#a16207' : '#b91c1c'
                      }}>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal 1: Create Planting Staff */}
      {showStaffModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Create Planting Staff Member</h2>
            <form onSubmit={handleCreateStaff}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Full Name</label>
                <input type="text" required value={staffForm.name} onChange={(e) => setStaffForm({...staffForm, name: e.target.value})} placeholder="e.g. Ramesh Kumar" style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Username</label>
                  <input type="text" required value={staffForm.username} onChange={(e) => setStaffForm({...staffForm, username: e.target.value})} placeholder="ramesh_flora" style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Email</label>
                  <input type="email" required value={staffForm.email} onChange={(e) => setStaffForm({...staffForm, email: e.target.value})} placeholder="ramesh@park.gov.in" style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Password</label>
                <input type="password" required value={staffForm.password} onChange={(e) => setStaffForm({...staffForm, password: e.target.value})} placeholder="••••••••" style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Assign to Parks</label>
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.5rem' }}>
                  {parks.map((park) => (
                    <label key={park._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={staffForm.assignedParks.includes(park._id)} onChange={() => handleParkCheckbox(park._id)} />
                      <span>{park.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowStaffModal(false)} style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Create Staff Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Flora Item */}
      {showFloraModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Add Flora / Tree Item</h2>
            <form onSubmit={handleAddFlora}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Select Park</label>
                <select required value={floraForm.park} onChange={(e) => setFloraForm({...floraForm, park: e.target.value})} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  {parks.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Species / Common Name</label>
                  <input type="text" required value={floraForm.species} onChange={(e) => setFloraForm({...floraForm, species: e.target.value})} placeholder="e.g. Banyan Tree" style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Scientific Name</label>
                  <input type="text" value={floraForm.scientificName} onChange={(e) => setFloraForm({...floraForm, scientificName: e.target.value})} placeholder="Ficus benghalensis" style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Type</label>
                  <select value={floraForm.type} onChange={(e) => setFloraForm({...floraForm, type: e.target.value})} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                    <option value="Tree">Tree</option>
                    <option value="Shrub">Shrub</option>
                    <option value="Flower Bed">Flower Bed</option>
                    <option value="Lawn / Grass">Lawn / Grass</option>
                    <option value="Hedge">Hedge</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Location in Park</label>
                  <input type="text" value={floraForm.locationInPark} onChange={(e) => setFloraForm({...floraForm, locationInPark: e.target.value})} placeholder="East Wing Lawn" style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowFloraModal(false)} style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', border: 'none', background: '#059669', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Add Flora</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Create Maintenance Task */}
      {showTaskModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '500px', width: '100%', padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Create Maintenance Task</h2>
            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Select Park</label>
                <select required value={taskForm.park} onChange={(e) => setTaskForm({...taskForm, park: e.target.value})} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  {parks.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Assign To Staff</label>
                <select value={taskForm.assignedTo} onChange={(e) => setTaskForm({...taskForm, assignedTo: e.target.value})} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                  {staffList.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Task Type</label>
                  <select value={taskForm.taskType} onChange={(e) => setTaskForm({...taskForm, taskType: e.target.value})} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                    <option value="Watering">Watering</option>
                    <option value="Pruning">Pruning</option>
                    <option value="Fertilizing">Fertilizing</option>
                    <option value="Weeding">Weeding</option>
                    <option value="Health Check">Health Check</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Priority</label>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})} style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowTaskModal(false)} style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPlantingStaff;
