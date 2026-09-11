import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import axios from 'axios';

const AdminZones = () => {
  const [zones, setZones] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [corporations, setCorporations] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ districtId: '', corporationId: '', name: '', code: '', description: '', status: 'Active' });
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchZones = async () => {
    try {
      const res = await axios.get('/api/master/zones');
      setZones(res.data);
    } catch (error) {
      console.error("Error fetching zones", error);
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

  useEffect(() => {
    fetchZones();
    fetchDistricts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'districtId') {
      setFormData(prev => ({ ...prev, districtId: value, corporationId: '' }));
      if (value) fetchCorporations(value);
      else setCorporations([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.districtId || !formData.corporationId) return alert("Select district and corporation");
    const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    try {
      if (editId) {
        await axios.put(`/api/master/zones/${editId}`, formData, config);
      } else {
        await axios.post('/api/master/zones', formData, config);
      }
      fetchZones();
      closeModal();
    } catch (error) {
      alert("Error saving zone");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this zone?")) return;
    const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      await axios.delete(`/api/master/zones/${id}`, config);
      fetchZones();
    } catch (error) {
      alert("Error deleting zone");
    }
  };

  const openEditModal = async (zone) => {
    setEditId(zone._id);
    const distId = zone.districtId?._id || zone.districtId;
    if (distId) {
      await fetchCorporations(distId);
    }
    setFormData({ 
      districtId: distId,
      corporationId: zone.corporationId?._id || zone.corporationId,
      name: zone.name, 
      code: zone.code, 
      description: zone.description || '', 
      status: zone.status 
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormData({ districtId: '', corporationId: '', name: '', code: '', description: '', status: 'Active' });
    setCorporations([]);
  };

  const filteredZones = zones.filter(z => 
    z.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    z.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h3>Zone Management</h3>
        <button className="btn-admin-add" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add Zone
        </button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input 
          type="text" 
          placeholder="Search Zones..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '0.5rem', width: '300px', borderRadius: '4px', border: '1px solid #d1d5db' }}
        />
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>District</th>
              <th>Corporation</th>
              <th>Name</th>
              <th>Code</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredZones.map(z => (
              <tr key={z._id}>
                <td>{z.districtId?.name || 'Unknown'}</td>
                <td>{z.corporationId?.name || 'Unknown'}</td>
                <td>{z.name}</td>
                <td>{z.code}</td>
                <td><span className={`status-badge ${z.status.toLowerCase()}`}>{z.status}</span></td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => openEditModal(z)}><Edit2 size={16} /></button>
                    <button className="btn-icon delete" onClick={() => handleDelete(z._id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredZones.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>No zones found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>{editId ? 'Edit Zone' : 'Add New Zone'}</h4>
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
                <label>Zone Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Zone Code *</label>
                <input type="text" name="code" value={formData.code} onChange={handleInputChange} required />
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
                <button type="submit" className="btn-save">Save Zone</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminZones;
