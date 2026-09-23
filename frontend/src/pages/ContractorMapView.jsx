import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { TreePine, HardHat, Menu, LogOut, MapPin, ClipboardList, AlertCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ContractorSidebar from '../components/ContractorSidebar';
import './ContractorMapView.css';

// Fix default marker icons (Leaflet webpack issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom colored marker icons
const createColorIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="
    width:34px;height:34px;border-radius:50% 50% 50% 0;
    background:${color};transform:rotate(-45deg);
    border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

const statusColors = {
  Active: '#16a34a',
  'Under Maintenance': '#f59e0b',
  Closed: '#ef4444',
};

const ContractorMapView = () => {
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [parks, setParks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('All');

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const handleLogout = () => {
    localStorage.removeItem('contractorUser');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const stored = localStorage.getItem('contractorUser');
    if (!stored) { navigate('/login'); return; }
    const user = JSON.parse(stored);
    setContractor(user);

    const fetchData = async () => {
      try {
        // Fetch assigned parks
        const parksRes = await fetch(`/api/parks?contractorId=${user.id || user._id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const parksData = await parksRes.json();
        const parkList = Array.isArray(parksData) ? parksData : parksData.parks || [];
        setParks(parkList);

        // Fetch complaints as tasks for task count per park
        const cId = user._id || user.id;
        const tasksRes = await fetch(`/api/complaints?contractorId=${cId}`);
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(Array.isArray(tasksData) ? tasksData : []);
        }
      } catch (err) {
        console.error('Error fetching map data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const getTaskCount = (parkId) => tasks.filter(t => {
    const pId = t.park?._id || t.park;
    const parkObj = parks.find(p => p._id === parkId);
    return pId === parkId || (parkObj && t.parkName && parkObj.name === t.parkName);
  }).length;

  const getPendingCount = (parkId) => tasks.filter(t => {
    const pId = t.park?._id || t.park;
    const parkObj = parks.find(p => p._id === parkId);
    const matchesPark = pId === parkId || (parkObj && t.parkName && parkObj.name === t.parkName);
    const isCompleted = ['Completed', 'Completed - Waiting for Admin Review', 'Inspection Pending', 'Inspection Approved', 'Closed'].includes(t.status);
    return matchesPark && !isCompleted;
  }).length;

  const validParks = parks.filter(p => p.latitude && p.longitude && !isNaN(parseFloat(p.latitude)) && !isNaN(parseFloat(p.longitude)));
  const filteredParks = selectedStatus === 'All' ? validParks : validParks.filter(p => p.status === selectedStatus);

  const mapCenter = validParks.length > 0
    ? [parseFloat(validParks[0].latitude), parseFloat(validParks[0].longitude)]
    : [12.9716, 77.5946]; // Default: Bangalore

  const statusCounts = {
    All: validParks.length,
    Active: validParks.filter(p => p.status === 'Active').length,
    'Under Maintenance': validParks.filter(p => p.status === 'Under Maintenance').length,
    Closed: validParks.filter(p => p.status === 'Closed').length,
  };

  return (
    <div className="contractor-dashboard-page">
      <ContractorSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} handleLogout={handleLogout} contractor={contractor} />

      <div className={`contractor-main-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="contractor-header">
          <div className="container contractor-header-content">
            <div className="contractor-brand">
              <button className="contractor-menu-toggle" onClick={toggleSidebar}><Menu size={24} /></button>
              <TreePine size={28} color="#e5ede7" />
              <h1>Parks Monitoring System</h1>
            </div>
            <div className="contractor-user-info">
              <div className="contractor-user-details">
                <h4 className="contractor-user-name">{contractor?.name}</h4>
                <p className="contractor-user-role">
                  {contractor?.maintenanceSkills?.length > 0 ? contractor.maintenanceSkills.join(', ') : 'Maintenance Contractor'}
                </p>
              </div>
              <button className="btn-contractor-logout" onClick={handleLogout}><LogOut size={16} /> Logout</button>
            </div>
          </div>
        </header>

        <div className="map-page-container container">
          <div className="map-page-header">
            <div className="map-page-title">
              <MapPin size={28} className="map-title-icon" />
              <div>
                <h2>My Assigned Parks — Map View</h2>
                <p>Visual overview of all your assigned park locations</p>
              </div>
            </div>

            {/* Status filter pills */}
            <div className="map-filter-pills">
              {Object.entries(statusCounts).map(([status, count]) => (
                <button
                  key={status}
                  className={`map-filter-pill ${selectedStatus === status ? 'active' : ''}`}
                  data-status={status}
                  onClick={() => setSelectedStatus(status)}
                >
                  {status} <span className="pill-count">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="map-loading">
              <div className="map-spinner"></div>
              <p>Loading park locations…</p>
            </div>
          ) : validParks.length === 0 ? (
            <div className="map-empty">
              <AlertCircle size={48} />
              <h3>No parks with location data found</h3>
              <p>Your assigned parks don't have latitude/longitude set. Please contact your admin.</p>
            </div>
          ) : (
            <div className="map-layout">
              {/* Map */}
              <div className="map-wrapper">
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {filteredParks.map(park => (
                    <Marker
                      key={park._id}
                      position={[parseFloat(park.latitude), parseFloat(park.longitude)]}
                      icon={createColorIcon(statusColors[park.status] || '#6b7280')}
                    >
                      <Popup>
                        <div className="map-popup">
                          <h4>{park.name}</h4>
                          <span className={`popup-status popup-status--${park.status?.replace(' ', '-').toLowerCase()}`}>
                            {park.status || 'Active'}
                          </span>
                          <p className="popup-address">{park.address || 'No address'}</p>
                          <div className="popup-stats">
                            <div className="popup-stat">
                              <span className="popup-stat-num">{getTaskCount(park._id)}</span>
                              <span className="popup-stat-label">Total Tasks</span>
                            </div>
                            <div className="popup-stat">
                              <span className="popup-stat-num pending">{getPendingCount(park._id)}</span>
                              <span className="popup-stat-label">Pending</span>
                            </div>
                          </div>
                          <Link to="/contractor/tasks" className="popup-link">
                            <ClipboardList size={14} /> View Tasks
                          </Link>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {/* Park List sidebar */}
              <div className="map-park-list">
                <h3>Parks ({filteredParks.length})</h3>
                {filteredParks.map(park => (
                  <div key={park._id} className="map-park-card">
                    <div className="map-park-dot" style={{ background: statusColors[park.status] || '#6b7280' }}></div>
                    <div className="map-park-info">
                      <h4>{park.name}</h4>
                      <p>{park.address || park.parkCode}</p>
                      <div className="map-park-meta">
                        <span className={`map-park-status map-park-status--${park.status?.replace(' ', '-').toLowerCase()}`}>
                          {park.status || 'Active'}
                        </span>
                        <span className="map-park-tasks">
                          <ClipboardList size={12} /> {getPendingCount(park._id)} pending
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

              </div>
    </div>
  );
};

export default ContractorMapView;

