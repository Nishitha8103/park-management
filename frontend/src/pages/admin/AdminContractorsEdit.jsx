import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw, X, Upload } from 'lucide-react';
import axios from 'axios';

const AdminContractorsEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
    assignedParks: [],
    username: '',
    password: '',
    confirmPassword: '',
    status: 'Active',
    maintenanceSkills: []
  };

  const [formData, setFormData] = useState(initialForm);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [currentPhoto, setCurrentPhoto] = useState(null);

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const res = await axios.get('/api/master/districts');
        setDistricts(res.data);
      } catch (error) {
        console.error("Error fetching districts:", error);
      }
    };
    fetchDistricts();
  }, []);

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
    const fetchContractor = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // Fetch Contractor Details
        const res = await axios.get(`/api/contractors/${id}`, config);
        const contractor = res.data;
        
        // Fetch Corporations, Zones & Wards based on existing selections
        if (contractor.district) {
          const corpRes = await axios.get(`/api/master/corporations?districtId=${contractor.district._id || contractor.district}`);
          setCorporations(corpRes.data);
        }
        if (contractor.corporation) {
          const zoneRes = await axios.get(`/api/master/zones?corporationId=${contractor.corporation._id || contractor.corporation}`);
          setZones(zoneRes.data);
        }
        if (contractor.ward) {
          const wardRes = await axios.get(`/api/master/wards?zoneId=${contractor.zone._id || contractor.zone}`);
          setWards(wardRes.data);
        }
        if (contractor.zone) {
          const zoneIdVal = contractor.zone._id || contractor.zone;
          const parkRes = await axios.get(`/api/parks?zone=${zoneIdVal}`);
          setParks(parkRes.data);
        }


        setFormData({
          name: contractor.name,
          email: contractor.email,
          phone: contractor.phone,
          address: contractor.address,
          district: contractor.district ? (contractor.district._id || contractor.district) : '',
          corporation: contractor.corporation ? (contractor.corporation._id || contractor.corporation) : '',
          zone: contractor.zone ? (contractor.zone._id || contractor.zone) : '',
          ward: contractor.ward ? (contractor.ward._id || contractor.ward) : '',
          assignedParks: contractor.assignedParks ? contractor.assignedParks.map(p => p._id || p) : (contractor.park ? [contractor.park._id || contractor.park] : []),
          username: contractor.username,
          password: '',
          confirmPassword: '',
          status: contractor.status,
          maintenanceSkills: contractor.maintenanceSkills || []
        });
        
        setCurrentPhoto(contractor.profilePhoto);
      } catch (error) {
        console.error("Error fetching data:", error);
        setErrorMsg("Failed to load contractor data.");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchContractor();
  }, [id]);



  const fetchParks = async (zoneId) => {
    if (!zoneId) return setParks([]);
    try {
      const res = await axios.get(`/api/parks?zone=${zoneId}`);
      setParks(res.data);
    } catch (error) {
      console.error("Error fetching parks:", error);
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (name === 'district') {
        newData.corporation = ''; newData.zone = ''; newData.ward = ''; newData.assignedParks = [];
        fetchCorporations(value); setZones([]); setWards([]); setParks([]);
      }
      if (name === 'corporation') {
        newData.zone = ''; newData.ward = ''; newData.assignedParks = [];
        fetchZones(value); setWards([]); setParks([]);
      }
      if (name === 'zone') {
        newData.ward = ''; newData.assignedParks = [];
        fetchWards(value); fetchParks(value);
      }
      if (name === 'ward') {
        // Just keep assigned parks since they belong to the zone
      }
      return newData;
    });
  };

  const handleParkChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const parks = prev.assignedParks || [];
      if (checked) {
        return { ...prev, assignedParks: [...parks, value] };
      } else {
        return { ...prev, assignedParks: parks.filter(p => p !== value) };
      }
    });
  };

  const handleSelectAllParks = (e) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      assignedParks: checked ? parks.map(p => p._id) : []
    }));
  };

  const handleSkillChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const skills = prev.maintenanceSkills || [];
      if (checked) {
        return { ...prev, maintenanceSkills: [...skills, value] };
      } else {
        return { ...prev, maintenanceSkills: skills.filter(s => s !== value) };
      }
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setProfilePhoto(e.target.files[0]);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required.";
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return "Invalid email format.";
    if (formData.phone.length !== 10 || isNaN(formData.phone)) {
      return "Phone number must contain exactly 10 digits.";
    }
    if (formData.password && formData.password.length < 8) {
      return "Password must be at least 8 characters long.";
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

    setLoading(true);
    const token = JSON.parse(localStorage.getItem('adminUser'))?.token;

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (key !== 'confirmPassword') {
        if (key === 'password' && !formData[key]) return;
        if (key === 'maintenanceSkills') {
          formData[key].forEach(skill => submitData.append('maintenanceSkills', skill));
        } else if (key === 'assignedParks') {
          formData[key].forEach(parkId => submitData.append('assignedParks', parkId));
        } else {
          submitData.append(key, formData[key]);
        }
      }
    });
    
    if (profilePhoto) {
      submitData.append('profilePhoto', profilePhoto);
    }

    try {
      await axios.put(`/api/contractors/${id}`, submitData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert("Contractor account updated successfully.");
      navigate('/admin-dashboard/contractors');
    } catch (error) {
      console.error("Error updating contractor:", error);
      setErrorMsg(error.response?.data?.error || error.response?.data?.message || "Failed to update contractor.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading contractor details...</div>;
  }

  return (
    <div className="admin-panel" style={{ backgroundColor: '#f8fafc', padding: '1rem', minHeight: 'calc(100vh - 64px)' }}>
      <div className="admin-panel-header" style={{ marginBottom: '1.5rem' }}>
        <Link to="/admin-dashboard/contractors" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#64748b', textDecoration: 'none', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back to List
        </Link>
        <h3 style={{ margin: 0, color: '#1e293b' }}>Edit Contractor</h3>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        {errorMsg && <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: '500' }}>{errorMsg}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            {/* Personal Details */}
            <div style={{ gridColumn: '1 / -1' }}><h5 style={{ color: '#16A34A', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', margin: '0' }}>Personal Details</h5></div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>Full Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>Email Address *</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>Phone Number *</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>Address *</label>
              <textarea name="address" value={formData.address} onChange={handleInputChange} required rows="3" style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}></textarea>
            </div>

            {/* Jurisdiction / Location */}
            <div style={{ gridColumn: '1 / -1' }}><h5 style={{ color: '#16A34A', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', margin: '1rem 0 0' }}>Jurisdiction</h5></div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>District *</label>
              <select name="district" value={formData.district} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <option value="">Select District</option>
                {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>Corporation *</label>
              <select name="corporation" value={formData.corporation} onChange={handleInputChange} required disabled={!formData.district} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <option value="">Select Corporation</option>
                {corporations.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>Zone *</label>
              <select name="zone" value={formData.zone} onChange={handleInputChange} required disabled={!formData.corporation} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <option value="">Select Zone</option>
                {zones.map(z => <option key={z._id} value={z._id}>{z.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>Ward *</label>
              <select name="ward" value={formData.ward} onChange={handleInputChange} required disabled={!formData.zone} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <option value="">Select Ward</option>
                {wards.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>Assigned Parks *</label>
              {!formData.ward ? (
                <div style={{ fontSize: '0.9rem', color: '#64748b', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  Please select a Ward first to view available parks.
                </div>
              ) : parks.length === 0 ? (
                <div style={{ fontSize: '0.9rem', color: '#64748b', padding: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  No parks found in the selected Ward.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', background: '#fff', border: '1px solid #cbd5e1', padding: '0.75rem', borderRadius: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#1e293b', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                    <input 
                      type="checkbox" 
                      checked={parks.length > 0 && (formData.assignedParks || []).length === parks.length} 
                      onChange={handleSelectAllParks} 
                      style={{ cursor: 'pointer' }}
                    />
                    Select All
                  </label>
                  {parks.map(p => (
                    <label key={p._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#1e293b' }}>
                      <input 
                        type="checkbox" 
                        value={p._id} 
                        checked={(formData.assignedParks || []).includes(p._id)} 
                        onChange={handleParkChange} 
                        style={{ cursor: 'pointer' }}
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Specialization / Skills */}
            <div style={{ gridColumn: '1 / -1' }}><h5 style={{ color: '#16A34A', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', margin: '1rem 0 0' }}>Maintenance Skills</h5></div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>Select Maintenance Skills</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', background: '#f1f5f9', padding: '1rem', borderRadius: '6px' }}>
                {[
                  'Electrical Maintenance', 'Plumbing Maintenance', 'Gardening / Horticulture',
                  'Cleaning / Sanitation', 'Civil / Masonry', 'Carpentry', 'Painting',
                  'Playground Equipment Maintenance', 'Water Supply / Drainage', 
                  'Gate / Fencing Maintenance', 'General Park Maintenance'
                ].map(skill => (
                  <label key={skill} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#1e293b' }}>
                    <input 
                      type="checkbox" 
                      value={skill} 
                      checked={(formData.maintenanceSkills || []).includes(skill)} 
                      onChange={handleSkillChange} 
                      style={{ cursor: 'pointer' }}
                    />
                    {skill}
                  </label>
                ))}
              </div>
            </div>

            {/* Account Credentials */}
            <div style={{ gridColumn: '1 / -1' }}><h5 style={{ color: '#16A34A', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', margin: '1rem 0 0' }}>Account Credentials</h5></div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>Username *</label>
              <input type="text" name="username" value={formData.username} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
            <div></div> {/* Empty column for alignment */}
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>New Password (leave blank to keep current)</label>
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>Confirm New Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>

            {/* Status & Media */}
            <div style={{ gridColumn: '1 / -1' }}><h5 style={{ color: '#16A34A', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', margin: '1rem 0 0' }}>Status & Media</h5></div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>Status *</label>
              <select name="status" value={formData.status} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#475569' }}>Profile Photo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {currentPhoto && !profilePhoto && (
                  <img src={`${currentPhoto}`} alt="Current" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', backgroundColor: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '6px', cursor: 'pointer', flex: 1 }}>
                  <Upload size={18} color="#64748b" />
                  <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{profilePhoto ? profilePhoto.name : 'Change Image'}</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '2px solid #f1f5f9' }}>
            <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem', backgroundColor: '#16A34A', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
              <Save size={18} /> {loading ? 'Saving...' : 'Update Contractor'}
            </button>
            <Link to="/admin-dashboard/contractors" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', textDecoration: 'none' }}>
              <X size={18} /> Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminContractorsEdit;
