import { useState, useRef, useEffect } from 'react';
import { Camera, User, Lock, Mail, Phone, Building, ShieldCheck, Save, CheckCircle2, AlertCircle, Key, UserCheck, BadgeCheck } from 'lucide-react';
import './GovProfile.css';

const GovProfile = () => {
  const fileInputRef = useRef(null);
  
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('govUser');
    return stored ? JSON.parse(stored) : null;
  });

  const [profileData, setProfileData] = useState({
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@gov.in',
    phone: '+91 9876543210',
    department: 'Parks & Recreation',
    designation: 'Government Official',
    profilePic: null
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [alert, setAlert] = useState({ type: null, message: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || 'Parks & Recreation',
        designation: user.role || 'Government Official',
        profilePic: user.profilePic || null
      });
    }
  }, [user]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert({ type: null, message: '' });
    }, 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setProfileData(prev => ({ ...prev, profilePic: base64 }));

      try {
        if (user) {
          const res = await fetch(`/api/auth/users/${user.id || user._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profilePic: base64 })
          });
          if (res.ok) {
            const data = await res.json();
            const updatedUser = { ...user, profilePic: data.user?.profilePic || base64 };
            setUser(updatedUser);
            localStorage.setItem('govUser', JSON.stringify(updatedUser));
            window.dispatchEvent(new Event('user-updated'));
            showAlert('success', 'Profile picture updated successfully!');
          }
        }
      } catch (err) {
        console.error('Error saving profile picture:', err);
        showAlert('error', 'Failed to update profile picture.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (!profileData.name.trim()) {
      showAlert('error', 'Name is required');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(profileData.email)) {
      showAlert('error', 'Invalid email format');
      return;
    }
    if (profileData.phone && !/^\d{10}$/.test(profileData.phone)) {
      showAlert('error', 'Phone number must be exactly 10 digits');
      return;
    }

    setSavingProfile(true);
    
    try {
      const res = await fetch(`/api/auth/users/${user.id || user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          department: profileData.department,
          profilePic: profileData.profilePic
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...user, ...data.user, profilePic: data.user?.profilePic || profileData.profilePic };
        setUser(updatedUser);
        localStorage.setItem('govUser', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('user-updated'));
        showAlert('success', 'Personal information saved successfully!');
      } else {
        const err = await res.json();
        showAlert('error', err.message || 'Failed to update profile.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert('error', 'An error occurred while saving profile changes.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showAlert('error', 'New password and confirm password do not match!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showAlert('error', 'Password must be at least 6 characters long.');
      return;
    }
    
    setSavingPassword(true);

    try {
      const res = await fetch(`/api/auth/users/${user.id || user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: passwordData.newPassword
        })
      });

      if (res.ok) {
        showAlert('success', 'Password updated successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const err = await res.json();
        showAlert('error', err.message || 'Failed to update password.');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      showAlert('error', 'An error occurred while updating the password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="gov-profile-page container">
      
      {/* Header Banner */}
      <div className="gov-profile-header">
        <div className="gov-header-title-box">
          <span className="gov-badge-pill">
            <ShieldCheck size={14} /> OFFICIAL PROFILE & SETTINGS
          </span>
          <h2>Government Official Account Settings</h2>
          <p>Manage your account credentials, contact information, department details, and security preferences.</p>
        </div>
      </div>

      {/* Floating Alert Toast */}
      {alert.type && (
        <div className={`gov-alert-banner ${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Profile Layout Grid */}
      <div className="gov-profile-grid">
        
        {/* Left Side: Avatar & Summary Card */}
        <div className="gov-profile-left">
          <div className="gov-card profile-avatar-card">
            
            <div className="avatar-ring-container" onClick={handleImageClick} title="Click to upload new photo">
              {profileData.profilePic ? (
                <img src={profileData.profilePic} alt="Official Profile" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  <User size={64} className="placeholder-icon" />
                </div>
              )}
              <div className="avatar-camera-overlay">
                <Camera size={26} color="white" />
                <span>Upload</span>
              </div>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden-file-input" 
              accept="image/*" 
              onChange={handleImageChange}
            />

            <div className="official-name-badge-group">
              <h3>{profileData.name || 'Government Official'}</h3>
              <div className="verified-badge-pill">
                <BadgeCheck size={14} /> Verified Official
              </div>
            </div>

            <p className="official-dept-text">{profileData.department || 'Parks & Recreation'}</p>

            <button className="btn-upload-photo" onClick={handleImageClick}>
              <Camera size={15} /> Upload Photo
            </button>

            {/* Quick Details List */}
            <div className="profile-summary-box">
              <div className="summary-row">
                <span className="summary-label">Account ID:</span>
                <span className="summary-val">GOV-{(user?._id || user?.id || '8892').slice(-6).toUpperCase()}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Role:</span>
                <span className="summary-val">{profileData.designation}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Status:</span>
                <span className="status-active-tag">Active</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Form Cards */}
        <div className="gov-profile-right">
          
          {/* Card 1: Personal Information */}
          <div className="gov-card profile-form-card">
            <div className="card-section-header">
              <div className="section-icon-box text-emerald">
                <UserCheck size={20} />
              </div>
              <div>
                <h3>Personal Information</h3>
                <p>Update your display name, email, and official phone number.</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="profile-form-body">
              <div className="form-fields-grid">
                
                {/* Full Name */}
                <div className="form-field-group">
                  <label className="field-label">Full Name</label>
                  <div className="input-with-icon">
                    <User size={18} className="field-icon" />
                    <input 
                      type="text" 
                      className="styled-input" 
                      name="name"
                      placeholder="Enter full name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                {/* Email Address */}
                <div className="form-field-group">
                  <label className="field-label">Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="field-icon" />
                    <input 
                      type="email" 
                      className="styled-input" 
                      name="email"
                      placeholder="name@government.in"
                      value={profileData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="form-field-group">
                  <label className="field-label">Phone Number</label>
                  <div className="input-with-icon">
                    <Phone size={18} className="field-icon" />
                    <input 
                      type="tel" 
                      className="styled-input" 
                      name="phone"
                      placeholder="+91 9876543210"
                      value={profileData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Department (Readonly) */}
                <div className="form-field-group">
                  <label className="field-label">Department</label>
                  <div className="input-with-icon readonly">
                    <Building size={18} className="field-icon" />
                    <input 
                      type="text" 
                      className="styled-input readonly" 
                      value={profileData.department || 'Parks & Recreation'}
                      readOnly
                    />
                    <Lock size={15} className="lock-icon" />
                  </div>
                  <span className="field-note">Assigned by administrator</span>
                </div>

                {/* Designation (Readonly) */}
                <div className="form-field-group full-width">
                  <label className="field-label">Designation / Role</label>
                  <div className="input-with-icon readonly">
                    <ShieldCheck size={18} className="field-icon" />
                    <input 
                      type="text" 
                      className="styled-input readonly" 
                      value={profileData.designation || 'Government Official'}
                      readOnly
                    />
                    <Lock size={15} className="lock-icon" />
                  </div>
                  <span className="field-note">Assigned by administrator</span>
                </div>

              </div>

              <div className="form-submit-row">
                <button type="submit" className="btn-save-primary" disabled={savingProfile}>
                  <Save size={16} />
                  {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Change Password */}
          <div className="gov-card profile-form-card">
            <div className="card-section-header">
              <div className="section-icon-box text-purple">
                <Key size={20} />
              </div>
              <div>
                <h3>Security & Password</h3>
                <p>Ensure your official account remains secure with a strong password.</p>
              </div>
            </div>

            <form onSubmit={handleSavePassword} className="profile-form-body">
              <div className="form-fields-grid">
                
                {/* Current Password */}
                <div className="form-field-group full-width">
                  <label className="field-label">Current Password</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="field-icon" />
                    <input 
                      type="password" 
                      className="styled-input" 
                      name="currentPassword"
                      placeholder="••••••••••••"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="form-field-group">
                  <label className="field-label">New Password</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="field-icon" />
                    <input 
                      type="password" 
                      className="styled-input" 
                      name="newPassword"
                      placeholder="Minimum 6 characters"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="form-field-group">
                  <label className="field-label">Confirm New Password</label>
                  <div className="input-with-icon">
                    <Lock size={18} className="field-icon" />
                    <input 
                      type="password" 
                      className="styled-input" 
                      name="confirmPassword"
                      placeholder="Re-enter new password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </div>

              </div>

              <div className="form-submit-row">
                <button type="submit" className="btn-save-secondary" disabled={savingPassword}>
                  <Lock size={16} />
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};

export default GovProfile;
