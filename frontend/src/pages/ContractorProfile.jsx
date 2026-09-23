import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, TreePine, HardHat, User, Mail, Phone, Wrench, Save, Camera, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import './ContractorProfile.css';
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
  const [imgError, setImgError] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
      return;
    }
    
    const user = JSON.parse(storedUser);
    setContractor(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      department: user.department || ''
    });
    if (user.profilePhoto || user.profilePic) {
      setProfilePic(user.profilePhoto || user.profilePic);
    }

    const token = user.token || localStorage.getItem('token');
    if (token) {
      fetch('/api/contractors/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            const refreshed = { ...user, ...data, token };
            localStorage.setItem('contractorUser', JSON.stringify(refreshed));
            setContractor(refreshed);
            setFormData({
              name: data.name || user.name || '',
              email: data.email || user.email || '',
              phone: data.phone || user.phone || '',
              department: data.department || user.department || ''
            });
            if (data.profilePhoto || data.profilePic) {
              setProfilePic(data.profilePhoto || data.profilePic);
              setImgError(false);
            }
          }
        })
        .catch(() => {});
    }
  }, [navigate]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('contractorUser');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'name') {
      value = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      return;
    }

    setRawFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePic(reader.result);
      setImgError(false);
      setIsEditing(true);
      setMessage({ type: 'success', text: 'Photo selected! Click "Save Profile" to save your updates.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };
    reader.readAsDataURL(file);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setRawFile(null);
    setFormData({
      name: contractor?.name || '',
      email: contractor?.email || '',
      phone: contractor?.phone || '',
      department: contractor?.department || ''
    });
    setProfilePic(contractor?.profilePhoto || contractor?.profilePic || null);
    setImgError(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
      const token = contractor?.token || localStorage.getItem('token');
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
        const updated = {
          ...contractor,
          ...data,
          profilePhoto: data.profilePhoto || profilePic,
          profilePic: data.profilePhoto || profilePic,
          token
        };
        localStorage.setItem('contractorUser', JSON.stringify(updated));
        setContractor(updated);
        if (data.profilePhoto || data.profilePic) {
          setProfilePic(data.profilePhoto || data.profilePic);
          setImgError(false);
        }
        setRawFile(null);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        window.dispatchEvent(new Event('user-updated'));
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
      const token = contractor?.token || localStorage.getItem('token');
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
              <TreePine size={28} color="#e5ede7" />
              <h1>Parks Monitoring System</h1>
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
              <div className="avatar-wrapper" onClick={triggerFileInput} title="Click to upload profile photo">
                {profilePic && !imgError ? (
                  <img 
                    src={profilePic} 
                    alt="Profile" 
                    className="avatar-image" 
                    onError={() => setImgError(true)} 
                  />
                ) : (
                  <div className="avatar-circle">
                    <User size={48} />
                  </div>
                )}
                <div className="avatar-overlay">
                  <Camera size={24} />
                  <span>{rawFile ? 'Selected' : (profilePic ? 'Change' : 'Upload')}</span>
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
                type="button"
                className={`btn-toggle-edit ${isEditing ? 'active' : ''}`}
                onClick={() => {
                  if (isEditing) {
                    handleCancelEditing();
                  } else {
                    setIsEditing(true);
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
                      <label>Full Name</label>
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
                          maxLength="10"
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
    </div>
  );
};

export default ContractorProfile;

