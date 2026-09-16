import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import NotificationDropdown from '../components/NotificationDropdown';
import { Menu, TreePine, Bell, User } from 'lucide-react';
import './MainLayout.css';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem('user');
      let parsed = null;
      if (stored) {
        try {
          parsed = JSON.parse(stored);
        } catch (e) {
          parsed = null;
        }
      }
      setUser(parsed);
    };

    checkUser();
    window.addEventListener('user-updated', checkUser);
    window.addEventListener('storage', checkUser);
    return () => {
      window.removeEventListener('user-updated', checkUser);
      window.removeEventListener('storage', checkUser);
    };
  }, []);

  return (
    <div className="app-layout">
      <header className="main-topbar">
        <div className="topbar-left">
          <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle navigation menu">
            <Menu size={26} color="white" />
          </button>
          <Link to="/" className="topbar-logo" style={{ textDecoration: 'none', color: 'white' }}>
            <TreePine size={24} color="white" />
            <span className="logo-text">Parks Monitoring</span>
          </Link>
        </div>

        <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
          {user ? (
            <>
              <NotificationDropdown 
                userId={user._id || user.id || 'CITIZEN_GUEST'} 
                role="citizen" 
              />
              <Link 
                to="/profile" 
                className="topbar-user-link" 
                title="View Profile"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  color: 'white', 
                  textDecoration: 'none',
                  background: 'rgba(255,255,255,0.12)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.88rem',
                  fontWeight: 600
                }}
              >
                <User size={16} />
                <span className="user-name-span" style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name || 'Citizen'}
                </span>
              </Link>
            </>
          ) : (
            <Link 
              to="/notifications" 
              className="topbar-notif-btn" 
              title="Notification Center"
              style={{
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.12)'
              }}
            >
              <Bell size={20} />
            </Link>
          )}
        </div>
      </header>
      
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
