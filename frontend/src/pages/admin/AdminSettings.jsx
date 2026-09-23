import { useState, useEffect } from 'react';
import { 
  Building2,
  User, 
  Lock, 
  Bell, 
  Shield, 
  Mail, 
  Phone, 
  Save, 
  CheckCircle2,
  Calendar,
  Clock,
  Sliders,
  Store,
  FileText,
  Plus,
  Trash2,
  Ticket,
  BadgeCheck,
  Sparkles,
  Image as ImageIcon,
  HardHat,
  Landmark,
  ShieldCheck,
  Users,
  Wrench,
  AlertTriangle,
  DollarSign,
  Camera,
  Star
} from 'lucide-react';
import axios from 'axios';

const DEFAULT_PROOF_TYPES = [
  'Rental Agreement',
  'Electricity Bill / Water Bill',
  'Gas Connection Bill',
  'College ID / Bonafide Certificate',
  'Employer Letter / HR Certificate',
  'Bank Statement with Local Address',
  'Trade License / Business Registration',
  'Other Valid Address Proof'
];

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('branding');
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  
  // 1. Branding & Identity
  const [branding, setBranding] = useState({
    projectName: 'Parks Monitoring System',
    slogan: '“Explore. Enjoy. Empower.”',
    description: 'Discover your city’s parks, stay informed, report issues, join events and book stalls — all in one place!',
    logoUrl: '/parks_logo_v3.png',
    organizationName: 'Parks & Horticulture Department',
    helplinePhone: '1800-123-PARK',
    supportEmail: 'support@parksmonitoring.gov.in'
  });

  // 2. Profile Data
  const [profileData, setProfileData] = useState({
    name: adminUser.name || 'System Admin',
    email: adminUser.email || 'admin@example.com',
    phone: adminUser.phone || '9876543210',
  });

  // 3. Passwords
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });

  // 4. Contractor Operational & Material Policies
  const [contractorPolicies, setContractorPolicies] = useState({
    maxConcurrentTasks: 5,
    requireBeforeAfterPhotos: true,
    allowTaskReassignmentRequests: true,
    requireMaterialApproval: true
  });

  // 5. Government Official Policies
  const [officialPolicies, setOfficialPolicies] = useState({
    maxConcurrentInspections: 10,
    allowInspectionReassignment: true,
    mandatoryInspectionRemarks: true,
    allowLeaveSelfApplication: true
  });

  // 6. Public & Citizen Portal Policies
  const [publicPolicies, setPublicPolicies] = useState({
    allowPublicComplaints: true,
    allowCitizenRegistration: true,
    allowStallBookings: true,
    allowEventRegistrations: true
  });

  // 7. Leave Policy Configuration (Real HR engine)
  const [leavePolicy, setLeavePolicy] = useState({
    annualAllowance: 12,
    dailyDeductionRate: 1000
  });

  // 6. Complaint SLA Thresholds (Real Escalation Engine)
  const [slaThresholds, setSlaThresholds] = useState({
    urgentHours: 4,
    highHours: 24,
    mediumHours: 48,
    lowHours: 72
  });

  // 7. Stall & Event Policies
  const [stallPolicies, setStallPolicies] = useState({
    requireProofOfAddress: true,
    maxBookingDays: 7,
    advanceBookingWindowDays: 30,
    cancellationWindowHours: 48,
    securityDepositAmount: 500,
    stallOpeningTime: '06:00',
    stallClosingTime: '21:00'
  });

  const [eventPolicies, setEventPolicies] = useState({
    maxTicketsPerUser: 5,
    cancellationWindowHours: 24,
    autoGenerateQrPass: true
  });

  const [proofTypes, setProofTypes] = useState(DEFAULT_PROOF_TYPES);
  const [newProofType, setNewProofType] = useState('');

  // 8. Notification Preferences
  const [notifications, setNotifications] = useState({
    highPriorityGrievances: true,
    stallBookingAlerts: true,
    contractorRequestAlerts: true
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const getAdminToken = () => {
    try {
      return JSON.parse(localStorage.getItem('adminUser'))?.token;
    } catch (_) {
      return null;
    }
  };

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    try {
      const [settingsRes, proofsRes] = await Promise.all([
        axios.get('/api/settings').catch(() => ({ data: { success: false } })),
        axios.get('/api/stall-bookings/config/proof-types').catch(() => ({ data: { success: false } }))
      ]);

      if (settingsRes.data?.success && settingsRes.data.settings) {
        const s = settingsRes.data.settings;
        if (s.branding) setBranding(prev => ({ ...prev, ...s.branding }));
        if (s.publicModule) setPublicPolicies(prev => ({ ...prev, ...s.publicModule }));
        if (s.contractorModule) setContractorPolicies(prev => ({ ...prev, ...s.contractorModule }));
        if (s.officialModule) setOfficialPolicies(prev => ({ ...prev, ...s.officialModule }));
        if (s.leavePolicy) setLeavePolicy(s.leavePolicy);
        if (s.slaThresholds) setSlaThresholds(s.slaThresholds);
        if (s.stallPolicies) setStallPolicies(prev => ({ ...prev, ...s.stallPolicies }));
        if (s.eventPolicies) setEventPolicies(prev => ({ ...prev, ...s.eventPolicies }));
        if (s.notifications) {
          setNotifications({
            highPriorityGrievances: s.notifications.highPriorityGrievances !== undefined ? s.notifications.highPriorityGrievances : true,
            stallBookingAlerts: s.notifications.stallBookingAlerts !== undefined ? s.notifications.stallBookingAlerts : true,
            contractorRequestAlerts: s.notifications.contractorRequestAlerts !== undefined ? s.notifications.contractorRequestAlerts : true
          });
        }
      }

      if (proofsRes.data?.success && Array.isArray(proofsRes.data.proofTypes)) {
        setProofTypes(proofsRes.data.proofTypes);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const showFeedback = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3500);
  };

  // 1. Save Branding & Identity
  const handleBrandingSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/api/settings/branding', {
        value: branding,
        description: 'Portal name, logo, slogan, and organization branding'
      });
      showFeedback('success', 'Portal branding (Name, Logo & Slogan) updated successfully.');
    } catch (err) {
      console.error('Branding update error:', err);
      showFeedback('error', 'Failed to update branding settings.');
    } finally {
      setSaving(false);
    }
  };

  // 2. Save Profile
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = getAdminToken();
      const adminId = adminUser._id || adminUser.id;
      
      if (adminId) {
        await axios.put(`/api/auth/users/${adminId}`, {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      }

      const updated = { ...adminUser, name: profileData.name, email: profileData.email, phone: profileData.phone };
      localStorage.setItem('adminUser', JSON.stringify(updated));
      showFeedback('success', 'Admin profile information updated successfully.');
    } catch (err) {
      console.error('Profile update error:', err);
      showFeedback('error', err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // 3. Save Password
  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      showFeedback('error', 'New passwords do not match.');
      return;
    }
    if (passwords.new.length < 6) {
      showFeedback('error', 'Password must be at least 6 characters long.');
      return;
    }

    setSaving(true);
    try {
      const token = getAdminToken();
      const adminId = adminUser._id || adminUser.id;
      
      if (adminId) {
        await axios.put(`/api/auth/users/${adminId}`, {
          password: passwords.new
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      }

      setPasswords({ new: '', confirm: '' });
      showFeedback('success', 'Admin password updated successfully.');
    } catch (err) {
      console.error('Password update error:', err);
      showFeedback('error', err.response?.data?.message || 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  // 4. Save Contractor Policies
  const handleSaveContractorPolicies = async () => {
    setSaving(true);
    try {
      await axios.put('/api/settings/contractorModule', {
        value: contractorPolicies,
        description: 'Contractor task limits, material approval rules, and performance compliance'
      });
      showFeedback('success', 'Contractor operational policies saved successfully.');
    } catch (err) {
      showFeedback('error', 'Failed to save contractor policies.');
    } finally {
      setSaving(false);
    }
  };

  // 5. Save Government Official Policies
  const handleSaveOfficialPolicies = async () => {
    setSaving(true);
    try {
      await axios.put('/api/settings/officialModule', {
        value: officialPolicies,
        description: 'Government Official inspection workload limits, remarks enforcement, and reassignment rules'
      });
      showFeedback('success', 'Government Official operational policies saved successfully.');
    } catch (err) {
      showFeedback('error', 'Failed to save official policies.');
    } finally {
      setSaving(false);
    }
  };

  // 6. Save Public & Citizen Policies
  const handleSavePublicPolicies = async () => {
    setSaving(true);
    try {
      await axios.put('/api/settings/publicModule', {
        value: publicPolicies,
        description: 'Public grievance reporting, citizen registration, and booking availability'
      });
      showFeedback('success', 'Public & Citizen Portal policies saved successfully.');
    } catch (err) {
      showFeedback('error', 'Failed to save public portal policies.');
    } finally {
      setSaving(false);
    }
  };

  // 7. Save Leave Policy
  const handleSaveLeavePolicy = async () => {
    setSaving(true);
    try {
      await axios.put('/api/settings/leavePolicy', {
        value: leavePolicy,
        description: 'Annual leave allowance and daily unpaid deduction rate'
      });
      showFeedback('success', 'Leave & HR policy settings saved successfully.');
    } catch (err) {
      showFeedback('error', 'Failed to save leave policy settings.');
    } finally {
      setSaving(false);
    }
  };

  // 6. Save SLA Thresholds
  const handleSaveSlaThresholds = async () => {
    setSaving(true);
    try {
      await axios.put('/api/settings/slaThresholds', {
        value: slaThresholds,
        description: 'Turnaround hours for Urgent, High, Medium, Low complaints'
      });
      showFeedback('success', 'Complaint SLA resolution thresholds saved successfully.');
    } catch (err) {
      showFeedback('error', 'Failed to save SLA settings.');
    } finally {
      setSaving(false);
    }
  };

  // 7. Save Stall & Event Policies
  const handleAddProofType = () => {
    if (!newProofType.trim()) return;
    if (proofTypes.includes(newProofType.trim())) {
      showFeedback('error', 'This document type already exists.');
      return;
    }
    setProofTypes(prev => [...prev, newProofType.trim()]);
    setNewProofType('');
  };

  const handleDeleteProofType = (index) => {
    setProofTypes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveStallAndEventPolicies = async () => {
    setSaving(true);
    try {
      const token = getAdminToken();
      await Promise.all([
        axios.put('/api/stall-bookings/config/proof-types', { proofTypes }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }),
        axios.put('/api/settings/stallPolicies', {
          value: stallPolicies,
          description: 'Booking limits and operational rules for park stalls'
        }),
        axios.put('/api/settings/eventPolicies', {
          value: eventPolicies,
          description: 'Public event registration limits and QR passes'
        })
      ]);
      showFeedback('success', 'Stall & Event policies and KYC document rules saved successfully.');
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to save policies.');
    } finally {
      setSaving(false);
    }
  };

  // 8. Save Notifications
  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await axios.put('/api/settings/notifications', {
        value: notifications,
        description: 'System alert and in-app broadcast preferences'
      });
      showFeedback('success', 'Notification preferences saved successfully.');
    } catch (err) {
      showFeedback('error', 'Failed to save notification settings.');
    } finally {
      setSaving(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'branding':
        return (
          <form onSubmit={handleBrandingSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', color: '#F0F4FF', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={22} color="#10b981" /> Project Identity & Branding
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#A8B0C8' }}>
                Configure the official project title, slogan/quote, mission subtitle, and emblem logo for the platform.
              </p>
            </div>

            {/* Live Brand Preview Card matching exact landing page design */}
            <div style={{ background: 'linear-gradient(135deg, #0b1e16 0%, #151A2B 100%)', border: '1.5px solid #10b981', borderRadius: '14px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#0a1f18', border: '2.5px solid #34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '6px', boxShadow: '0 0 20px rgba(52, 211, 153, 0.35)', flexShrink: 0 }}>
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.src = '/parks_logo_v3.png'; }} />
                ) : (
                  <ImageIcon size={36} color="#10b981" />
                )}
              </div>

              <div style={{ flex: 1, minWidth: '240px' }}>
                <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', display: 'inline-block', marginBottom: '4px' }}>
                  🌿 Live Portal Brand Identity
                </span>
                <h3 style={{ margin: '0 0 4px 0', color: '#F0F4FF', fontSize: '1.45rem', fontWeight: 900, lineHeight: 1.2 }}>
                  {branding.projectName || 'Parks Monitoring System'}
                </h3>
                <p style={{ margin: '0 0 6px 0', color: '#34d399', fontSize: '0.98rem', fontWeight: 800, fontStyle: 'italic' }}>
                  {branding.slogan || '“Explore. Enjoy. Empower.”'}
                </p>
                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.84rem', lineHeight: 1.4 }}>
                  {branding.description || 'Discover your city’s parks, stay informed, report issues, join events and book stalls — all in one place!'}
                </p>
              </div>
            </div>

            {/* Input Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '8px' }}>
                  Project / Portal Name
                </label>
                <input 
                  type="text" 
                  value={branding.projectName} 
                  onChange={e => setBranding({...branding, projectName: e.target.value})} 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: '#151A2B', color: '#F0F4FF', outline: 'none', boxSizing: 'border-box', fontWeight: 700 }} 
                  placeholder="e.g. Parks Monitoring System" 
                  required 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '8px' }}>
                  Project Slogan / Tagline
                </label>
                <input 
                  type="text" 
                  value={branding.slogan} 
                  onChange={e => setBranding({...branding, slogan: e.target.value})} 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: '#151A2B', color: '#34d399', outline: 'none', boxSizing: 'border-box', fontWeight: 700 }} 
                  placeholder="e.g. “Explore. Enjoy. Empower.”" 
                  required 
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '8px' }}>
                  Portal Mission & Subtitle
                </label>
                <input 
                  type="text" 
                  value={branding.description} 
                  onChange={e => setBranding({...branding, description: e.target.value})} 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: '#151A2B', color: '#F0F4FF', outline: 'none', boxSizing: 'border-box' }} 
                  placeholder="e.g. Discover your city’s parks, stay informed, report issues, join events and book stalls — all in one place!" 
                  required 
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '8px' }}>
                  Logo Image Path / URL
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    value={branding.logoUrl} 
                    onChange={e => setBranding({...branding, logoUrl: e.target.value})} 
                    style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: '#151A2B', color: '#F0F4FF', outline: 'none', boxSizing: 'border-box' }} 
                    placeholder="e.g. /parks_logo_v3.png" 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setBranding({...branding, logoUrl: '/parks_logo_v3.png'})}
                    style={{ padding: '0 1rem', background: '#1E2438', color: '#34d399', border: '1px solid #10b981', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                    title="Reset to default logo"
                  >
                    Default Logo
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
              <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981', color: '#042f2e', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Branding Settings'}
              </button>
            </div>
          </form>
        );

      case 'profile':
        return (
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h4 style={{ margin: 0, color: '#F0F4FF', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', fontSize: '1.1rem' }}>Admin Profile Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '8px' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="#666E85" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value.replace(/[^a-zA-Z\s]/g, '')})} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: '#151A2B', color: '#F0F4FF', outline: 'none', boxSizing: 'border-box' }} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '8px' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="#666E85" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: '#151A2B', color: '#F0F4FF', outline: 'none', boxSizing: 'border-box' }} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '8px' }}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} color="#666E85" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" maxLength="10" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: '#151A2B', color: '#F0F4FF', outline: 'none', boxSizing: 'border-box' }} required />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
              <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#4F6FF5', color: '#fff', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        );

      case 'security':
        return (
          <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h4 style={{ margin: 0, color: '#F0F4FF', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', fontSize: '1.1rem' }}>Change Admin Password</h4>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#A8B0C8' }}>
              Set a strong password with at least 6 characters for administrative access.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '480px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '8px' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#666E85" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="password" 
                    value={passwords.new} 
                    onChange={e => setPasswords({...passwords, new: e.target.value})} 
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: '#151A2B', color: '#F0F4FF', outline: 'none', boxSizing: 'border-box' }} 
                    placeholder="Enter new password (min. 6 chars)" 
                    required 
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '8px' }}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#666E85" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="password" 
                    value={passwords.confirm} 
                    onChange={e => setPasswords({...passwords, confirm: e.target.value})} 
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: '#151A2B', color: '#F0F4FF', outline: 'none', boxSizing: 'border-box' }} 
                    placeholder="Re-enter new password" 
                    required 
                  />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
              <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#4F6FF5', color: '#fff', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                <Shield size={18} /> {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        );

      case 'contractor_policies':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', color: '#F0F4FF', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HardHat size={22} color="#f59e0b" /> Contractor Operational & Task Policies
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#A8B0C8' }}>
                Configure administrative task capacity limits, material request approvals, and complaint resolution verification rules for park contractors.
              </p>
            </div>

            {/* 1. Task Allocation & Capacity Limit */}
            <div style={{ background: '#151A2B', padding: '1.35rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h5 style={{ margin: '0 0 1rem 0', color: '#fbbf24', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wrench size={16} /> Workload & Task Allocation Limit
              </h5>
              
              <div style={{ maxWidth: '420px', marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '6px' }}>
                  Max Concurrent Active Tasks per Contractor
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={contractorPolicies.maxConcurrentTasks}
                  onChange={e => setContractorPolicies({ ...contractorPolicies, maxConcurrentTasks: Number(e.target.value) || 5 })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', background: '#1E2438', color: '#F0F4FF', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Caps maximum simultaneous complaints a single contractor can hold.</span>
              </div>
            </div>

            {/* 2. Operational Rules & Verification Toggles */}
            <div style={{ background: '#151A2B', padding: '1.35rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h5 style={{ margin: '0 0 1rem 0', color: '#38bdf8', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={16} /> Resolution Verification & Request Governance
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {/* Before/After Photos Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ maxWidth: '80%' }}>
                    <span style={{ fontSize: '0.92rem', color: '#F0F4FF', fontWeight: 600, display: 'block' }}>
                      Require Before & After Photo Proof
                    </span>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#A8B0C8' }}>
                      Contractors must upload live resolution photos before marking maintenance tasks completed.
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={contractorPolicies.requireBeforeAfterPhotos} 
                      onChange={() => setContractorPolicies({ ...contractorPolicies, requireBeforeAfterPhotos: !contractorPolicies.requireBeforeAfterPhotos })} 
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: contractorPolicies.requireBeforeAfterPhotos ? '#10b981' : '#2A334E', transition: '.3s', borderRadius: '34px' }}>
                      <span style={{ position: 'absolute', height: '18px', width: '18px', left: contractorPolicies.requireBeforeAfterPhotos ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                    </span>
                  </label>
                </div>

                {/* Task Reassignment Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ maxWidth: '80%' }}>
                    <span style={{ fontSize: '0.92rem', color: '#F0F4FF', fontWeight: 600, display: 'block' }}>
                      Allow Task Reassignment Requests
                    </span>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#A8B0C8' }}>
                      Permit contractors to submit task transfer requests when on leave or needing specialized maintenance machinery.
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={contractorPolicies.allowTaskReassignmentRequests} 
                      onChange={() => setContractorPolicies({ ...contractorPolicies, allowTaskReassignmentRequests: !contractorPolicies.allowTaskReassignmentRequests })} 
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: contractorPolicies.allowTaskReassignmentRequests ? '#10b981' : '#2A334E', transition: '.3s', borderRadius: '34px' }}>
                      <span style={{ position: 'absolute', height: '18px', width: '18px', left: contractorPolicies.allowTaskReassignmentRequests ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                    </span>
                  </label>
                </div>

                {/* Material Requisition Review Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ maxWidth: '80%' }}>
                    <span style={{ fontSize: '0.92rem', color: '#F0F4FF', fontWeight: 600, display: 'block' }}>
                      Require Admin Review for Material Requests
                    </span>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#A8B0C8' }}>
                      Contractor requests for replacement materials (pipes, soil, tools) require direct Admin approval before dispatch.
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={contractorPolicies.requireMaterialApproval} 
                      onChange={() => setContractorPolicies({ ...contractorPolicies, requireMaterialApproval: !contractorPolicies.requireMaterialApproval })} 
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: contractorPolicies.requireMaterialApproval ? '#10b981' : '#2A334E', transition: '.3s', borderRadius: '34px' }}>
                      <span style={{ position: 'absolute', height: '18px', width: '18px', left: contractorPolicies.requireMaterialApproval ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="button"
                onClick={handleSaveContractorPolicies}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f59e0b', color: '#451a03', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Save Contractor Policies'}
              </button>
            </div>
          </div>
        );

      case 'official_policies':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', color: '#F0F4FF', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Landmark size={22} color="#38bdf8" /> Government Official Operational & Inspection Policies
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#A8B0C8' }}>
                Configure inspection workload limits, mandatory verification remarks, and self-service leave rules for Ward and Zone Officers.
              </p>
            </div>

            {/* 1. Workload & Inspection Allocation */}
            <div style={{ background: '#151A2B', padding: '1.35rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h5 style={{ margin: '0 0 1rem 0', color: '#38bdf8', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} /> Inspection Capacity & Workload Limit
              </h5>
              
              <div style={{ maxWidth: '420px', marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '6px' }}>
                  Max Concurrent Active Inspections per Official
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={officialPolicies.maxConcurrentInspections}
                  onChange={e => setOfficialPolicies({ ...officialPolicies, maxConcurrentInspections: Number(e.target.value) || 10 })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', background: '#1E2438', color: '#F0F4FF', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Caps simultaneous complaint verifications assigned to one official.</span>
              </div>
            </div>

            {/* 2. Governance & Workflow Toggles */}
            <div style={{ background: '#151A2B', padding: '1.35rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h5 style={{ margin: '0 0 1rem 0', color: '#34d399', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={16} /> Inspection Protocol & Portal Governance
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {/* Mandatory Remarks Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ maxWidth: '80%' }}>
                    <span style={{ fontSize: '0.92rem', color: '#F0F4FF', fontWeight: 600, display: 'block' }}>
                      Mandatory Inspection Verification Remarks
                    </span>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#A8B0C8' }}>
                      Enforce that officials must submit formal inspection notes before approving or returning maintenance work.
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={officialPolicies.mandatoryInspectionRemarks} 
                      onChange={() => setOfficialPolicies({ ...officialPolicies, mandatoryInspectionRemarks: !officialPolicies.mandatoryInspectionRemarks })} 
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: officialPolicies.mandatoryInspectionRemarks ? '#10b981' : '#2A334E', transition: '.3s', borderRadius: '34px' }}>
                      <span style={{ position: 'absolute', height: '18px', width: '18px', left: officialPolicies.mandatoryInspectionRemarks ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                    </span>
                  </label>
                </div>

                {/* Reassignment Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ maxWidth: '80%' }}>
                    <span style={{ fontSize: '0.92rem', color: '#F0F4FF', fontWeight: 600, display: 'block' }}>
                      Allow Inspection Reassignment Requests
                    </span>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#A8B0C8' }}>
                      Permit government officials to request task transfers to fellow ward officers when on field duty or leave.
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={officialPolicies.allowInspectionReassignment} 
                      onChange={() => setOfficialPolicies({ ...officialPolicies, allowInspectionReassignment: !officialPolicies.allowInspectionReassignment })} 
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: officialPolicies.allowInspectionReassignment ? '#10b981' : '#2A334E', transition: '.3s', borderRadius: '34px' }}>
                      <span style={{ position: 'absolute', height: '18px', width: '18px', left: officialPolicies.allowInspectionReassignment ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                    </span>
                  </label>
                </div>

                {/* Self-Service Leave Application Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ maxWidth: '80%' }}>
                    <span style={{ fontSize: '0.92rem', color: '#F0F4FF', fontWeight: 600, display: 'block' }}>
                      Allow Direct Leave Self-Application
                    </span>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#A8B0C8' }}>
                      Allow officials to directly apply for planned leave dates through the official portal.
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={officialPolicies.allowLeaveSelfApplication} 
                      onChange={() => setOfficialPolicies({ ...officialPolicies, allowLeaveSelfApplication: !officialPolicies.allowLeaveSelfApplication })} 
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: officialPolicies.allowLeaveSelfApplication ? '#10b981' : '#2A334E', transition: '.3s', borderRadius: '34px' }}>
                      <span style={{ position: 'absolute', height: '18px', width: '18px', left: officialPolicies.allowLeaveSelfApplication ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="button"
                onClick={handleSaveOfficialPolicies}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#38bdf8', color: '#082f49', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Save Official Policies'}
              </button>
            </div>
          </div>
        );

      case 'public_policies':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', color: '#F0F4FF', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={22} color="#10b981" /> Public & Citizen Portal Policies
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#A8B0C8' }}>
                Configure citizen access controls, public grievance reporting permissions, stall booking availability, and event registrations.
              </p>
            </div>

            {/* Public Service Toggles */}
            <div style={{ background: '#151A2B', padding: '1.35rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h5 style={{ margin: '0 0 1rem 0', color: '#34d399', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={16} /> Citizen Service Availability & Access Control
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {/* Public Complaints Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ maxWidth: '80%' }}>
                    <span style={{ fontSize: '0.92rem', color: '#F0F4FF', fontWeight: 600, display: 'block' }}>
                      Allow Public Complaint Submissions
                    </span>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#A8B0C8' }}>
                      Enable citizens to submit new park maintenance grievances and feedback through the portal.
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={publicPolicies.allowPublicComplaints} 
                      onChange={() => setPublicPolicies({ ...publicPolicies, allowPublicComplaints: !publicPolicies.allowPublicComplaints })} 
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: publicPolicies.allowPublicComplaints ? '#10b981' : '#2A334E', transition: '.3s', borderRadius: '34px' }}>
                      <span style={{ position: 'absolute', height: '18px', width: '18px', left: publicPolicies.allowPublicComplaints ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                    </span>
                  </label>
                </div>

                {/* Citizen Registration Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ maxWidth: '80%' }}>
                    <span style={{ fontSize: '0.92rem', color: '#F0F4FF', fontWeight: 600, display: 'block' }}>
                      Allow Citizen Self-Registration
                    </span>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#A8B0C8' }}>
                      Allow new members of the public to create citizen accounts on the registration page.
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={publicPolicies.allowCitizenRegistration} 
                      onChange={() => setPublicPolicies({ ...publicPolicies, allowCitizenRegistration: !publicPolicies.allowCitizenRegistration })} 
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: publicPolicies.allowCitizenRegistration ? '#10b981' : '#2A334E', transition: '.3s', borderRadius: '34px' }}>
                      <span style={{ position: 'absolute', height: '18px', width: '18px', left: publicPolicies.allowCitizenRegistration ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                    </span>
                  </label>
                </div>

                {/* Stall Booking Master Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ maxWidth: '80%' }}>
                    <span style={{ fontSize: '0.92rem', color: '#F0F4FF', fontWeight: 600, display: 'block' }}>
                      Allow Online Stall Bookings
                    </span>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#A8B0C8' }}>
                      Master switch enabling or disabling citizen stall and kiosk reservation workflows across parks.
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={publicPolicies.allowStallBookings} 
                      onChange={() => setPublicPolicies({ ...publicPolicies, allowStallBookings: !publicPolicies.allowStallBookings })} 
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: publicPolicies.allowStallBookings ? '#10b981' : '#2A334E', transition: '.3s', borderRadius: '34px' }}>
                      <span style={{ position: 'absolute', height: '18px', width: '18px', left: publicPolicies.allowStallBookings ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                    </span>
                  </label>
                </div>

                {/* Event Registration Master Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ maxWidth: '80%' }}>
                    <span style={{ fontSize: '0.92rem', color: '#F0F4FF', fontWeight: 600, display: 'block' }}>
                      Allow Event Registrations & QR Passes
                    </span>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#A8B0C8' }}>
                      Permit the general public to register for park events, workshops, and generate QR passes.
                    </p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={publicPolicies.allowEventRegistrations} 
                      onChange={() => setPublicPolicies({ ...publicPolicies, allowEventRegistrations: !publicPolicies.allowEventRegistrations })} 
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: publicPolicies.allowEventRegistrations ? '#10b981' : '#2A334E', transition: '.3s', borderRadius: '34px' }}>
                      <span style={{ position: 'absolute', height: '18px', width: '18px', left: publicPolicies.allowEventRegistrations ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="button"
                onClick={handleSavePublicPolicies}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981', color: '#064e3b', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Save Public Policies'}
              </button>
            </div>
          </div>
        );

      case 'leave_policy':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', color: '#F0F4FF', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="#34d399" /> Leave Policy & HR Configurations
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#A8B0C8' }}>
                Configure annual leave days and unpaid leave salary deduction rates for Contractors and Government Officials.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div style={{ background: '#151A2B', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#F0F4FF', marginBottom: '6px' }}>
                  Annual Paid Leave Allowance (Days)
                </label>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#A8B0C8' }}>
                  Standard paid leave days per calendar year for Contractors and Officials.
                </p>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={leavePolicy.annualAllowance}
                  onChange={e => setLeavePolicy({ ...leavePolicy, annualAllowance: Number(e.target.value) || 12 })}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: '#1E2438', color: '#F0F4FF', outline: 'none', fontWeight: 700, fontSize: '1.1rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#151A2B', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#F0F4FF', marginBottom: '6px' }}>
                  Unpaid Leave Daily Deduction Rate (₹)
                </label>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#A8B0C8' }}>
                  Daily salary deduction rate applied when an employee exceeds their annual allowance.
                </p>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={leavePolicy.dailyDeductionRate}
                  onChange={e => setLeavePolicy({ ...leavePolicy, dailyDeductionRate: Number(e.target.value) || 1000 })}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: '#1E2438', color: '#34d399', outline: 'none', fontWeight: 700, fontSize: '1.1rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleSaveLeavePolicy}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#32C48D', color: '#064e3b', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Save Leave Policy'}
              </button>
            </div>
          </div>
        );

      case 'sla':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', color: '#F0F4FF', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#fbbf24" /> Complaint SLA & Resolution Thresholds
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#A8B0C8' }}>
                Configure resolution deadline hours based on complaint priority levels.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#151A2B', padding: '1.1rem', borderRadius: '10px', border: '1.5px solid #991b1b' }}>
                <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 800, textTransform: 'uppercase' }}>🔴 Urgent Priority SLA</span>
                <p style={{ margin: '4px 0 10px 0', fontSize: '0.78rem', color: '#A8B0C8' }}>Turnaround time (Hours)</p>
                <input
                  type="number"
                  min="1"
                  value={slaThresholds.urgentHours}
                  onChange={e => setSlaThresholds({ ...slaThresholds, urgentHours: Number(e.target.value) || 4 })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #991b1b', background: '#1E2438', color: '#f87171', fontWeight: 800, fontSize: '1.1rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#151A2B', padding: '1.1rem', borderRadius: '10px', border: '1.5px solid #b45309' }}>
                <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase' }}>🟡 High Priority SLA</span>
                <p style={{ margin: '4px 0 10px 0', fontSize: '0.78rem', color: '#A8B0C8' }}>Turnaround time (Hours)</p>
                <input
                  type="number"
                  min="1"
                  value={slaThresholds.highHours}
                  onChange={e => setSlaThresholds({ ...slaThresholds, highHours: Number(e.target.value) || 24 })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #b45309', background: '#1E2438', color: '#fbbf24', fontWeight: 800, fontSize: '1.1rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#151A2B', padding: '1.1rem', borderRadius: '10px', border: '1.5px solid #3b82f6' }}>
                <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 800, textTransform: 'uppercase' }}>🔵 Medium Priority SLA</span>
                <p style={{ margin: '4px 0 10px 0', fontSize: '0.78rem', color: '#A8B0C8' }}>Turnaround time (Hours)</p>
                <input
                  type="number"
                  min="1"
                  value={slaThresholds.mediumHours}
                  onChange={e => setSlaThresholds({ ...slaThresholds, mediumHours: Number(e.target.value) || 48 })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #3b82f6', background: '#1E2438', color: '#60a5fa', fontWeight: 800, fontSize: '1.1rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#151A2B', padding: '1.1rem', borderRadius: '10px', border: '1.5px solid #475569' }}>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 800, textTransform: 'uppercase' }}>⚪ Low Priority SLA</span>
                <p style={{ margin: '4px 0 10px 0', fontSize: '0.78rem', color: '#A8B0C8' }}>Turnaround time (Hours)</p>
                <input
                  type="number"
                  min="1"
                  value={slaThresholds.lowHours}
                  onChange={e => setSlaThresholds({ ...slaThresholds, lowHours: Number(e.target.value) || 72 })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid #475569', background: '#1E2438', color: '#cbd5e1', fontWeight: 800, fontSize: '1.1rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleSaveSlaThresholds}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F5B942', color: '#451a03', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Save SLA Thresholds'}
              </button>
            </div>
          </div>
        );

      case 'stall_policies':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', color: '#F0F4FF', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={22} color="#32C48D" /> Stall & Event Booking Policies
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#A8B0C8' }}>
                Configure rules for citizen stall bookings, operational timings, security deposits, and accepted verification proofs.
              </p>
            </div>

            {/* 1. Stall Operational & Booking Rules */}
            <div style={{ background: '#151A2B', padding: '1.35rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h5 style={{ margin: '0 0 1rem 0', color: '#34d399', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={16} /> Stall Booking Limits & Operational Hours
              </h5>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '6px' }}>
                    Max Consecutive Booking Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={stallPolicies.maxBookingDays}
                    onChange={e => setStallPolicies({ ...stallPolicies, maxBookingDays: Number(e.target.value) || 7 })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', background: '#1E2438', color: '#F0F4FF', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Limit per vendor booking</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '6px' }}>
                    Advance Booking Window (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={stallPolicies.advanceBookingWindowDays}
                    onChange={e => setStallPolicies({ ...stallPolicies, advanceBookingWindowDays: Number(e.target.value) || 30 })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', background: '#1E2438', color: '#F0F4FF', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Reservation advance window</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '6px' }}>
                    Cancellation Refund Cutoff (Hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="168"
                    value={stallPolicies.cancellationWindowHours}
                    onChange={e => setStallPolicies({ ...stallPolicies, cancellationWindowHours: Number(e.target.value) || 48 })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', background: '#1E2438', color: '#F0F4FF', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Hours prior for full refund</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '6px' }}>
                    Refundable Cleanliness Deposit (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={stallPolicies.securityDepositAmount}
                    onChange={e => setStallPolicies({ ...stallPolicies, securityDepositAmount: Number(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', background: '#1E2438', color: '#34d399', fontWeight: 800, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Deposit refunded after inspection</span>
                </div>
              </div>

              {/* Park Stall Operational Timings */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '6px' }}>
                    Daily Stall Opening Time
                  </label>
                  <input
                    type="time"
                    value={stallPolicies.stallOpeningTime || '06:00'}
                    onChange={e => setStallPolicies({ ...stallPolicies, stallOpeningTime: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', background: '#1E2438', color: '#F0F4FF', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '6px' }}>
                    Daily Stall Closing Time
                  </label>
                  <input
                    type="time"
                    value={stallPolicies.stallClosingTime || '21:00'}
                    onChange={e => setStallPolicies({ ...stallPolicies, stallClosingTime: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', background: '#1E2438', color: '#F0F4FF', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Public Events Policy */}
            <div style={{ background: '#151A2B', padding: '1.35rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h5 style={{ margin: '0 0 1rem 0', color: '#60a5fa', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Ticket size={16} /> Public Event Registration Policies
              </h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '6px' }}>
                    Max Passes per Citizen Booking
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={eventPolicies.maxTicketsPerUser}
                    onChange={e => setEventPolicies({ ...eventPolicies, maxTicketsPerUser: Number(e.target.value) || 5 })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', background: '#1E2438', color: '#F0F4FF', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Maximum attendee tickets per booking</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '6px' }}>
                    Event Cancellation Cutoff (Hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="72"
                    value={eventPolicies.cancellationWindowHours}
                    onChange={e => setEventPolicies({ ...eventPolicies, cancellationWindowHours: Number(e.target.value) || 24 })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', background: '#1E2438', color: '#F0F4FF', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Hours before event start for pass cancellation</span>
                </div>
              </div>
            </div>

            {/* 3. KYC & Document Verification Rules */}
            <div style={{ background: '#151A2B', padding: '1.35rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', color: '#F0F4FF', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BadgeCheck size={16} color="#32C48D" /> Accepted Vendor Verification & Proof Documents
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#A8B0C8' }}>
                    Vendors booking park stalls must submit one of the following recognized identity or address proofs.
                  </p>
                </div>
              </div>

              {/* Add New Proof Document */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '1.25rem', maxWidth: '650px' }}>
                <input
                  type="text"
                  placeholder="e.g. Municipal Vendor Card, Trade License, Bonafide..."
                  value={newProofType}
                  onChange={(e) => setNewProofType(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProofType(); } }}
                  style={{ flex: 1, padding: '0.65rem 0.9rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', fontSize: '0.88rem', background: '#1E2438', color: '#F0F4FF', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={handleAddProofType}
                  style={{ padding: '0.65rem 1.25rem', background: '#32C48D', color: '#064e3b', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  <Plus size={16} /> Add Document
                </button>
              </div>

              {/* List of current types in a modern responsive grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                {proofTypes.map((type, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0.9rem', background: '#1E2438', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={15} color="#34d399" />
                      <span style={{ fontSize: '0.875rem', color: '#F0F4FF', fontWeight: 600 }}>{type}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteProofType(idx)}
                      style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', cursor: 'pointer', padding: '4px 6px', borderRadius: '4px' }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="button"
                onClick={handleSaveStallAndEventPolicies}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#32C48D', color: '#064e3b', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Save Stall & Event Policies'}
              </button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', color: '#F0F4FF', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={20} color="#4F6FF5" /> In-App Notification & Alert Preferences
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#A8B0C8' }}>
                Manage real-time in-app alert badges, sound alarms, and dashboard notification dispatch.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '680px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.25rem', background: '#151A2B', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', color: '#fbbf24', fontSize: '0.95rem', fontWeight: 700 }}>⚠️ High-Priority Grievance & SLA Escalations</h5>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#A8B0C8' }}>Notify immediately on the admin dashboard when urgent complaints or SLA deadlines approach.</p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '26px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={notifications.highPriorityGrievances} onChange={() => setNotifications({...notifications, highPriorityGrievances: !notifications.highPriorityGrievances})} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: notifications.highPriorityGrievances ? '#10b981' : '#2A334E', transition: '.3s', borderRadius: '34px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ position: 'absolute', height: '18px', width: '18px', left: notifications.highPriorityGrievances ? '23px' : '4px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.25rem', background: '#151A2B', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', color: '#34d399', fontSize: '0.95rem', fontWeight: 700 }}>🏪 Stall Bookings & Event Registrations</h5>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#A8B0C8' }}>Receive notifications when citizens complete slot reservations, KYC document submissions, or ticket payments.</p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '26px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={notifications.stallBookingAlerts} onChange={() => setNotifications({...notifications, stallBookingAlerts: !notifications.stallBookingAlerts})} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: notifications.stallBookingAlerts ? '#10b981' : '#2A334E', transition: '.3s', borderRadius: '34px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ position: 'absolute', height: '18px', width: '18px', left: notifications.stallBookingAlerts ? '23px' : '4px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.25rem', background: '#151A2B', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', color: '#818cf8', fontSize: '0.95rem', fontWeight: 700 }}>📋 Contractor Material & Leave Requests</h5>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#A8B0C8' }}>Alert the admin when contractors request project materials, task reassignments, or staff leaves.</p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '26px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={notifications.contractorRequestAlerts} onChange={() => setNotifications({...notifications, contractorRequestAlerts: !notifications.contractorRequestAlerts})} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: notifications.contractorRequestAlerts ? '#10b981' : '#2A334E', transition: '.3s', borderRadius: '34px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ position: 'absolute', height: '18px', width: '18px', left: notifications.contractorRequestAlerts ? '23px' : '4px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                  </span>
                </label>
              </div>

            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleSaveNotifications}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#4F6FF5', color: '#fff', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Save Notification Preferences'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="admin-settings-view" style={{ padding: '0.5rem', minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.6rem', margin: 0, color: '#F0F4FF', fontWeight: 800 }}>
          <Sliders size={26} color="#4F6FF5" />
          Admin System & Configuration
        </h2>
        <p style={{ color: '#A8B0C8', marginTop: '0.4rem', marginBottom: 0, fontSize: '0.92rem' }}>
          Manage project branding (Logo, Name, Slogan), contractor operations, Leave & HR policies, Complaint SLA thresholds, and operational booking rules.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Sidebar Tabs */}
        <div style={{ width: '280px', background: '#1E2438', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          <button 
            onClick={() => setActiveTab('branding')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.85rem 1rem', border: 'none', background: activeTab === 'branding' ? 'rgba(79, 111, 245, 0.2)' : 'transparent', color: activeTab === 'branding' ? '#4F6FF5' : '#CBD5E1', fontWeight: activeTab === 'branding' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '6px' }}
          >
            <Building2 size={18} /> Portal Branding & Slogan
          </button>

          <button 
            onClick={() => setActiveTab('contractor_policies')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.85rem 1rem', border: 'none', background: activeTab === 'contractor_policies' ? 'rgba(245, 158, 11, 0.2)' : 'transparent', color: activeTab === 'contractor_policies' ? '#f59e0b' : '#CBD5E1', fontWeight: activeTab === 'contractor_policies' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '6px' }}
          >
            <HardHat size={18} /> Contractor Policies
          </button>

          <button 
            onClick={() => setActiveTab('official_policies')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.85rem 1rem', border: 'none', background: activeTab === 'official_policies' ? 'rgba(56, 189, 248, 0.2)' : 'transparent', color: activeTab === 'official_policies' ? '#38bdf8' : '#CBD5E1', fontWeight: activeTab === 'official_policies' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '6px' }}
          >
            <Landmark size={18} /> Govt Official Policies
          </button>

          <button 
            onClick={() => setActiveTab('public_policies')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.85rem 1rem', border: 'none', background: activeTab === 'public_policies' ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: activeTab === 'public_policies' ? '#10b981' : '#CBD5E1', fontWeight: activeTab === 'public_policies' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '6px' }}
          >
            <Users size={18} /> Public & Citizen Portal
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.85rem 1rem', border: 'none', background: activeTab === 'profile' ? 'rgba(79, 111, 245, 0.2)' : 'transparent', color: activeTab === 'profile' ? '#4F6FF5' : '#CBD5E1', fontWeight: activeTab === 'profile' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '6px' }}
          >
            <User size={18} /> Admin Profile
          </button>

          <button 
            onClick={() => setActiveTab('security')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.85rem 1rem', border: 'none', background: activeTab === 'security' ? 'rgba(79, 111, 245, 0.2)' : 'transparent', color: activeTab === 'security' ? '#4F6FF5' : '#CBD5E1', fontWeight: activeTab === 'security' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '6px' }}
          >
            <Lock size={18} /> Password & Security
          </button>

          <button 
            onClick={() => setActiveTab('leave_policy')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.85rem 1rem', border: 'none', background: activeTab === 'leave_policy' ? 'rgba(52, 211, 153, 0.2)' : 'transparent', color: activeTab === 'leave_policy' ? '#34d399' : '#CBD5E1', fontWeight: activeTab === 'leave_policy' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '6px' }}
          >
            <Calendar size={18} /> Leave & HR Policy
          </button>

          <button 
            onClick={() => setActiveTab('sla')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.85rem 1rem', border: 'none', background: activeTab === 'sla' ? 'rgba(251, 191, 36, 0.2)' : 'transparent', color: activeTab === 'sla' ? '#fbbf24' : '#CBD5E1', fontWeight: activeTab === 'sla' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '6px' }}
          >
            <Clock size={18} /> Complaint SLAs
          </button>
          
          <button 
            onClick={() => setActiveTab('stall_policies')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.85rem 1rem', border: 'none', background: activeTab === 'stall_policies' ? 'rgba(50, 196, 141, 0.2)' : 'transparent', color: activeTab === 'stall_policies' ? '#32C48D' : '#CBD5E1', fontWeight: activeTab === 'stall_policies' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '6px' }}
          >
            <Store size={18} /> Stall & Event Policies
          </button>

          <button 
            onClick={() => setActiveTab('notifications')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.85rem 1rem', border: 'none', background: activeTab === 'notifications' ? 'rgba(79, 111, 245, 0.2)' : 'transparent', color: activeTab === 'notifications' ? '#4F6FF5' : '#CBD5E1', fontWeight: activeTab === 'notifications' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
          >
            <Bell size={18} /> Notifications
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, minWidth: '320px', background: '#1E2438', borderRadius: '12px', padding: '2rem', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', minHeight: '440px' }}>
          {message.text && (
            <div style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', background: message.type === 'success' ? 'rgba(50, 196, 141, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: message.type === 'success' ? '#32C48D' : '#f87171', border: `1px solid ${message.type === 'success' ? 'rgba(50, 196, 141, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
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
