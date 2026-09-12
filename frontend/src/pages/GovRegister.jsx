import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Phone, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import './GovRegister.css';

const GovRegister = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!name.trim()) return setErrorMsg('Full Name is required');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErrorMsg('A valid Official Email is required');
    if (!/^\d{10}$/.test(phone)) return setErrorMsg('Phone number must be exactly 10 digits');
    if (!department) return setErrorMsg('Department is required');
    if (password.length < 6) return setErrorMsg('Password must be at least 6 characters');
    if (password !== confirmPassword) return setErrorMsg('Passwords do not match!');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          email, 
          phone,
          department,
          password, 
          role: 'Government Official'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg("Government Account Created! Redirecting...");
        navigate('/gov/login');
      } else {
        setErrorMsg(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMsg("Failed to connect to server. Please ensure backend is running.");
    }
  };

  return (
    <div className="gov-register-page">
      <div className="gov-register-card">
        <div className="gov-register-header">
          <div className="gov-register-logo">
            <Shield size={36} className="gov-text-primary" style={{ color: '#1e40af' }} />
          </div>
          <h2>GOVERNMENT PORTAL</h2>
          <p className="gov-register-brand">OFFICIAL REGISTRATION</p>
        </div>

        <form onSubmit={handleRegister}>
          <div className="gov-form-row">
            <div className="gov-form-group">
              <label className="gov-input-label">Full Name</label>
              <div className="gov-input-with-icon">
                <User size={18} className="gov-input-icon" />
                <input 
                  type="text" 
                  className="gov-input-field has-icon" 
                  placeholder="Enter official name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <div className="gov-form-group">
              <label className="gov-input-label">Official Email</label>
              <div className="gov-input-with-icon">
                <Mail size={18} className="gov-input-icon" />
                <input 
                  type="email" 
                  className="gov-input-field has-icon" 
                  placeholder="name@gov.in" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  required 
                />
              </div>
            </div>
          </div>

          <div className="gov-form-row">
            <div className="gov-form-group">
              <label className="gov-input-label">Phone Number</label>
              <div className="gov-input-with-icon">
                <Phone size={18} className="gov-input-icon" />
                <input 
                  type="tel" 
                  className="gov-input-field has-icon" 
                  placeholder="Enter contact number" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <div className="gov-form-group">
              <label className="gov-input-label">Department</label>
              <div className="gov-input-with-icon">
                <Shield size={18} className="gov-input-icon" />
                <select 
                  className="gov-input-field has-icon" 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="parks_rec">Parks & Recreation</option>
                  <option value="city_planning">City Planning</option>
                  <option value="maintenance">Public Works</option>
                </select>
              </div>
            </div>
          </div>

          <div className="gov-form-row">
            <div className="gov-form-group">
              <label className="gov-input-label">Password</label>
              <div className="gov-input-with-icon">
                <Lock size={18} className="gov-input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="gov-input-field has-icon" 
                  placeholder="Create password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required 
                />
                <button 
                  type="button" 
                  className="gov-password-toggle"
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="gov-form-group">
              <label className="gov-input-label">Confirm Password</label>
              <div className="gov-input-with-icon">
                <Lock size={18} className="gov-input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="gov-input-field has-icon" 
                  placeholder="Confirm password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
          </div>

          {errorMsg && <div style={{ color: 'red', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 'bold', textAlign: 'center' }}>{errorMsg}</div>}

          <button type="submit" className="gov-btn-primary">
            <UserPlus size={18} /> Register Official Account
          </button>
          
          {successMsg && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
              {successMsg}
            </div>
          )}
        </form>

        <div className="gov-register-footer">
          <p>Already registered? <Link to="/gov/login" style={{ color: '#1e40af', fontWeight: 'bold' }}>Login Here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default GovRegister;
