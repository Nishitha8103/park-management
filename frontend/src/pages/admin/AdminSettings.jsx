import { useState, useEffect } from 'react';
import { User, Lock, Bell, Shield, Mail, Phone, Save, FileCheck, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const DEFAULT_PROOF_TYPES = [
  'Rental Agreement',
  'Electricity Bill / Water Bill',
  'Gas Connection Bill',
  'College ID / Bonafide Certificate',
  'Employer Letter / HR Certificate',
  'Bank Statement with Local Address',
  'Other Valid Address Proof'
];

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  
  const [profileData, setProfileData] = useState({
    name: adminUser.name || 'System Admin',
    email: adminUser.email || 'admin@example.com',
    phone: adminUser.phone || '9876543210',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    newComplaint: true,
    taskCompletion: true,
  });

  // Configurable address proof types for Stall Booking
  const [proofTypes, setProofTypes] = useState(DEFAULT_PROOF_TYPES);
  const [newProofType, setNewProofType] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProofTypesConfig();
  }, []);

  const fetchProofTypesConfig = async () => {
    try {
      const res = await axios.get('/api/stall-bookings/config/proof-types');
      if (res.data?.success && Array.isArray(res.data.proofTypes)) {
        setProofTypes(res.data.proofTypes);
      }
    } catch (_) {
      // fallback to defaults
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    setTimeout(() => {
      setSaving(false);
      setMessage({ type: 'success', text: 'Profile settings updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }, 800);
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswords({ current: '', new: '', confirm: '' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }, 800);
  };

  const handleAddProofType = () => {
    if (!newProofType.trim()) return;
    if (proofTypes.includes(newProofType.trim())) {
      setMessage({ type: 'error', text: 'This document type already exists.' });
      return;
    }
    setProofTypes(prev => [...prev, newProofType.trim()]);
    setNewProofType('');
  };

  const handleDeleteProofType = (index) => {
    setProofTypes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveProofTypes = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      const res = await axios.put('/api/stall-bookings/config/proof-types', { proofTypes }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setMessage({ type: 'success', text: 'Accepted address proof types updated successfully!' });
      } else {
        setMessage({ type: 'error', text: res.data?.message || 'Failed to update.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save proof types.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h4 style={{ margin: 0, color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Personal Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} required />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#3b82f6', color: '#fff', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        );

      case 'stall_docs':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 700 }}>
                Accepted Address Proof Types (Stall Bookings)
              </h4>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b' }}>
                Configure which document types applicants can upload when their current city address differs from their native Aadhaar card address.
              </p>
            </div>

            {/* Add New Type */}
            <div style={{ display: 'flex', gap: '10px', maxWidth: '600px' }}>
              <input
                type="text"
                placeholder="e.g. Hostels / PG Rent Agreement, Work Permit..."
                value={newProofType}
                onChange={(e) => setNewProofType(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProofType(); } }}
                style={{ flex: 1, padding: '0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
              />
              <button
                type="button"
                onClick={handleAddProofType}
                style={{ padding: '0.75rem 1.25rem', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={18} /> Add
              </button>
            </div>

            {/* List of current types */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '600px' }}>
              {proofTypes.map((type, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.92rem', color: '#1e293b', fontWeight: 600 }}>{type}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteProofType(idx)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleSaveProofTypes}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#059669', color: '#fff', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Save Document Types'}
              </button>
            </div>
          </div>
        );

      case 'security':
        return (
          <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h4 style={{ margin: 0, color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Change Password</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Current Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} required />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1rem' }}>
              <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#3b82f6', color: '#fff', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                <Shield size={18} /> {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        );

      case 'notifications':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h4 style={{ margin: 0, color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Notification Preferences</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', color: '#0f172a' }}>Email Alerts</h5>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Receive system notifications via email.</p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                  <input type="checkbox" checked={notifications.emailAlerts} onChange={() => setNotifications({...notifications, emailAlerts: !notifications.emailAlerts})} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: notifications.emailAlerts ? '#10b981' : '#cbd5e1', transition: '.4s', borderRadius: '34px' }}>
                    <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: notifications.emailAlerts ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', color: '#0f172a' }}>SMS Alerts</h5>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Receive urgent alerts via SMS to your registered phone number.</p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                  <input type="checkbox" checked={notifications.smsAlerts} onChange={() => setNotifications({...notifications, smsAlerts: !notifications.smsAlerts})} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: notifications.smsAlerts ? '#10b981' : '#cbd5e1', transition: '.4s', borderRadius: '34px' }}>
                    <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: notifications.smsAlerts ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', color: '#0f172a' }}>New Complaints</h5>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Notify me when a new complaint is registered by a citizen.</p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                  <input type="checkbox" checked={notifications.newComplaint} onChange={() => setNotifications({...notifications, newComplaint: !notifications.newComplaint})} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: notifications.newComplaint ? '#10b981' : '#cbd5e1', transition: '.4s', borderRadius: '34px' }}>
                    <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: notifications.newComplaint ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="admin-panel" style={{ padding: '2rem', background: '#f1f5f9', minHeight: '100vh' }}>
      <div className="admin-panel-header" style={{ marginBottom: '2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', margin: 0, color: '#0f172a' }}>
          <Shield size={28} color="#059669" />
          System Settings & Verification Rules
        </h3>
        <p style={{ color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>
          Manage your account settings, notification preferences, and configurable stall verification documents.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Sidebar Tabs */}
        <div style={{ width: '260px', background: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <button 
            onClick={() => setActiveTab('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.9rem', border: 'none', background: activeTab === 'profile' ? '#eff6ff' : 'transparent', color: activeTab === 'profile' ? '#2563eb' : '#475569', fontWeight: activeTab === 'profile' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '4px' }}
          >
            <User size={18} /> Account Profile
          </button>
          <button 
            onClick={() => setActiveTab('stall_docs')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.9rem', border: 'none', background: activeTab === 'stall_docs' ? '#ecfdf5' : 'transparent', color: activeTab === 'stall_docs' ? '#059669' : '#475569', fontWeight: activeTab === 'stall_docs' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '4px' }}
          >
            <FileCheck size={18} /> Stall Address Proofs
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.9rem', border: 'none', background: activeTab === 'security' ? '#eff6ff' : 'transparent', color: activeTab === 'security' ? '#2563eb' : '#475569', fontWeight: activeTab === 'security' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '4px' }}
          >
            <Lock size={18} /> Security
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.9rem', border: 'none', background: activeTab === 'notifications' ? '#eff6ff' : 'transparent', color: activeTab === 'notifications' ? '#2563eb' : '#475569', fontWeight: activeTab === 'notifications' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
          >
            <Bell size={18} /> Notifications
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, background: '#fff', borderRadius: '12px', padding: '2.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', minHeight: '400px' }}>
          {message.text && (
            <div style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b', border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} /> {message.text}
            </div>
          )}
          {renderTabContent()}
        </div>

      </div>
    </div>
  );
};

export default AdminSettings;
