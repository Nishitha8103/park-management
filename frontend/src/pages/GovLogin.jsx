import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import './GovLogin.css';

const GovLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) return setErrorMsg('A valid Official Email Address is required');
    if (!password) return setErrorMsg('Password is required');
    if (password.length < 6) return setErrorMsg('Password must be at least 6 characters');

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
        if (data.user.role === 'Government Official' || data.user.role === 'Admin') {
           localStorage.setItem('govUser', JSON.stringify(data.user));
           navigate('/gov-dashboard');
        } else {
           setErrorMsg('Access denied. Not a government official.');
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
            <label className="gov-input-label">Official Email Address</label>
            <input 
              type="email" 
              className="gov-input-field" 
              placeholder="Enter your official email" 
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
            <a href="#" className="gov-text-primary">Forgot Password?</a>
          </div>

          {errorMsg && <div style={{ color: 'red', fontSize: '0.9rem', marginBottom: '1rem' }}>{errorMsg}</div>}

          <button type="submit" className="gov-btn-primary">Login to Portal</button>
        </form>

        <div className="gov-login-footer">
          <p>Don't have an official account? <Link to="/gov/register" className="gov-text-primary" style={{ fontWeight: 'bold' }}>Register Here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default GovLogin;
