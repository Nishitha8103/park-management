import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Trees, 
  FileText, 
  Bell, 
  User, 
  LogOut,
  Calendar,
  AlertOctagon,
  CalendarDays
} from 'lucide-react';
import '../components/Sidebar.css'; // Use existing project styling

const GovSidebar = ({ isOpen = false, toggleSidebar = () => {} }) => {
  const [userData, setUserData] = useState({
    name: 'Rajesh Kumar',
    role: 'Government Official',
    profilePic: null
  });

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUserData = () => {
      const stored = localStorage.getItem('govUser');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUserData({
            name: parsed.name || 'Government Official',
            role: 'Government Official',
            profilePic: parsed.profilePic || null
          });

          const userId = parsed._id || parsed.id;
          if (userId) {
            fetch(`/api/notifications?userId=${userId}&role=official`)
              .then(res => res.json())
              .then(data => {
                if (data && typeof data.unreadCount === 'number') {
                  setUnreadCount(data.unreadCount);
                }
              })
              .catch(err => console.error(err));
          }
        } catch (e) {
          console.error("Error parsing user data");
        }
      }
    };

    loadUserData();

    // Listen for localStorage updates (triggered when profile pic is saved) and notification changes
    window.addEventListener('storage', loadUserData);
    window.addEventListener('user-updated', loadUserData);
    window.addEventListener('notifications-updated', loadUserData);
    return () => {
      window.removeEventListener('storage', loadUserData);
      window.removeEventListener('user-updated', loadUserData);
      window.removeEventListener('notifications-updated', loadUserData);
    };
  }, []);

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={toggleSidebar}></div>
      <aside className={`sidebar gov-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="user-profile">
          <div className="avatar" style={{ overflow: 'hidden', borderRadius: '50%', backgroundColor: '#f3f4f6' }}>
            {userData.profilePic ? (
              <img src={userData.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <User size={20} />
            )}
          </div>
          <div className="user-info">
            <p className="user-name">{userData.name}</p>
            <p className="user-role">{userData.role}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/gov-dashboard" end className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          
          <NavLink to="/gov-dashboard/my-inspections" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Trees size={20} />
            <span>Assigned Inspections</span>
          </NavLink>

          <NavLink to="/gov-dashboard/schedule" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Calendar size={20} />
            <span>Work Schedule</span>
          </NavLink>

          <NavLink to="/gov-dashboard/notifications" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <Bell size={20} />
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {unreadCount}
                </span>
              )}
            </div>
          </NavLink>

          <NavLink to="/gov-dashboard/profile" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <User size={20} />
            <span>Profile</span>
          </NavLink>

          <NavLink to="/gov-dashboard/leaves" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <CalendarDays size={20} />
            <span>My Leaves</span>
          </NavLink>

          <NavLink to="/gov-dashboard/logout" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} style={{ marginTop: 'auto' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </NavLink>
        </nav>
      </aside>
    </>
  );
};

export default GovSidebar;
