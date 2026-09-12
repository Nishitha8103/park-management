import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TreePine, Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSuccessfulAuth = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.role === 'Contractor') {
      localStorage.setItem('contractorUser', JSON.stringify(userData));
    }
    if (userData.role === 'Admin') {
      localStorage.setItem('adminUser', JSON.stringify(userData));
    }
    if (userData.role === 'Government Official' || userData.role === 'official') {
      localStorage.setItem('govUser', JSON.stringify(userData));
    }
    
    switch (userData.role) {
      case 'Admin':
        navigate('/admin-dashboard');
        break;
      case 'Contractor':
        navigate('/contractor-dashboard');
        break;
      case 'Government Official':
      case 'official':
        navigate('/gov-dashboard');
        break;
      case 'Public':
      case 'public_user':
      case 'Public User':
        navigate('/parks');
        break;
      default:
        navigate('/parks');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!email.trim()) return setErrorMsg('Email or Username is required');
    if (!password) return setErrorMsg('Password is required');
    if (password.length < 6) return setErrorMsg('Password must be at least 6 characters');
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), username: email.trim(), password }),
      });
      const data = await response.json();
      
      if (response.ok) {
        handleSuccessfulAuth(data.user);
      } else {
        setErrorMsg(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg('Failed to connect to server. If your Render backend was sleeping, please wait 20-30 seconds for it to wake up and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const googleLoginHandler = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setErrorMsg('');
      try {
        // Fetch user info directly from Google
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await userInfoRes.json();

        // Send user info to backend
        const res = await fetch('/api/auth/google-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userInfo: googleUser,
            token: tokenResponse.access_token 
          }),
        });
        const data = await res.json();
        if (res.ok) {
          handleSuccessfulAuth(data.user);
        } else {
          setErrorMsg(data.message || 'Google Login failed');
        }
      } catch (err) {
        console.error("Google Auth error:", err);
        setErrorMsg('Failed to authenticate with Google: ' + (err.message || ''));
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google Sign-In Error:", error);
      setIsGoogleLoading(false);
      setErrorMsg('Google Sign-In was cancelled or failed.');
    }
  });

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <TreePine size={40} className="text-primary" />
          </div>
          <h2>PARKS</h2>
          <p className="login-brand">MONITORING SYSTEM</p>
        </div>
        
        <div className="login-welcome">
          <h3>Welcome Back!</h3>
          <p>Please login to your account</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="input-label">Email Address / Username</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter your email or username" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="input-label">Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                className="input-field" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} className="text-secondary" /> : <Eye size={20} className="text-secondary" />}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember Me</span>
            </label>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="forgot-password text-success"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Forgot Password?
            </button>
          </div>

          {errorMsg && <div style={{ color: 'red', fontSize: '0.9rem' }}>{errorMsg}</div>}

          <button type="submit" className="btn btn-primary w-full login-btn" disabled={isLoading || isGoogleLoading}>
            {isLoading ? 'Connecting to Server...' : 'Login'}
          </button>
          
          <div className="login-divider">
            <span>OR</span>
          </div>
          
          <button 
            type="button" 
            className="btn btn-outline w-full google-btn" 
            onClick={() => googleLoginHandler()}
            disabled={isGoogleLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <Link to="/register" className="text-success font-semibold">Register</Link></p>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        onPasswordResetSuccess={(resetIdentifier) => {
          setEmail(resetIdentifier);
          setShowForgotModal(false);
          setErrorMsg('');
        }}
      />
    </div>
  );
};

export default Login;
