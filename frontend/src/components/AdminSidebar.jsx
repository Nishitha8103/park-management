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
  CreditCard,
  AlertOctagon,
  CalendarDays,
  RotateCcw,
  MapPin,
  Building2,
  Grid3x3,
  ShieldCheck,
  Star,
  MessageSquareHeart
} from 'lucide-react';
import './AdminSidebar.css';

const AdminSidebar = ({ isOpen = false, toggleSidebar = () => {}, closeSidebar = () => {} }) => {
  const [userData, setUserData] = useState({
    name: 'Admin User',
    role: 'Administrator',
  });

  useEffect(() => {
    const stored = localStorage.getItem('adminUser');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserData({
          name: parsed.name || 'Admin User',
          role: parsed.role || 'Administrator',
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
            <UserCheck size={20} color="#fff" />
          </div>
          <div className="user-info">
            <p className="user-name">{userData.name}</p>
            <p className="user-role">{userData.role}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin-dashboard" end className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <div className="adm-nav-group-label">Park Management</div>
          
          <NavLink to="/admin-dashboard/parks" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <TreePine size={18} />
            <span>Parks</span>
          </NavLink>

          <div className="adm-nav-group-label">Operations</div>

          <NavLink to="/admin-dashboard/complaints" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <AlertTriangle size={18} />
            <span>Complaints</span>
          </NavLink>
          <NavLink to="/admin-dashboard/reassignments" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <RotateCcw size={18} />
            <span>Task Reassignments</span>
          </NavLink>
          <NavLink to="/admin-dashboard/contractors" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <Briefcase size={18} />
            <span>Contractors</span>
          </NavLink>
          <NavLink to="/admin-dashboard/officials" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <Users size={18} />
            <span>Government Officials</span>
          </NavLink>
          <NavLink to="/admin-dashboard/leaves" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <CalendarDays size={18} />
            <span>Leave Management</span>
          </NavLink>

          <div className="adm-nav-group-label">Communication</div>

          <NavLink to="/admin-dashboard/feedback" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <Star size={18} />
            <span>Public Feedback</span>
          </NavLink>
          <NavLink to="/admin-dashboard/notifications" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <Bell size={18} />
            <span>Notifications</span>
          </NavLink>
          <NavLink to="/admin-dashboard/announcements" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <Megaphone size={18} />
            <span>Announcements</span>
          </NavLink>

          <div className="adm-nav-group-label">Finance & Events</div>

          <NavLink to="/admin-dashboard/events" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <Calendar size={18} />
            <span>Events</span>
          </NavLink>
          <NavLink to="/admin-dashboard/event-registrations" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <CreditCard size={18} />
            <span>Event Payments</span>
          </NavLink>
          <NavLink to="/admin-dashboard/stall-bookings" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <Briefcase size={18} />
            <span>Stall Bookings</span>
          </NavLink>
          <NavLink to="/admin-dashboard/stall-payments" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <CreditCard size={18} />
            <span>Stall Payments</span>
          </NavLink>
          <NavLink to="/admin-dashboard/material-requests" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <Package size={18} />
            <span>Material Requests</span>
          </NavLink>

          <div className="nav-divider"></div>

          <NavLink to="/admin-dashboard/settings" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={closeSidebar}>
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>

          <NavLink to="/admin-dashboard/logout" className="nav-item logout" onClick={closeSidebar}>
            <LogOut size={18} />
            <span>Logout</span>
          </NavLink>
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;

