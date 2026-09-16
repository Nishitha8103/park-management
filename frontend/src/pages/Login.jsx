import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, Sprout } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');
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
    
    if (redirectPath) {
      navigate(redirectPath);
      return;
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
      setErrorMsg('Failed to connect to server. If your backend is starting up, please wait a moment and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const googleLoginHandler = useGoogleLogin({
    prompt: 'select_account',
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setErrorMsg('');
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await userInfoRes.json();

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
    <div className="login-dark-page" style={{ backgroundImage: "url('/landing_dark_leaves.jpg?v=100')" }}>
      <div className="login-dark-overlay"></div>

      <div className="login-main-wrapper">
        <div className="login-glass-card">
          {/* Circular Glow Logo */}
          <div className="login-logo-container">
            <img src="/parks_logo_v3.png" alt="Parks Monitoring System Logo" className="login-logo-img" />
          </div>

          {/* Heading */}
          <div className="login-header-group">
            <h1 className="login-brand-title">
              Parks <span className="login-title-accent">Monitoring System</span>
            </h1>
            <div className="login-tagline-row">
              <span className="login-tagline-line"></span>
              <span className="login-tagline-text">Explore. Enjoy. Empower.</span>
              <span className="login-tagline-line"></span>
            </div>
          </div>

          {/* Green Leaf Welcome Pill Banner */}
          <div className="login-welcome-pill">
            <div className="welcome-pill-leaf-left">
              <Sprout size={24} className="welcome-sprout-icon" />
            </div>
            <div className="welcome-pill-content">
              <h3 className="welcome-pill-title">Welcome Back!</h3>
              <p className="welcome-pill-sub">Please login to your account</p>
            </div>
            <div className="welcome-pill-leaf-right">
              <span className="welcome-leaf-emoji">🍃</span>
            </div>
          </div>

          {/* Login Form */}
          <form className="login-card-form" onSubmit={handleLogin}>
            {/* Email / Username Field */}
            <div className="login-field-group">
              <label className="login-field-label">Email Address / Username</label>
              <div className="login-input-container">
                <Mail size={18} className="login-input-icon" />
                <input 
                  type="text" 
                  className="login-text-input" 
                  placeholder="Enter your email or username" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-field-group">
              <label className="login-field-label">Password</label>
              <div className="login-input-container">
                <Lock size={18} className="login-input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="login-text-input" 
                  placeholder="Enter your password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button 
                  type="button" 
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="login-options-row">
              <label className="login-remember-label">
                <input type="checkbox" className="login-custom-checkbox" />
                <span>Remember Me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="login-forgot-link"
              >
                Forgot Password?
              </button>
            </div>

            {errorMsg && <div className="login-error-alert">{errorMsg}</div>}

            {/* Login Button */}
            <button 
              type="submit" 
              className="login-submit-button" 
              disabled={isLoading || isGoogleLoading}
            >
              <LogIn size={18} className="btn-icon-start" />
              <span>{isLoading ? 'Connecting to Server...' : 'Login'}</span>
              <ArrowRight size={18} className="btn-icon-end" />
            </button>
            
            {/* OR Divider */}
            <div className="login-divider-container">
              <span className="divider-line"></span>
              <span className="divider-text">OR</span>
              <span className="divider-line"></span>
            </div>
            
            {/* Google Login Button */}
            <button 
              type="button" 
              className="login-google-button" 
              onClick={() => googleLoginHandler()}
              disabled={isGoogleLoading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="google-svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
          </form>

          {/* Footer link to Register */}
          <div className="login-card-bottom">
            <span>Don't have an account? </span>
            <Link to="/register" className="login-register-action">Register</Link>
          </div>
        </div>

        {/* Skyline / Page Bottom Footer */}
        <div className="login-bottom-skyline">
          <p className="skyline-tagline">
            <span>Parks Monitoring System</span>
            <span className="skyline-divider">|</span>
            <span>Explore. Enjoy. Empower.</span>
          </p>
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
