import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, FileText, ClipboardCheck, Wrench, Clock, Eye, Menu, HardHat, LogOut, ChevronDown, Bell } from 'lucide-react';
import ContractorSidebar from '../components/ContractorSidebar';

import './ContractorReports.css';

const API_BASE = '/api';

const ContractorReports = () => {
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('contractorUser');
    if (!storedUser) {
      navigate('/contractor/login');
    } else {
      setContractor(JSON.parse(storedUser));
    }
  }, [navigate]);

  useEffect(() => {
    if (!contractor) return;
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/complaints?contractorId=${contractor._id || contractor.id}`);
        const data = await res.json();
        
        const source = Array.isArray(data) ? data : [];
        
        // Setup Notifications counter
        const newTasks = source.filter(c => ['Assigned', 'Reassigned to Contractor'].includes(c.status));
        setNotifications(newTasks);

        // Filter reports
        const completedJobs = source.filter(c => 
          ['Completed', 'Completed - Waiting for Admin Review', 'Inspection Pending', 'Inspection Approved', 'Closed'].includes(c.status)
        );

        setReports(completedJobs.map(c => ({
          id: c.complaintNumber,
          _id: c._id,
          park: c.parkName || (c.park ? c.park.name : 'Unknown Park'),
          type: c.category || 'Maintenance Report',
          date: new Date(c.createdAt).toLocaleDateString('en-GB'),
          status: c.status === 'Completed' || c.status === 'Completed - Waiting for Admin Review' ? 'Pending' : (c.status === 'Returned by Admin' || c.status === 'Rework Required' ? 'Rejected' : 'Verified'),
          submittedOn: new Date(c.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
        })));
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [contractor]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('contractorUser');
    navigate('/contractor/login');
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Verified': return 'badge-verified';
      case 'Pending': return 'badge-pending';
      case 'Rejected': return 'badge-rejected';
      default: return '';
    }
  };

  if (!contractor) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 'bold' }}>Verifying authorization...</div>;

  return (
    <div className="contractor-dashboard-page">
      <ContractorSidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        handleLogout={handleLogout} 
        contractor={contractor} 
      />
      
      <div className={`contractor-main-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="contractor-header">
          <div className="container contractor-header-content">
            <div className="contractor-brand">
              <button className="contractor-menu-toggle" onClick={toggleSidebar}>
                <Menu size={24} />
              </button>
              <HardHat size={28} className="contractor-text-primary" />
              <h1>PARK MAINTENANCE</h1>
              <span>Portal</span>
            </div>
            
            <div className="contractor-user-info" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div 
                className="header-notification-icon" 
                onClick={() => navigate('/contractor/notifications')}
                style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Bell size={22} style={{ color: '#e2e8f0' }} />
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 5px', borderRadius: '10px', minWidth: '16px', textAlign: 'center' }}>{notifications.length}</span>
              </div>
              <div className="contractor-user-details" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '0.5rem' }}>
                <h4 className="contractor-user-name" style={{ margin: 0 }}>{contractor.name}</h4>
                <p className="contractor-user-role" style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>{contractor.department || 'General Maintenance'} Specialist</p>
              </div>
              <button className="btn-contractor-logout" onClick={handleLogout} style={{ marginLeft: '0.5rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </header>

        <main className="container contractor-dashboard-container">
          <div className="reports-header-section">
            <h2 className="reports-page-title">Submitted Reports</h2>
            <div className="reports-breadcrumb">
              Home <span className="chevron">&gt;</span> Reports
            </div>
          </div>



          <div className="reports-stats-grid">
            <div className="reports-stat-card stat-total">
              <div className="stat-icon-wrapper total-icon">
                <FileText size={28} />
              </div>
              <div className="stat-info">
                <h3>{reports.length}</h3>
                <p>Total Reports<br/>Submitted</p>
              </div>
            </div>

            <div className="reports-stat-card stat-inspection">
              <div className="stat-icon-wrapper inspection-icon">
                <ClipboardCheck size={28} />
              </div>
              <div className="stat-info">
                <h3>{reports.filter(r => r.status === 'Verified').length}</h3>
                <p>Verified<br/>Reports</p>
              </div>
            </div>

            <div className="reports-stat-card stat-maintenance">
              <div className="stat-icon-wrapper maintenance-icon">
                <Wrench size={28} />
              </div>
              <div className="stat-info">
                <h3>{reports.filter(r => r.status === 'Rejected').length}</h3>
                <p>Rejected<br/>Reports</p>
              </div>
            </div>

            <div className="reports-stat-card stat-pending">
              <div className="stat-icon-wrapper pending-icon">
                <Clock size={28} />
              </div>
              <div className="stat-info">
                <h3>{reports.filter(r => r.status === 'Pending').length}</h3>
                <p>Pending Verification<br/>Reports</p>
              </div>
            </div>
          </div>

          <div className="reports-table-card">
            <h3 className="table-title">Reports List</h3>
            <div className="table-responsive">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Report ID</th>
                    <th>Park Name</th>
                    <th>Report Type</th>
                    <th>Report Date</th>
                    <th>Status</th>
                    <th>Submitted On</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading reports...</td>
                    </tr>
                  ) : reports.length > 0 ? (
                    reports.map((report, index) => (
                      <tr key={report.id}>
                        <td className="col-id">{index + 1}</td>
                        <td className="col-report-id" style={{ fontWeight: 'bold' }}>{report.id}</td>
                        <td className="col-park-name">{report.park}</td>
                        <td>{report.type}</td>
                        <td>{report.date}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(report.status)}`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="col-submitted-on">{report.submittedOn}</td>
                        <td>
                          <button className="btn-view-report" onClick={() => navigate(`/contractor/task/${report.id}`)}>
                            <Eye size={14} /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No reports submitted yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
        
        
      </div>
    </div>
  );
};

export default ContractorReports;
