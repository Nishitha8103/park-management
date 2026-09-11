import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Briefcase } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminContractors = () => {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchContractors = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      const res = await axios.get('/api/contractors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContractors(res.data);
    } catch (error) {
      console.error("Error fetching contractors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contractor?")) return;
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      await axios.delete(`/api/contractors/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchContractors();
    } catch (error) {
      console.error("Error deleting contractor:", error);
      alert("Failed to delete contractor.");
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Briefcase size={24} /> Contractor List
        </h3>
        <Link to="/admin-dashboard/contractors/add" className="btn-admin-add" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', backgroundColor: '#16A34A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', textDecoration: 'none' }}>
          <Plus size={16} /> Add Contractor
        </Link>
      </div>

      <div className="admin-table-container" style={{ padding: '1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading contractors...</div>
        ) : (
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e293b', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Contractor ID</th>
                <th style={{ padding: '0.75rem' }}>Full Name</th>
                <th style={{ padding: '0.75rem' }}>Email & Phone</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contractors.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>No contractors found.</td></tr>
              ) : (
                contractors.map(c => (
                  <tr key={c._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{c.contractorId}</td>
                    <td style={{ padding: '0.75rem' }}>{c.name}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.85rem' }}>{c.email}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{c.phone}</div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ 
                        fontSize: '0.8rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px',
                        color: c.status === 'Active' ? '#16A34A' : '#ef4444', 
                        backgroundColor: c.status === 'Active' ? '#dcfce7' : '#fee2e2',
                      }}>{c.status}</span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div className="action-buttons">
                        <button className="btn-icon" onClick={() => navigate(`/admin-dashboard/contractors/edit/${c._id}`)}><Edit2 size={16} /></button>
                        <button className="btn-icon delete" onClick={() => handleDelete(c._id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminContractors;
