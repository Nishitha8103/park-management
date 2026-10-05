import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { Menu, TreePine, Sun, Moon } from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import './MainLayout.css';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const navigate = useNavigate();

  const [adminUser, setAdminUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'dark');

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('adminTheme', nextTheme);
  };

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
    <div className={`app-layout admin-portal-layout ${theme === 'light' ? 'light-mode' : 'dark-mode'}`}>
      <header className="main-topbar adm-topbar">
        <button className="menu-toggle" onClick={toggleSidebar} title="Toggle Sidebar">
          <Menu size={24} color={theme === 'light' ? '#0f172a' : 'white'} />
        </button>
        <div className="adm-topbar-inner">
          <div className="adm-topbar-brand">
            <TreePine size={26} color={theme === 'light' ? '#16a34a' : '#4ade80'} />
            <span className="logo-text">Parks Monitoring System</span>
          </div>
          <div className="adm-topbar-actions">
            {adminUser && <NotificationDropdown userId={adminUser.id || adminUser._id} role="admin" />}
            <button 
              className="adm-topbar-icon-btn theme-toggle-btn" 
              onClick={toggleTheme} 
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun size={20} className="theme-icon sun-icon" />
              ) : (
                <Moon size={20} className="theme-icon moon-icon" />
              )}
            </button>
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
