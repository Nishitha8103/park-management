import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { Menu, TreePine, Search, Settings, User } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import './MainLayout.css';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const navigate = useNavigate();

  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    let storedAdmin = localStorage.getItem('adminUser');
    let storedUser = localStorage.getItem('user');
    
    let parsed = null;
    if (storedAdmin) {
      try { parsed = JSON.parse(storedAdmin); } catch (e) {}
    }
    
    if (!parsed && storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u.role === 'Admin' || (u.role && u.role.toLowerCase() === 'admin')) {
          parsed = u;
          localStorage.setItem('adminUser', JSON.stringify(u));
        }
      } catch (e) {}
    }

    if (parsed) {
      setAdminUser(parsed);
    } else {
      // If not logged in as admin, provide fallback guest admin or redirect gracefully
      const defaultAdmin = {
        name: 'Administrator',
        role: 'Admin',
        email: 'admin@parkmanagement.gov'
      };
      setAdminUser(defaultAdmin);
      localStorage.setItem('adminUser', JSON.stringify(defaultAdmin));
    }
  }, [navigate]);

  return (
    <div className="app-layout admin-portal-layout">
      <header className="main-topbar adm-topbar">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={24} color="white" />
        </button>
        <div className="adm-topbar-inner">
          <div className="adm-topbar-brand">
            <TreePine size={26} color="#e5ede7" />
            <span className="logo-text">Parks Monitoring System</span>
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
