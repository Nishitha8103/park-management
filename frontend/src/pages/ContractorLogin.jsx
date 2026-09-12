import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HardHat, Eye, EyeOff, Wrench } from 'lucide-react';
import './ContractorLogin.css';

const ContractorLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!username.trim()) return setErrorMsg('Username is required');
    if (!password) return setErrorMsg('Password is required');
    if (password.length < 6) return setErrorMsg('Password must be at least 6 characters');

    try {
      const response = await fetch('/api/contractors/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.user.role === 'contractor' || data.user.role === 'Contractor') {
           localStorage.setItem('contractorUser', JSON.stringify(data.user));
           navigate('/contractor-dashboard');
        } else {
           setErrorMsg('Access denied. Not a registered contractor.');
        }
      } else {
        setErrorMsg(data.message || 'Invalid username or password.');
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("Failed to connect to server.");
    }
  };

  return (
    <div className="contractor-login-page">
      <div className="contractor-login-card">
        <div className="contractor-login-header">
          <div className="contractor-login-logo">
            <HardHat size={36} className="contractor-text-primary" />
          </div>
          <h2>CONTRACTOR PORTAL</h2>
          <p className="contractor-login-brand">PARKS MAINTENANCE SYSTEM</p>
        </div>
        
        <div className="contractor-login-welcome">
          <h3>Contractor Login</h3>
          <p>Access your assigned tasks & updates</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="contractor-form-group">
            <label className="contractor-input-label">Username</label>
            <input 
              type="text" 
              className="contractor-input-field" 
              placeholder="Enter your contractor username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          
          <div className="contractor-form-group">
            <label className="contractor-input-label">Password</label>
            <div className="contractor-password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                className="contractor-input-field" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button 
                type="button" 
                className="contractor-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="contractor-login-options">
            <label className="contractor-remember-me">
              <input type="checkbox" />
              <span>Remember Me</span>
            </label>
            <a href="#" className="contractor-text-primary">Forgot Password?</a>
          </div>

          {errorMsg && <div style={{ color: '#dc2626', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: '500' }}>{errorMsg}</div>}

          <button type="submit" className="contractor-btn-primary">
            <Wrench size={18} style={{ marginRight: '8px' }} /> Login to Dashboard
          </button>
        </form>

        <div className="contractor-login-footer">
          <p>Don't have a contractor account? <Link to="/contractor/register" className="contractor-text-primary" style={{ fontWeight: 'bold' }}>Register Here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ContractorLogin;
