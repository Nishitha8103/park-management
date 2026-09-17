import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import GovSidebar from '../components/GovSidebar';
import { Menu, TreePine, Bell } from 'lucide-react';
import './MainLayout.css';
import './GovLayout.css';

const GovLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('govUser');
    if (!storedUser) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="app-layout gov-portal-layout">
      <header className="main-topbar gov-topbar">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={28} color="white" />
        </button>
        <div className="topbar-logo" style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TreePine size={28} color="#e5ede7" />
            <span className="logo-text">Parks Monitoring System</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginRight: '16px' }}>
            <div 
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => navigate('/gov-dashboard/notifications')}
              title="Notifications"
            >
              <Bell size={24} color="white" />
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#ef4444', color: 'white', fontSize: '10px', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</span>
            </div>
          </div>
        </div>
      </header>
      
      <GovSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="main-content gov-main-content-wrapper">
        <Outlet />
      </div>
    </div>
  );
};

export default GovLayout;
