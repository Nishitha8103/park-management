import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import './GovMyParks.css';

const API_BASE = '/api';
const PAGE_SIZE = 6;

const GovMyParks = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        setLoading(true);
        setError('');

        const stored = localStorage.getItem('govUser');
        if (!stored) {
          setError('Not logged in.');
          setLoading(false);
          return;
        }
        const user = JSON.parse(stored);
        const userId = user._id || user.id;

        // Fetch only complaints assigned to this official
        const res = await fetch(`${API_BASE}/complaints?officialId=${userId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setInspections(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError('Failed to load inspections.');
      } finally {
        setLoading(false);
      }
    };

    fetchInspections();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case 'New': return 'status-pending';
      case 'Assigned': return 'status-pending';
      case 'Pending': return 'status-pending';
      case 'Started':
      case 'In Progress':
      case 'Waiting for Parts':
      case 'Inspection Pending': return 'status-in-progress';
      case 'Completed':
      case 'Verified':
      case 'Closed': return 'status-completed';
      case 'Rejected': return 'status-rework';
      default: return '';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  // Apply search & status filter
  const filtered = inspections.filter(item => {
    const matchSearch =
      !searchTerm ||
      (item.complaintNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.parkName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      statusFilter === 'All Status' ||
      item.status === statusFilter;

    return matchSearch && matchStatus;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  return (
    <div className="assigned-inspections-container">
      <div className="page-header flex items-center gap-sm">
        <ClipboardList size={28} className="text-primary" />
        <h1 className="page-title">Assigned Inspections</h1>
      </div>

      <div className="filters-container flex gap-md">
        <div className="search-box-wrapper flex-1">
          <Search size={20} className="search-icon text-secondary" />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Search by park, complaint ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="status-filter-wrapper">
          <select
            className="input-field select-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All Status">All Status</option>
            <option value="New">New</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Inspection Pending">Inspection Pending</option>
            <option value="Completed">Completed</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="card table-card">
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading inspections...</p>
        ) : error ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>{error}</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            {inspections.length === 0
              ? 'No inspections assigned to you yet.'
              : 'No results match your search/filter.'}
          </p>
        ) : (
          <>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Park Name</th>
                    <th>Contractor</th>
                    <th>Complaint Type</th>
                    <th>Assigned Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((item) => {
                    const contractor = item.assignedContractor;
                    const contractorName = contractor
                      ? (contractor.companyName || contractor.name || '—')
                      : 'Unassigned';

                    return (
                      <tr key={item._id}>
                        <td className="font-semibold text-primary">{item.complaintNumber}</td>
                        <td>{item.parkName || item.park?.name || '—'}</td>
                        <td>{contractorName}</td>
                        <td>{item.category || '—'}</td>
                        <td>{formatDate(item.updatedAt)}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-view"
                            onClick={() => navigate(`/gov-dashboard/inspections/${item._id}`)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="table-footer flex justify-between items-center">
              <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
                Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filtered.length)} to{' '}
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}{' '}
                inspection{filtered.length !== 1 ? 's' : ''}
              </p>
              {totalPages > 1 && (
                <div className="pagination flex gap-sm">
                  <button className="page-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`page-btn ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button className="page-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GovMyParks;
