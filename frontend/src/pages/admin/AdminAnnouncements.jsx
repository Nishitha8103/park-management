import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Megaphone, Calendar as CalendarIcon, Clock, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Data for dependent dropdowns
  const [corporations, setCorporations] = useState([]);
  const [zones, setZones] = useState([]);
  const [wards, setWards] = useState([]);
  const [parks, setParks] = useState([]);

  // Location selector state
  const [selectedCorp, setSelectedCorp] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedPark, setSelectedPark] = useState('');

  const initialForm = {
    title: '',
    content: '',
    type: 'General',
    targetType: 'ALL_CITIZENS',
    targetId: '',
    priority: 'Normal',
    duration: 'Full Day',
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
      
      const [corpRes, zoneRes, wardRes, parkRes] = await Promise.all([
        axios.get('/api/master/corporations', { headers }).catch(() => ({ data: [] })),
        axios.get('/api/master/zones', { headers }),
        axios.get('/api/master/wards', { headers }),
        axios.get('/api/parks', { headers })
      ]);
      
      setCorporations(corpRes.data || []);
      setZones(zoneRes.data || []);
      setWards(wardRes.data || []);
      setParks(parkRes.data || []);
    } catch (err) {
      console.error("Failed to load master data", err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchMasterData();
  }, []);

  // Filtered dropdown lists based on hierarchical selections
  const availableZones = zones.filter(z => {
    if (!selectedCorp) return true;
    const zCorpId = z.corporationId?._id || z.corporationId || z.corporation;
    return zCorpId === selectedCorp;
  });

  const availableWards = wards.filter(w => {
    if (selectedZone) {
      const wZoneId = w.zoneId?._id || w.zoneId || w.zone;
      if (wZoneId !== selectedZone) return false;
    }
    if (selectedCorp) {
      const wCorpId = w.corporationId?._id || w.corporationId || w.corporation;
      if (wCorpId && wCorpId !== selectedCorp) return false;
    }
    return true;
  });

  const availableParks = parks.filter(p => {
    if (selectedWard) {
      const pWardId = p.ward?._id || p.ward;
      if (pWardId !== selectedWard) return false;
    }
    if (selectedZone) {
      const pZoneId = p.zone?._id || p.zone;
      if (pZoneId !== selectedZone) return false;
    }
    if (selectedCorp) {
      const pCorpId = p.corporation?._id || p.corporation;
      if (pCorpId && pCorpId !== selectedCorp) return false;
    }
    return true;
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      
      // If targetType changed, sync targetId
      if (name === 'targetType') {
        if (value === 'CORPORATION') updated.targetId = selectedCorp;
        else if (value === 'ZONE') updated.targetId = selectedZone;
        else if (value === 'WARD') updated.targetId = selectedWard;
        else if (value === 'PARK') updated.targetId = selectedPark;
        else updated.targetId = '';
      }
      
      return updated;
    });
  };

  // Location selector handlers
  const handleCorpChange = (corpId) => {
    setSelectedCorp(corpId);
    setSelectedZone('');
    setSelectedWard('');
    setSelectedPark('');
    
    if (corpId) {
      if (['ALL_CITIZENS', 'ALL_CONTRACTORS', 'ALL_GOVERNMENT', 'CORPORATION'].includes(formData.targetType)) {
        setFormData(prev => ({ ...prev, targetType: 'CORPORATION', targetId: corpId }));
      } else {
        setFormData(prev => ({ ...prev, targetId: '' }));
      }
    } else {
      if (formData.targetType === 'CORPORATION') {
        setFormData(prev => ({ ...prev, targetId: '' }));
      }
    }
  };

  const handleZoneChange = (zoneId) => {
    setSelectedZone(zoneId);
    setSelectedWard('');
    setSelectedPark('');

    // If a zone is chosen, auto-select its corporation if not set
    if (zoneId && !selectedCorp) {
      const matchedZone = zones.find(z => z._id === zoneId);
      const parentCorp = matchedZone?.corporationId?._id || matchedZone?.corporationId;
      if (parentCorp) setSelectedCorp(parentCorp);
    }

    if (zoneId) {
      if (['ALL_CITIZENS', 'ALL_CONTRACTORS', 'ALL_GOVERNMENT', 'CORPORATION', 'ZONE'].includes(formData.targetType)) {
        setFormData(prev => ({ ...prev, targetType: 'ZONE', targetId: zoneId }));
      } else {
        setFormData(prev => ({ ...prev, targetId: '' }));
      }
    } else {
      if (formData.targetType === 'ZONE') {
        setFormData(prev => ({ ...prev, targetId: selectedCorp ? selectedCorp : '', targetType: selectedCorp ? 'CORPORATION' : 'ALL_CITIZENS' }));
      }
    }
  };

  const handleWardChange = (wardId) => {
    setSelectedWard(wardId);
    setSelectedPark('');

    // If a ward is chosen, auto-fill its zone & corporation
    if (wardId) {
      const matchedWard = wards.find(w => w._id === wardId);
      const parentZone = matchedWard?.zoneId?._id || matchedWard?.zoneId;
      const parentCorp = matchedWard?.corporationId?._id || matchedWard?.corporationId;
      if (parentZone && !selectedZone) setSelectedZone(parentZone);
      if (parentCorp && !selectedCorp) setSelectedCorp(parentCorp);
    }

    if (wardId) {
      if (['ALL_CITIZENS', 'ALL_CONTRACTORS', 'ALL_GOVERNMENT', 'CORPORATION', 'ZONE', 'WARD'].includes(formData.targetType)) {
        setFormData(prev => ({ ...prev, targetType: 'WARD', targetId: wardId }));
      } else {
        setFormData(prev => ({ ...prev, targetId: '' }));
      }
    } else {
      if (formData.targetType === 'WARD') {
        setFormData(prev => ({ ...prev, targetId: selectedZone ? selectedZone : (selectedCorp ? selectedCorp : ''), targetType: selectedZone ? 'ZONE' : (selectedCorp ? 'CORPORATION' : 'ALL_CITIZENS') }));
      }
    }
  };

  const handleParkChange = (parkId) => {
    setSelectedPark(parkId);

    // If a park is chosen, auto-fill its ward, zone & corporation
    if (parkId) {
      const matchedPark = parks.find(p => p._id === parkId);
      const pWard = matchedPark?.ward?._id || matchedPark?.ward;
      const pZone = matchedPark?.zone?._id || matchedPark?.zone;
      const pCorp = matchedPark?.corporation?._id || matchedPark?.corporation;
      if (pWard && !selectedWard) setSelectedWard(pWard);
      if (pZone && !selectedZone) setSelectedZone(pZone);
      if (pCorp && !selectedCorp) setSelectedCorp(pCorp);

      setFormData(prev => ({ ...prev, targetType: 'PARK', targetId: parkId }));
    } else {
      if (formData.targetType === 'PARK') {
        setFormData(prev => ({ ...prev, targetId: selectedWard ? selectedWard : (selectedZone ? selectedZone : (selectedCorp ? selectedCorp : '')), targetType: selectedWard ? 'WARD' : (selectedZone ? 'ZONE' : (selectedCorp ? 'CORPORATION' : 'ALL_CITIZENS')) }));
      }
    }
  };

  const handleAdd = () => {
    setFormData({
      ...initialForm,
      startDate: new Date().toISOString().slice(0, 16)
    });
    setSelectedCorp('');
    setSelectedZone('');
    setSelectedWard('');
    setSelectedPark('');
    setEditingId(null);
    setShowModal(true);
    setShowPreview(false);
  };

  const handleEdit = (announcement) => {
    const rawTargetId = announcement.targetId?._id || announcement.targetId || '';
    const tType = announcement.targetType || 'ALL_CITIZENS';
    
    // Populate hierarchy according to targetType
    let cId = '';
    let zId = '';
    let wId = '';
    let pId = '';

    if (tType === 'CORPORATION') {
      cId = rawTargetId;
    } else if (tType === 'ZONE') {
      zId = rawTargetId;
      const zObj = zones.find(z => z._id === rawTargetId);
      cId = zObj?.corporationId?._id || zObj?.corporationId || '';
    } else if (tType === 'WARD') {
      wId = rawTargetId;
      const wObj = wards.find(w => w._id === rawTargetId);
      zId = wObj?.zoneId?._id || wObj?.zoneId || '';
      cId = wObj?.corporationId?._id || wObj?.corporationId || '';
    } else if (tType === 'PARK') {
      pId = rawTargetId;
      const pObj = parks.find(p => p._id === rawTargetId);
      wId = pObj?.ward?._id || pObj?.ward || '';
      zId = pObj?.zone?._id || pObj?.zone || '';
      cId = pObj?.corporation?._id || pObj?.corporation || '';
    }

    setSelectedCorp(cId);
    setSelectedZone(zId);
    setSelectedWard(wId);
    setSelectedPark(pId);

    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type || 'General',
      targetType: tType,
      targetId: rawTargetId,
      priority: announcement.priority || 'Normal',
      duration: announcement.duration || 'Full Day',
      startDate: announcement.startDate ? new Date(announcement.startDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      endDate: announcement.endDate ? new Date(announcement.endDate).toISOString().slice(0, 16) : '',
      isActive: announcement.isActive
    });
    setEditingId(announcement._id);
    setShowModal(true);
    setShowPreview(false);
  };

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteAction = async () => {
    if (!deleteConfirmId) return;
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      await axios.delete(`/api/announcements/${deleteConfirmId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast("Announcement deleted successfully!", "success");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      showToast("Failed to delete announcement.", "error");
    } finally {
      setDeleteConfirmId(null);
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
          showToast("Announcement updated successfully!", "success");
        } else {
          await axios.post('/api/announcements', payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showToast("Announcement created successfully!", "success");
        }
        fetchAnnouncements();
        setShowModal(false);
        setFormData(initialForm);
        setEditingId(null);
      } catch (error) {
        console.error("Error saving announcement:", error);
        showToast("Failed to save announcement.", "error");
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
        <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <form className="admin-modal" onSubmit={handleSubmit} style={{ backgroundColor: '#1E2438', color: '#F0F4FF', borderRadius: '12px', width: '640px', maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1A2035' }}>
              <h4 style={{ margin: 0, color: '#F0F4FF', fontSize: '1.15rem', fontWeight: 700 }}>
                {showPreview ? 'Announcement Preview' : (editingId ? 'Edit Announcement' : 'New Announcement')}
              </h4>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8B0C8' }}>
                <X size={20} />
              </button>
            </div>
            
            {!showPreview ? (
              <div className="admin-modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#CBD5E1' }}>Title *</label>
                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} required style={{ width: '100%', padding: '0.7rem 0.9rem', background: '#151A2B', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#F0F4FF', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#CBD5E1' }}>Content *</label>
                    <textarea name="content" value={formData.content} onChange={handleInputChange} required rows="4" style={{ width: '100%', padding: '0.7rem 0.9rem', background: '#151A2B', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#F0F4FF', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}></textarea>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#CBD5E1' }}>Type</label>
                    <select name="type" value={formData.type} onChange={handleInputChange} style={{ width: '100%', padding: '0.7rem 0.9rem', background: '#151A2B', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#F0F4FF', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}>
                      <option value="General">📢 General</option>
                      <option value="Park Closure">🚧 Park Closure</option>
                      <option value="Maintenance">🔧 Maintenance</option>
                      <option value="Emergency">⚠️ Emergency</option>
                      <option value="Event">📅 Event</option>
                      <option value="Information">ℹ️ Information</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#CBD5E1' }}>Priority</label>
                    <select name="priority" value={formData.priority} onChange={handleInputChange} style={{ width: '100%', padding: '0.7rem 0.9rem', background: '#151A2B', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#F0F4FF', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}>
                      <option value="Normal">Normal</option>
                      <option value="Important">Important</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: 600, fontSize: '0.85rem', color: '#CBD5E1' }}>Target Audience Scope *</label>
                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                      {[
                        { val: 'ALL_CITIZENS', label: 'All Citizens' },
                        { val: 'ALL_CONTRACTORS', label: 'All Contractors' },
                        { val: 'ALL_GOVERNMENT', label: 'All Government' },
                        { val: 'CORPORATION', label: 'Specific Corporation' },
                        { val: 'ZONE', label: 'Specific Zone' },
                        { val: 'WARD', label: 'Specific Ward' },
                        { val: 'PARK', label: 'Specific Park' }
                      ].map(type => (
                        <label key={type.val} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#F0F4FF', fontSize: '0.88rem' }}>
                          <input type="radio" name="targetType" value={type.val} checked={formData.targetType === type.val} onChange={handleInputChange} />
                          <span>{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Always Visible Hierarchical Location / Target Selectors */}
                  <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: '#131826', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#93C5FD' }}>
                        📍 Select Location Filters (Corporation, Zone, Ward, Park)
                      </span>
                      {['CORPORATION', 'ZONE', 'WARD', 'PARK'].includes(formData.targetType) && (
                        <span style={{ fontSize: '0.75rem', color: '#34D399', background: 'rgba(52, 211, 153, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                          Targeting: {formData.targetType}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.8rem', color: '#CBD5E1' }}>
                          🏛️ Corporation {formData.targetType === 'CORPORATION' && <span style={{ color: '#ef4444' }}>*</span>}
                        </label>
                        <select 
                          value={selectedCorp} 
                          onChange={(e) => handleCorpChange(e.target.value)} 
                          required={formData.targetType === 'CORPORATION'}
                          style={{ width: '100%', padding: '0.65rem 0.8rem', background: '#151A2B', border: formData.targetType === 'CORPORATION' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#F0F4FF', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                        >
                          <option value="">-- All Corporations --</option>
                          {corporations.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.8rem', color: '#CBD5E1' }}>
                          🗺️ Zone {formData.targetType === 'ZONE' && <span style={{ color: '#ef4444' }}>*</span>}
                        </label>
                        <select 
                          value={selectedZone} 
                          onChange={(e) => handleZoneChange(e.target.value)} 
                          required={formData.targetType === 'ZONE'}
                          style={{ width: '100%', padding: '0.65rem 0.8rem', background: '#151A2B', border: formData.targetType === 'ZONE' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#F0F4FF', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                        >
                          <option value="">-- All Zones --</option>
                          {availableZones.map(z => <option key={z._id} value={z._id}>{z.name}</option>)}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.8rem', color: '#CBD5E1' }}>
                          📍 Ward {formData.targetType === 'WARD' && <span style={{ color: '#ef4444' }}>*</span>}
                        </label>
                        <select 
                          value={selectedWard} 
                          onChange={(e) => handleWardChange(e.target.value)} 
                          required={formData.targetType === 'WARD'}
                          style={{ width: '100%', padding: '0.65rem 0.8rem', background: '#151A2B', border: formData.targetType === 'WARD' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#F0F4FF', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                        >
                          <option value="">-- All Wards --</option>
                          {availableWards.map(w => <option key={w._id} value={w._id}>{w.name} {w.wardNumber ? `(#${w.wardNumber})` : ''}</option>)}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.8rem', color: '#CBD5E1' }}>
                          🌳 Park {formData.targetType === 'PARK' && <span style={{ color: '#ef4444' }}>*</span>}
                        </label>
                        <select 
                          value={selectedPark} 
                          onChange={(e) => handleParkChange(e.target.value)} 
                          required={formData.targetType === 'PARK'}
                          style={{ width: '100%', padding: '0.65rem 0.8rem', background: '#151A2B', border: formData.targetType === 'PARK' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#F0F4FF', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                        >
                          <option value="">-- All Parks --</option>
                          {availableParks.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Duration Selector */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: 600, fontSize: '0.85rem', color: '#CBD5E1' }}>Duration</label>
                    <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                      {[
                        { val: 'Full Day', label: 'Full Day' },
                        { val: 'Half Day – Morning', label: 'Half Day – Morning' },
                        { val: 'Half Day – Afternoon', label: 'Half Day – Afternoon' }
                      ].map(d => {
                        const isSelected = (formData.duration || 'Full Day') === d.val;
                        return (
                          <label
                            key={d.val}
                            onClick={() => setFormData(prev => ({ ...prev, duration: d.val }))}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              padding: '0.6rem 1.1rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              border: isSelected ? '1.5px solid #10b981' : '1px solid rgba(255,255,255,0.15)',
                              backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.12)' : '#151A2B',
                              color: isSelected ? '#34d399' : '#CBD5E1',
                              fontWeight: isSelected ? 600 : 500,
                              fontSize: '0.88rem',
                              transition: 'all 0.2s ease',
                              userSelect: 'none'
                            }}
                          >
                            <input
                              type="radio"
                              name="duration"
                              value={d.val}
                              checked={isSelected}
                              onChange={() => setFormData(prev => ({ ...prev, duration: d.val }))}
                              style={{
                                accentColor: '#10b981',
                                width: '16px',
                                height: '16px',
                                cursor: 'pointer'
                              }}
                            />
                            <span>{d.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#CBD5E1' }}>Start Date</label>
                    <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleInputChange} required style={{ width: '100%', padding: '0.7rem 0.9rem', background: '#151A2B', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#F0F4FF', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem', color: '#CBD5E1' }}>End Date (Optional)</label>
                    <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleInputChange} style={{ width: '100%', padding: '0.7rem 0.9rem', background: '#151A2B', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#F0F4FF', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="admin-modal-body" style={{ padding: '2rem', backgroundColor: '#151A2B' }}>
                <div style={{ backgroundColor: '#1E2438', borderRadius: '10px', padding: '1.5rem', border: formData.priority === 'Urgent' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {formData.priority === 'Urgent' ? <AlertTriangle color="#ef4444" /> : <Megaphone color="#3b82f6" />}
                      <h3 style={{ margin: 0, color: formData.priority === 'Urgent' ? '#f87171' : '#F0F4FF', fontSize: '1.2rem' }}>{formData.title}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        ⏱️ {formData.duration || 'Full Day'}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
                        {formData.type}
                      </span>
                    </div>
                  </div>
                  
                  <p style={{ color: '#CBD5E1', lineHeight: 1.6, marginBottom: '1.5rem', whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{formData.content}</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#151A2B', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                      <span style={{ color: '#A8B0C8', display: 'block', marginBottom: '0.25rem' }}>Target Audience</span>
                      <strong style={{ color: '#F0F4FF' }}>📍 {getTargetLabel(formData.targetType, formData.targetId)}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#A8B0C8', display: 'block', marginBottom: '0.25rem' }}>Priority & Duration</span>
                      <strong style={{ color: formData.priority === 'Urgent' ? '#f87171' : formData.priority === 'Important' ? '#fbbf24' : '#60a5fa' }}>
                        ⚠️ {formData.priority} • ⏱️ {formData.duration || 'Full Day'}
                      </strong>
                    </div>
                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <CalendarIcon size={16} color="#A8B0C8" />
                      <span style={{ color: '#CBD5E1' }}>
                        Valid: {new Date(formData.startDate).toLocaleString()} — {formData.endDate ? new Date(formData.endDate).toLocaleString() : 'Forever'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="admin-modal-actions" style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#1A2035', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={() => showPreview ? setShowPreview(false) : setShowModal(false)} style={{ padding: '0.65rem 1.25rem', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#CBD5E1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                {showPreview ? 'Back to Edit' : 'Cancel'}
              </button>
              
              <button type="submit" disabled={loading} style={{ padding: '0.65rem 1.5rem', backgroundColor: showPreview ? '#32C48D' : '#4F6FF5', color: showPreview ? '#064e3b' : 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                {loading ? 'Processing...' : (showPreview ? 'Publish Announcement' : 'Preview Announcement')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Custom Delete Confirmation Popup Modal */}
      {deleteConfirmId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#1E2438', color: '#F0F4FF', borderRadius: '14px', width: '420px', maxWidth: '100%', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.25rem auto' }}>
                <AlertTriangle size={28} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 700, color: '#F0F4FF' }}>
                Delete Announcement?
              </h3>
              <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Are you sure you want to delete this announcement? This action cannot be undone.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem 1.5rem', backgroundColor: '#151A2B', borderTop: '1px solid rgba(255,255,255,0.08)', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: '0.6rem 1.2rem',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#CBD5E1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAction}
                style={{
                  padding: '0.6rem 1.2rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1200,
          backgroundColor: toastMessage.type === 'error' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          padding: '0.85rem 1.4rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          fontWeight: 600,
          fontSize: '0.92rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {toastMessage.type === 'error' ? '⚠️' : '✓'} {toastMessage.text}
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;

