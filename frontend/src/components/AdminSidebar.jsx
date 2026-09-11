import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Users, 
  Briefcase, 
  ClipboardCheck, 
  CheckCircle,
  Bell,
  FileBarChart,
  Settings,
  LogOut,
  UserCheck,
  TreePine,
  Megaphone,
  Calendar,
  Package,
  CreditCard
} from 'lucide-react';
import './AdminSidebar.css';

const AdminSidebar = ({ isOpen = false, toggleSidebar = () => {}, closeSidebar = () => {} }) => {
  const [userData, setUserData] = useState({
    name: 'Admin User',
    role: 'Admin',
  });

  useEffect(() => {
    const stored = localStorage.getItem('adminUser');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserData({
          name: parsed.name || 'Admin User',
          role: parsed.role || 'Admin',
        });
      } catch (e) {
        console.error("Error parsing admin data");
      }
    }
  }, []);

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={toggleSidebar}></div>
      <aside className={`admin-sidebar sidebar ${isOpen ? 'open' : ''}`}>
        <div className="user-profile admin-profile">
          <div className="avatar">
            <UserCheck size={24} color="#4f46e5" />
          </div>
          <div className="user-info">
            <p className="user-name">{userData.name}</p>
            <p className="user-role" style={{ color: '#818cf8' }}>{userData.role}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin-dashboard" end className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          

          
          <NavLink to="/admin-dashboard/parks" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <TreePine size={20} />
            <span>Parks Management</span>
          </NavLink>
          
          <NavLink to="/admin-dashboard/complaints" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <AlertTriangle size={20} />
            <span>Complaints</span>
          </NavLink>
          
          <NavLink to="/admin-dashboard/contractors" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <Briefcase size={20} />
            <span>Contractors</span>
          </NavLink>

          <NavLink to="/admin-dashboard/officials" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <Users size={20} />
            <span>Government Officials</span>
          </NavLink>
          
          <NavLink to="/admin-dashboard/announcements" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <Megaphone size={20} />
            <span>Announcements</span>
          </NavLink>
          
          <NavLink to="/admin-dashboard/events" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <Calendar size={20} />
            <span>Events</span>
          </NavLink>

          <NavLink to="/admin-dashboard/event-registrations" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <CreditCard size={20} />
            <span>Event Payments</span>
          </NavLink>

          <NavLink to="/admin-dashboard/stall-bookings" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <Briefcase size={20} />
            <span>Stall Bookings</span>
          </NavLink>

          <NavLink to="/admin-dashboard/stall-payments" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <CreditCard size={20} />
            <span>Stall Payments</span>
          </NavLink>

          <NavLink to="/admin-dashboard/material-requests" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <Package size={20} />
            <span>Material Requests</span>
          </NavLink>

          <NavLink to="/admin-dashboard/notifications" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <Bell size={20} />
            <span>Notifications</span>
          </NavLink>
          

          <div className="nav-divider"></div>
          
          <NavLink to="/admin-dashboard/settings" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>

          <NavLink to="/admin-dashboard/logout" className="nav-item logout" onClick={closeSidebar}>
            <LogOut size={20} color="#ef4444" />
            <span style={{ color: '#ef4444' }}>Logout</span>
          </NavLink>
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
