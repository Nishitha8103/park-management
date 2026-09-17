import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, Search, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const AdminOfficials = () => {
  const navigate = useNavigate();
  const [officials, setOfficials] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  


  // Sample data fallback if API returns empty
  const defaultOfficials = [
    { _id: '1', officialId: 'GOV-101', name: 'Ramesh Kumar', email: 'ramesh.gov@parks.in', phone: '+91 9876543210', department: 'Horticulture & Parks', designation: 'Senior Inspector', status: 'Active' },
    { _id: '2', officialId: 'GOV-102', name: 'Sita Sharma', email: 'sita.s@parks.in', phone: '+91 9876543211', department: 'Urban Forestry', designation: 'Zone Officer', status: 'Active' },
    { _id: '3', officialId: 'GOV-103', name: 'Anil Verma', email: 'anil.v@parks.in', phone: '+91 9876543212', department: 'Civic Maintenance', designation: 'Assistant Director', status: 'Active' },
  ];

  const fetchOfficials = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/auth/users?role=official').catch(() => ({ data: [] }));
      if (res.data && res.data.length > 0) {
        setOfficials(res.data);
      } else {
        setOfficials(defaultOfficials);
      }
    } catch (error) {
      console.error("Error fetching officials:", error);
      setOfficials(defaultOfficials);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficials();
  }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Official?',
      text: 'Are you sure you want to delete this Government Official?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!'
    });
    if (result.isConfirmed) {
      setOfficials(prev => prev.filter(o => o._id !== id));
      Swal.fire({
        title: 'Deleted!',
        text: 'Government Official removed.',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false
      });
    }
  };



  const filteredOfficials = officials.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.department && o.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-panel">
      <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={24} /> Government Official List
        </h3>
        <button onClick={() => navigate('/admin-dashboard/officials/add')} className="btn-admin-add" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', backgroundColor: '#4f6d54', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}>
          <Plus size={16} /> Add Official
        </button>
      </div>

      <div className="admin-table-container" style={{ padding: '1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading officials...</div>
        ) : (
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e293b', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Official ID</th>
                <th style={{ padding: '0.75rem' }}>Full Name</th>
                <th style={{ padding: '0.75rem' }}>Email & Phone</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {officials.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>No government officials found.</td></tr>
              ) : (
                officials.map(official => (
                  <tr key={official._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{official.username || 'GOV-000'}</td>
                    <td style={{ padding: '0.75rem' }}>{official.name}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.85rem' }}>{official.email}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{official.phone}</div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ 
                        fontSize: '0.8rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px',
                        color: official.status === 'Active' ? '#4f6d54' : '#ef4444', 
                        backgroundColor: official.status === 'Active' ? '#edf2ee' : '#fee2e2',
                        border: official.status === 'Active' ? '1px solid #cbd7cd' : '1px solid #fecaca',
                      }}>{official.status || 'Active'}</span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div className="action-buttons">
                        <button className="btn-icon" onClick={() => navigate(`/admin-dashboard/officials/edit/${official._id}`)}><Edit2 size={16} /></button>
                        <button className="btn-icon delete" onClick={() => handleDelete(official._id)}><Trash2 size={16} /></button>
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

export default AdminOfficials;
