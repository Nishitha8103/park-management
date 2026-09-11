import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import axios from 'axios';

const AdminWards = () => {
  const [wards, setWards] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [corporations, setCorporations] = useState([]);
  const [zones, setZones] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ districtId: '', corporationId: '', zoneId: '', name: '', wardNumber: '', description: '', status: 'Active' });
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchWards = async () => {
    try {
      const res = await axios.get('/api/master/wards');
      setWards(res.data);
    } catch (error) {
      console.error("Error fetching wards", error);
    }
  };

  const fetchDistricts = async () => {
    try {
      const res = await axios.get('/api/master/districts');
      setDistricts(res.data);
    } catch (error) {
      console.error("Error fetching districts", error);
    }
  };

  const fetchCorporations = async (districtId) => {
    try {
      const res = await axios.get(`/api/master/corporations?districtId=${districtId}`);
      setCorporations(res.data);
    } catch (error) {
      console.error("Error fetching corporations", error);
    }
  };

  const fetchZones = async (corporationId) => {
    try {
      const res = await axios.get(`/api/master/zones?corporationId=${corporationId}`);
      setZones(res.data);
    } catch (error) {
      console.error("Error fetching zones", error);
    }
  };

  useEffect(() => {
    fetchWards();
    fetchDistricts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'districtId') {
      setFormData(prev => ({ ...prev, districtId: value, corporationId: '', zoneId: '' }));
      setZones([]);
      if (value) fetchCorporations(value);
      else setCorporations([]);
    }
    
    if (name === 'corporationId') {
      setFormData(prev => ({ ...prev, corporationId: value, zoneId: '' }));
      if (value) fetchZones(value);
      else setZones([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.districtId || !formData.corporationId || !formData.zoneId) return alert("Select district, corporation, and zone");
    const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    try {
      if (editId) {
        await axios.put(`/api/master/wards/${editId}`, formData, config);
      } else {
        await axios.post('/api/master/wards', formData, config);
      }
      fetchWards();
      closeModal();
    } catch (error) {
      alert("Error saving ward");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this ward?")) return;
    const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      await axios.delete(`/api/master/wards/${id}`, config);
      fetchWards();
    } catch (error) {
      alert("Error deleting ward");
    }
  };

  const openEditModal = async (ward) => {
    setEditId(ward._id);
    const distId = ward.districtId?._id || ward.districtId;
    const corpId = ward.corporationId?._id || ward.corporationId;
    
    if (distId) await fetchCorporations(distId);
    if (corpId) await fetchZones(corpId);
    
    setFormData({ 
      districtId: distId,
      corporationId: corpId,
      zoneId: ward.zoneId?._id || ward.zoneId,
      name: ward.name, 
      wardNumber: ward.wardNumber, 
      description: ward.description || '', 
      status: ward.status 
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormData({ districtId: '', corporationId: '', zoneId: '', name: '', wardNumber: '', description: '', status: 'Active' });
    setCorporations([]);
    setZones([]);
  };

  const filteredWards = wards.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.wardNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h3>Ward Management</h3>
        <button className="btn-admin-add" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add Ward
        </button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input 
          type="text" 
          placeholder="Search Wards..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '0.5rem', width: '300px', borderRadius: '4px', border: '1px solid #d1d5db' }}
        />
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Corporation</th>
              <th>Zone</th>
              <th>Name</th>
              <th>Ward No</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWards.map(w => (
              <tr key={w._id}>
                <td>{w.corporationId?.name || 'Unknown'}</td>
                <td>{w.zoneId?.name || 'Unknown'}</td>
                <td>{w.name}</td>
                <td>{w.wardNumber}</td>
                <td><span className={`status-badge ${w.status.toLowerCase()}`}>{w.status}</span></td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => openEditModal(w)}><Edit2 size={16} /></button>
                    <button className="btn-icon delete" onClick={() => handleDelete(w._id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredWards.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>No wards found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>{editId ? 'Edit Ward' : 'Add New Ward'}</h4>
              <button className="btn-icon" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>District *</label>
                <select name="districtId" value={formData.districtId} onChange={handleInputChange} required>
                  <option value="">Select District</option>
                  {districts.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Corporation *</label>
                <select name="corporationId" value={formData.corporationId} onChange={handleInputChange} required disabled={!formData.districtId}>
                  <option value="">Select Corporation</option>
                  {corporations.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Zone *</label>
                <select name="zoneId" value={formData.zoneId} onChange={handleInputChange} required disabled={!formData.corporationId}>
                  <option value="">Select Zone</option>
                  {zones.map(z => (
                    <option key={z._id} value={z._id}>{z.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Ward Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Ward Number *</label>
                <input type="text" name="wardNumber" value={formData.wardNumber} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-save">Save Ward</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWards;
