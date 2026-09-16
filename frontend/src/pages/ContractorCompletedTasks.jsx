import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, LogOut, HardHat, Search, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import './ContractorCompletedTasks.css';
import ContractorSidebar from '../components/ContractorSidebar';


const ContractorCompletedTasks = () => {
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPark, setFilterPark] = useState('All Parks');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('contractorUser');
    if (!storedUser) {
      navigate('/login');
    } else {
      const user = JSON.parse(storedUser);
      setContractor(user);

      const fetchJobs = async () => {
        try {
          const contractorId = user.id || user._id;
          const res = await fetch(`/api/complaints?contractorId=${contractorId}`);
          if (res.ok) {
            const data = await res.json();
            const completed = data.filter(c => 
              ['completed', 'completed - waiting for admin review', 'inspection pending', 'inspection approved', 'closed', 'verified'].includes(c.status?.toLowerCase())
            ).map(c => ({
              id: c.complaintNumber,
              _id: c._id,
              park: c.parkName || (c.park ? c.park.name : 'Unknown Park'),
              issue: c.category || 'Maintenance',
              date: c.completionDate ? new Date(c.completionDate).toLocaleDateString() : new Date(c.updatedAt).toLocaleDateString(),
              status: c.status
            }));
            setJobs(completed);
          }
        } catch (error) {
          console.error('Error fetching jobs:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchJobs();
    }
  }, [navigate]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('contractorUser');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const completedTasks = jobs;

  if (!contractor) return null;
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 'bold' }}>Loading completed tasks...</div>;

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
                <Bell size={22} style={{ color: '#475569' }} />
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 5px', borderRadius: '10px', minWidth: '16px', textAlign: 'center' }}>3</span>
              </div>
              <div className="contractor-user-details" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '0.5rem' }}>
                <h4 className="contractor-user-name" style={{ margin: 0 }}>{contractor.name}</h4>
                <p className="contractor-user-role" style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{contractor.department || 'General Maintenance'} Specialist</p>
              </div>
              <button className="btn-contractor-logout" onClick={handleLogout} style={{ marginLeft: '0.5rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </header>

        <div className="contractor-completed-tasks-page container">
          <div className="completed-tasks-container">
            
            <div className="completed-tasks-header">
              <h2>Completed Tasks</h2>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>{completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} completed</span>
            </div>

            <div className="completed-tasks-card">
              <h3>Completed Tasks</h3>

              <div className="completed-tasks-toolbar">
                <div className="search-wrapper">
                  <Search size={18} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search tasks..." 
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <select 
                  className="filter-select"
                  value={filterPark}
                  onChange={(e) => setFilterPark(e.target.value)}
                >
                  <option value="All Parks">All Parks</option>
                  <option value="Riverside Park">Riverside Park</option>
                  <option value="City Garden Park">City Garden Park</option>
                  <option value="Central Park">Central Park</option>
                  <option value="Green Valley Park">Green Valley Park</option>
                  <option value="Lake View Park">Lake View Park</option>
                </select>
              </div>

              <div className="completed-tasks-table-wrapper">
                <table className="completed-tasks-table">
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Park Name</th>
                      <th>Issue Type</th>
                      <th>Completed On</th>
                      <th>Inspection Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedTasks.map((task) => (
                      <tr key={task.id}>
                        <td className="col-task-id">{task.id}</td>
                        <td className="col-park-name">{task.park}</td>
                        <td className="col-issue-type">{task.issue}</td>
                        <td>{task.date}</td>
                        <td>
                          <span className="badge-approved">{task.status}</span>
                        </td>
                        <td>
                          <Link to={`/contractor/task/${task.id}`} className="btn-view-outline">View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="completed-tasks-footer">
                <div className="pagination-info">
                  Showing 1 to 5 of 5 completed tasks
                </div>
                <div className="pagination-controls">
                  <button className="page-btn" disabled>
                    <ChevronLeft size={16} />
                  </button>
                  <button className="page-btn active">1</button>
                  <button className="page-btn">2</button>
                  <button className="page-btn">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default ContractorCompletedTasks;

