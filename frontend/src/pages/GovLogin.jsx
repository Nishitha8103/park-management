import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import './GovLogin.css';

const GovLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!email.trim()) return setErrorMsg('Official Email or Official ID is required');
    if (!password) return setErrorMsg('Password is required');
    if (password.length < 6) return setErrorMsg('Password must be at least 6 characters');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), username: email.trim(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.user.role === 'Government Official' || data.user.role === 'Admin') {
           localStorage.setItem('govUser', JSON.stringify(data.user));
           navigate('/gov-dashboard');
        } else {
           setErrorMsg('Access denied. Not a government official.');
        }
      } else {
        setErrorMsg(data.message || 'Invalid email/ID or password.');
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("Failed to connect to server.");
    }
  };

  return (
    <div className="gov-login-page">
      <div className="gov-login-card">
        <div className="gov-login-header">
          <div className="gov-login-logo">
            <Shield size={36} className="gov-text-primary" />
          </div>
          <h2>GOVERNMENT PORTAL</h2>
          <p className="gov-login-brand">PARKS MONITORING SYSTEM</p>
        </div>
        
        <div className="gov-login-welcome">
          <h3>Official Login</h3>
          <p>Access your dashboard</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="gov-form-group">
            <label className="gov-input-label">Official Email or ID (e.g. GOV-001)</label>
            <input 
              type="text" 
              className="gov-input-field" 
              placeholder="Enter official email or ID" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          
          <div className="gov-form-group">
            <label className="gov-input-label">Password</label>
            <div className="gov-password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                className="gov-input-field" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button 
                type="button" 
                className="gov-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="gov-login-options">
            <label className="gov-remember-me">
              <input type="checkbox" />
              <span>Remember Me</span>
            </label>
            <button 
              type="button" 
              onClick={() => setShowForgotModal(true)} 
              className="gov-text-primary" 
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
            >
              Forgot Password?
            </button>
          </div>

          {errorMsg && <div style={{ color: 'red', fontSize: '0.9rem', marginBottom: '1rem' }}>{errorMsg}</div>}

          <button type="submit" className="gov-btn-primary">Login to Portal</button>
        </form>

        <div className="gov-login-footer">
          <p>Don't have an official account? <Link to="/gov/register" className="gov-text-primary" style={{ fontWeight: 'bold' }}>Register Here</Link></p>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        onPasswordResetSuccess={(resetId) => {
          if (resetId) setEmail(resetId);
          setShowForgotModal(false);
          setErrorMsg('');
        }}
      />
    </div>
  );
};

export default GovLogin;
