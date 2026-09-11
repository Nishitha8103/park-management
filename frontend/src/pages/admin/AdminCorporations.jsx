import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import axios from 'axios';

const AdminCorporations = () => {
  const [corporations, setCorporations] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ districtId: '', name: '', code: '', description: '', status: 'Active' });
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCorporations = async () => {
    try {
      const res = await axios.get('/api/master/corporations');
      setCorporations(res.data);
    } catch (error) {
      console.error("Error fetching corporations", error);
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

  useEffect(() => {
    fetchCorporations();
    fetchDistricts();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.districtId) return alert("Select a district");
    const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    try {
      if (editId) {
        await axios.put(`/api/master/corporations/${editId}`, formData, config);
      } else {
        await axios.post('/api/master/corporations', formData, config);
      }
      fetchCorporations();
      closeModal();
    } catch (error) {
      alert("Error saving corporation");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this corporation?")) return;
    const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      await axios.delete(`/api/master/corporations/${id}`, config);
      fetchCorporations();
    } catch (error) {
      alert("Error deleting corporation");
    }
  };

  const openEditModal = (corp) => {
    setEditId(corp._id);
    setFormData({ 
      districtId: corp.districtId?._id || corp.districtId, 
      name: corp.name, 
      code: corp.code, 
      description: corp.description || '', 
      status: corp.status 
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormData({ districtId: '', name: '', code: '', description: '', status: 'Active' });
  };

  const filteredCorporations = corporations.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h3>Corporation Management</h3>
        <button className="btn-admin-add" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add Corporation
        </button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input 
          type="text" 
          placeholder="Search Corporations..." 
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
              <th>Name</th>
              <th>Code</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCorporations.map(c => (
              <tr key={c._id}>
                <td>{c.districtId?.name || 'Unknown'}</td>
                <td>{c.name}</td>
                <td>{c.code}</td>
                <td><span className={`status-badge ${c.status.toLowerCase()}`}>{c.status}</span></td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => openEditModal(c)}><Edit2 size={16} /></button>
                    <button className="btn-icon delete" onClick={() => handleDelete(c._id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCorporations.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>No corporations found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>{editId ? 'Edit Corporation' : 'Add New Corporation'}</h4>
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
                <label>Corporation Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Corporation Code *</label>
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
                <button type="submit" className="btn-save">Save Corporation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCorporations;
