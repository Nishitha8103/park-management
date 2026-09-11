import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import axios from 'axios';
import './Parks.css';

const Parks = () => {
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Filter States
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCorporation, setSelectedCorporation] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  const fetchParks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/parks');
      setParks(res.data);
    } catch (error) {
      console.error("Error fetching parks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParks();
  }, []);

  // Dynamically derive filter options from actual parks
  const availableDistricts = useMemo(() => {
    const map = new Map();
    parks.forEach(p => {
      const d = p.district;
      if (d && !map.has(d._id)) map.set(d._id, d);
    });
    return Array.from(map.values());
  }, [parks]);

  const availableCorporations = useMemo(() => {
    const map = new Map();
    parks.forEach(p => {
      const d = p.district;
      const c = p.corporation;
      if (c && (!selectedDistrict || (d && d._id === selectedDistrict)) && !map.has(c._id)) map.set(c._id, c);
    });
    return Array.from(map.values());
  }, [parks, selectedDistrict]);

  const availableZones = useMemo(() => {
    const map = new Map();
    parks.forEach(p => {
      const c = p.corporation;
      const z = p.zone;
      if (z && (!selectedCorporation || (c && c._id === selectedCorporation)) && !map.has(z._id)) map.set(z._id, z);
    });
    return Array.from(map.values());
  }, [parks, selectedCorporation]);

  const availableWards = useMemo(() => {
    const map = new Map();
    parks.forEach(p => {
      const z = p.zone;
      const w = p.ward;
      if (w && (!selectedZone || (z && z._id === selectedZone)) && !map.has(w._id)) map.set(w._id, w);
    });
    return Array.from(map.values());
  }, [parks, selectedZone]);

  const handleFilterChange = (type, value) => {
    if (type === 'district') {
      setSelectedDistrict(value);
      setSelectedCorporation(''); setSelectedZone(''); setSelectedWard('');
    }
    if (type === 'corporation') {
      setSelectedCorporation(value);
      setSelectedZone(''); setSelectedWard('');
    }
    if (type === 'zone') {
      setSelectedZone(value);
      setSelectedWard('');
    }
    if (type === 'ward') {
      setSelectedWard(value);
    }
  };

  const handleClearFilters = () => {
    setSelectedDistrict('');
    setSelectedCorporation('');
    setSelectedZone('');
    setSelectedWard('');
    setSearchTerm('');
  };

  const hasActiveFilters = selectedDistrict || selectedCorporation || selectedZone || selectedWard || searchTerm;

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const defaultImages = [
    '/parks/park_v3_1.jpg',
    '/parks/park_v3_2.jpg',
    '/parks/park_v3_3.jpg',
    '/parks/park_v3_4.jpg',
    '/parks/park_v3_5.jpg'
  ];

  const getImageUrl = (imagePath, index = 0) => {
    return defaultImages[index % defaultImages.length];
  };

  const filteredParks = useMemo(() => parks.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const parkDist = p.district?._id || p.district;
    const parkCorp = p.corporation?._id || p.corporation;
    const parkZone = p.zone?._id || p.zone;
    const parkWard = p.ward?._id || p.ward;
    const matchesDist = !selectedDistrict || parkDist === selectedDistrict;
    const matchesCorp = !selectedCorporation || parkCorp === selectedCorporation;
    const matchesZone = !selectedZone || parkZone === selectedZone;
    const matchesWard = !selectedWard || parkWard === selectedWard;
    return matchesSearch && matchesDist && matchesCorp && matchesZone && matchesWard;
  }), [parks, searchTerm, selectedDistrict, selectedCorporation, selectedZone, selectedWard]);

  const visibleParks = filteredParks;

  return (
    <div className="parks-page">
      <div className="page-header">
        <h1>Our Parks</h1>
        <p>Explore parks in your area</p>
      </div>

      <div className="filters-section" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <select className="filter-dropdown" value={selectedDistrict} onChange={e => handleFilterChange('district', e.target.value)} style={{ flex: '1', minWidth: '150px' }}>
          <option value="">All Districts</option>
          {availableDistricts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select className="filter-dropdown" value={selectedCorporation} onChange={e => handleFilterChange('corporation', e.target.value)} style={{ flex: '1', minWidth: '150px' }}>
          <option value="">All Corporations</option>
          {availableCorporations.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select className="filter-dropdown" value={selectedZone} onChange={e => handleFilterChange('zone', e.target.value)} style={{ flex: '1', minWidth: '150px' }}>
          <option value="">All Zones</option>
          {availableZones.map(z => <option key={z._id} value={z._id}>{z.name}</option>)}
        </select>
        <select className="filter-dropdown" value={selectedWard} onChange={e => handleFilterChange('ward', e.target.value)} style={{ flex: '1', minWidth: '150px' }}>
          <option value="">All Wards</option>
          {availableWards.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
        </select>

        <div className="search-bar" style={{ flex: '2', minWidth: '250px' }}>
          <Search size={20} className="text-secondary" />
          <input
            type="text"
            placeholder="Search Park Name"
            className="search-input"
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ width: '100%' }}
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            style={{ padding: '0.5rem 1rem', backgroundColor: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            ✕ Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading parks...</div>
      ) : filteredParks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No parks found.</div>
      ) : (
        <>
          <div style={{ margin: '1.5rem 0 0.5rem 0', color: '#64748b', fontSize: '0.9rem' }}>
            Showing <strong>{filteredParks.length}</strong> parks
          </div>

          <div className="parks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '0.5rem' }}>
            {visibleParks.map((park, index) => {
              const displayImg = (park.images && park.images.length > 0) ? getImageUrl(park.images[0], index) : getImageUrl(null, index);
              return (
                <div key={park._id} className="park-card" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '180px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                    <img src={displayImg} alt={park.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    <span style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: park.status === 'Active' ? '#dcfce7' : '#fee2e2', color: park.status === 'Active' ? '#15803d' : '#b91c1c' }}>
                      {park.status || 'Active'}
                    </span>
                  </div>

                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#0f172a' }}>{park.name}</h3>
                      <p style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: '#64748b' }}>
                        <MapPin size={16} />
                        {park.ward?.name ? `${park.ward.name}, ` : ''}{park.zone?.name ? `${park.zone.name}` : 'Location available in details'}
                      </p>

                      {park.facilities && park.facilities.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.25rem' }}>
                          {park.facilities.slice(0, 4).map((facility, index) => (
                            <span key={index} style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                              {facility}
                            </span>
                          ))}
                          {park.facilities.length > 4 && (
                            <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                              +{park.facilities.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <Link to={`/parks/${park._id}`} className="btn btn-primary" style={{ textAlign: 'center', textDecoration: 'none', padding: '0.6rem 1rem', borderRadius: '6px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}>
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

        </>
      )}
    </div>
  );
};

export default Parks;
