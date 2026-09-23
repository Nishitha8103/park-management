import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Phone, Lock, TreePine, Eye, EyeOff, Wrench } from 'lucide-react';
import './ContractorRegister.css';

const ContractorRegister = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!name.trim()) return setErrorMsg('Full Name / Company Name is required');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErrorMsg('A valid Email Address is required');
    if (!/^\d{10}$/.test(phone)) return setErrorMsg('Phone number must be exactly 10 digits');
    if (!specialization) return setErrorMsg('Maintenance Specialization is required');
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
          department: specialization, // mapped to department in backend schema
          password, 
          role: 'Contractor'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg("Contractor Account Created! Redirecting to login...");
        navigate('/contractor/login');
      } else {
        setErrorMsg(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMsg("Failed to connect to server. Please ensure backend is running.");
    }
  };

  return (
    <div className="contractor-register-page">
      <div className="contractor-register-card">
        <div className="contractor-register-header">
          <div className="contractor-register-logo">
            <TreePine size={36} className="contractor-text-primary" />
          </div>
          <h2>CONTRACTOR PORTAL</h2>
          <p className="contractor-register-brand">PARKS MONITORING SYSTEM</p>
        </div>

        <form onSubmit={handleRegister}>
          <div className="contractor-form-row">
            <div className="contractor-form-group">
              <label className="contractor-input-label">Full Name</label>
              <div className="contractor-input-with-icon">
                <User size={18} className="contractor-input-icon" />
                <input 
                  type="text" 
                  className="contractor-input-field has-icon" 
                  placeholder="Enter full name" 
                  value={name}
                  onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                  required 
                />
              </div>
            </div>
            
            <div className="contractor-form-group">
              <label className="contractor-input-label">Email Address</label>
              <div className="contractor-input-with-icon">
                <Mail size={18} className="contractor-input-icon" />
                <input 
                  type="email" 
                  className="contractor-input-field has-icon" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  required 
                />
              </div>
            </div>
          </div>

          <div className="contractor-form-row">
            <div className="contractor-form-group">
              <label className="contractor-input-label">Phone Number</label>
              <div className="contractor-input-with-icon">
                <Phone size={18} className="contractor-input-icon" />
                <input 
                  type="tel" 
                  className="contractor-input-field has-icon" 
                  placeholder="Enter phone number" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  required 
                />
              </div>
            </div>
            
            <div className="contractor-form-group">
              <label className="contractor-input-label">Maintenance Specialization</label>
              <div className="contractor-input-with-icon">
                <Wrench size={18} className="contractor-input-icon" />
                <select 
                  className="contractor-input-field has-icon" 
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  required
                >
                  <option value="">Select Specialization</option>
                  <option value="Landscaping">Landscaping & Gardening</option>
                  <option value="Plumbing">Plumbing & Irrigation</option>
                  <option value="Electrical">Electrical & Lighting</option>
                  <option value="Civil Works">Civil Works & Masonry</option>
                  <option value="General Clean">General Cleaning & Sanitation</option>
                </select>
              </div>
            </div>
          </div>

          <div className="contractor-form-row">
            <div className="contractor-form-group">
              <label className="contractor-input-label">Password</label>
              <div className="contractor-input-with-icon">
                <Lock size={18} className="contractor-input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="contractor-input-field has-icon" 
                  placeholder="Create password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required 
                />
                <button 
                  type="button" 
                  className="contractor-password-toggle"
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="contractor-form-group">
              <label className="contractor-input-label">Confirm Password</label>
              <div className="contractor-input-with-icon">
                <Lock size={18} className="contractor-input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="contractor-input-field has-icon" 
                  placeholder="Confirm password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
          </div>

          {errorMsg && <div style={{ color: '#dc2626', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 'bold', textAlign: 'center' }}>{errorMsg}</div>}

          <button type="submit" className="contractor-btn-primary">
            <UserPlus size={18} style={{ marginRight: '8px' }} /> Register Contractor Account
          </button>
          
          {successMsg && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef3c7', color: '#78350f', borderRadius: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
              {successMsg}
            </div>
          )}
        </form>

        <div className="contractor-register-footer">
          <p>Already registered? <Link to="/contractor/login" style={{ color: '#d97706', fontWeight: 'bold' }}>Login Here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ContractorRegister;
