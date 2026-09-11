import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Megaphone, Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Data for dependent dropdowns
  const [zones, setZones] = useState([]);
  const [wards, setWards] = useState([]);
  const [parks, setParks] = useState([]);
  const [corporations, setCorporations] = useState([]);
  
  const [filteredWards, setFilteredWards] = useState([]);
  const [filteredParks, setFilteredParks] = useState([]);

  const initialForm = {
    title: '',
    content: '',
    type: 'General',
    targetType: 'ALL_CITIZENS',
    targetId: '',
    priority: 'Normal',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: '',
    isActive: true
  };
  
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const fetchAnnouncements = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      const res = await axios.get('/api/announcements/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(res.data);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const fetchMasterData = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      const headers = { Authorization: `Bearer ${token}` };
      
      const [zoneRes, wardRes, parkRes, corpRes] = await Promise.all([
        axios.get('/api/master/zones', { headers }),
        axios.get('/api/master/wards', { headers }),
        axios.get('/api/parks', { headers }),
        axios.get('/api/master/corporations', { headers }).catch(() => ({ data: [] }))
      ]);
      
      setZones(zoneRes.data);
      setWards(wardRes.data);
      setParks(parkRes.data);
      setCorporations(corpRes.data);
    } catch (err) {
      console.error("Failed to load master data", err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchMasterData();
  }, []);

  // Handle dependent dropdowns filtering
  useEffect(() => {
    if (formData.targetType === 'WARD' && zones.length > 0) {
       // Ideally Ward has zone, if not we just show all. 
       // For this simple implementation, let's just show all wards if zone is not selected
       setFilteredWards(wards);
    }
    
    if (formData.targetType === 'PARK' && wards.length > 0) {
       setFilteredParks(parks);
    }
  }, [formData.targetType, formData.targetId, zones, wards, parks]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      
      // Reset targetId if targetType changes
      if (name === 'targetType') {
        updated.targetId = '';
      }
      
      return updated;
    });
  };

  const handleAdd = () => {
    setFormData({
      ...initialForm,
      startDate: new Date().toISOString().slice(0, 16)
    });
    setEditingId(null);
    setShowModal(true);
    setShowPreview(false);
  };

  const handleEdit = (announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type || 'General',
      targetType: announcement.targetType || 'ALL_CITIZENS',
      targetId: announcement.targetId?._id || announcement.targetId || '',
      priority: announcement.priority || 'Normal',
      startDate: announcement.startDate ? new Date(announcement.startDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      endDate: announcement.endDate ? new Date(announcement.endDate).toISOString().slice(0, 16) : '',
      isActive: announcement.isActive
    });
    setEditingId(announcement._id);
    setShowModal(true);
    setShowPreview(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      await axios.delete(`/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      alert("Failed to delete announcement.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (showPreview) {
      // Actually submit
      setLoading(true);
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;

      // Determine onModel based on targetType
      let onModel = 'Park';
      if (formData.targetType === 'CORPORATION') onModel = 'Corporation';
      if (formData.targetType === 'ZONE') onModel = 'Zone';
      if (formData.targetType === 'WARD') onModel = 'Ward';

      const payload = {
        ...formData,
        onModel,
        targetId: formData.targetId || null
      };

      try {
        if (editingId) {
          await axios.put(`/api/announcements/${editingId}`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else {
          await axios.post('/api/announcements', payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        fetchAnnouncements();
        setShowModal(false);
        setFormData(initialForm);
        setEditingId(null);
      } catch (error) {
        console.error("Error saving announcement:", error);
        alert("Failed to save announcement.");
      } finally {
        setLoading(false);
        setShowPreview(false);
      }
    } else {
      // Show preview
      setShowPreview(true);
    }
  };

  const getTargetLabel = (type, id) => {
    if (type === 'ALL_CITIZENS') return 'All Citizens';
    if (type === 'ALL_CONTRACTORS') return 'All Contractors';
    if (type === 'ALL_GOVERNMENT') return 'All Government';
    if (type === 'CORPORATION') return corporations.find(c => c._id === id)?.name || 'Specific Corporation';
    if (type === 'ZONE') return zones.find(z => z._id === id)?.name || 'Specific Zone';
    if (type === 'WARD') return wards.find(w => w._id === id)?.name || 'Specific Ward';
    if (type === 'PARK') return parks.find(p => p._id === id)?.name || 'Specific Park';
    return 'Unknown';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return { bg: '#dcfce7', text: '#16a34a' };
      case 'Scheduled': return { bg: '#fef3c7', text: '#d97706' };
      case 'Expired': return { bg: '#fee2e2', text: '#ef4444' };
      case 'Draft': return { bg: '#f1f5f9', text: '#64748b' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Megaphone size={24} /> Announcements Management
        </h3>
        <button className="btn-admin-add" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          <Plus size={16} /> Add Announcement
        </button>
      </div>

      <div className="admin-table-container" style={{ padding: '1rem' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>Title</th>
              <th style={{ padding: '0.75rem' }}>Type</th>
              <th style={{ padding: '0.75rem' }}>Target</th>
              <th style={{ padding: '0.75rem' }}>Priority</th>
              <th style={{ padding: '0.75rem' }}>Valid Until</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '1rem' }}>No announcements found.</td></tr>
            ) : (
              announcements.map(a => (
                <tr key={a._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{a.title}</td>
                  <td style={{ padding: '0.75rem' }}>{a.type || 'General'}</td>
                  <td style={{ padding: '0.75rem' }}>{getTargetLabel(a.targetType, a.targetId?._id || a.targetId)}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ 
                      color: a.priority === 'Urgent' ? '#ef4444' : a.priority === 'Important' ? '#f59e0b' : '#3b82f6',
                      fontWeight: '600' 
                    }}>
                      {a.priority || 'Normal'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {a.endDate ? new Date(a.endDate).toLocaleDateString() : 'Forever'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ 
                      fontSize: '0.8rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px',
                      color: getStatusColor(a.status).text, 
                      backgroundColor: getStatusColor(a.status).bg,
                    }}>{a.status || 'Active'}</span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-icon" onClick={() => handleEdit(a)}><Edit2 size={16} /></button>
                      <button className="btn-icon delete" onClick={() => handleDelete(a._id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form className="admin-modal" onSubmit={handleSubmit} style={{ backgroundColor: 'white', borderRadius: '8px', width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>{showPreview ? 'Announcement Preview' : (editingId ? 'Edit Announcement' : 'New Announcement')}</h4>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            {!showPreview ? (
              <div className="admin-modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Title *</label>
                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                  
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Content *</label>
                    <textarea name="content" value={formData.content} onChange={handleInputChange} required rows="4" style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}></textarea>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Type</label>
                    <select name="type" value={formData.type} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                      <option value="General">📢 General</option>
                      <option value="Park Closure">🚧 Park Closure</option>
                      <option value="Maintenance">🔧 Maintenance</option>
                      <option value="Emergency">⚠️ Emergency</option>
                      <option value="Event">📅 Event</option>
                      <option value="Information">ℹ️ Information</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Priority</label>
                    <select name="priority" value={formData.priority} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                      <option value="Normal">Normal</option>
                      <option value="Important">Important</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Target Audience *</label>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {[
                        { val: 'ALL_CITIZENS', label: 'All Citizens' },
                        { val: 'ALL_CONTRACTORS', label: 'All Contractors' },
                        { val: 'ALL_GOVERNMENT', label: 'All Government' },
                        { val: 'CORPORATION', label: 'Specific Corporation' },
                        { val: 'ZONE', label: 'Specific Zone' },
                        { val: 'WARD', label: 'Specific Ward' },
                        { val: 'PARK', label: 'Specific Park' }
                      ].map(type => (
                        <label key={type.val} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                          <input type="radio" name="targetType" value={type.val} checked={formData.targetType === type.val} onChange={handleInputChange} />
                          <span style={{ fontSize: '0.85rem' }}>{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {['CORPORATION', 'ZONE', 'WARD', 'PARK'].includes(formData.targetType) && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Select Target *</label>
                      <select name="targetId" value={formData.targetId} onChange={handleInputChange} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                        <option value="">Select an option...</option>
                        {formData.targetType === 'CORPORATION' && corporations.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        {formData.targetType === 'ZONE' && zones.map(z => <option key={z._id} value={z._id}>{z.name}</option>)}
                        {formData.targetType === 'WARD' && filteredWards.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                        {formData.targetType === 'PARK' && filteredParks.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Start Date</label>
                    <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleInputChange} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>End Date (Optional)</label>
                    <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="admin-modal-body" style={{ padding: '2rem', backgroundColor: '#f8fafc' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', border: formData.priority === 'Urgent' ? '2px solid #ef4444' : '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {formData.priority === 'Urgent' ? <AlertTriangle color="#ef4444" /> : <Megaphone color="#3b82f6" />}
                      <h3 style={{ margin: 0, color: formData.priority === 'Urgent' ? '#ef4444' : '#1e293b' }}>{formData.title}</h3>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '10px', backgroundColor: '#e0e7ff', color: '#4338ca' }}>
                      {formData.type}
                    </span>
                  </div>
                  
                  <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>{formData.content}</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Target Audience</span>
                      <strong style={{ color: '#1e293b' }}>📍 {getTargetLabel(formData.targetType, formData.targetId)}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Priority</span>
                      <strong style={{ color: formData.priority === 'Urgent' ? '#ef4444' : formData.priority === 'Important' ? '#f59e0b' : '#3b82f6' }}>⚠️ {formData.priority}</strong>
                    </div>
                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <CalendarIcon size={16} color="#64748b" />
                      <span style={{ color: '#475569' }}>
                        Valid: {new Date(formData.startDate).toLocaleString()} — {formData.endDate ? new Date(formData.endDate).toLocaleString() : 'Forever'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="admin-modal-actions" style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={() => showPreview ? setShowPreview(false) : setShowModal(false)} style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>
                {showPreview ? 'Back to Edit' : 'Cancel'}
              </button>
              
              <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', backgroundColor: showPreview ? '#10b981' : '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {loading ? 'Processing...' : (showPreview ? 'Publish Announcement' : 'Preview Announcement')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
