import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Save, RotateCcw, X, Upload } from 'lucide-react';
import axios from 'axios';

const AdminOfficialsAdd = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Master Data
  const [districts, setDistricts] = useState([]);
  const [corporations, setCorporations] = useState([]);
  const [zones, setZones] = useState([]);
  const [wards, setWards] = useState([]);
  const [parks, setParks] = useState([]);

  const initialForm = {
    name: '',
    email: '',
    phone: '',
    address: '',
    district: '',
    corporation: '',
    zone: '',
    ward: '',
    park: '',
    username: '',
    password: '',
    confirmPassword: '',
    status: 'Active'
  };

  const [formData, setFormData] = useState(initialForm);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [selectedParks, setSelectedParks] = useState([]);

  const [allParks, setAllParks] = useState([]);

  const fetchDistricts = async () => {
    try {
      const res = await axios.get('/api/master/districts');
      setDistricts(res.data);
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  };

  const fetchCorporations = async (districtId) => {
    if (!districtId) return setCorporations([]);
    try {
      const res = await axios.get(`/api/master/corporations?districtId=${districtId}`);
      setCorporations(res.data);
    } catch (error) {
      console.error("Error fetching corporations:", error);
    }
  };

  const fetchZones = async (corporationId) => {
    if (!corporationId) return setZones([]);
    try {
      const res = await axios.get(`/api/master/zones?corporationId=${corporationId}`);
      setZones(res.data);
    } catch (error) {
      console.error("Error fetching zones:", error);
    }
  };

  const fetchWards = async (zoneId) => {
    if (!zoneId) return setWards([]);
    try {
      const res = await axios.get(`/api/master/wards?zoneId=${zoneId}`);
      setWards(res.data);
    } catch (error) {
      console.error("Error fetching wards:", error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [parksRes, nextIdRes] = await Promise.all([
          axios.get('/api/parks'),
          axios.get('/api/auth/next-official-id')
        ]);
        setAllParks(parksRes.data);
        
        setFormData(prev => ({ ...prev, username: nextIdRes.data.nextId }));
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchInitialData();
    fetchDistricts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (name === 'email' && (!prev.username || prev.username === prev.email.split('@')[0])) {
        newData.username = value ? value.split('@')[0] : '';
      }
      
      if (name === 'district') {
        newData.corporation = ''; newData.zone = ''; newData.ward = ''; newData.park = '';
        fetchCorporations(value);
        setZones([]); setWards([]); setParks([]);
      }
      if (name === 'corporation') {
        newData.zone = ''; newData.ward = ''; newData.park = '';
        fetchZones(value);
        setWards([]); setParks([]);
      }
      if (name === 'zone') {
        newData.ward = ''; newData.park = '';
        fetchWards(value);
        
        const zoneParks = allParks.filter(p => p.zone?._id === value || p.zone === value);
        setParks(zoneParks);
      }
      if (name === 'ward') {
        newData.park = '';
        const wardParks = allParks.filter(p => p.ward?._id === value || p.ward === value);
        setParks(wardParks);
      }
      return newData;
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setProfilePhoto(e.target.files[0]);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Full Name is required.";
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return "Invalid email format.";
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      return "Phone number must contain exactly 10 digits.";
    }
    if (formData.password.length < 6) {
      return "Password must be at least 6 characters long.";
    }
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    if (selectedParks.length === 0) {
      setErrorMsg("Please select at least one park to assign.");
      return;
    }

    setLoading(true);

    try {
      await axios.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        username: formData.username || (formData.email ? formData.email.split('@')[0] : ''),
        password: formData.password,
        role: 'Government Official',
        phone: formData.phone,
        department: formData.district ? `District ${formData.district}` : 'Parks Dept',
        zone: formData.zone || undefined,
        ward: formData.ward || undefined,
        district: formData.district || undefined,
        parks: selectedParks
      });

      alert('Government Official added successfully!');
      navigate('/admin-dashboard/officials');
    } catch (error) {
      console.error("Error creating official:", error);
      setErrorMsg(error.response?.data?.message || 'Failed to create government official. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialForm);
    setProfilePhoto(null);
    setSelectedParks([]);
    setErrorMsg('');
  };

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: '#1e293b', fontWeight: '700' }}>
          Add New Government Official
        </h2>

        {errorMsg && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Personal Details */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#4f6d54', fontWeight: '700', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Personal Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem', width: '50%' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                Phone Number *
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                style={{ width: '96%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Section 2: Jurisdiction */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#4f6d54', fontWeight: '700', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Jurisdiction
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                  District *
                </label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">Select District</option>
                  {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                  Corporation *
                </label>
                <select
                  name="corporation"
                  value={formData.corporation}
                  onChange={handleInputChange}
                  disabled={!formData.district}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: formData.district ? '#fff' : '#f1f5f9', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">Select Corporation</option>
                  {corporations.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                  Zone *
                </label>
                <select
                  name="zone"
                  value={formData.zone}
                  onChange={handleInputChange}
                  disabled={!formData.corporation}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: formData.corporation ? '#fff' : '#f1f5f9', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">Select Zone</option>
                  {zones.map(z => <option key={z._id} value={z._id}>{z.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                  Ward *
                </label>
                <select
                  name="ward"
                  value={formData.ward}
                  onChange={handleInputChange}
                  disabled={!formData.zone}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: formData.zone ? '#fff' : '#f1f5f9', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">Select Ward</option>
                  {wards.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ width: '100%', marginTop: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                Select Parks to Assign *
              </label>
              {!formData.ward ? (
                <div style={{ padding: '0.75rem', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.85rem', color: '#64748b' }}>
                  Please select District, Corporation, Zone, and Ward first to load parks.
                </div>
              ) : parks.length === 0 ? (
                <div style={{ padding: '0.75rem', background: '#fee2e2', borderRadius: '6px', fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>
                  No parks found in this ward.
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedParks.length === parks.length) {
                          setSelectedParks([]);
                        } else {
                          setSelectedParks(parks.map(p => p._id));
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4f6d54',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {selectedParks.length === parks.length ? 'Unselect All' : 'Select All'}
                    </button>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.75rem', 
                    maxHeight: '180px', 
                    overflowY: 'auto', 
                    padding: '0.75rem', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '6px',
                    background: '#fff'
                  }}>
                    {parks.map(p => {
                      const isSelected = selectedParks.includes(p._id);
                      return (
                        <label key={p._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', color: '#334155' }}>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedParks(prev => [...prev, p._id]);
                              } else {
                                setSelectedParks(prev => prev.filter(id => id !== p._id));
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 3: Account Credentials */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#4f6d54', fontWeight: '700', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Account Credentials
            </h3>

            <div style={{ marginBottom: '1.25rem', width: '50%' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                Username (Auto-generated) *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                readOnly
                disabled
                style={{ width: '96%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#94a3b8', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Status & Media */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#4f6d54', fontWeight: '700', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status & Media
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' }}>
                  Profile Photo
                </label>
                <div style={{
                  border: '1px dashed #cbd5e1',
                  borderRadius: '6px',
                  padding: '0.65rem 1rem',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  fontSize: '0.85rem'
                }} onClick={() => document.getElementById('official-photo-input').click()}>
                  <Upload size={16} />
                  <span>{profilePhoto ? profilePhoto.name : 'Upload Image'}</span>
                  <input
                    id="official-photo-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#4f6d54',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Official'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                padding: '0.65rem 1.25rem',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={18} />
              Reset
            </button>

            <Link
              to="/admin-dashboard/officials"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#ffffff',
                color: '#ef4444',
                border: '1px solid #fca5a5',
                padding: '0.65rem 1.25rem',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '0.9rem',
                textDecoration: 'none'
              }}
            >
              <X size={18} />
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminOfficialsAdd;
