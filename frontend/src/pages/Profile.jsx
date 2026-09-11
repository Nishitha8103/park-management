import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Clock, Lock, Edit, Check, Camera } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const todayDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const todayTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const [userData, setUserData] = useState({
    name: 'Public User',
    email: 'publicuser@gmail.com',
    phone: '9876543210',
    address: 'JP Nagar, Bangalore',
    memberSince: todayDate,
    lastLogin: `${todayDate} ${todayTime}`,
    role: 'Public User',
    profilePic: null
  });

  const fileInputRef = useRef(null);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setUserData(prev => ({ ...prev, profilePic: base64String }));
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            localStorage.setItem('user', JSON.stringify({ ...parsed, profilePic: base64String }));
            window.dispatchEvent(new Event('user-updated'));
          } catch (err) {
            console.error(err);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', address: '' });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Use registration date if available, otherwise fallback
        let userMemberSince = parsed.memberSince || todayDate;
        if (parsed.createdAt) {
          userMemberSince = new Date(parsed.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        }
        const userLastLogin = parsed.lastLogin || `${todayDate} ${todayTime}`;
        
        setUserData(prev => ({
          ...prev,
          name: parsed.name || 'Public User',
          email: parsed.email || prev.email,
          phone: parsed.phone || prev.phone,
          address: parsed.address || prev.address,
          role: parsed.userType === 'public_user' ? 'Public User' : parsed.userType || prev.role,
          memberSince: userMemberSince,
          lastLogin: userLastLogin,
          profilePic: parsed.profilePic || null
        }));
        
        // Backfill storage if they were missing
        if (!parsed.memberSince || !parsed.lastLogin) {
          localStorage.setItem('user', JSON.stringify({
            ...parsed,
            memberSince: userMemberSince,
            lastLogin: userLastLogin
          }));
        }
      } catch (e) {
        console.error("Error parsing user data");
      }
    }
  }, []);

  const handleEditClick = () => {
    if (isEditing) {
      setUserData(prev => ({ ...prev, ...editForm }));
      setIsEditing(false);
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('user', JSON.stringify({ 
          ...parsed, 
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address
        }));
        window.dispatchEvent(new Event('user-updated'));
      }
      alert('Profile updated successfully!');
    } else {
      setEditForm({ 
        name: userData.name, 
        email: userData.email,
        phone: userData.phone, 
        address: userData.address 
      });
      setIsEditing(true);
    }
  };

  const handlePasswordChange = () => {
    if (isChangingPassword) {
      if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
        alert("Please fill in all password fields!");
        return;
      }
      if (passwordForm.new !== passwordForm.confirm) {
        alert("New passwords do not match!");
        return;
      }
      if (passwordForm.new.length < 6) {
        alert("Password must be at least 6 characters!");
        return;
      }
      
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.password !== passwordForm.current) {
          alert("Current password is incorrect!");
          return;
        }
        localStorage.setItem('user', JSON.stringify({ ...parsed, password: passwordForm.new }));
      }

      setIsChangingPassword(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
      alert('Password changed successfully!');
    } else {
      setIsChangingPassword(true);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header-banner">
        <div className="header-title-group">
          <div className="header-icon-box">
            <User size={26} color="#059669" />
          </div>
          <div>
            <h1>My Profile</h1>
            <p>Manage your personal details, contact information, and security preferences</p>
          </div>
        </div>
      </div>

      <div className="profile-hero-card">
        <div 
          className="profile-avatar-large editable-avatar" 
          onClick={() => fileInputRef.current?.click()}
          title="Click to change profile picture"
        >
          {userData.profilePic ? (
            <img src={userData.profilePic} alt="Profile" className="profile-pic-img" />
          ) : (
            <User size={50} color="white" />
          )}
          <div className="avatar-edit-overlay">
            <Camera size={22} color="white" />
          </div>
          <input 
            type="file" 
            ref={fileInputRef}
            accept="image/*" 
            style={{ display: 'none' }} 
            onChange={handleProfilePicChange} 
          />
        </div>

        <div className="profile-hero-info">
          <div className="user-name-row">
            <h2>{isEditing ? editForm.name : userData.name}</h2>
            <span className="user-role-badge">🟢 {userData.role || 'Public Citizen'}</span>
          </div>
          <div className="profile-meta-grid">
            <div className="profile-meta-item">
              <Mail size={15} /> <span>{userData.email}</span>
            </div>
            <div className="profile-meta-item">
              <Phone size={15} /> <span>{isEditing ? editForm.phone : userData.phone}</span>
            </div>
            <div className="profile-meta-item">
              <MapPin size={15} /> <span>{isEditing ? editForm.address : userData.address}</span>
            </div>
          </div>
        </div>

        <button className="edit-profile-btn" onClick={handleEditClick}>
          {isEditing ? <><Check size={16} /> Save Changes</> : <><Edit size={16} /> Edit Profile</>}
        </button>
      </div>

      <div className="profile-section-card">
        <div className="section-header">
          <User size={20} className="section-header-icon" />
          <h3>Personal Details</h3>
        </div>
        
        <div className="info-fields-grid">
          <div className="info-field-card">
            <div className="info-field-label"><User size={15} /> Full Name</div>
            <div className="info-field-value">
              {isEditing ? (
                <input 
                  type="text" 
                  value={editForm.name} 
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="profile-edit-input"
                />
              ) : userData.name}
            </div>
          </div>

          <div className="info-field-card">
            <div className="info-field-label"><Mail size={15} /> Email Address</div>
            <div className="info-field-value">
              {isEditing ? (
                <input 
                  type="email" 
                  value={editForm.email} 
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="profile-edit-input"
                />
              ) : userData.email}
            </div>
          </div>

          <div className="info-field-card">
            <div className="info-field-label"><Phone size={15} /> Phone Number</div>
            <div className="info-field-value">
              {isEditing ? (
                <input 
                  type="text" 
                  value={editForm.phone} 
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  className="profile-edit-input"
                />
              ) : userData.phone}
            </div>
          </div>

          <div className="info-field-card">
            <div className="info-field-label"><MapPin size={15} /> Location / Address</div>
            <div className="info-field-value">
              {isEditing ? (
                <input 
                  type="text" 
                  value={editForm.address} 
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  className="profile-edit-input"
                />
              ) : userData.address}
            </div>
          </div>

          <div className="info-field-card">
            <div className="info-field-label"><Calendar size={15} /> Member Since</div>
            <div className="info-field-value readonly-val">{userData.memberSince}</div>
          </div>

          <div className="info-field-card">
            <div className="info-field-label"><Clock size={15} /> Last Login</div>
            <div className="info-field-value readonly-val">{userData.lastLogin}</div>
          </div>
        </div>
      </div>

      <div className="profile-section-card">
        <div className="section-header">
          <Lock size={20} className="section-header-icon" />
          <h3>Account Security</h3>
        </div>

        <div className="account-security-content">
          {!isChangingPassword ? (
            <div className="security-summary-row">
              <div>
                <div className="security-title">Password</div>
                <div className="password-mask">• • • • • • • • • •</div>
              </div>
              <button className="change-password-btn" onClick={handlePasswordChange}>
                <Lock size={15} /> Change Password
              </button>
            </div>
          ) : (
            <div className="password-change-form">
              <div className="form-group-row">
                <label>Current Password</label>
                <input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})} className="profile-edit-input" placeholder="Enter current password" />
              </div>
              <div className="form-group-row">
                <label>New Password</label>
                <input type="password" value={passwordForm.new} onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})} className="profile-edit-input" placeholder="Enter new password (min 6 chars)" />
              </div>
              <div className="form-group-row">
                <label>Confirm New Password</label>
                <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})} className="profile-edit-input" placeholder="Confirm new password" />
              </div>
              <div className="password-actions">
                <button className="cancel-btn" onClick={() => {setIsChangingPassword(false); setPasswordForm({ current: '', new: '', confirm: '' })}}>Cancel</button>
                <button className="save-btn" onClick={handlePasswordChange}>Save Password</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
