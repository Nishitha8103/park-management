import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Clock, Lock, Edit, Check, Camera } from 'lucide-react';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const todayDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const todayTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getStoredUser = () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error reading stored user:", e);
    }
    return null;
  };

  const [userData, setUserData] = useState(() => {
    const parsed = getStoredUser();
    if (parsed) {
      return {
        name: parsed.name || 'Public User',
        email: parsed.email || 'user@example.com',
        phone: parsed.phone || '',
        address: parsed.address || '',
        memberSince: parsed.memberSince || (parsed.createdAt ? new Date(parsed.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : todayDate),
        lastLogin: parsed.lastLogin || `${todayDate} ${todayTime}`,
        role: parsed.role || 'Public User',
        profilePic: parsed.profilePic || null
      };
    }
    return {
      name: 'Public User',
      email: 'user@example.com',
      phone: '',
      address: '',
      memberSince: todayDate,
      lastLogin: `${todayDate} ${todayTime}`,
      role: 'Public User',
      profilePic: null
    };
  });

  const fileInputRef = useRef(null);

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        setUserData(prev => ({ ...prev, profilePic: base64String }));
        const stored = getStoredUser() || {};
        const updated = { ...stored, profilePic: base64String };
        localStorage.setItem('user', JSON.stringify(updated));
        window.dispatchEvent(new Event('user-updated'));

        // If user id exists, try persisting to backend
        const userId = stored._id || stored.id;
        if (userId) {
          try {
            await axios.put(`/api/auth/users/${userId}`, { profilePic: base64String });
          } catch (err) {
            console.error('Failed to sync profile pic to backend:', err);
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
    const syncFromStorage = () => {
      const parsed = getStoredUser();
      if (parsed) {
        setUserData(prev => ({
          ...prev,
          name: parsed.name ?? prev.name,
          email: parsed.email ?? prev.email,
          phone: parsed.phone ?? prev.phone,
          address: parsed.address ?? prev.address,
          role: parsed.role ?? prev.role,
          memberSince: parsed.memberSince || (parsed.createdAt ? new Date(parsed.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : prev.memberSince),
          profilePic: parsed.profilePic ?? prev.profilePic
        }));
      }
    };

    const fetchLiveProfile = async () => {
      const stored = getStoredUser();
      const token = stored?.token || localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get('/api/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data) {
            const freshUser = { ...stored, ...res.data };
            localStorage.setItem('user', JSON.stringify(freshUser));
            syncFromStorage();
          }
        } catch (err) {
          console.error('Error fetching live profile:', err);
        }
      }
    };

    syncFromStorage();
    fetchLiveProfile();
    window.addEventListener('user-updated', syncFromStorage);
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener('user-updated', syncFromStorage);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  const handleEditClick = async () => {
    if (isEditing) {
      const updatedFields = {
        name: editForm.name.trim() || userData.name,
        email: editForm.email.trim() || userData.email,
        phone: editForm.phone.trim(),
        address: editForm.address.trim()
      };

      const stored = getStoredUser() || {};
      const newStored = { ...stored, ...updatedFields };
      
      // Update local storage and UI immediately
      localStorage.setItem('user', JSON.stringify(newStored));
      setUserData(prev => ({ ...prev, ...updatedFields }));
      setIsEditing(false);
      window.dispatchEvent(new Event('user-updated'));

      // If user id exists, persist to backend DB and update with response
      const userId = stored._id || stored.id;
      if (userId) {
        try {
          const res = await axios.put(`/api/auth/users/${userId}`, updatedFields);
          if (res.data && res.data.user) {
            const syncedUser = { ...newStored, ...res.data.user };
            localStorage.setItem('user', JSON.stringify(syncedUser));
            if (syncedUser.role === 'Contractor') localStorage.setItem('contractorUser', JSON.stringify(syncedUser));
            if (syncedUser.role === 'Admin') localStorage.setItem('adminUser', JSON.stringify(syncedUser));
            if (syncedUser.role === 'Government Official') localStorage.setItem('govUser', JSON.stringify(syncedUser));
            window.dispatchEvent(new Event('user-updated'));
          }
        } catch (err) {
          console.error('Failed to sync profile update to backend:', err);
        }
      }

      alert('Profile updated successfully!');
    } else {
      setEditForm({ 
        name: userData.name || '', 
        email: userData.email || '',
        phone: userData.phone || '', 
        address: userData.address || '' 
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
      
      const stored = getStoredUser();
      if (stored) {
        if (stored.password && stored.password !== passwordForm.current) {
          alert("Current password is incorrect!");
          return;
        }
        localStorage.setItem('user', JSON.stringify({ ...stored, password: passwordForm.new }));
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
            <span className="user-role-badge">
              🟢 {userData.role === 'public_user' ? 'Public User' : userData.role || 'Public User'}
            </span>
          </div>
          <div className="profile-meta-grid">
            <div className="profile-meta-item">
              <Mail size={15} /> <span>{userData.email}</span>
            </div>
            <div className="profile-meta-item">
              <Phone size={15} /> <span>{isEditing ? editForm.phone : (userData.phone || 'No phone provided')}</span>
            </div>
            <div className="profile-meta-item">
              <MapPin size={15} /> <span>{isEditing ? editForm.address : (userData.address || 'No location provided')}</span>
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
                  placeholder="e.g. 9876543210"
                />
              ) : (userData.phone || '—')}
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
                  placeholder="e.g. JP Nagar, Bangalore"
                />
              ) : (userData.address || '—')}
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
