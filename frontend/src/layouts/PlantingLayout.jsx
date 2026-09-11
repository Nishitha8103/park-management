import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import PlantingSidebar from '../components/PlantingSidebar';
import { Menu, TreePine } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import './MainLayout.css';

const PlantingLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const navigate = useNavigate();

  const [plantingUser, setPlantingUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('plantingUser') || localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      try {
        const parsed = JSON.parse(storedUser);
        setPlantingUser(parsed);
      } catch (e) {}
    }
  }, [navigate]);

  return (
    <div className="app-layout">
      <header className="main-topbar" style={{ backgroundColor: '#065f46' }}>
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={28} color="white" />
        </button>
        <div className="topbar-logo" style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TreePine size={28} color="#6ee7b7" />
            <span className="logo-text">Planting & Flora Portal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginRight: '16px' }}>
            {plantingUser && <NotificationDropdown userId={plantingUser.id || plantingUser._id} role="planting" />}
          </div>
        </div>
      </header>
      
      <PlantingSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} closeSidebar={() => setIsSidebarOpen(false)} />
      
      <div className="main-content" style={{ backgroundColor: '#f0fdf4', padding: '1.5rem', minHeight: 'calc(100vh - 60px)' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default PlantingLayout;
