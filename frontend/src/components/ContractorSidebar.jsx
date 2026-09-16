import { NavLink } from 'react-router-dom';
import { TreePine, Home, ClipboardList, CheckCircle, FileText, Bell, User, LogOut, Calendar, Package, CalendarDays } from 'lucide-react';
import './ContractorSidebar.css';

const ContractorSidebar = ({ isOpen, toggleSidebar, handleLogout, contractor }) => {
  return (
    <>
      <div className={`contractor-sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={toggleSidebar}></div>
      <aside className={`contractor-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="contractor-sidebar-header">
          <TreePine size={32} color="white" />
          <h2>Parks<br/>Monitoring System</h2>
        </div>

        <div className="contractor-sidebar-user">
          <div className="contractor-sidebar-avatar">
            <User size={24} />
          </div>
          <div className="contractor-sidebar-user-info">
            <p className="name">{contractor?.name || 'ABC Maintenance'}</p>
            <p className="role">Contractor</p>
          </div>
        </div>

        <nav className="contractor-nav">
           <NavLink 
            to="/contractor-dashboard" 
            end 
            className={({isActive}) => {
              const filter = new URLSearchParams(window.location.search).get('filter');
              return (isActive && !filter) ? 'contractor-nav-item active' : 'contractor-nav-item';
            }}
          >
            <Home size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink 
            to="/contractor/tasks" 
            className={({isActive}) => isActive ? 'contractor-nav-item active' : 'contractor-nav-item'}
          >
            <ClipboardList size={20} />
            <span>My Tasks</span>
          </NavLink>


          <NavLink to="/contractor/schedule" className={({isActive}) => isActive ? 'contractor-nav-item active' : 'contractor-nav-item'}>
            <Calendar size={20} />
            <span>Work Schedule</span>
          </NavLink>
          <NavLink to="/contractor/materials" className={({isActive}) => isActive ? 'contractor-nav-item active' : 'contractor-nav-item'}>
            <Package size={20} />
            <span>Material Requests</span>
          </NavLink>
          <NavLink to="/contractor/leaves" className={({isActive}) => isActive ? 'contractor-nav-item active' : 'contractor-nav-item'}>
            <CalendarDays size={20} />
            <span>My Leaves</span>
          </NavLink>
          <NavLink to="/contractor/notifications" className={({isActive}) => isActive ? 'contractor-nav-item active' : 'contractor-nav-item'}>
            <Bell size={20} />
            <span>Notifications</span>
          </NavLink>
          <NavLink to="/contractor/profile" className={({isActive}) => isActive ? 'contractor-nav-item active' : 'contractor-nav-item'}>
            <User size={20} />
            <span>Profile</span>
          </NavLink>
        </nav>

        <div className="contractor-sidebar-footer">
          <button onClick={handleLogout} className="contractor-logout-btn">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default ContractorSidebar;
