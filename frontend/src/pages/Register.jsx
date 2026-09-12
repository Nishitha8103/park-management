import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, Sprout } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSuccess = (userData) => {
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
          handleGoogleSuccess(data.user);
        } else {
          setErrorMsg(data.message || 'Google registration failed');
        }
      } catch (err) {
        console.error("Google Auth error:", err);
        setErrorMsg('Failed to connect to Google authentication service.');
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Basic validation
    if (!name.trim()) return setErrorMsg('Full Name is required');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErrorMsg('Invalid email format');
    if (!/^\d{10}$/.test(phone)) return setErrorMsg('Phone number must be exactly 10 digits');
    if (password.length < 6) return setErrorMsg('Password must be at least 6 characters');
    if (password !== confirmPassword) return setErrorMsg('Passwords do not match');

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone, password, role: 'public_user' }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg("Successfully registered! Redirecting to login...");
        setTimeout(() => navigate('/login'), 1200);
      } else {
        setErrorMsg(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMsg("Failed to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-dark-page">
      <div className="register-dark-overlay"></div>

      <div className="register-main-wrapper">
        <div className="register-glass-card">
          {/* Circular Glow Logo */}
          <div className="register-logo-container">
            <img src="/parks_logo_v3.png" alt="Parks Monitoring System Logo" className="register-logo-img" />
          </div>

          {/* Heading */}
          <div className="register-header-group">
            <h1 className="register-brand-title">
              Parks <span className="register-title-accent">Monitoring System</span>
            </h1>
            <div className="register-tagline-row">
              <span className="register-tagline-line"></span>
              <span className="register-tagline-text">Explore. Enjoy. Empower.</span>
              <span className="register-tagline-line"></span>
            </div>
          </div>

          {/* Green Leaf Welcome Pill Banner */}
          <div className="register-welcome-pill">
            <div className="welcome-pill-leaf-left">
              <Sprout size={24} className="welcome-sprout-icon" />
            </div>
            <div className="welcome-pill-content">
              <h3 className="welcome-pill-title">Create Account</h3>
              <p className="welcome-pill-sub">Join Parks Monitoring System</p>
            </div>
            <div className="welcome-pill-leaf-right">
              <span className="welcome-leaf-emoji">🌱</span>
            </div>
          </div>

          {/* Form */}
          <form className="register-card-form" onSubmit={handleRegister}>
            {/* Full Name */}
            <div className="register-field-group">
              <label className="register-field-label">Full Name</label>
              <div className="register-input-container">
                <User size={18} className="register-input-icon" />
                <input 
                  type="text" 
                  className="register-text-input" 
                  placeholder="Enter your full name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="register-field-group">
              <label className="register-field-label">Email Address</label>
              <div className="register-input-container">
                <Mail size={18} className="register-input-icon" />
                <input 
                  type="email" 
                  className="register-text-input" 
                  placeholder="Enter your email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  required 
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="register-field-group">
              <label className="register-field-label">Phone Number</label>
              <div className="register-input-container">
                <Phone size={18} className="register-input-icon" />
                <input 
                  type="tel" 
                  className="register-text-input" 
                  placeholder="10-digit mobile number" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                  required 
                />
              </div>
            </div>

            {/* Password */}
            <div className="register-field-group">
              <label className="register-field-label">Password</label>
              <div className="register-input-container">
                <Lock size={18} className="register-input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="register-text-input" 
                  placeholder="Create a password (min. 6 chars)" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required 
                />
                <button 
                  type="button" 
                  className="register-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="register-field-group">
              <label className="register-field-label">Confirm Password</label>
              <div className="register-input-container">
                <Lock size={18} className="register-input-icon" />
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  className="register-text-input" 
                  placeholder="Confirm your password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
                <button 
                  type="button" 
                  className="register-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <label className="register-terms-label">
              <input type="checkbox" className="register-custom-checkbox" required />
              <span>I agree to the <span className="terms-highlight">Terms & Conditions</span> and <span className="terms-highlight">Privacy Policy</span></span>
            </label>

            {errorMsg && <div className="register-error-alert">{errorMsg}</div>}
            {successMsg && <div className="register-success-alert">{successMsg}</div>}

            {/* Register Submit Button */}
            <button 
              type="submit" 
              className="register-submit-button" 
              disabled={isLoading || isGoogleLoading}
            >
              <UserPlus size={18} className="btn-icon-start" />
              <span>{isLoading ? 'Creating Account...' : 'Register'}</span>
              <ArrowRight size={18} className="btn-icon-end" />
            </button>
            
            {/* OR Divider */}
            <div className="register-divider-container">
              <span className="divider-line"></span>
              <span className="divider-text">OR</span>
              <span className="divider-line"></span>
            </div>
            
            {/* Google Button */}
            <button 
              type="button" 
              className="register-google-button" 
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

          {/* Footer link to Login */}
          <div className="register-card-bottom">
            <span>Already have an account? </span>
            <Link to="/login" className="register-login-action">Login</Link>
          </div>
        </div>

        {/* Skyline / Page Bottom Footer */}
        <div className="register-bottom-skyline">
          <p className="skyline-tagline">
            <span>Parks Monitoring System</span>
            <span className="skyline-divider">|</span>
            <span>Explore. Enjoy. Empower.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
