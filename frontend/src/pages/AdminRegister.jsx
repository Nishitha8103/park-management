import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Phone, Lock, TreePine, Eye, EyeOff, FolderKey } from 'lucide-react';
import './AdminRegister.css';

const AdminRegister = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dept, setDept] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!name.trim()) return setErrorMsg('Full Name is required');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErrorMsg('A valid Admin Email is required');
    if (!/^\d{10}$/.test(phone)) return setErrorMsg('Phone number must be exactly 10 digits');
    if (!dept) return setErrorMsg('Administrative Unit is required');
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
          department: dept,
          password, 
          role: 'Admin'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg("Administrator Account Created! Redirecting to login...");
        navigate('/admin/login');
      } else {
        setErrorMsg(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMsg("Failed to connect to server. Please ensure backend is running.");
    }
  };

  return (
    <div className="admin-register-page">
      <div className="admin-register-card">
        <div className="admin-register-header">
          <div className="admin-register-logo">
            <TreePine size={36} className="admin-text-primary" />
          </div>
          <h2>ADMIN PORTAL</h2>
          <p className="admin-register-brand">PARKS MONITORING SYSTEM</p>
        </div>

        <form onSubmit={handleRegister}>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-input-label">Full Name</label>
              <div className="admin-input-with-icon">
                <User size={18} className="admin-input-icon" />
                <input 
                  type="text" 
                  className="admin-input-field has-icon" 
                  placeholder="Enter full name" 
                  value={name}
                  onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                  required 
                />
              </div>
            </div>
            
            <div className="admin-form-group">
              <label className="admin-input-label">Admin Email Address</label>
              <div className="admin-input-with-icon">
                <Mail size={18} className="admin-input-icon" />
                <input 
                  type="email" 
                  className="admin-input-field has-icon" 
                  placeholder="admin@system.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  required 
                />
              </div>
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-input-label">Phone Number</label>
              <div className="admin-input-with-icon">
                <Phone size={18} className="admin-input-icon" />
                <input 
                  type="tel" 
                  className="admin-input-field has-icon" 
                  placeholder="Enter phone number" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  required 
                />
              </div>
            </div>
            
            <div className="admin-form-group">
              <label className="admin-input-label">Administrative Unit</label>
              <div className="admin-input-with-icon">
                <FolderKey size={18} className="admin-input-icon" />
                <select 
                  className="admin-input-field has-icon" 
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  required
                >
                  <option value="">Select Administrative Unit</option>
                  <option value="System Ops">System Operations & Admin</option>
                  <option value="Municipal Authority">Municipal Authority Oversight</option>
                  <option value="Security Admin">IT Infrastructure & Security</option>
                </select>
              </div>
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-input-label">Password</label>
              <div className="admin-input-with-icon">
                <Lock size={18} className="admin-input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="admin-input-field has-icon" 
                  placeholder="Create password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required 
                />
                <button 
                  type="button" 
                  className="admin-password-toggle"
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-input-label">Confirm Password</label>
              <div className="admin-input-with-icon">
                <Lock size={18} className="admin-input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="admin-input-field has-icon" 
                  placeholder="Confirm password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
          </div>

          {errorMsg && <div style={{ color: '#dc2626', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: '500', textAlign: 'center' }}>{errorMsg}</div>}

          <button type="submit" className="admin-btn-primary">
            <UserPlus size={18} style={{ marginRight: '8px' }} /> Register Admin Account
          </button>
          
          {successMsg && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e0e7ff', color: '#4338ca', borderRadius: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
              {successMsg}
            </div>
          )}
        </form>

        <div className="admin-register-footer">
          <p>Already registered? <Link to="/admin/login" style={{ color: '#6366f1', fontWeight: 'bold' }}>Login Here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
