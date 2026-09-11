import { useState, useEffect } from 'react';
import { TreePine, Plus, Search, Edit2, AlertCircle, CheckCircle2, MapPin, Calendar, HeartPulse, Droplets } from 'lucide-react';

const FloraInventory = () => {
  const [floraList, setFloraList] = useState([]);
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPark, setSelectedPark] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingFlora, setEditingFlora] = useState(null);
  const [formData, setFormData] = useState({
    park: '',
    species: '',
    scientificName: '',
    type: 'Tree',
    plantingDate: new Date().toISOString().split('T')[0],
    healthStatus: 'Healthy',
    locationInPark: '',
    wateringFrequencyDays: 2,
    notes: ''
  });

  const [msg, setMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const getAuthToken = () => {
    try {
      const plantingUser = JSON.parse(localStorage.getItem('plantingUser') || '{}');
      if (plantingUser?.token) return plantingUser.token;
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user?.token) return user.token;
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      if (adminUser?.token) return adminUser.token;
    } catch (e) {}
    return localStorage.getItem('token') || '';
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const [floraRes, parksRes] = await Promise.all([
        fetch('/api/flora', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/parks')
      ]);

      if (floraRes.ok) {
        const floraData = await floraRes.json();
        setFloraList(floraData);
      }
      if (parksRes.ok) {
        const parksData = await parksRes.json();
        setParks(Array.isArray(parksData) ? parksData : parksData.parks || []);
      }
    } catch (err) {
      console.error("Error fetching flora data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingFlora(null);
    setFormData({
      park: parks.length > 0 ? parks[0]._id : '',
      species: '',
      scientificName: '',
      type: 'Tree',
      plantingDate: new Date().toISOString().split('T')[0],
      healthStatus: 'Healthy',
      locationInPark: '',
      wateringFrequencyDays: 2,
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingFlora(item);
    setFormData({
      park: item.park?._id || item.park || (parks.length > 0 ? parks[0]._id : ''),
      species: item.species || '',
      scientificName: item.scientificName || '',
      type: item.type || 'Tree',
      plantingDate: item.plantingDate ? new Date(item.plantingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      healthStatus: item.healthStatus || 'Healthy',
      locationInPark: item.locationInPark || '',
      wateringFrequencyDays: item.wateringFrequencyDays || 2,
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      const token = getAuthToken();
      const url = editingFlora ? `/api/flora/${editingFlora._id}` : '/api/flora';
      const method = editingFlora ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        setMsg({ type: 'success', text: `Flora item ${editingFlora ? 'updated' : 'added'} successfully!` });
        setShowModal(false);
        fetchInitialData();
      } else {
        setMsg({ type: 'error', text: data.message || 'Failed to save flora item.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Server error while saving flora item.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFlora = floraList.filter(item => {
    const matchesSearch = item.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.scientificName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.locationInPark?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPark = selectedPark === 'ALL' || item.park?._id === selectedPark || item.park === selectedPark;
    return matchesSearch && matchesPark;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <TreePine color="#059669" size={32} />
            Flora & Tree Inventory
          </h1>
          <p style={{ color: '#4b5563', marginTop: '0.25rem' }}>
            Track species, planting dates, health status, and care schedules for all park flora.
          </p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          style={{
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2)'
          }}
        >
          <Plus size={20} /> Add New Plant / Tree
        </button>
      </div>

      {msg.text && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          backgroundColor: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: msg.type === 'success' ? '#166534' : '#991b1b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {msg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {msg.text}
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input 
            type="text"
            placeholder="Search by species, scientific name, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.6rem 0.6rem 2.25rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ minWidth: '200px' }}>
          <select 
            value={selectedPark}
            onChange={(e) => setSelectedPark(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '0.875rem',
              backgroundColor: 'white'
            }}
          >
            <option value="ALL">All Assigned Parks</option>
            {parks.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Flora Grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading Flora Inventory...</div>
      ) : filteredFlora.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <TreePine size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No Flora items logged yet.</p>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.25rem' }}>Click "Add New Plant / Tree" above to start building your botanical inventory.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredFlora.map((item) => (
            <div key={item._id} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '600', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '6px',
                      backgroundColor: '#ecfdf5',
                      color: '#047857',
                      display: 'inline-block',
                      marginBottom: '0.35rem'
                    }}>
                      {item.type}
                    </span>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827' }}>{item.species}</h3>
                    {item.scientificName && (
                      <p style={{ fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic' }}>{item.scientificName}</p>
                    )}
                  </div>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600', 
                    padding: '0.25rem 0.6rem', 
                    borderRadius: '9999px',
                    backgroundColor: item.healthStatus === 'Healthy' ? '#dcfce7' : item.healthStatus === 'Critical' ? '#fee2e2' : '#fef9c3',
                    color: item.healthStatus === 'Healthy' ? '#15803d' : item.healthStatus === 'Critical' ? '#b91c1c' : '#a16207'
                  }}>
                    {item.healthStatus}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: '0.875rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={15} color="#059669" />
                    <span>{item.park?.name || 'Park'} {item.locationInPark ? `(${item.locationInPark})` : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={15} color="#2563eb" />
                    <span>Planted: {item.plantingDate ? new Date(item.plantingDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Droplets size={15} color="#0284c7" />
                    <span>Watering frequency: Every {item.wateringFrequencyDays || 2} days</span>
                  </div>
                  {item.notes && (
                    <div style={{ marginTop: '0.4rem', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '6px', fontSize: '0.8rem', color: '#6b7280' }}>
                      "{item.notes}"
                    </div>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => handleOpenEditModal(item)}
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Edit2 size={14} /> Update Health / Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '550px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', color: '#111827' }}>
              {editingFlora ? 'Update Flora Details' : 'Add New Plant / Tree'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Select Park</label>
                <select 
                  required
                  value={formData.park}
                  onChange={(e) => setFormData({...formData, park: e.target.value})}
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                >
                  {parks.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Species / Common Name</label>
                  <input 
                    type="text" required
                    value={formData.species}
                    onChange={(e) => setFormData({...formData, species: e.target.value})}
                    placeholder="e.g. Neem Tree, Rose Bush"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Scientific Name (Optional)</label>
                  <input 
                    type="text"
                    value={formData.scientificName}
                    onChange={(e) => setFormData({...formData, scientificName: e.target.value})}
                    placeholder="e.g. Azadirachta indica"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  >
                    <option value="Tree">Tree</option>
                    <option value="Shrub">Shrub</option>
                    <option value="Flower Bed">Flower Bed</option>
                    <option value="Lawn / Grass">Lawn / Grass</option>
                    <option value="Hedge">Hedge</option>
                    <option value="Potted Plant">Potted Plant</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Health Status</label>
                  <select 
                    value={formData.healthStatus}
                    onChange={(e) => setFormData({...formData, healthStatus: e.target.value})}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  >
                    <option value="Healthy">Healthy</option>
                    <option value="Needs Attention">Needs Attention</option>
                    <option value="Critical">Critical</option>
                    <option value="Dormant">Dormant</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Location in Park</label>
                  <input 
                    type="text"
                    value={formData.locationInPark}
                    onChange={(e) => setFormData({...formData, locationInPark: e.target.value})}
                    placeholder="e.g. North Gate Entrance"
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Watering Frequency (Days)</label>
                  <input 
                    type="number" min="1" max="30"
                    value={formData.wateringFrequencyDays}
                    onChange={(e) => setFormData({...formData, wateringFrequencyDays: Number(e.target.value)})}
                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>Notes / Special Care Instructions</label>
                <textarea 
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="e.g. Apply organic fertilizer every fortnight."
                  style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', border: 'none', background: '#059669', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                >
                  {submitting ? 'Saving...' : 'Save Flora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloraInventory;
