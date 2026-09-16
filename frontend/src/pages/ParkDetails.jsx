import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, CheckCircle2, AlertTriangle, MessageSquareHeart, Phone, Clock, ShieldCheck, Trash2, Leaf, Ban, Users, PawPrint, Shield, Navigation, Megaphone } from 'lucide-react';
import axios from 'axios';
import './ParkDetails.css';

const ParkDetails = () => {
  const { id } = useParams();
  const [parkData, setParkData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);

  const defaultImages = [
    '/parks/park7.jpg',
    '/parks/park1.jpg',
    '/parks/park3.jpg',
    '/parks/park4.jpg',
    '/parks/park5.jpg',
    '/parks/park6.jpg',
    '/parks/park_v3_1.jpg',
    '/parks/park_v3_2.jpg',
    '/parks/park_v3_3.jpg',
    '/parks/park_v3_4.jpg',
    '/parks/park_v3_5.jpg'
  ];

  const resolveParkImage = (img, name = '') => {
    if (img && typeof img === 'string' && img.trim() !== '') {
      if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/')) {
        return img;
      }
      return `/${img}`;
    }
    // Deterministic scenic fallback based on name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash + name.charCodeAt(i)) % defaultImages.length;
    }
    return defaultImages[hash] || '/parks/park7.jpg';
  };

  const defaultPark = {
    name: "Central Park",
    location: "Zone 1 • Ward 10",
    rating: 4.8,
    reviews: 128,
    image: "/parks/park7.jpg",
    status: "Well Maintained",
    description: "Central Park is a premier urban green space maintained by the local municipal authorities to promote community well-being, environmental sustainability, and outdoor recreation. It features well-laid walking tracks, lush lawns, and vibrant flower beds that provide a refreshing escape from the city's concrete landscape. The park is equipped with modern amenities including children's play structures, ample seating areas, and proper lighting to ensure safety and comfort for all visitors. Regular maintenance ensures the preservation of its local flora, making it a cherished daily destination for residents seeking fitness, relaxation, and a connection with nature.",
    facilities: [
      "Playground", "Walking Track", "Benches", "Yoga Space", "Drinking Water", "Public Toilet"
    ],
    stats: {
      area: "2.5 Acres",
      openedOn: "12 Jan 2018",
      maintenance: "Daily"
    },
    stallData: {
      totalStallSlots: 10,
      availableStallSlots: 3,
      stallBookingAmount: 1500
    },
    address: "Coles Park, Pulakeshinagar, Bengaluru, Karnataka",
    latitude: "12.9972",
    longitude: "77.6111"
  };

  useEffect(() => {
    const fetchParkDetails = async () => {
      if (!id) {
        setParkData(defaultPark);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(`/api/parks/${id}`);
        const found = res.data;
        if (found) {
          const locationStr = [
            found.ward?.name ? `Ward: ${found.ward.name}` : null,
            found.zone?.name ? `Zone: ${found.zone.name}` : null,
            found.district?.name ? `District: ${found.district.name}` : null
          ].filter(Boolean).join(' • ');

          const rawImg = (found.images && found.images.length > 0) ? found.images[0] : (found.image || null);
          const imgUrl = resolveParkImage(rawImg, found.name || '');

          setParkData({
            id: found._id,
            name: found.name || defaultPark.name,
            location: locationStr || defaultPark.location,
            ward: found.ward?.name || '',
            zone: found.zone?.name || '',
            corporation: found.corporation?.name || '',
            district: found.district?.name || '',
            rating: 4.8,
            reviews: 128,
            image: imgUrl,
            status: found.status || "Well Maintained",
            description: found.description || defaultPark.description.replace('Central Park', found.name || 'This park'),
            facilities: (found.facilities && found.facilities.length > 0) ? found.facilities : defaultPark.facilities,
            stats: {
              area: found.area || defaultPark.stats.area,
              openedOn: found.openedOn || defaultPark.stats.openedOn,
              maintenance: found.maintenance || defaultPark.stats.maintenance
            },
            stallData: {
              totalStallSlots: found.totalStallSlots || 0,
              availableStallSlots: found.availableStallSlots || 0,
              stallBookingAmount: found.stallBookingAmount || 0
            },
            address: found.address || '',
            latitude: found.latitude || '',
            longitude: found.longitude || ''
          });
        } else {
          setParkData(defaultPark);
        }
      } catch (err) {
        console.error("Error fetching park details:", err);
        setParkData(defaultPark);
      } finally {
        setLoading(false);
      }
    };

    const fetchAnnouncements = async () => {
      if (!id) return;
      try {
        const res = await axios.get(`/api/announcements/park/${id}`);
        setAnnouncements(res.data);
      } catch (err) {
        console.error("Error fetching park announcements:", err);
      }
    };

    fetchParkDetails();
    fetchAnnouncements();
  }, [id]);

  const park = parkData || defaultPark;

  if (loading) {
    return (
      <div className="park-details-page" style={{ padding: '2rem 0', textAlign: 'center', color: '#64748b' }}>
        Loading park details...
      </div>
    );
  }

  const navState = {
    parkId: park.id,
    parkName: park.name,
    location: park.location,
    ward: park.ward,
    zone: park.zone,
    corporation: park.corporation,
    district: park.district
  };

  const getMapSearchQuery = () => {
    // The database is seeded with a placeholder coordinate of 12.9716, 77.5946 for most parks.
    // We should ignore this placeholder and fall back to the text-based address search.
    const isPlaceholder = (park.latitude === '12.9716' || park.latitude === 12.9716) && 
                          (park.longitude === '77.5946' || park.longitude === 77.5946);

    if (park.latitude && park.longitude && !isPlaceholder) {
      return `${park.latitude},${park.longitude}`;
    }
    let query = park.name;
    if (park.address) {
      query += `, ${park.address}`;
    } else {
      if (park.ward) query += `, ${park.ward}`;
      if (park.district) query += `, ${park.district}`;
      else query += `, Bengaluru`;
    }
    return encodeURIComponent(query);
  };

  return (
    <div className="park-details-page single-page">
      <div className="park-details-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <Link to="/parks" className="back-link">
          <ArrowLeft size={16} /> Back to Parks
        </Link>
      </div>

      {announcements.length > 0 && (
        <div className="park-announcements" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {announcements.map(ann => (
            <div key={ann._id} style={{ 
              backgroundColor: ann.priority === 'Urgent' ? '#fee2e2' : (ann.priority === 'Important' ? '#fef3c7' : '#e0f2fe'),
              borderLeft: `4px solid ${ann.priority === 'Urgent' ? '#ef4444' : (ann.priority === 'Important' ? '#f59e0b' : '#3b82f6')}`,
              padding: '1rem',
              borderRadius: '0 4px 4px 0',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-start'
            }}>
              <div style={{ marginTop: '0.1rem' }}>
                {ann.priority === 'Urgent' ? <AlertTriangle color="#ef4444" size={24} /> : (ann.type === 'Closure' ? <Ban color="#f59e0b" size={24} /> : <Megaphone color="#3b82f6" size={24} />)}
              </div>
              <div>
                <h4 style={{ 
                  margin: '0 0 0.25rem 0', 
                  color: ann.priority === 'Urgent' ? '#991b1b' : (ann.priority === 'Important' ? '#92400e' : '#075985')
                }}>{ann.title}</h4>
                <p style={{ margin: 0, color: '#334155', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{ann.content}</p>
                {ann.endDate && (
                  <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>
                    Valid until: {new Date(ann.endDate).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="park-hero-image-compact">
        <img 
          src={park.image || '/parks/park7.jpg'} 
          alt={park.name} 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/parks/park7.jpg';
          }}
        />
        <div className="park-hero-overlay">
          <div className="park-hero-info">
            <h1>{park.name}</h1>
            <p className="park-location"><MapPin size={16} /> {park.location}</p>
          </div>
          <div className="park-hero-right">
            <div className="park-rating-badge">
              <Star size={16} fill="#f59e0b" color="#f59e0b" />
              <span className="rating-val">{park.rating}</span>
              <span className="rating-count">({park.reviews})</span>
            </div>
            <div className="park-status-badge">{park.status}</div>
          </div>
        </div>
      </div>

      <div className="park-main-grid">
        <div className="park-left-col">
          <div className="park-card-box park-about-box">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Star size={18} style={{ color: '#64748b' }} /> About Park</h3>
            <p>{park.description}</p>
          </div>

          <div className="park-stats-row">
            <div className="stat-box">
              <span className="stat-title">Area</span>
              <span className="stat-value">{park.stats.area}</span>
            </div>
            <div className="stat-box">
              <span className="stat-title">Opened On</span>
              <span className="stat-value">{park.stats.openedOn}</span>
            </div>
            <div className="stat-box">
              <span className="stat-title">Maintenance</span>
              <span className="stat-value">{park.stats.maintenance}</span>
            </div>
          </div>

          <div className="park-card-box rules-box" style={{ padding: '0.85rem 1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.15rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: '700' }}>
              <ShieldCheck size={22} style={{ color: '#059669' }} strokeWidth={1.5} /> Park Rules & Guidelines
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0', borderTop: '1px solid #e2e8f0' }}>
                <Trash2 size={18} style={{ color: '#059669' }} strokeWidth={1.5} />
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>Keep the park clean. Use dustbins.</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0', borderTop: '1px solid #e2e8f0' }}>
                <Leaf size={18} style={{ color: '#059669' }} strokeWidth={1.5} />
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>Do not pluck flowers or damage plants.</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0', borderTop: '1px solid #e2e8f0' }}>
                <Ban size={18} style={{ color: '#059669' }} strokeWidth={1.5} />
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>No littering, smoking or alcohol.</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0', borderTop: '1px solid #e2e8f0' }}>
                <Users size={18} style={{ color: '#059669' }} strokeWidth={1.5} />
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>Respect other visitors and maintain silence.</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0', borderTop: '1px solid #e2e8f0' }}>
                <PawPrint size={18} style={{ color: '#059669' }} strokeWidth={1.5} />
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>Pets must be on a leash.</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                <Shield size={18} style={{ color: '#059669' }} strokeWidth={1.5} />
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>Follow park timings and staff instructions.</span>
              </div>

            </div>
          </div>

          <div className="park-card-box timings-box" style={{ marginTop: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={18} style={{ color: '#64748b' }} /> Park Timings</h3>
            <div className="rules-content" style={{ color: '#475569', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600', color: '#0f172a' }}>Morning</p>
                  <p style={{ margin: '0', fontWeight: '600', color: '#059669' }}>5:00 AM - 10:00 AM</p>
                </div>
                <div style={{ flex: 1, background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontWeight: '600', color: '#0f172a' }}>Evening</p>
                  <p style={{ margin: '0', fontWeight: '600', color: '#059669' }}>4:00 PM - 8:30 PM</p>
                </div>
              </div>
            </div>
          </div>

          <div className="park-card-box notice-box" style={{ marginTop: '1rem', background: 'linear-gradient(to right, #fffbeb, #fef3c7)', border: '1px solid #fde68a' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', marginBottom: '0.5rem' }}>
              📢 Important Notice
            </h3>
            <p style={{ margin: '0', color: '#92400e', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Please help us keep the park clean, safe and green. Follow park rules, respect other visitors, and report any maintenance or safety issues to the park staff.
            </p>
          </div>
        </div>

        <div className="park-right-col">
          <div className="park-card-box park-facilities-box">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={18} style={{ color: '#64748b' }} /> Park Facilities</h3>
            <ul className="facilities-list-compact">
              {park.facilities.map((facility, index) => {
                const getFacilityIcon = (name) => {
                  const n = name.toLowerCase();
                  
                  if (n.includes('playground') || n.includes('children') || n.includes('play')) {
                    return (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'flex' }}>
                        <path d="M2 22h20" />
                        <path d="M6 22V4" />
                        <path d="M6 18H3" />
                        <path d="M6 14H3" />
                        <path d="M6 10H3" />
                        <path d="M6 6H3" />
                        <path d="M6 4c4 0 5 15 10 16h4" />
                      </svg>
                    );
                  }
                  if (n.includes('bench') || n.includes('seat')) {
                    return (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'flex' }}>
                        <path d="M4 12V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6" />
                        <path d="M4 9h16" />
                        <rect x="2" y="12" width="20" height="3" rx="1" />
                        <path d="M6 15v6" />
                        <path d="M18 15v6" />
                        <path d="M4 15v4" />
                        <path d="M20 15v4" />
                      </svg>
                    );
                  }

                  let iconName = 'check_circle';
                  if (n.includes('walk') || n.includes('track')) iconName = 'directions_walk';
                  else if (n.includes('garden') || n.includes('lake') || n.includes('green')) iconName = 'park';
                  else if (n.includes('yoga')) iconName = 'self_improvement';
                  else if (n.includes('water') || n.includes('drink')) iconName = 'water_drop';
                  else if (n.includes('toilet') || n.includes('restroom')) iconName = 'wc';
                  else if (n.includes('gym') || n.includes('fitness') || n.includes('exercise')) iconName = 'fitness_center';
                  else if (n.includes('park') || n.includes('parking')) iconName = 'local_parking';
                  
                  return <span className="material-symbols-outlined" style={{ color: '#059669', fontSize: '20px', display: 'flex' }}>{iconName}</span>;
                };
                
                return (
                  <li key={index} style={{ gap: '0.6rem', padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center' }}>
                    {getFacilityIcon(facility)}
                    <span style={{ color: '#1e293b' }}>{facility}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="park-card-box accessibility-box">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.15rem', lineHeight: '1' }}>🛡️</span> Visitor Safety & Accessibility
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0' }}>
                <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>♿</span>
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>Wheelchair Accessible</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0' }}>
                <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>🛤️</span>
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>Accessible Pathways</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0' }}>
                <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>🅿️</span>
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>Parking Available</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0' }}>
                <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>🐕</span>
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>Pet Friendly</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0' }}>
                <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>🩹</span>
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>First-Aid Facility</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0' }}>
                <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>📹</span>
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>CCTV Monitoring</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0' }}>
                <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>👶</span>
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>Stroller Friendly</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0' }}>
                <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>🚨</span>
                <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>Emergency Assistance</span>
              </div>
            </div>
          </div>
          <div className="park-card-box location-box" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <MapPin size={18} style={{ color: '#059669' }} /> Location & Directions
            </h3>
            
            <div className="location-content-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
              <div className="location-details-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="address-container" style={{ flex: 1 }}>
                  <div>
                    <p className="primary-address" style={{ margin: '0 0 0.2rem 0', fontWeight: '600', color: '#0f172a', fontSize: '0.95rem' }}>
                      {park.address || `${park.name}, ${park.location}`}
                    </p>
                    <p className="secondary-address" style={{ margin: '0', color: '#64748b', fontSize: '0.85rem' }}>
                      {park.district ? `${park.district}, Karnataka` : 'Bengaluru Urban, Karnataka'}
                    </p>
                  </div>
                </div>
                
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${getMapSearchQuery()}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary get-directions-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2)',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Navigation size={16} /> Directions
                </a>
              </div>
              
              <div className="location-map-col" style={{ flex: 1, minHeight: '140px' }}>
                <iframe
                  title="Park Location"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0, borderRadius: '12px', width: '100%', height: '100%', minHeight: '140px' }}
                  src={`https://maps.google.com/maps?q=${getMapSearchQuery()}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="park-action-row" style={{ marginTop: '0.5rem', marginBottom: '0' }}>
        <Link 
          to="/complaint" 
          state={navState}
          className="btn btn-primary action-btn report-btn" 
          style={{ height: '42px', fontSize: '0.95rem' }}
        >
          <AlertTriangle size={16} /> Report an Issue
        </Link>
        <Link 
          to="/feedback" 
          state={navState}
          className="btn btn-secondary action-btn feedback-btn" 
          style={{ height: '42px', fontSize: '0.95rem' }}
        >
          <MessageSquareHeart size={16} /> Give Feedback
        </Link>
      </div>
    </div>
  );
};

export default ParkDetails;

