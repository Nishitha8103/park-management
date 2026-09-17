import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContractorSidebar from '../components/ContractorSidebar';
import ContractorLeaveManagement from '../components/ContractorLeaveManagement';
import NotificationDropdown from '../components/NotificationDropdown';
import { Menu, HardHat, LogOut } from 'lucide-react';
import './ContractorDashboard.css';

const ContractorLeaves = () => {
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('contractorUser');
    if (!stored) {
      navigate('/contractor/login');
      return;
    }
    try {
      setContractor(JSON.parse(stored));
    } catch {
      navigate('/contractor/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('contractorUser');
    localStorage.removeItem('token');
    navigate('/contractor/login');
  };

  if (!contractor) return null;

  return (
    <div className="contractor-dashboard-page">
      <ContractorSidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        handleLogout={handleLogout}
        contractor={contractor}
      />

      <div className={`contractor-main-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Top Header Navigation */}
        <header className="contractor-header">
          <div className="container contractor-header-content">
            <div className="contractor-brand">
              <button className="contractor-menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                <Menu size={24} />
              </button>
              <HardHat size={28} className="contractor-text-primary" />
              <h1>PARK MAINTENANCE</h1>
              <span>Portal</span>
            </div>
            <div className="contractor-user-info">
              <NotificationDropdown userId={contractor._id || contractor.id} role="contractor" />
              <div className="contractor-user-details">
                <h4 className="contractor-user-name">{contractor.name}</h4>
                <p className="contractor-user-role">{contractor.department || 'Park Maintenance'} Specialist</p>
              </div>
              <button className="btn-contractor-logout" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="container contractor-dashboard-container" style={{ paddingTop: '1.25rem' }}>
          <ContractorLeaveManagement contractor={contractor} />
        </main>
      </div>
    </div>
  );
};

export default ContractorLeaves;
