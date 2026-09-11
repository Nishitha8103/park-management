import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import axios from 'axios';

const AdminDistricts = () => {
  const [districts, setDistricts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', status: 'Active' });
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDistricts = async () => {
    try {
      const res = await axios.get('/api/master/districts');
      setDistricts(res.data);
    } catch (error) {
      console.error("Error fetching districts", error);
    }
  };

  useEffect(() => {
    fetchDistricts();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    try {
      if (editId) {
        await axios.put(`/api/master/districts/${editId}`, formData, config);
      } else {
        await axios.post('/api/master/districts', formData, config);
      }
      fetchDistricts();
      closeModal();
    } catch (error) {
      alert("Error saving district");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this district?")) return;
    const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      await axios.delete(`/api/master/districts/${id}`, config);
      fetchDistricts();
    } catch (error) {
      alert("Error deleting district");
    }
  };

  const openEditModal = (district) => {
    setEditId(district._id);
    setFormData({ name: district.name, code: district.code, description: district.description || '', status: district.status });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormData({ name: '', code: '', description: '', status: 'Active' });
  };

  const filteredDistricts = districts.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h3>District Management</h3>
        <button className="btn-admin-add" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Add District
        </button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input 
          type="text" 
          placeholder="Search Districts..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '0.5rem', width: '300px', borderRadius: '4px', border: '1px solid #d1d5db' }}
        />
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDistricts.map(d => (
              <tr key={d._id}>
                <td>{d.name}</td>
                <td>{d.code}</td>
                <td><span className={`status-badge ${d.status.toLowerCase()}`}>{d.status}</span></td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon" onClick={() => openEditModal(d)}><Edit2 size={16} /></button>
                    <button className="btn-icon delete" onClick={() => handleDelete(d._id)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredDistricts.length === 0 && (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>No districts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>{editId ? 'Edit District' : 'Add New District'}</h4>
              <button className="btn-icon" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>District Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>District Code *</label>
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
                <button type="submit" className="btn-save">Save District</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDistricts;
