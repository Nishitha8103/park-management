import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
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
          alert(data.message || 'Google registration failed');
        }
      } catch (err) {
        console.error("Google Auth error:", err);
        alert('Failed to connect to Google authentication service.');
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google Sign-In Error:", error);
      setIsGoogleLoading(false);
      alert('Google Sign-In was cancelled or failed.');
    }
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Basic validation

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, role: 'public_user' }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg("Successfully registered! Redirecting to login...");
        navigate('/login');
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Failed to connect to server. Please ensure backend is running.");
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <div className="register-icon-wrapper">
            <UserPlus size={40} className="text-primary" />
          </div>
          <h2>Create Your Account</h2>
          <p>Fill in the details below to register</p>
        </div>

        <form className="register-form" onSubmit={handleRegister}>
          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon text-secondary" />
                <input 
                  type="text" 
                  className="input-field has-icon" 
                  placeholder="Enter your full name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="input-label">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon text-secondary" />
                <input 
                  type="email" 
                  className="input-field has-icon" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  required 
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Phone Number</label>
              <div className="input-with-icon">
                <Phone size={18} className="input-icon text-secondary" />
                <input type="tel" className="input-field has-icon" placeholder="Enter your phone number" required />
              </div>
            </div>
            
            <div className="form-group">
              <label className="input-label">Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon text-secondary" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="input-field has-icon" 
                  placeholder="Create a password" 
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
                  {showPassword ? <EyeOff size={18} className="text-secondary" /> : <Eye size={18} className="text-secondary" />}
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Confirm Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon text-secondary" />
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                className="input-field has-icon" 
                placeholder="Confirm your password" 
                required
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} className="text-secondary" /> : <Eye size={18} className="text-secondary" />}
              </button>
            </div>
          </div>


          <div className="privacy-alert">
            <ShieldCheck size={24} className="text-success privacy-icon" />
            <div className="privacy-content">
              <h4>Your Privacy Matters</h4>
              <p>Your information is safe with us. We never share your data with third parties.</p>
            </div>
          </div>

          <label className="terms-checkbox">
            <input type="checkbox" required />
            <span>I agree to the <a href="#" className="text-success font-semibold">Terms & Conditions</a> and <a href="#" className="text-success font-semibold">Privacy Policy</a></span>
          </label>

          <button type="submit" className="btn btn-primary w-full register-btn">
            <UserPlus size={18} /> Register
          </button>
          
          <div className="login-divider" style={{ textAlign: 'center', margin: '1rem 0', position: 'relative' }}>
            <span style={{ background: '#fff', padding: '0 0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>OR</span>
          </div>

          <button 
            type="button" 
            className="btn btn-outline w-full google-btn"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: '1px solid var(--border)', padding: '0.75rem', width: '100%', borderRadius: 'var(--radius-md)', fontWeight: 500 }}
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
          
          {successMsg && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
              {successMsg}
            </div>
          )}
        </form>

        <div className="register-footer">
          <p>Already have an account? <Link to="/login" className="text-success font-semibold">Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
