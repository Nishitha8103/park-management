import { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Mail, 
  Phone, 
  Save, 
  FileCheck, 
  Plus, 
  Trash2, 
  CheckCircle2,
  Users,
  Briefcase,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Sliders,
  Check
} from 'lucide-react';
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

  // Public Module Controls
  const [publicModuleControls, setPublicModuleControls] = useState({
    allowCitizenRegistration: true,
    allowStallBookings: true,
    allowEventRegistrations: true,
    requireAadhaarKyc: false,
    allowPublicComplaints: true,
    maxActiveComplaintsPerUser: 5,
  });

  // Contractor Module Controls
  const [contractorModuleControls, setContractorModuleControls] = useState({
    allowDirectRegistration: false,
    autoAssignComplaints: true,
    requireMaterialApproval: true,
    allowTaskReassignmentRequests: true,
    contractorPenaltyForOverdueHours: 24,
  });

  // Government Official Controls
  const [officialModuleControls, setOfficialModuleControls] = useState({
    allowLeaveSelfApplication: true,
    autoApproveLeavesUnderDays: 1,
    mandatoryInspectionChecklist: true,
    emergencySosAlertDispatch: true,
    allowDepartmentReassignments: true,
  });

  // Configurable address proof types for Stall Booking
  const [proofTypes, setProofTypes] = useState(DEFAULT_PROOF_TYPES);
  const [newProofType, setNewProofType] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProofTypesConfig();
    fetchSystemModuleSettings();
  }, []);

  const fetchProofTypesConfig = async () => {
    try {
      const res = await axios.get('/api/stall-bookings/config/proof-types');
      if (res.data?.success && Array.isArray(res.data.proofTypes)) {
        setProofTypes(res.data.proofTypes);
      }
    } catch (_) {}
  };

  const fetchSystemModuleSettings = () => {
    try {
      const savedPub = localStorage.getItem('adm_public_module_settings');
      if (savedPub) setPublicModuleControls(JSON.parse(savedPub));
      
      const savedCon = localStorage.getItem('adm_contractor_module_settings');
      if (savedCon) setContractorModuleControls(JSON.parse(savedCon));

      const savedOff = localStorage.getItem('adm_official_module_settings');
      if (savedOff) setOfficialModuleControls(JSON.parse(savedOff));
    } catch (_) {}
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    // Save to localStorage adminUser
    try {
      const updated = { ...adminUser, name: profileData.name, email: profileData.email, phone: profileData.phone };
      localStorage.setItem('adminUser', JSON.stringify(updated));
    } catch (_) {}

    setTimeout(() => {
      setSaving(false);
      setMessage({ type: 'success', text: 'Admin profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }, 600);
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
    }, 600);
  };

  const handleSavePublicControls = () => {
    setSaving(true);
    localStorage.setItem('adm_public_module_settings', JSON.stringify(publicModuleControls));
    setTimeout(() => {
      setSaving(false);
      setMessage({ type: 'success', text: 'Public Citizen Module settings updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }, 500);
  };

  const handleSaveContractorControls = () => {
    setSaving(true);
    localStorage.setItem('adm_contractor_module_settings', JSON.stringify(contractorModuleControls));
    setTimeout(() => {
      setSaving(false);
      setMessage({ type: 'success', text: 'Contractor Operations Module settings updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }, 500);
  };

  const handleSaveOfficialControls = () => {
    setSaving(true);
    localStorage.setItem('adm_official_module_settings', JSON.stringify(officialModuleControls));
    setTimeout(() => {
      setSaving(false);
      setMessage({ type: 'success', text: 'Government Official Module settings updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }, 500);
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
            <h4 style={{ margin: 0, color: '#F0F4FF', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', fontSize: '1.1rem' }}>Admin Profile Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '8px' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="#666E85" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: '#151A2B', color: '#F0F4FF', outline: 'none', boxSizing: 'border-box' }} required />
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
                  <input type="text" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: '#151A2B', color: '#F0F4FF', outline: 'none', boxSizing: 'border-box' }} required />
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

      case 'public_module':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', color: '#F0F4FF', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#32C48D" /> Public & Citizen Module Management
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#A8B0C8' }}>
                Control citizen privileges, public stall reservation accessibility, grievance limits, and registration rules.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { key: 'allowCitizenRegistration', title: 'Open Citizen Registration', desc: 'Allow public users to sign up freely without manual approval.' },
                { key: 'allowStallBookings', title: 'Enable Stall Applications', desc: 'Allow citizens to book park food and retail stall slots online.' },
                { key: 'allowEventRegistrations', title: 'Enable Public Event Registrations', desc: 'Allow citizens to register and pay for park activities and marathons.' },
                { key: 'requireAadhaarKyc', title: 'Mandatory Aadhaar KYC for Stall Bookings', desc: 'Require complete verified Aadhaar KYC before citizens can submit stall applications.' },
                { key: 'allowPublicComplaints', title: 'Enable Public Grievance Submissions', desc: 'Allow public citizens to log park maintenance complaints with live photo uploads.' }
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.25rem', background: '#151A2B', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', color: '#F0F4FF', fontSize: '0.95rem' }}>{item.title}</h5>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#A8B0C8' }}>{item.desc}</p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '26px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={publicModuleControls[item.key]} 
                      onChange={() => setPublicModuleControls(prev => ({ ...prev, [item.key]: !prev[item.key] }))} 
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: publicModuleControls[item.key] ? '#32C48D' : '#2A334E', transition: '.3s', borderRadius: '34px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ position: 'absolute', height: '18px', width: '18px', left: publicModuleControls[item.key] ? '23px' : '4px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                    </span>
                  </label>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleSavePublicControls}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#32C48D', color: '#064e3b', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Save Public Module Settings'}
              </button>
            </div>
          </div>
        );

      case 'contractor_module':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', color: '#F0F4FF', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={20} color="#F5B942" /> Contractor Operations Module Management
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#A8B0C8' }}>
                Manage assignment rules, material requests requirements, reassignment request permissions, and SLA constraints.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { key: 'autoAssignComplaints', title: 'Auto-Assign Tasks by Category & Ward', desc: 'Automatically assign logged complaints to active certified contractors matching park wards.' },
                { key: 'requireMaterialApproval', title: 'Require Admin Approval on Material Requests', desc: 'Require admin review before contractor material purchase requests are sanctioned.' },
                { key: 'allowTaskReassignmentRequests', title: 'Allow Contractor Reassignment Requests', desc: 'Enable contractors to request task reassignment if outside specialized capability or heavy workload.' },
                { key: 'allowDirectRegistration', title: 'Allow Self-Registration for Contractors', desc: 'Allow contractors to register from public portal without admin manual onboarding.' }
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.25rem', background: '#151A2B', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', color: '#F0F4FF', fontSize: '0.95rem' }}>{item.title}</h5>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#A8B0C8' }}>{item.desc}</p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '26px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={contractorModuleControls[item.key]} 
                      onChange={() => setContractorModuleControls(prev => ({ ...prev, [item.key]: !prev[item.key] }))} 
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: contractorModuleControls[item.key] ? '#F5B942' : '#2A334E', transition: '.3s', borderRadius: '34px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ position: 'absolute', height: '18px', width: '18px', left: contractorModuleControls[item.key] ? '23px' : '4px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                    </span>
                  </label>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleSaveContractorControls}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F5B942', color: '#451a03', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Save Contractor Module Settings'}
              </button>
            </div>
          </div>
        );

      case 'official_module':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', color: '#F0F4FF', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={20} color="#4F6FF5" /> Government Officials Module Management
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#A8B0C8' }}>
                Configure government official leave rules, inspection checkpoints, emergency broadcast protocols, and ward audits.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { key: 'allowLeaveSelfApplication', title: 'Enable Leave Portal for Field Officials', desc: 'Permit government officials and inspectors to apply for leaves with proof upload.' },
                { key: 'mandatoryInspectionChecklist', title: 'Enforce Step-by-Step Inspection Checklist', desc: 'Require officials to fill verified cleanliness & equipment checklist during park visits.' },
                { key: 'emergencySosAlertDispatch', title: 'Direct Emergency Dispatch to On-Duty Officials', desc: 'Automatically forward high-priority emergencies to officials assigned to that specific park.' },
                { key: 'allowDepartmentReassignments', title: 'Allow Intra-Department Complaint Transfers', desc: 'Allow officials to transfer complaints across horticulture, civil, electrical, and security.' }
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.25rem', background: '#151A2B', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', color: '#F0F4FF', fontSize: '0.95rem' }}>{item.title}</h5>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#A8B0C8' }}>{item.desc}</p>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '26px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={officialModuleControls[item.key]} 
                      onChange={() => setOfficialModuleControls(prev => ({ ...prev, [item.key]: !prev[item.key] }))} 
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: officialModuleControls[item.key] ? '#4F6FF5' : '#2A334E', transition: '.3s', borderRadius: '34px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ position: 'absolute', height: '18px', width: '18px', left: officialModuleControls[item.key] ? '23px' : '4px', bottom: '3px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%' }}></span>
                    </span>
                  </label>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleSaveOfficialControls}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#4F6FF5', color: '#fff', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Save Official Module Settings'}
              </button>
            </div>
          </div>
        );

      case 'stall_docs':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', color: '#F0F4FF', fontSize: '1.15rem', fontWeight: 700 }}>
                Accepted Address Proof Types (Stall Bookings)
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#A8B0C8' }}>
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
                style={{ flex: 1, padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', fontSize: '0.9rem', background: '#151A2B', color: '#F0F4FF', outline: 'none' }}
              />
              <button
                type="button"
                onClick={handleAddProofType}
                style={{ padding: '0.75rem 1.25rem', background: '#32C48D', color: '#064e3b', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={18} /> Add
              </button>
            </div>

            {/* List of current types */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '600px' }}>
              {proofTypes.map((type, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#151A2B', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '0.92rem', color: '#F0F4FF', fontWeight: 600 }}>{type}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteProofType(idx)}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
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
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#32C48D', color: '#064e3b', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Save Document Types'}
              </button>
            </div>
          </div>
        );

      case 'security':
        return (
          <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h4 style={{ margin: 0, color: '#F0F4FF', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', fontSize: '1.1rem' }}>Change Admin Password</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '8px' }}>Current Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#666E85" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: '#151A2B', color: '#F0F4FF', outline: 'none', boxSizing: 'border-box' }} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '8px' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#666E85" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: '#151A2B', color: '#F0F4FF', outline: 'none', boxSizing: 'border-box' }} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8B0C8', marginBottom: '8px' }}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#666E85" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: '#151A2B', color: '#F0F4FF', outline: 'none', boxSizing: 'border-box' }} required />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '1rem' }}>
              <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#4F6FF5', color: '#fff', padding: '0.75rem 2rem', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                <Shield size={18} /> {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        );

      case 'notifications':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h4 style={{ margin: 0, color: '#F0F4FF', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', fontSize: '1.1rem' }}>Notification Preferences</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: '#151A2B', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', color: '#F0F4FF' }}>Email Alerts</h5>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#A8B0C8' }}>Receive system notifications via email.</p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                  <input type="checkbox" checked={notifications.emailAlerts} onChange={() => setNotifications({...notifications, emailAlerts: !notifications.emailAlerts})} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: notifications.emailAlerts ? '#32C48D' : '#2A334E', transition: '.4s', borderRadius: '34px' }}>
                    <span style={{ position: 'absolute', height: '18px', width: '18px', left: notifications.emailAlerts ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: '#151A2B', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', color: '#F0F4FF' }}>SMS Alerts</h5>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#A8B0C8' }}>Receive urgent alerts via SMS to your registered phone number.</p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                  <input type="checkbox" checked={notifications.smsAlerts} onChange={() => setNotifications({...notifications, smsAlerts: !notifications.smsAlerts})} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: notifications.smsAlerts ? '#32C48D' : '#2A334E', transition: '.4s', borderRadius: '34px' }}>
                    <span style={{ position: 'absolute', height: '18px', width: '18px', left: notifications.smsAlerts ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: '#151A2B', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h5 style={{ margin: '0 0 4px 0', color: '#F0F4FF' }}>New Complaints</h5>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#A8B0C8' }}>Notify me when a new complaint is registered by a citizen.</p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                  <input type="checkbox" checked={notifications.newComplaint} onChange={() => setNotifications({...notifications, newComplaint: !notifications.newComplaint})} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: notifications.newComplaint ? '#32C48D' : '#2A334E', transition: '.4s', borderRadius: '34px' }}>
                    <span style={{ position: 'absolute', height: '18px', width: '18px', left: notifications.newComplaint ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
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
    <div className="admin-settings-view" style={{ padding: '0.5rem', minHeight: '100vh' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.6rem', margin: 0, color: '#F0F4FF', fontWeight: 800 }}>
          <Sliders size={26} color="#4F6FF5" />
          Admin System & Module Configuration
        </h2>
        <p style={{ color: '#A8B0C8', marginTop: '0.4rem', marginBottom: 0, fontSize: '0.92rem' }}>
          Configure core admin account, public citizen modules, contractor workflows, government official rules, and stall verification.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Sidebar Tabs */}
        <div style={{ width: '280px', background: '#1E2438', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          <button 
            onClick={() => setActiveTab('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.85rem 1rem', border: 'none', background: activeTab === 'profile' ? 'rgba(79, 111, 245, 0.2)' : 'transparent', color: activeTab === 'profile' ? '#4F6FF5' : '#CBD5E1', fontWeight: activeTab === 'profile' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '6px' }}
          >
            <User size={18} /> Account Profile
          </button>
          
          <button 
            onClick={() => setActiveTab('public_module')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.85rem 1rem', border: 'none', background: activeTab === 'public_module' ? 'rgba(50, 196, 141, 0.2)' : 'transparent', color: activeTab === 'public_module' ? '#32C48D' : '#CBD5E1', fontWeight: activeTab === 'public_module' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '6px' }}
          >
            <Users size={18} /> Public Citizen Module
          </button>

          <button 
            onClick={() => setActiveTab('contractor_module')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.85rem 1rem', border: 'none', background: activeTab === 'contractor_module' ? 'rgba(245, 185, 66, 0.2)' : 'transparent', color: activeTab === 'contractor_module' ? '#F5B942' : '#CBD5E1', fontWeight: activeTab === 'contractor_module' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '6px' }}
          >
            <Briefcase size={18} /> Contractor Module
          </button>

          <button 
            onClick={() => setActiveTab('official_module')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.85rem 1rem', border: 'none', background: activeTab === 'official_module' ? 'rgba(79, 111, 245, 0.2)' : 'transparent', color: activeTab === 'official_module' ? '#60a5fa' : '#CBD5E1', fontWeight: activeTab === 'official_module' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '6px' }}
          >
            <UserCheck size={18} /> Govt Official Module
          </button>

          <button 
            onClick={() => setActiveTab('stall_docs')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.85rem 1rem', border: 'none', background: activeTab === 'stall_docs' ? 'rgba(50, 196, 141, 0.2)' : 'transparent', color: activeTab === 'stall_docs' ? '#32C48D' : '#CBD5E1', fontWeight: activeTab === 'stall_docs' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '6px' }}
          >
            <FileCheck size={18} /> Stall Address Proofs
          </button>

          <button 
            onClick={() => setActiveTab('security')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '0.85rem 1rem', border: 'none', background: activeTab === 'security' ? 'rgba(79, 111, 245, 0.2)' : 'transparent', color: activeTab === 'security' ? '#4F6FF5' : '#CBD5E1', fontWeight: activeTab === 'security' ? 700 : 500, borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', marginBottom: '6px' }}
          >
            <Lock size={18} /> Security
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
