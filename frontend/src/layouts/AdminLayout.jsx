import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { Menu, ShieldAlert } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import './MainLayout.css';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const navigate = useNavigate();

  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('adminUser');
    if (!storedUser) {
      navigate('/admin/login');
    } else {
      try {
        setAdminUser(JSON.parse(storedUser));
      } catch (e) {}
    }
  }, [navigate]);

  return (
    <div className="app-layout">
      <header className="main-topbar" style={{ backgroundColor: '#1e1b4b' }}>
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={28} color="white" />
        </button>
        <div className="topbar-logo" style={{ display: 'flex', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={28} color="white" />
            <span className="logo-text">Admin Portal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginRight: '16px' }}>
            {adminUser && <NotificationDropdown userId={adminUser.id || adminUser._id} role="admin" />}
          </div>
        </div>
      </header>
      
      <AdminSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} closeSidebar={() => setIsSidebarOpen(false)} />
      
      <div className="main-content" style={{ backgroundColor: 'transparent', padding: '1rem' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
