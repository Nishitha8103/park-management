import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, Sprout } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="register-dark-page" style={{ backgroundImage: "url('/landing_bg_leaves.jpg?v=5')" }}>
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
              disabled={isLoading}
            >
              <UserPlus size={18} className="btn-icon-start" />
              <span>{isLoading ? 'Creating Account...' : 'Register'}</span>
              <ArrowRight size={18} className="btn-icon-end" />
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
