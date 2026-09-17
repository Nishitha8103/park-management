import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, TreePine, FileText, Star, ScanLine, User, Search, History, LogOut, Calendar, Bell, Megaphone, AlertOctagon } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen = false, toggleSidebar = () => {} }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: 'Guest User',
    role: 'Public User',
    profilePic: null
  });

  const [complaintCount, setComplaintCount] = useState(3);
  const [feedbackCount, setFeedbackCount] = useState(2);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('user-updated'));
    toggleSidebar();
    navigate('/login');
  };

  const updateCounts = () => {
    // Initial defaults if missing
    if (!localStorage.getItem('my_complaints')) {
      localStorage.setItem('my_complaints', JSON.stringify([
        { id: 'CMP392862255', date: '2026-07-04', park: 'Central Park', category: 'Cleanliness', title: 'Trash not collected', status: 'Submitted' },
        { id: 'CMP123456789', date: '2026-07-01', park: 'Green Valley Park', category: 'Broken Facility', title: 'Swing set broken', status: 'Under Review' },
        { id: 'CMP987654321', date: '2026-06-15', park: 'Central Park', category: 'Lighting', title: 'Path lights out', status: 'Resolved' }
      ]));
    }

    if (!localStorage.getItem('my_feedbacks')) {
      localStorage.setItem('my_feedbacks', JSON.stringify([
        { id: 'FB8201', date: '2026-07-10', parkName: 'Madhavan Park', zoneWard: 'South Zone • Ward 4', overallRating: 5, comments: 'Clean and peaceful environment.', status: 'Sent to Admin' },
        { id: 'FB5102', date: '2026-06-20', parkName: 'Central Park', zoneWard: 'Zone 1 • Ward 10', overallRating: 4, comments: 'Good maintenance.', status: 'Sent to Admin' }
      ]));
    }

    try {
      const cmp = JSON.parse(localStorage.getItem('my_complaints') || '[]');
      setComplaintCount(cmp.length);
    } catch (e) {
      setComplaintCount(0);
    }

    try {
      const fb = JSON.parse(localStorage.getItem('my_feedbacks') || '[]');
      setFeedbackCount(fb.length);
    } catch (e) {
      setFeedbackCount(0);
    }
  };

  const formatDisplayRole = (parsed) => {
    if (!parsed) return 'Public User';
    const name = (parsed.name || '').toLowerCase();
    const rawRole = (parsed.role || parsed.userType || '').toLowerCase();

    if (name.includes('nishitha') || rawRole.includes('public')) {
      return 'Public User';
    }
    if (name.includes('vishal') || rawRole.includes('official') || rawRole.includes('gov')) {
      return 'Government Official';
    }
    if (rawRole.includes('contractor')) {
      return 'Contractor';
    }
    if (rawRole.includes('admin')) {
      return 'Administrator';
    }
    return parsed.role || parsed.userType || 'Public User';
  };

  useEffect(() => {
    const updateUserData = () => {
      const stored = localStorage.getItem('user');
      let parsed = null;
      if (stored) {
        try {
          parsed = JSON.parse(stored);
        } catch (e) {
          console.error("Error parsing user data");
        }
      }

      if (parsed) {
        setUserData({
          name: parsed.name || 'User',
          role: parsed.role || 'Public User',
          profilePic: parsed.profilePic || null
        });
      } else {
        setUserData({
          name: 'Public User',
          role: 'Public User',
          profilePic: null
        });
      }
    };

    updateUserData();
    updateCounts();

    window.addEventListener('user-updated', updateUserData);
    window.addEventListener('complaints-updated', updateCounts);
    window.addEventListener('feedbacks-updated', updateCounts);
    window.addEventListener('storage', updateCounts);

    return () => {
      window.removeEventListener('user-updated', updateUserData);
      window.removeEventListener('complaints-updated', updateCounts);
      window.removeEventListener('feedbacks-updated', updateCounts);
      window.removeEventListener('storage', updateCounts);
    };
  }, []);

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={toggleSidebar}></div>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="user-profile">
        <div className="avatar">
          {userData.profilePic ? (
            <img src={userData.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
        <NavLink to="/" onClick={toggleSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <Home size={20} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/parks" onClick={toggleSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <TreePine size={20} />
          <span>Parks</span>
        </NavLink>
        <NavLink to="/events" onClick={toggleSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <Calendar size={20} />
          <span>Events</span>
        </NavLink>
        <NavLink to="/complaint-history" onClick={toggleSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <FileText size={20} />
          <span>Complaints</span>
        </NavLink>
        <NavLink to="/feedback-history" onClick={toggleSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <Star size={20} />
          <span>Feedback Notification</span>
        </NavLink>
        <NavLink to="/stall-bookings" onClick={toggleSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <FileText size={20} />
          <span>Stall Bookings</span>
        </NavLink>
        <NavLink to="/my-registrations" onClick={toggleSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <FileText size={20} />
          <span>My Registrations</span>
        </NavLink>
        <NavLink to="/announcements" onClick={toggleSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <Megaphone size={20} />
          <span>Announcements</span>
        </NavLink>
        <NavLink to="/notifications" onClick={toggleSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <Bell size={20} />
          <span>Notifications</span>
        </NavLink>
        <NavLink to="/profile" onClick={toggleSidebar} className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
          <User size={20} />
          <span>Profile</span>
        </NavLink>
        <button onClick={handleLogout} className="nav-item logout-nav-item" type="button">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </nav>
      </aside>
    </>
  );
};

export default Sidebar;
