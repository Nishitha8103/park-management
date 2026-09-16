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
    <div className="contractor-dashboard">
      <ContractorSidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        handleLogout={handleLogout}
        contractor={contractor}
      />

      <div className="contractor-main">
        {/* Top Bar */}
        <header className="contractor-topbar">
          <div className="contractor-topbar-left">
            <button className="contractor-menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={24} />
            </button>
            <HardHat size={24} color="#16a34a" />
            <h1 className="contractor-topbar-title">Leave & Availability</h1>
          </div>
          <div className="contractor-topbar-right">
            <NotificationDropdown userId={contractor._id || contractor.id} role="contractor" />
            <button className="contractor-logout-topbar" onClick={handleLogout}>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
          <ContractorLeaveManagement contractor={contractor} />
        </div>
      </div>
    </div>
  );
};

export default ContractorLeaves;
