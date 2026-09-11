import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './GovReports.css';

const GovReports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('All Dates');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const userStr = localStorage.getItem('govUser');
        if (!userStr) {
          navigate('/gov/login');
          return;
        }
        const user = JSON.parse(userStr);
        const userId = user._id || user.id;

        const res = await axios.get(`/api/complaints?officialId=${userId}`);
        
        // Show all assigned complaints, as the user expects to see their 6 assigned parks here
        setReports(res.data || []);
      } catch (error) {
        console.error('Failed to fetch inspection reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [navigate]);

  const getResultClass = (result) => {
    switch (result) {
      case 'Inspection Approved':
      case 'Closed':
      case 'Verified':
        return 'text-success'; // Green
      case 'Rework Required':
        return 'text-warning'; // Orange
      case 'Rejected':
      case 'Returned by Admin':
        return 'text-error'; // Red
      default:
        return 'text-primary';
    }
  };

  const getResultText = (status) => {
    switch (status) {
      case 'Inspection Approved':
      case 'Closed':
      case 'Verified':
        return 'Approved';
      case 'Rework Required':
        return 'Rework';
      case 'Returned by Admin':
        return 'Rejected';
      default:
        return status || 'Pending';
    }
  };

  // Basic filtering
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.complaintNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          report.parkName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.assignedContractor?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // date filtering could be added here if needed based on `dateFilter` state
    return matchesSearch;
  });

  return (
    <div className="inspection-reports-container">
      <h1 className="page-title mb-lg">Inspection Reports</h1>

      <div className="filters-container flex justify-between mb-md">
        <div className="search-box-wrapper" style={{ flex: '1', maxWidth: '400px' }}>
          <Search size={20} className="search-icon text-secondary" />
          <input 
            type="text" 
            className="input-field search-input"
            placeholder="Search reports..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="status-filter-wrapper" style={{ width: '200px' }}>
          <select 
            className="input-field select-input"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="All Dates">All Dates</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>
        </div>
      </div>

      <div className="card table-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Park Name</th>
                <th>Contractor</th>
                <th>Inspection Result</th>
                <th>Inspection Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading reports...</td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No inspection reports found.</td>
                </tr>
              ) : (
                filteredReports.map((item) => (
                  <tr key={item._id}>
                    <td className="font-semibold">{item.complaintNumber}</td>
                    <td>{item.parkName || (item.park && item.park.name) || 'N/A'}</td>
                    <td>{item.assignedContractor ? (item.assignedContractor.companyName || item.assignedContractor.contactPerson) : 'N/A'}</td>
                    <td className={`font-semibold ${getResultClass(item.status)}`}>{getResultText(item.status)}</td>
                    <td>{item.inspectionDate ? new Date(item.inspectionDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                    <td>
                      <div className="flex gap-sm items-center">
                        <span className="font-semibold text-primary" style={{cursor: 'pointer'}} onClick={() => navigate(`/gov-dashboard/inspections/${item._id}`)}>View</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="table-footer flex justify-between items-center">
          <p className="text-secondary" style={{fontSize: '0.9rem'}}>
            Showing {filteredReports.length > 0 ? 1 : 0} to {filteredReports.length} of {reports.length} reports
          </p>
          <div className="pagination flex gap-sm">
            <button className="page-btn"><ChevronLeft size={16} /></button>
            <button className="page-btn active">1</button>
            <button className="page-btn"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovReports;
