import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { Menu, ShieldAlert, Search, Settings, User } from 'lucide-react';
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
      navigate('/login');
    } else {
      try {
        setAdminUser(JSON.parse(storedUser));
      } catch (e) {}
    }
  }, [navigate]);

  return (
    <div className="app-layout admin-portal-layout">
      <header className="main-topbar adm-topbar">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={24} color="#A8B0C8" />
        </button>
        <div className="adm-topbar-inner">
          <div className="adm-topbar-brand">
            <ShieldAlert size={22} color="#4F6FF5" />
            <span className="logo-text">Parks Monitoring</span>
            <span className="adm-badge-portal">Admin</span>
          </div>
          <div className="adm-topbar-search">
            <Search size={16} color="#666E85" />
            <input type="text" placeholder="Search parks, complaints, staff..." />
          </div>
          <div className="adm-topbar-actions">
            {adminUser && <NotificationDropdown userId={adminUser.id || adminUser._id} role="admin" />}
            <button className="adm-topbar-icon-btn" onClick={() => navigate('/admin-dashboard/settings')} title="Settings">
              <Settings size={18} />
            </button>
            <div className="adm-topbar-avatar" title={adminUser?.name || 'Admin'}>
              <User size={16} />
            </div>
          </div>
        </div>
      </header>
      
      <AdminSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} closeSidebar={() => setIsSidebarOpen(false)} />
      
      <div className="main-content adm-main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
