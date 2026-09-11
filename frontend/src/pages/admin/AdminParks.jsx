import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Upload, Download, AlertTriangle, CheckCircle2, Store } from 'lucide-react';
import axios from 'axios';

const AdminParks = () => {
  const [parks, setParks] = useState([]);
  
  // Master Data States
  const [districts, setDistricts] = useState([]);
  const [corporations, setCorporations] = useState([]);
  const [zones, setZones] = useState([]);
  const [wards, setWards] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingPark, setEditingPark] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const [selectedParks, setSelectedParks] = useState([]);
  
  // Stall Slot Management States
  const [showStallSlotsModal, setShowStallSlotsModal] = useState(false);
  const [selectedParkForSlots, setSelectedParkForSlots] = useState(null);
  const [parkSlots, setParkSlots] = useState([]);
  const [slotFormData, setSlotFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    price: '',
    totalSlots: 1
  });
  
  const initialForm = {
    district: '', corporation: '', zone: '', ward: '',
    name: '', parkCode: '', address: '', latitude: '', longitude: '', area: '', parkType: '',
    numberOfTrees: 0, numberOfBenches: 0, numberOfLights: 0, numberOfDustbins: 0,
    childrenPlayArea: false, walkingTrack: false, openGym: false, garden: false, lake: false, restrooms: false, parking: false, yogaSpace: false, drinkingWater: false,
    wheelchairAccessible: false, accessiblePathways: false, petFriendly: false, firstAid: false, cctv: false, strollerFriendly: false, emergencyAssistance: false,
    openedOn: '', maintenance: '',
    totalStallSlots: 0, stallBookingAmount: 0,
    description: '', status: 'Active'
  };
  
  const [formData, setFormData] = useState(initialForm);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const fetchParks = async () => {
    try {
      let token = null;
      const userStr = localStorage.getItem('adminUser');
      if (userStr && userStr !== 'undefined') {
        try { token = JSON.parse(userStr)?.token; } catch (e) {}
      }
      
      const res = await axios.get('/api/parks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Fetched parks:", res.data);
      
      // Ensure we always set an array
      if (Array.isArray(res.data)) {
        setParks(res.data);
      } else if (res.data && Array.isArray(res.data.parks)) {
        setParks(res.data.parks);
      } else {
        console.error("Unexpected response format:", res.data);
        setParks([]);
      }
    } catch (error) {
      console.error("Error fetching parks:", error);
    }
  };

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
    fetchParks();
    fetchDistricts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: val };
      
      // Cascading logic
      if (name === 'district') {
        newData.corporation = ''; newData.zone = ''; newData.ward = '';
        fetchCorporations(val); setZones([]); setWards([]);
      }
      if (name === 'corporation') {
        newData.zone = ''; newData.ward = '';
        fetchZones(val); setWards([]);
      }
      if (name === 'zone') {
        newData.ward = '';
        fetchWards(val);
      }
      
      return newData;
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 5) {
      alert("You can only upload a maximum of 5 images.");
      return;
    }
    setSelectedFiles(Array.from(e.target.files));
  };

  const fetchStallSlots = async (parkId) => {
    try {
      const res = await axios.get(`/api/stall-slots/park/${parkId}`);
      setParkSlots(res.data);
    } catch (error) {
      console.error("Error fetching stall slots:", error);
    }
  };

  const openStallSlotsModal = (park) => {
    setSelectedParkForSlots(park);
    fetchStallSlots(park._id);
    setSlotFormData({ 
      date: '', 
      startTime: '', 
      endTime: '', 
      location: '', 
      price: park.stallBookingAmount || 0, 
      totalSlots: 1,
      paymentDeadlineDate: '',
      paymentDeadlineTime: '23:59',
      paymentWindowHours: 24
    });
    setShowStallSlotsModal(true);
  };

  const handleSlotInputChange = (e) => {
    const { name, value } = e.target;
    setSlotFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSlotSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      await axios.post('/api/stall-slots', {
        parkId: selectedParkForSlots._id,
        ...slotFormData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Stall slot added successfully!");
      fetchStallSlots(selectedParkForSlots._id);
      setSlotFormData({ 
        date: '', 
        startTime: '', 
        endTime: '', 
        location: '', 
        price: selectedParkForSlots.stallBookingAmount || 0, 
        totalSlots: 1,
        paymentDeadlineDate: '',
        paymentDeadlineTime: '23:59',
        paymentWindowHours: 24
      });
    } catch (error) {
      console.error("Error adding stall slot:", error);
      alert("Failed to add stall slot.");
    }
  };

  const handleDeleteStallSlot = async (slotId) => {
    if (!window.confirm("Are you sure you want to delete this slot?")) return;
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      await axios.delete(`/api/stall-slots/${slotId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Slot deleted successfully!");
      fetchStallSlots(selectedParkForSlots._id);
    } catch (error) {
      console.error("Error deleting stall slot:", error);
      alert(error.response?.data?.message || "Failed to delete stall slot.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side Validations
    if (!formData.name || !formData.name.trim()) {
      alert("Validation Error: Please enter a valid Park Name.");
      return;
    }
    if (!formData.parkCode || !formData.parkCode.trim()) {
      alert("Validation Error: Please enter a valid Park Code.");
      return;
    }
    if (!formData.district) {
      alert("Validation Error: Please select a District.");
      return;
    }
    if (!formData.corporation) {
      alert("Validation Error: Please select a Corporation.");
      return;
    }
    if (!formData.zone) {
      alert("Validation Error: Please select a Zone.");
      return;
    }
    if (!formData.ward) {
      alert("Validation Error: Please select a Ward.");
      return;
    }

    if (Number(formData.numberOfTrees) < 0 || Number(formData.numberOfBenches) < 0 || Number(formData.numberOfLights) < 0 || Number(formData.numberOfDustbins) < 0) {
      alert("Validation Error: Quantity values (Trees, Benches, Lights, Dustbins) cannot be negative.");
      return;
    }
    if (Number(formData.totalStallSlots) < 0 || Number(formData.stallBookingAmount) < 0) {
      alert("Validation Error: Stall slot total and booking amount cannot be negative.");
      return;
    }

    if (formData.latitude && formData.latitude.trim() !== '') {
      const latNum = Number(formData.latitude);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        alert("Validation Error: Latitude must be a valid number between -90 and 90.");
        return;
      }
    }
    if (formData.longitude && formData.longitude.trim() !== '') {
      const lngNum = Number(formData.longitude);
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        alert("Validation Error: Longitude must be a valid number between -180 and 180.");
        return;
      }
    }

    setLoading(true);
    const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
    
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key]);
    });
    
    selectedFiles.forEach(file => {
      submitData.append('images', file);
    });

    try {
      if (editingPark) {
        await axios.put(`/api/parks/${editingPark._id}`, submitData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        alert("Park updated successfully!");
      } else {
        await axios.post('/api/parks', submitData, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        alert("Park added successfully!");
      }
      fetchParks();
      setShowModal(false);
      setFormData(initialForm);
      setSelectedFiles([]);
      setEditingPark(null);
    } catch (error) {
      console.error("Error saving park:", error);
      const msg = error.response?.data?.message || "Failed to save park. Please check your inputs.";
      alert(`Validation / Save Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (park) => {
    setEditingPark(park);
    setFormData({
      district: park.district?._id || park.district || '',
      corporation: park.corporation?._id || park.corporation || '',
      zone: park.zone?._id || park.zone || '',
      ward: park.ward?._id || park.ward || '',
      name: park.name || '',
      parkCode: park.parkCode || '',
      address: park.address || '',
      latitude: park.latitude || '',
      longitude: park.longitude || '',
      area: park.area || '',
      parkType: park.parkType || '',
      numberOfTrees: park.numberOfTrees || 0,
      numberOfBenches: park.numberOfBenches || 0,
      numberOfLights: park.numberOfLights || 0,
      numberOfDustbins: park.numberOfDustbins || 0,
      childrenPlayArea: park.childrenPlayArea || false,
      walkingTrack: park.walkingTrack || false,
      openGym: park.openGym || false,
      garden: park.garden || false,
      lake: park.lake || false,
      restrooms: park.restrooms || false,
      parking: park.parking || false,
      yogaSpace: park.yogaSpace || false,
      drinkingWater: park.drinkingWater || false,
      wheelchairAccessible: park.wheelchairAccessible || false,
      accessiblePathways: park.accessiblePathways || false,
      petFriendly: park.petFriendly || false,
      firstAid: park.firstAid || false,
      cctv: park.cctv || false,
      strollerFriendly: park.strollerFriendly || false,
      emergencyAssistance: park.emergencyAssistance || false,
      openedOn: park.openedOn || '',
      maintenance: park.maintenance || '',
      totalStallSlots: park.totalStallSlots || 0,
      stallBookingAmount: park.stallBookingAmount || 0,
      description: park.description || '',
      status: park.status || 'Active'
    });
    if (park.district) fetchCorporations(park.district?._id || park.district);
    if (park.corporation) fetchZones(park.corporation?._id || park.corporation);
    if (park.zone) fetchWards(park.zone?._id || park.zone);
    
    setSelectedFiles([]);
    setShowModal(true);
  };

  const handleDeleteClick = async (parkId) => {
    if (!window.confirm("Are you sure you want to delete this park?")) return;
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      await axios.delete(`/api/parks/${parkId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Park deleted successfully!");
      fetchParks();
    } catch (error) {
      console.error("Error deleting park:", error);
      alert("Failed to delete park.");
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedParks(parks.map(p => p._id));
    } else {
      setSelectedParks([]);
    }
  };

  const handleSelectPark = (parkId) => {
    setSelectedParks(prev => {
      if (prev.includes(parkId)) return prev.filter(id => id !== parkId);
      return [...prev, parkId];
    });
  };

  const handleBulkDelete = async () => {
    if (selectedParks.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedParks.length} parks?`)) return;
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      await axios.post('/api/parks/bulk-delete', { parkIds: selectedParks }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Selected parks deleted successfully!");
      setSelectedParks([]);
      fetchParks();
    } catch (error) {
      console.error("Error in bulk delete:", error);
      alert("Failed to delete parks.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkFile) return alert("Please select a file first.");
    setBulkLoading(true);
    setBulkResult(null);
    const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
    const submitData = new FormData();
    submitData.append('excelFile', bulkFile);

    try {
      const res = await axios.post('/api/parks/bulk-upload', submitData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setBulkResult(res.data);
      fetchParks();
    } catch (error) {
      console.error("Error bulk uploading parks:", error);
      alert(error.response?.data?.message || "Failed to upload bulk parks.");
    } finally {
      setBulkLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/parks/')) return imagePath;
    return `${imagePath}`;
  };

  const handleExportParks = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      const res = await axios.get('/api/parks/export', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'BBMP_Parks_Export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting parks:", error);
      alert("Failed to export parks.");
    }
  };


  return (
    <div className="admin-panel">
      <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Municipal Parks Listing</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedParks.length > 0 && (
            <button className="btn-admin-add" onClick={handleBulkDelete} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              <Trash2 size={16} /> Delete Selected ({selectedParks.length})
            </button>
          )}
          <button className="btn-admin-add" onClick={() => setShowBulkModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Upload size={16} /> Upload Bulk
          </button>

          <button className="btn-admin-add" onClick={handleExportParks} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Download size={16} /> Export Parks
          </button>

          <button className="btn-admin-add" onClick={() => { setEditingPark(null); setFormData(initialForm); setSelectedFiles([]); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Plus size={16} /> Add New Park
          </button>
        </div>
      </div>

      <div className="admin-table-container" style={{ padding: '1rem' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem', width: '40px' }}>
                <input 
                  type="checkbox" 
                  checked={parks.length > 0 && selectedParks.length === parks.length} 
                  onChange={handleSelectAll} 
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                />
              </th>
              <th style={{ padding: '0.75rem' }}>Image</th>
              <th style={{ padding: '0.75rem' }}>Park Name</th>
              <th style={{ padding: '0.75rem' }}>Park Code</th>
              <th style={{ padding: '0.75rem' }}>Corporation</th>
              <th style={{ padding: '0.75rem' }}>Zone</th>
              <th style={{ padding: '0.75rem' }}>Ward</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {parks.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '1rem' }}>No parks added yet.</td></tr>
            ) : (
              <>
                {parks.map(p => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedParks.includes(p._id)} 
                      onChange={() => handleSelectPark(p._id)}
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {p.images && p.images.length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <img src={getImageUrl(p.images[0])} alt="Park" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                        {p.images.length > 1 && <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>+{p.images.length - 1}</span>}
                      </div>
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageIcon size={16} color="#94a3b8" />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{p.name}</td>
                  <td style={{ padding: '0.75rem' }}>{p.parkCode || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>{p.corporation?.name || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>{p.zone?.name || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>{p.ward?.name || 'N/A'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ 
                      fontSize: '0.8rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px',
                      color: p.status === 'Active' ? '#16a34a' : '#f97316', 
                      backgroundColor: p.status === 'Active' ? '#dcfce7' : '#ffedd5',
                    }}>{p.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-icon" onClick={() => openStallSlotsModal(p)} title="Manage Stall Slots"><Store size={16} /></button>
                      <button className="btn-icon" onClick={() => handleEditClick(p)}><Edit2 size={16} /></button>
                      <button className="btn-icon delete" onClick={() => handleDeleteClick(p._id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="admin-modal" style={{ backgroundColor: 'white', borderRadius: '8px', width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Bulk Upload Parks (Excel / CSV)</h4>
              <button type="button" onClick={() => setShowBulkModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div className="admin-modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '6px', padding: '1rem', textAlign: 'center' }}>
                <a href="/parks_template.csv" download className="btn-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#4f46e5', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.95rem' }}>
                  <Download size={16} /> Download Sample CSV Template
                </a>
                <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Use this template to properly format your data columns before uploading.</p>
              </div>

              <form onSubmit={handleBulkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Select Excel/CSV File</label>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={(e) => setBulkFile(e.target.files[0])}
                    required 
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>
                <button type="submit" disabled={bulkLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '0.75rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
                  {bulkLoading ? 'Processing file...' : 'Upload & Parse Parks'}
                </button>
              </form>

              {/* Bulk Results Summary */}
              {bulkResult && (
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '1rem', background: '#f8fafc' }}>
                  <h5 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Upload Summary</h5>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                    <span style={{ color: '#16a34a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={16} /> Success: {bulkResult.successCount}
                    </span>
                    <span style={{ color: '#dc2626', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={16} /> Failed: {bulkResult.failureCount}
                    </span>
                  </div>

                  {bulkResult.errors && bulkResult.errors.length > 0 && (
                    <div>
                      <p style={{ margin: '5px 0', fontSize: '0.85rem', fontWeight: 'bold', color: '#e11d48' }}>Errors Details:</p>
                      <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #fda4af', borderRadius: '4px', padding: '0.5rem', background: '#fff1f2' }}>
                        {bulkResult.errors.map((err, idx) => (
                          <div key={idx} style={{ fontSize: '0.8rem', marginBottom: '4px', borderBottom: '1px solid #fee2e2', paddingBottom: '4px', color: '#9f1239' }}>
                            <strong>Row {err.row} ({err.parkName}):</strong> {err.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <h6 style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#475569' }}>Column Format Reference:</h6>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: '#64748b', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
                  <li><strong>District</strong> (e.g. Bangalore Urban)</li>
                  <li><strong>Corporation</strong> (e.g. BBMP)</li>
                  <li><strong>Zone</strong> (e.g. South Zone)</li>
                  <li><strong>Ward</strong> (e.g. 111 or Jayanagar)</li>
                  <li><strong>Park Name</strong> (e.g. Cubbon Park)</li>
                  <li><strong>Park Code</strong> (e.g. P-111-02)</li>
                  <li><strong>Area</strong> (e.g. 300 Acres)</li>
                  <li><strong>Park Type</strong> (e.g. Botanical)</li>
                </ul>
              </div>
            </div>
            
            <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowBulkModal(false)} style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Close Dialog</button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Add Park Modal */}
      {showModal && (
        <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form className="admin-modal" onSubmit={handleSubmit} style={{ backgroundColor: 'white', borderRadius: '8px', width: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>{editingPark ? 'Edit Park Details' : 'Register New Park'}</h4>
              <button type="button" onClick={() => {setShowModal(false); setFormData(initialForm); setEditingPark(null);}} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div className="admin-modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Location Hierarchy */}
              <h5 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '0.5rem', color: '#374151' }}>Location Hierarchy</h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>District *</label>
                  <select name="district" value={formData.district} onChange={handleInputChange} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Corporation *</label>
                  <select name="corporation" value={formData.corporation} onChange={handleInputChange} required disabled={!formData.district} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                    <option value="">Select Corporation</option>
                    {corporations.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Zone *</label>
                  <select name="zone" value={formData.zone} onChange={handleInputChange} required disabled={!formData.corporation} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                    <option value="">Select Zone</option>
                    {zones.map(z => <option key={z._id} value={z._id}>{z.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Ward *</label>
                  <select name="ward" value={formData.ward} onChange={handleInputChange} required disabled={!formData.zone} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                    <option value="">Select Ward</option>
                    {wards.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Basic Details */}
              <h5 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', margin: '1rem 0 0.5rem', color: '#374151' }}>Basic Details</h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Park Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Park Code *</label>
                  <input type="text" name="parkCode" value={formData.parkCode} onChange={handleInputChange} required style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Latitude</label>
                  <input type="text" name="latitude" value={formData.latitude} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Longitude</label>
                  <input type="text" name="longitude" value={formData.longitude} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Area (e.g., 5 Acres)</label>
                  <input type="text" name="area" value={formData.area} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Park Type</label>
                  <select name="parkType" value={formData.parkType} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                    <option value="">Select Type</option>
                    <option value="Neighborhood">Neighborhood</option>
                    <option value="Botanical">Botanical</option>
                    <option value="Recreational">Recreational</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Opened On</label>
                  <input type="date" name="openedOn" value={formData.openedOn} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Maintenance</label>
                  <select name="maintenance" value={formData.maintenance} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                    <option value="">Select Maintenance</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>

              {/* Assets & Inventory */}
              <h5 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', margin: '1rem 0 0.5rem', color: '#374151' }}>Assets & Inventory</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Trees</label>
                  <input type="number" name="numberOfTrees" value={formData.numberOfTrees} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Benches</label>
                  <input type="number" name="numberOfBenches" value={formData.numberOfBenches} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Lights</label>
                  <input type="number" name="numberOfLights" value={formData.numberOfLights} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Dustbins</label>
                  <input type="number" name="numberOfDustbins" value={formData.numberOfDustbins} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
              </div>

              {/* Stall Configurations */}
              <h5 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', margin: '1rem 0 0.5rem', color: '#374151' }}>Stall Configurations</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Total Stall Slots</label>
                  <input type="number" name="totalStallSlots" value={formData.totalStallSlots} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Stall Booking Amount (₹)</label>
                  <input type="number" name="stallBookingAmount" value={formData.stallBookingAmount} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
              </div>

              {/* Facilities Boolean Flags */}
              <h5 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', margin: '1rem 0 0.5rem', color: '#374151' }}>Facilities</h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f9fafb', padding: '1rem', borderRadius: '4px' }}>
                {[
                  { name: 'childrenPlayArea', label: 'Playground' },
                  { name: 'walkingTrack', label: 'Walking Track' },
                  { name: 'garden', label: 'Garden Area' },
                  { name: 'yogaSpace', label: 'Yoga Space' },
                  { name: 'drinkingWater', label: 'Drinking Water' },
                  { name: 'restrooms', label: 'Public Toilet' },
                  { name: 'openGym', label: 'Outdoor Gym' },
                  { name: 'parking', label: 'Parking Available' },
                  { name: 'lake', label: 'Lake' }
                ].map(fac => (
                  <label key={fac.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" name={fac.name} checked={formData[fac.name]} onChange={handleInputChange} />
                    <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>{fac.label}</span>
                  </label>
                ))}
              </div>

              {/* Visitor Safety & Accessibility */}
              <h5 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', margin: '1rem 0 0.5rem', color: '#374151' }}>Visitor Safety & Accessibility</h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#fef2f2', padding: '1rem', borderRadius: '4px' }}>
                {[
                  { name: 'wheelchairAccessible', label: 'Wheelchair Accessible' },
                  { name: 'accessiblePathways', label: 'Accessible Pathways' },
                  { name: 'petFriendly', label: 'Pet Friendly' },
                  { name: 'firstAid', label: 'First-Aid Facility' },
                  { name: 'cctv', label: 'CCTV Monitoring' },
                  { name: 'strollerFriendly', label: 'Stroller Friendly' },
                  { name: 'emergencyAssistance', label: 'Emergency Assistance' }
                ].map(fac => (
                  <label key={fac.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" name={fac.name} checked={formData[fac.name]} onChange={handleInputChange} />
                    <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>{fac.label}</span>
                  </label>
                ))}
              </div>

              {/* Media & Other */}
              <h5 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', margin: '1rem 0 0.5rem', color: '#374151' }}>Media & Other</h5>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Upload Images (Max 5)</label>
                <input 
                  type="file" multiple accept="image/*" onChange={handleFileChange} 
                  style={{ width: '100%', padding: '0.5rem', border: '1px dashed #cbd5e1', borderRadius: '4px' }} 
                />
                {selectedFiles.length > 0 && (
                  <p style={{ fontSize: '0.8rem', color: '#6366f1', marginTop: '4px' }}>{selectedFiles.length} files selected</p>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                  <option value="Active">Active</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

            </div>

            <div className="admin-modal-actions" style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" onClick={() => {setShowModal(false); setFormData(initialForm); setEditingPark(null);}} style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                {loading ? 'Saving...' : editingPark ? 'Update Park' : 'Save Full Details'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stall Slots Management Modal */}
      {showStallSlotsModal && selectedParkForSlots && (
        <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="admin-modal" style={{ backgroundColor: 'white', borderRadius: '8px', width: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>Manage Stall Slots - {selectedParkForSlots.name}</h4>
              <button type="button" onClick={() => setShowStallSlotsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div className="admin-modal-body" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              
              {/* Add New Slot Form */}
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '1.5rem' }}>
                <h5 style={{ margin: '0 0 1rem 0' }}>Add New Slot</h5>
                <form onSubmit={handleSlotSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: '1 1 150px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>Date *</label>
                    <input type="date" name="date" required value={slotFormData.date} onChange={handleSlotInputChange} style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                  <div style={{ flex: '1 1 100px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>Start Time *</label>
                    <input type="time" name="startTime" required value={slotFormData.startTime} onChange={handleSlotInputChange} style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                  <div style={{ flex: '1 1 100px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>End Time *</label>
                    <input type="time" name="endTime" required value={slotFormData.endTime} onChange={handleSlotInputChange} style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                  <div style={{ flex: '1 1 150px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>Location *</label>
                    <input type="text" name="location" required placeholder="e.g. North Gate" value={slotFormData.location} onChange={handleSlotInputChange} style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                  <div style={{ flex: '1 1 100px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>Price (₹) *</label>
                    <input type="number" name="price" required value={slotFormData.price} onChange={handleSlotInputChange} style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                  <div style={{ flex: '1 1 100px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>Total Slots *</label>
                    <input type="number" name="totalSlots" min="1" required value={slotFormData.totalSlots} onChange={handleSlotInputChange} style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                  </div>
                  <div style={{ flex: '1 1 140px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: '#047857' }}>Payment Deadline Date</label>
                    <input type="date" name="paymentDeadlineDate" value={slotFormData.paymentDeadlineDate} onChange={handleSlotInputChange} style={{ width: '100%', padding: '0.4rem', border: '1px solid #a7f3d0', borderRadius: '4px', backgroundColor: '#ecfdf5' }} />
                  </div>
                  <div style={{ flex: '1 1 110px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: '#047857' }}>Deadline Time</label>
                    <input type="time" name="paymentDeadlineTime" value={slotFormData.paymentDeadlineTime} onChange={handleSlotInputChange} style={{ width: '100%', padding: '0.4rem', border: '1px solid #a7f3d0', borderRadius: '4px', backgroundColor: '#ecfdf5' }} />
                  </div>
                  <div style={{ flex: '1 1 140px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: '#047857' }}>Payment Window (Hrs)</label>
                    <input type="number" name="paymentWindowHours" min="1" value={slotFormData.paymentWindowHours} onChange={handleSlotInputChange} style={{ width: '100%', padding: '0.4rem', border: '1px solid #a7f3d0', borderRadius: '4px', backgroundColor: '#ecfdf5' }} placeholder="e.g. 24" />
                  </div>
                  <div style={{ flex: '1 1 100%' }}>
                    <button type="submit" style={{ width: '100%', padding: '0.5rem', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Add Slot
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Slots List */}
              <h5>Existing Slots</h5>
              {parkSlots.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No slots available for this park.</p>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Location</th>
                        <th>Price</th>
                        <th>Payment Cutoff</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parkSlots.map(slot => (
                        <tr key={slot._id}>
                          <td>{new Date(slot.date).toLocaleDateString()}</td>
                          <td>{slot.startTime} - {slot.endTime}</td>
                          <td>{slot.location}</td>
                          <td>₹{slot.price}</td>
                          <td>
                            <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>
                              {slot.paymentDeadlineDate 
                                ? `${new Date(slot.paymentDeadlineDate).toLocaleDateString()} ${slot.paymentDeadlineTime || ''}` 
                                : `Within ${slot.paymentWindowHours || 24}h of approval`}
                            </div>
                          </td>
                          <td>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: slot.isAvailable ? '#dcfce7' : '#f1f5f9', color: slot.isAvailable ? '#16a34a' : '#64748b', fontWeight: 'bold' }}>
                              {slot.totalSlots !== undefined 
                                ? `${slot.availableSlots} / ${slot.totalSlots} Available` 
                                : (slot.isAvailable ? 'Available' : 'Booked')}
                            </span>
                          </td>
                          <td>
                            <button 
                              onClick={() => handleDeleteStallSlot(slot._id)}
                              disabled={!slot.isAvailable}
                              style={{ background: 'none', border: 'none', color: slot.isAvailable ? '#ef4444' : '#cbd5e1', cursor: slot.isAvailable ? 'pointer' : 'not-allowed' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminParks;
