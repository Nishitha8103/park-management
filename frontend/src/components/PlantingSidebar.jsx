import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TreePine, 
  CheckSquare, 
  LogOut, 
  UserCheck
} from 'lucide-react';
import './AdminSidebar.css';

const PlantingSidebar = ({ isOpen = false, toggleSidebar = () => {}, closeSidebar = () => {} }) => {
  const [userData, setUserData] = useState({
    name: 'Planting Staff',
    role: 'Planting Staff',
  });

  useEffect(() => {
    const stored = localStorage.getItem('plantingUser') || localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserData({
          name: parsed.name || 'Planting Staff',
          role: parsed.role || 'Planting Staff',
        });
      } catch (e) {
        console.error("Error parsing user data");
      }
    }
  }, []);

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={toggleSidebar}></div>
      <aside className={`admin-sidebar sidebar ${isOpen ? 'open' : ''}`} style={{ backgroundColor: '#064e3b' }}>
        <div className="user-profile admin-profile" style={{ borderBottom: '1px solid #047857' }}>
          <div className="avatar" style={{ backgroundColor: '#065f46' }}>
            <UserCheck size={24} color="#34d399" />
          </div>
          <div className="user-info">
            <p className="user-name" style={{ color: 'white' }}>{userData.name}</p>
            <p className="user-role" style={{ color: '#6ee7b7' }}>{userData.role}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/planting-dashboard" end className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </NavLink>

          <NavLink to="/planting-dashboard/inventory" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <TreePine size={20} />
            <span>Flora & Tree Inventory</span>
          </NavLink>

          <NavLink to="/planting-dashboard/tasks" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <CheckSquare size={20} />
            <span>Plant Maintenance Tasks</span>
          </NavLink>

          <div className="nav-divider" style={{ borderTop: '1px solid #047857' }}></div>

          <NavLink to="/login" className="nav-item logout" onClick={() => {
            localStorage.removeItem('plantingUser');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            closeSidebar();
          }}>
            <LogOut size={20} color="#fca5a5" />
            <span style={{ color: '#fca5a5' }}>Logout</span>
          </NavLink>
        </nav>
      </aside>
    </>
  );
};

export default PlantingSidebar;
