import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, HardHat, User, Mail, Phone, Wrench, Save, Camera, Lock, Shield, Eye, EyeOff, ShieldCheck, ShieldX, Fingerprint } from 'lucide-react';
import './ContractorProfile.css';
import AadhaarKycModal from '../components/AadhaarKycModal';
import ContractorSidebar from '../components/ContractorSidebar';


const ContractorProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [contractor, setContractor] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: ''
  });

  const [profilePic, setProfilePic] = useState(null);
  const [rawFile, setRawFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Aadhaar KYC state
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycStatus, setKycStatus] = useState('not_started'); // from backend
  const [kycData, setKycData] = useState(null);

  // Password fields
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('contractorUser');
    if (!storedUser) {
      navigate('/login');
    } else {
      const user = JSON.parse(storedUser);
      setContractor(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || ''
      });
      if (user.profilePic || user.profilePhoto) setProfilePic(user.profilePic || user.profilePhoto);

      // Fetch KYC status from backend
      fetch('/api/kyc/status', {
        headers: { Authorization: `Bearer ${user.token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.success) {
            setKycStatus(data.kycStatus || 'not_started');
            setKycData(data.kycData || null);
          }
        })
        .catch(() => {});

      // If maintenanceSkills is missing (old session), fetch fresh data from backend
      if (!user.maintenanceSkills || user.maintenanceSkills.length === 0) {
        fetch(`/api/contractors/profile`, {
          headers: { Authorization: `Bearer ${user.token}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && data.maintenanceSkills) {
              const refreshed = { ...user, maintenanceSkills: data.maintenanceSkills, phone: data.phone || user.phone };
              localStorage.setItem('contractorUser', JSON.stringify(refreshed));
              setContractor(refreshed);
            }
          })
          .catch(() => {});
      }
    }
  }, [navigate]);

  const handleKycVerified = () => {
    setKycStatus('pending');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('contractorUser');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRawFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
        
        // Save to local storage immediately
        if (contractor) {
          const updatedUser = { ...contractor, profilePic: reader.result };
          localStorage.setItem('contractorUser', JSON.stringify(updatedUser));
          setContractor(updatedUser);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Name is required' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setMessage({ type: 'error', text: 'Invalid email format' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      return;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      setMessage({ type: 'error', text: 'Phone number must be exactly 10 digits' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      return;
    }
    
    try {
      const token = contractor?.token;
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      if (rawFile) {
        submitData.append('profilePhoto', rawFile);
      }

      const response = await fetch('/api/contractors/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('contractorUser', JSON.stringify(data));
        setContractor(data);
        setMessage({ type: 'success', text: 'Profile updated successfully and email sent!' });
        setIsEditing(false);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Server error' });
    }
    
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 4000);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill all password fields.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    
    try {
      const token = contractor?.token;
      const submitData = new FormData();
      submitData.append('password', passwordData.newPassword);

      const response = await fetch('/api/contractors/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Password successfully updated and email sent!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update password' });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Server error' });
    }
    
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 4000);
  };

  if (!contractor) return null;

  return (
    <div className="contractor-dashboard-page">
      <ContractorSidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        handleLogout={handleLogout} 
        contractor={contractor} 
      />
      
      <div className={`contractor-main-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="contractor-header">
          <div className="container contractor-header-content">
            <div className="contractor-brand">
              <button className="contractor-menu-toggle" onClick={toggleSidebar}>
                <Menu size={24} />
              </button>
              <HardHat size={28} className="contractor-text-primary" />
              <h1>PARK MAINTENANCE</h1>
              <span>Portal</span>
            </div>
            
            <div className="contractor-user-info">
              <div className="contractor-user-details">
                <h4 className="contractor-user-name">{contractor.name}</h4>
                <p className="contractor-user-role">
                  {contractor.maintenanceSkills && contractor.maintenanceSkills.length > 0
                    ? contractor.maintenanceSkills.join(', ')
                    : 'Maintenance Contractor'}
                </p>
              </div>
              <button className="btn-contractor-logout" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </header>

        <div className="contractor-profile-page container">
          <div className="profile-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="header-icon-wrapper">
                <User size={24} />
              </div>
              <div>
                <h2>My Profile Settings</h2>
                <p className="profile-subtitle">Manage your account information and security</p>
              </div>
            </div>
          </div>

          {message.text && (
            <div className={`profile-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="profile-card">
            {/* LEFT COLUMN - Avatar */}
            <div className="profile-avatar-section">
              <div className="avatar-wrapper" onClick={triggerFileInput}>
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="avatar-image" />
                ) : (
                  <div className="avatar-circle">
                    <User size={48} />
                  </div>
                )}
                <div className="avatar-overlay">
                  <Camera size={24} />
                  <span>Upload</span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
              </div>
              
              <h3 className="avatar-name">{contractor.name}</h3>
              <span className="badge-role">
                {contractor.maintenanceSkills && contractor.maintenanceSkills.length > 0
                  ? contractor.maintenanceSkills[0]
                  : 'Maintenance Contractor'}
              </span>
              
              <button 
                className={`btn-toggle-edit ${isEditing ? 'active' : ''}`}
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (isEditing) {
                    setFormData({
                      name: contractor.name || '',
                      email: contractor.email || '',
                      phone: contractor.phone || '',
                      department: contractor.department || ''
                    });
                  }
                }}
              >
                {isEditing ? 'Cancel Editing' : 'Edit Profile Info'}
              </button>
            </div>

            {/* RIGHT COLUMN - Forms */}
            <div className="profile-forms-section">
              {/* Profile Info Form */}
              <div className="form-section-block">
                <h3 className="section-title">
                  <User size={18} /> Personal Information
                </h3>
                <form onSubmit={handleSaveProfile}>
                  <div className="profile-form-grid">
                    <div className="profile-form-group">
                      <label>Full Name / Company Name</label>
                      <div className="profile-input-wrapper">
                        <User size={18} className="profile-input-icon" />
                        <input 
                          type="text" 
                          name="name"
                          value={formData.name} 
                          onChange={handleChange}
                          disabled={!isEditing}
                          required
                          className={isEditing ? 'editable' : ''}
                        />
                      </div>
                    </div>

                    <div className="profile-form-group">
                      <label>Email Address</label>
                      <div className="profile-input-wrapper">
                        <Mail size={18} className="profile-input-icon" />
                        <input 
                          type="email" 
                          name="email"
                          value={formData.email} 
                          onChange={handleChange}
                          disabled={!isEditing}
                          required
                          className={isEditing ? 'editable' : ''}
                        />
                      </div>
                    </div>

                    <div className="profile-form-group">
                      <label>Phone Number</label>
                      <div className="profile-input-wrapper">
                        <Phone size={18} className="profile-input-icon" />
                        <input 
                          type="tel" 
                          name="phone"
                          value={formData.phone} 
                          onChange={handleChange}
                          disabled={!isEditing}
                          required
                          className={isEditing ? 'editable' : ''}
                        />
                      </div>
                    </div>

                    <div className="profile-form-group">
                      <label>Assigned Department / Skills</label>
                      <div className="profile-input-wrapper" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1.5px solid #e2e8f0', minHeight: '46px' }}>
                        <Wrench size={18} className="profile-input-icon" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
                          {contractor.maintenanceSkills && contractor.maintenanceSkills.length > 0
                            ? contractor.maintenanceSkills.map((skill, idx) => (
                                <span key={idx} style={{
                                  background: '#dcfce7',
                                  color: '#15803d',
                                  borderRadius: '20px',
                                  padding: '2px 12px',
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  border: '1px solid #bbf7d0'
                                }}>{skill}</span>
                              ))
                            : <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>Not assigned by admin</span>
                          }
                        </div>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px', marginLeft: '2px' }}>Assigned by administrator — cannot be changed</p>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="profile-form-actions">
                      <button type="submit" className="btn-save-profile">
                        <Save size={18} style={{ marginRight: '8px' }} /> Save Profile
                      </button>
                    </div>
                  )}
                </form>
              </div>

              <div className="section-divider"></div>

              {/* Aadhaar KYC Section */}
              <div className="form-section-block">
                <h3 className="section-title" style={{ color: '#1a237e' }}>
                  <Fingerprint size={18} /> Aadhaar KYC Verification
                </h3>
                <p className="section-desc">Upload your Aadhaar card for identity verification. Admin will review and approve within 1–2 business days.</p>

                {kycStatus === 'verified' && (
                  <div style={{ background: 'linear-gradient(135deg,#e8f5e9,#f1f8e9)', border: '1.5px solid #a5d6a7', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldCheck size={24} style={{ color: '#2e7d32', flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: '#1b5e20', fontSize: '15px' }}>KYC Verified ✓</p>
                      <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#388e3c' }}>Your identity has been verified by the administrator.</p>
                    </div>
                    <span style={{ marginLeft: 'auto', background: '#2e7d32', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px' }}>VERIFIED</span>
                  </div>
                )}

                {kycStatus === 'pending' && (
                  <div style={{ background: '#fffde7', border: '1.5px solid #ffe082', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldCheck size={24} style={{ color: '#f57f17', flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: '#e65100', fontSize: '15px' }}>Under Review</p>
                      <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#795548' }}>Your documents have been submitted. Admin will verify them soon.</p>
                    </div>
                    <span style={{ marginLeft: 'auto', background: '#ff8f00', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px' }}>PENDING</span>
                  </div>
                )}

                {kycStatus === 'rejected' && (
                  <div style={{ background: '#fff8f8', border: '1.5px solid #ef9a9a', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ShieldX size={22} style={{ color: '#c62828' }} />
                      <span style={{ fontWeight: 700, color: '#c62828', fontSize: '15px' }}>KYC Rejected</span>
                    </div>
                    {kycRejectReason && <p style={{ margin: 0, fontSize: '13px', color: '#546e7a', background: '#f5f5f5', padding: '8px 12px', borderRadius: '8px' }}><strong>Reason:</strong> {kycRejectReason}</p>}
                    <button id="kyc-retry-btn" onClick={() => setKycModalOpen(true)} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: 'linear-gradient(135deg,#1a237e,#1565c0)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                      <Fingerprint size={14} /> Resubmit Documents
                    </button>
                  </div>
                )}

                {kycStatus === 'not_started' && (
                  <div style={{ background: '#f8f9ff', border: '1.5px solid #c5cae9', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ShieldCheck size={22} style={{ color: '#90a4ae' }} />
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#546e7a', fontSize: '14px' }}>Not Verified</p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#90a4ae' }}>Upload your Aadhaar card to get verified.</p>
                      </div>
                    </div>
                    <button id="kyc-open-modal-btn" onClick={() => setKycModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg,#1a237e,#1565c0)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(26,35,126,0.28)' }}>
                      <Fingerprint size={16} /> Verify Aadhaar
                    </button>
                  </div>
                )}
              </div>

              <div className="section-divider"></div>

              {/* Change Password Form */}
              <div className="form-section-block">
                <h3 className="section-title security">
                  <Shield size={18} /> Security & Authentication
                </h3>
                <p className="section-desc">Ensure your account is using a long, random password to stay secure.</p>
                
                <form onSubmit={handleSavePassword}>
                  <div className="profile-form-grid">
                    <div className="profile-form-group">
                      <label>Current Password</label>
                      <div className="profile-input-wrapper">
                        <Lock size={18} className="profile-input-icon" />
                        <input 
                          type={showPassword.current ? "text" : "password"} 
                          name="currentPassword"
                          value={passwordData.currentPassword} 
                          onChange={handlePasswordChange}
                          className="editable"
                          placeholder="••••••••"
                        />
                        <button type="button" className="password-toggle-btn" onClick={() => togglePasswordVisibility('current')}>
                          {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="profile-form-group empty-cell d-none d-sm-block"></div>

                    <div className="profile-form-group">
                      <label>New Password</label>
                      <div className="profile-input-wrapper">
                        <Lock size={18} className="profile-input-icon" />
                        <input 
                          type={showPassword.new ? "text" : "password"} 
                          name="newPassword"
                          value={passwordData.newPassword} 
                          onChange={handlePasswordChange}
                          className="editable"
                          placeholder="••••••••"
                        />
                        <button type="button" className="password-toggle-btn" onClick={() => togglePasswordVisibility('new')}>
                          {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="profile-form-group">
                      <label>Confirm New Password</label>
                      <div className="profile-input-wrapper">
                        <Lock size={18} className="profile-input-icon" />
                        <input 
                          type={showPassword.confirm ? "text" : "password"} 
                          name="confirmPassword"
                          value={passwordData.confirmPassword} 
                          onChange={handlePasswordChange}
                          className="editable"
                          placeholder="••••••••"
                        />
                        <button type="button" className="password-toggle-btn" onClick={() => togglePasswordVisibility('confirm')}>
                          {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="profile-form-actions">
                    <button type="submit" className="btn-save-password">
                      Update Password
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
        
      </div>

      {/* Aadhaar KYC Modal */}
      <AadhaarKycModal
        isOpen={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
        onSubmitted={handleKycVerified}
        currentStatus={kycStatus}
      />
    </div>
  );
};

export default ContractorProfile;

