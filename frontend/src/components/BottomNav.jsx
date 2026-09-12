import { NavLink } from 'react-router-dom';
import { Home, TreePine, Calendar, FileText, Menu } from 'lucide-react';
import './BottomNav.css';

export default function BottomNav({ toggleSidebar }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`} end>
        <Home size={20} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/parks" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <TreePine size={20} />
        <span>Parks</span>
      </NavLink>
      <NavLink to="/events" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Calendar size={20} />
        <span>Events</span>
      </NavLink>
      <NavLink to="/complaint-history" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <FileText size={20} />
        <span>Complaints</span>
      </NavLink>
      <button type="button" onClick={toggleSidebar} className="bottom-nav-item bottom-nav-btn">
        <Menu size={20} />
        <span>Menu</span>
      </button>
    </nav>
  );
}
