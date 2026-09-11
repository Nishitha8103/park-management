import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import './GovMyParks.css';

const API_BASE = '/api';

const GovMyInspections = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        setLoading(true);
        setError('');

        // Get the logged-in government official from localStorage
        const stored = localStorage.getItem('govUser');
        if (!stored) {
          setError('Not logged in.');
          setLoading(false);
          return;
        }
        const user = JSON.parse(stored);
        const userId = user._id || user.id;

        // Fetch complaints assigned to this official
        const res = await fetch(`${API_BASE}/complaints?officialId=${userId}`);
        if (!res.ok) throw new Error('Failed to fetch inspections');
        const data = await res.json();

        // Filter: only show complaints that need inspection or are assigned to this official
        const filtered = Array.isArray(data) ? data : [];
        setInspections(filtered);
      } catch (err) {
        console.error(err);
        setError('Failed to load inspections. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInspections();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Verified':
      case 'Closed':
        return { color: '#16a34a', border: '1px solid #16a34a' };
      case 'Inspection Pending':
      case 'Completed':
        return { color: '#f97316', border: '1px solid #f97316' };
      case 'In Progress':
      case 'Started':
        return { color: '#2563eb', border: '1px solid #2563eb' };
      case 'Rejected':
        return { color: '#ef4444', border: '1px solid #ef4444' };
      default:
        return { color: '#64748b', border: '1px solid #64748b' };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="assigned-inspections-container">
      <div className="page-header flex items-center gap-sm">
        <ClipboardList size={28} className="text-primary" />
        <h1 className="page-title">My Assigned Inspections</h1>
      </div>

      <div className="card table-card">
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading inspections...</p>
        ) : error ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>{error}</p>
        ) : inspections.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            No inspections assigned to you yet.
          </p>
        ) : (
          <>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Complaint No.</th>
                    <th>Park Name</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Date Assigned</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.map(insp => (
                    <tr key={insp._id}>
                      <td style={{ fontWeight: 700, color: '#06402b' }}>{insp.complaintNumber}</td>
                      <td style={{ fontWeight: 500 }}>{insp.parkName || (insp.park?.name) || '—'}</td>
                      <td>{insp.category || '—'}</td>
                      <td>
                        <span style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          color: insp.priority === 'High' || insp.priority === 'Urgent' ? '#ef4444'
                            : insp.priority === 'Medium' ? '#f97316' : '#16a34a',
                          backgroundColor: insp.priority === 'High' || insp.priority === 'Urgent' ? '#fee2e2'
                            : insp.priority === 'Medium' ? '#ffedd5' : '#dcfce7',
                          border: `1px solid ${insp.priority === 'High' || insp.priority === 'Urgent' ? '#fca5a5'
                            : insp.priority === 'Medium' ? '#fdba74' : '#bbf7d0'}`
                        }}>
                          {insp.priority || 'Medium'}
                        </span>
                      </td>
                      <td>{formatDate(insp.updatedAt)}</td>
                      <td>
                        <span style={{
                          padding: '0.4rem 0.8rem',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          display: 'inline-block',
                          textAlign: 'center',
                          ...getStatusStyle(insp.status)
                        }}>
                          {insp.status}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/gov-dashboard/inspections/${insp._id}`}
                          className="btn-view"
                          style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <p className="text-secondary" style={{ fontSize: '0.9rem', margin: 0 }}>
                Showing {inspections.length} inspection{inspections.length !== 1 ? 's' : ''} assigned to you
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GovMyInspections;
