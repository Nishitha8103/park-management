import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Eye, EyeOff, UserCheck } from 'lucide-react';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.user.role === 'Admin') {
           localStorage.setItem('adminUser', JSON.stringify(data.user));
           navigate('/admin-dashboard');
        } else {
           setErrorMsg('Access denied. You do not have administrator permissions.');
        }
      } else {
        setErrorMsg(data.message || 'Invalid email or password.');
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("Failed to connect to server.");
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-logo">
            <ShieldAlert size={36} className="admin-text-primary" />
          </div>
          <h2>ADMIN PORTAL</h2>
          <p className="admin-login-brand">SYSTEM CONTROL CENTER</p>
        </div>
        
        <div className="admin-login-welcome">
          <h3>Administrator Login</h3>
          <p>Provide secure credentials to enter dashboard</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="admin-form-group">
            <label className="admin-input-label">Admin Email Address</label>
            <input 
              type="email" 
              className="admin-input-field" 
              placeholder="admin@system.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          
          <div className="admin-form-group">
            <label className="admin-input-label">Password</label>
            <div className="admin-password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                className="admin-input-field" 
                placeholder="Enter password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button 
                type="button" 
                className="admin-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="admin-login-options">
            <label className="admin-remember-me">
              <input type="checkbox" />
              <span>Secure Session</span>
            </label>
            <a href="#" className="admin-text-primary">Reset Credentials?</a>
          </div>

          {errorMsg && <div style={{ color: '#dc2626', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: '500' }}>{errorMsg}</div>}

          <button type="submit" className="admin-btn-primary">
            <UserCheck size={18} style={{ marginRight: '8px' }} /> Verify & Login
          </button>
        </form>

        <div className="admin-login-footer">
          <p>Need a new admin account? <Link to="/admin/register" className="admin-text-primary" style={{ fontWeight: 'bold' }}>Register Here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
