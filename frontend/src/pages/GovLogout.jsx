import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import './GovLogout.css';

const GovLogout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('govUser');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="gov-logout-page">
      <div className="gov-logout-card">
        <div className="logout-icon-container">
          <LogOut size={48} className="logout-icon" />
        </div>
        <h2 className="logout-title">Sign Out</h2>
        <p className="logout-message">Are you sure you want to sign out of the Government Portal?</p>
        
        <div className="logout-actions">
          <button className="btn-cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button className="btn-confirm-logout" onClick={handleLogout}>
            Yes, Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default GovLogout;

