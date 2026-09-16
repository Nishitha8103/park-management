import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import axios from 'axios';
import './Parks.css';

const Parks = () => {
  const [parks, setParks] = useState(() => {
    try {
      const cached = sessionStorage.getItem('cached_parks_list');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = sessionStorage.getItem('cached_parks_list');
      return !cached;
    } catch {
      return true;
    }
  });
  const [fetchError, setFetchError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Filter States
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCorporation, setSelectedCorporation] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  const fetchParks = async (showLoadingState = true) => {
    try {
      if (showLoadingState) setLoading(true);
      setFetchError(null);
      const res = await axios.get('/api/parks');
      const data = Array.isArray(res.data) ? res.data : (res.data?.parks || []);
      setParks(data);
      try {
        sessionStorage.setItem('cached_parks_list', JSON.stringify(data));
      } catch (e) {}
    } catch (error) {
      console.error("Error fetching parks:", error);
      setFetchError(error.response?.data?.message || error.message || 'Failed to load parks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParks(parks.length === 0);
  }, []);

  // Dynamically derive filter options from actual parks
  const availableDistricts = useMemo(() => {
    const map = new Map();
    parks.forEach(p => {
      const d = p.district;
      if (d && typeof d === 'object' && d._id && !map.has(d._id)) {
        map.set(d._id, d);
      }
    });
    return Array.from(map.values());
  }, [parks]);

  const availableCorporations = useMemo(() => {
    const map = new Map();
    parks.forEach(p => {
      const d = p.district;
      const c = p.corporation;
      const distId = (d?._id || d || '').toString();
      if (c && typeof c === 'object' && c._id && (!selectedDistrict || distId === selectedDistrict) && !map.has(c._id)) {
        map.set(c._id, c);
      }
    });
    return Array.from(map.values());
  }, [parks, selectedDistrict]);

  const availableZones = useMemo(() => {
    const map = new Map();
    parks.forEach(p => {
      const c = p.corporation;
      const z = p.zone;
      const corpId = (c?._id || c || '').toString();
      if (z && typeof z === 'object' && z._id && (!selectedCorporation || corpId === selectedCorporation) && !map.has(z._id)) {
        map.set(z._id, z);
      }
    });
    return Array.from(map.values());
  }, [parks, selectedCorporation]);

  const availableWards = useMemo(() => {
    const map = new Map();
    parks.forEach(p => {
      const z = p.zone;
      const w = p.ward;
      const zoneId = (z?._id || z || '').toString();
      if (w && typeof w === 'object' && w._id && (!selectedZone || zoneId === selectedZone) && !map.has(w._id)) {
        map.set(w._id, w);
      }
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
    if (imagePath && typeof imagePath === 'string' && (imagePath.startsWith('/') || imagePath.startsWith('http'))) {
      return imagePath;
    }
    return defaultImages[index % defaultImages.length];
  };

  const filteredParks = useMemo(() => parks.filter(p => {
    const pName = (p.name || '').toLowerCase();
    const pCode = (p.parkCode || '').toLowerCase();
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = !q || pName.includes(q) || pCode.includes(q);

    const parkDist = (p.district?._id || p.district || '').toString();
    const parkCorp = (p.corporation?._id || p.corporation || '').toString();
    const parkZone = (p.zone?._id || p.zone || '').toString();
    const parkWard = (p.ward?._id || p.ward || '').toString();

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
            placeholder="Search Park Name or Code..."
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

      {loading && parks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Loader2 size={32} className="spin-icon" color="#16a34a" />
          <span style={{ color: '#475569', fontWeight: 600, fontSize: '1rem' }}>Loading parks catalog...</span>
        </div>
      ) : fetchError && parks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca', margin: '2rem 0' }}>
          <AlertCircle size={36} color="#dc2626" style={{ marginBottom: '8px' }} />
          <h3 style={{ color: '#991b1b', margin: '0 0 8px 0' }}>Unable to load parks</h3>
          <p style={{ color: '#b91c1c', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>{fetchError}</p>
          <button 
            onClick={() => fetchParks(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#dc2626', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      ) : filteredParks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px', margin: '2rem 0' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#334155', margin: '0 0 0.5rem 0' }}>No parks match your selected filters.</p>
          <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>Try selecting a different district, zone, ward or clearing search filters.</p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              style={{ marginTop: '1rem', padding: '0.5rem 1.2rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ margin: '1.5rem 0 0.5rem 0', color: '#64748b', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Showing <strong>{filteredParks.length}</strong> parks</span>
            {loading && <span style={{ fontSize: '0.8rem', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Loader2 size={13} className="spin-icon" /> Syncing updates...</span>}
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

