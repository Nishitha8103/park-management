import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TreePine, LogOut, User } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import './Navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar container">
      <div className="navbar-logo">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <TreePine style={{ color: '#15803d' }} size={28} strokeWidth={3} />
          <span style={{ color: '#1a1a1a', fontWeight: '900' }}>Parks Monitoring System</span>
        </Link>
      </div>
      
      <div className="navbar-links">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NotificationDropdown userId={user._id} role="citizen" />
            <Link to="/profile" className="nav-profile-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.95)', color: '#0f172a', border: '1px solid rgba(0, 0, 0, 0.12)', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)', transition: 'all 0.2s ease' }} title="Profile">
              <User size={20} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', borderRadius: '6px' }}>Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

