import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Menu, HardHat, LogOut, ClipboardList, Calendar, CheckCircle, RotateCcw,
  Bell, Activity, CalendarDays, Wrench, MapPin, AlertCircle, Package, Plus,
  ChevronRight, ArrowUpRight, ShieldCheck, Clock, Layers, Sparkles, FileText, Check
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell 
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ContractorDashboard.css';
import './ContractorMapView.css';
import ContractorSidebar from '../components/ContractorSidebar';
import NotificationDropdown from '../components/NotificationDropdown';

// Leaflet default icon fix
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
    border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.35);
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

const API_BASE = '/api';

const ContractorDashboard = () => {
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(() => {
    try {
      const stored = localStorage.getItem('contractorUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [complaints, setComplaints] = useState([]);
  const [parks, setParks] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedMapStatus, setSelectedMapStatus] = useState('All');
  const [selectedParkId, setSelectedParkId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingParks, setLoadingParks] = useState(true);
  
  const mapRef = useRef(null);

  // Derived stats
  const [stats, setStats] = useState({
    pending: 0,
    today: 0,
    completed: 0,
    rework: 0,
  });
  const [slaStats, setSlaStats] = useState({
    onTime: 0,
    dueSoon: 0,
    overdue: 0,
  });
  const [pieData, setPieData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('contractorUser');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    if (!contractor) {
      navigate('/login');
    }
  }, [contractor, navigate]);

  useEffect(() => {
    if (!contractor) return;

    const fetchParks = async () => {
      try {
        setLoadingParks(true);
        const res = await fetch(`${API_BASE}/parks?contractorId=${contractor._id || contractor.id}`, {
          headers: contractor.token ? { Authorization: `Bearer ${contractor.token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          const parkList = Array.isArray(data) ? data : data.parks || [];
          setParks(parkList);
        }
      } catch (err) {
        console.error('Failed to fetch parks:', err);
      } finally {
        setLoadingParks(false);
      }
    };

    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/complaints?contractorId=${contractor._id || contractor.id}`);
        const data = await res.json();
        
        const source = Array.isArray(data) ? data : [];
        setComplaints(source);

        const todayStr = new Date().toDateString();

        const pending = source.filter(c =>
          ['New', 'Assigned', 'In Progress', 'Reassigned to Contractor'].includes(c.status)
        ).length;

        const todayCount = source.filter(c => {
          const d = new Date(c.createdAt || c.updatedAt);
          return d.toDateString() === todayStr;
        }).length;

        const completed = source.filter(c =>
          ['Completed', 'Completed - Waiting for Admin Review', 'Inspection Pending', 'Inspection Approved', 'Closed'].includes(c.status)
        ).length;

        const rework = source.filter(c => ['Returned by Admin', 'Rework Required'].includes(c.status)).length;

        setStats({ pending, today: todayCount, completed, rework });
        
        let onTime = 0, dueSoon = 0, overdue = 0;
        source.forEach(c => {
          if (!['Completed', 'Completed - Waiting for Admin Review', 'Inspection Pending', 'Inspection Approved', 'Closed'].includes(c.status)) {
            if (c.slaStatus === 'On Time') onTime++;
            else if (c.slaStatus === 'Due Soon') dueSoon++;
            else if (c.slaStatus === 'Overdue') overdue++;
          }
        });
        setSlaStats({ onTime, dueSoon, overdue });

        const approved = completed;
        const inProgress = pending;
        const rejected = rework;
        
        const pie = [];
        if (approved > 0) pie.push({ name: 'Completed/Approved', value: approved, color: '#10b981' });
        if (inProgress > 0) pie.push({ name: 'In Progress/Assigned', value: inProgress, color: '#f59e0b' });
        if (rejected > 0) pie.push({ name: 'Rework Required', value: rejected, color: '#ef4444' });

        if (pie.length === 0) {
          pie.push({ name: 'No Active Tasks', value: 1, color: '#cbd5e1' });
        }

        setPieData(pie);

        const sorted = [...source]
          .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
          .slice(0, 5);

        setRecentActivities(sorted.map(c => ({
          id: c._id,
          text: `Task #${c.complaintNumber} — ${c.category} at ${c.parkName || 'Assigned Park'} [${c.status}]`,
          time: new Date(c.updatedAt || c.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        })));
      } catch (err) {
        console.error('Failed to fetch complaints:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchMaterials = async () => {
      try {
        const res = await fetch(`${API_BASE}/material-requests/my`, {
          headers: contractor.token ? { Authorization: `Bearer ${contractor.token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setMaterials(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch material requests:', err);
      }
    };

    fetchParks();
    fetchComplaints();
    fetchMaterials();
  }, [contractor]);

  // Strictly filter parks to assigned ones only
  const assignedParkIds = new Set([
    ...(contractor?.assignedParks || []).map(id => typeof id === 'object' ? id._id || id.id : id),
    ...(contractor?.park ? [typeof contractor.park === 'object' ? contractor.park._id || contractor.park.id : contractor.park] : []),
    ...complaints.map(c => c.park?._id || c.park).filter(Boolean)
  ].map(id => String(id)));

  const assignedParksOnly = parks.filter(p => {
    if (assignedParkIds.size > 0) {
      return assignedParkIds.has(String(p._id));
    }
    return true; // Fallback if no specific IDs found anywhere
  });

  const getTaskCountForPark = (parkId) => complaints.filter(t => {
    const pId = t.park?._id || t.park;
    const parkObj = assignedParksOnly.find(p => p._id === parkId);
    return pId === parkId || (parkObj && t.parkName && parkObj.name === t.parkName);
  }).length;

  const getPendingCountForPark = (parkId) => complaints.filter(t => {
    const pId = t.park?._id || t.park;
    const parkObj = assignedParksOnly.find(p => p._id === parkId);
    const matchesPark = pId === parkId || (parkObj && t.parkName && parkObj.name === t.parkName);
    const isCompleted = ['Completed', 'Completed - Waiting for Admin Review', 'Inspection Pending', 'Inspection Approved', 'Closed'].includes(t.status);
    return matchesPark && !isCompleted;
  }).length;

  const validParks = assignedParksOnly.filter(p => p.latitude && p.longitude && !isNaN(parseFloat(p.latitude)) && !isNaN(parseFloat(p.longitude)));
  const filteredParks = selectedMapStatus === 'All' ? validParks : validParks.filter(p => p.status === selectedMapStatus);
  
  const mapCenter = validParks.length > 0
    ? [parseFloat(validParks[0].latitude), parseFloat(validParks[0].longitude)]
    : [12.9716, 77.5946];

  const mapStatusCounts = {
    All: validParks.length,
    Active: validParks.filter(p => p.status === 'Active').length,
    'Under Maintenance': validParks.filter(p => p.status === 'Under Maintenance').length,
    Closed: validParks.filter(p => p.status === 'Closed').length,
  };

  const pendingTasksList = complaints.filter(c => 
    ['New', 'Assigned', 'In Progress', 'Reassigned to Contractor', 'Returned by Admin', 'Rework Required'].includes(c.status)
  ).slice(0, 5);

  const lineData = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const dayStr = d.toDateString();

      const dayComplaints = complaints.filter(c => {
        const cd = new Date(c.updatedAt || c.createdAt);
        return cd.toDateString() === dayStr;
      });

      const completed = dayComplaints.filter(c => ['Completed', 'Completed - Waiting for Admin Review', 'Inspection Pending', 'Inspection Approved', 'Closed'].includes(c.status)).length;
      const pending = dayComplaints.filter(c => ['New', 'Assigned', 'In Progress', 'Reassigned to Contractor'].includes(c.status)).length;
      const rejected = dayComplaints.filter(c => ['Returned by Admin', 'Rework Required'].includes(c.status)).length;

      days.push({ date: label, completed, pending, rejected });
    }
    return days;
  })();

  const now = new Date();
  const dayNum = now.getDate();
  const monthYear = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const weekday = now.toLocaleDateString('en-IN', { weekday: 'long' });

  const totalPie = pieData.reduce((sum, d) => sum + (d.name === 'No Active Tasks' ? 0 : d.value), 0);
  const completionRate = stats.completed + stats.pending > 0 
    ? Math.round((stats.completed / (stats.completed + stats.pending + stats.rework)) * 100) 
    : 100;

  if (!contractor) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 'bold' }}>Verifying authorization...</div>;
  }

  return (
    <div className="contractor-dashboard-page">
      <ContractorSidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        handleLogout={handleLogout} 
        contractor={contractor} 
      />
      
      <div className={`contractor-main-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Top Header Navigation */}
        <header className="contractor-header">
          <div className="container contractor-header-content">
            <div className="contractor-brand">
              <button className="contractor-menu-toggle" onClick={toggleSidebar} title="Toggle Sidebar Menu">
                <Menu size={24} />
              </button>
              <HardHat size={28} className="contractor-text-primary" />
              <h1>PARK MAINTENANCE</h1>
              <span>Contractor Portal</span>
            </div>
            
            <div className="contractor-user-info">
              <NotificationDropdown userId={contractor._id || contractor.id} role="contractor" />
              <div className="contractor-user-details">
                <h4 className="contractor-user-name">{contractor.name}</h4>
                <p className="contractor-user-role">{contractor.department || contractor.maintenanceSkills?.[0] || 'Park Maintenance'} Specialist</p>
              </div>
              <button className="btn-contractor-logout" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Main Container */}
        <main className="container contractor-dashboard-container">
          
          {/* Welcome Hero Banner */}
          <div className="contractor-hero-banner">
            <div className="hero-banner-main">
              <div className="hero-greeting">
                <div className="hero-badge">
                  <Sparkles size={14} /> Contractor Operational Dashboard
                </div>
                <h2>Welcome back, <span className="highlight">{contractor.name}!</span></h2>
                <p>Overview of assigned parks, active maintenance tasks, and material requests.</p>
              </div>

              <div className="hero-quick-actions">
                <Link to="/contractor/tasks" className="hero-action-btn primary">
                  <ClipboardList size={18} />
                  <span>My Tasks ({stats.pending})</span>
                </Link>
                <Link to="/contractor/materials" className="hero-action-btn secondary">
                  <Package size={18} />
                  <span>Request Materials</span>
                </Link>
                <Link to="/contractor/schedule" className="hero-action-btn secondary">
                  <Calendar size={18} />
                  <span>Work Schedule</span>
                </Link>
                <Link to="/contractor/reports" className="hero-action-btn secondary">
                  <FileText size={18} />
                  <span>Submit Report</span>
                </Link>
              </div>
            </div>

            <div className="hero-banner-metrics">
              <div className="hero-metric-item">
                <span className="metric-val">{validParks.length}</span>
                <span className="metric-lbl">Assigned Parks</span>
              </div>
              <div className="hero-metric-divider"></div>
              <div className="hero-metric-item">
                <span className="metric-val">{stats.pending}</span>
                <span className="metric-lbl">Active Tasks</span>
              </div>
              <div className="hero-metric-divider"></div>
              <div className="hero-metric-item">
                <span className="metric-val">{materials.filter(m => m.status === 'Pending').length}</span>
                <span className="metric-lbl">Pending Materials</span>
              </div>
              <div className="hero-metric-divider"></div>
              <div className="hero-metric-item">
                <span className="metric-val text-emerald">{completionRate}%</span>
                <span className="metric-lbl">Completion Rate</span>
              </div>
              <div className="hero-metric-divider"></div>
              <div className="hero-date-badge">
                <CalendarDays size={20} className="date-icon" />
                <div>
                  <div className="date-num">{String(dayNum).padStart(2, '0')} {monthYear}</div>
                  <div className="date-day">{weekday}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metric Stats Grid */}
          <div className="contractor-stats-grid">
            <div className="contractor-stat-card amber" onClick={() => navigate('/contractor/tasks')}>
              <div className="stat-card-top">
                <div className="stat-icon amber">
                  <ClipboardList size={24} />
                </div>
                <span className="stat-tag amber">Active Work</span>
              </div>
              <div className="stat-card-bottom">
                <h3>{loading ? '—' : String(stats.pending).padStart(2, '0')}</h3>
                <p>Pending Tasks</p>
              </div>
            </div>
            
            <div className="contractor-stat-card blue" onClick={() => navigate('/contractor/tasks')}>
              <div className="stat-card-top">
                <div className="stat-icon blue">
                  <Calendar size={24} />
                </div>
                <span className="stat-tag blue">Scheduled</span>
              </div>
              <div className="stat-card-bottom">
                <h3>{loading ? '—' : String(stats.today).padStart(2, '0')}</h3>
                <p>Tasks Today</p>
              </div>
            </div>

            <div className="contractor-stat-card green" onClick={() => navigate('/contractor/completed')}>
              <div className="stat-card-top">
                <div className="stat-icon green">
                  <CheckCircle size={24} />
                </div>
                <span className="stat-tag green">Verified</span>
              </div>
              <div className="stat-card-bottom">
                <h3>{loading ? '—' : String(stats.completed).padStart(2, '0')}</h3>
                <p>Completed Tasks</p>
              </div>
            </div>

            <div className="contractor-stat-card rose" onClick={() => navigate('/contractor/tasks')}>
              <div className="stat-card-top">
                <div className="stat-icon rose">
                  <RotateCcw size={24} />
                </div>
                <span className="stat-tag rose">Needs Action</span>
              </div>
              <div className="stat-card-bottom">
                <h3>{loading ? '—' : String(stats.rework).padStart(2, '0')}</h3>
                <p>Rework Requests</p>
              </div>
            </div>
          </div>

          {/* Assigned Parks Map Section */}
          <div className="contractor-card map-card">
            <div className="card-header flex-between">
              <div className="card-title-group">
                <div className="card-icon-box green">
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className="card-title">Assigned Parks Map</h3>
                  <p className="card-subtitle">Visual overview of your assigned park locations and active maintenance workloads</p>
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="map-filter-pills">
                {Object.entries(mapStatusCounts).map(([status, count]) => (
                  <button
                    key={status}
                    className={`map-filter-pill ${selectedMapStatus === status ? 'active' : ''}`}
                    data-status={status}
                    onClick={() => setSelectedMapStatus(status)}
                  >
                    {status} <span className="pill-count">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {loadingParks ? (
              <div className="map-loading" style={{ height: '380px' }}>
                <div className="map-spinner"></div>
                <p>Loading assigned park map locations...</p>
              </div>
            ) : validParks.length === 0 ? (
              <div className="map-empty" style={{ padding: '3.5rem 1rem' }}>
                <AlertCircle size={44} />
                <h3>No assigned parks found</h3>
                <p>You have no parks assigned to your account yet. Contact your administrator to assign parks.</p>
              </div>
            ) : (
              <div className="map-layout" style={{ height: '460px' }}>
                <div className="map-wrapper">
                  <MapContainer 
                    center={mapCenter} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                    ref={mapRef}
                  >
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
                            <p className="popup-address">{park.address || park.parkCode || 'No address'}</p>
                            <div className="popup-stats">
                              <div className="popup-stat">
                                <span className="popup-stat-num">{getTaskCountForPark(park._id)}</span>
                                <span className="popup-stat-label">Total Tasks</span>
                              </div>
                              <div className="popup-stat">
                                <span className="popup-stat-num pending">{getPendingCountForPark(park._id)}</span>
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

                {/* Assigned Parks Sidebar List */}
                <div className="map-park-list">
                  <div className="park-list-header">
                    <h4>Assigned Parks ({filteredParks.length})</h4>
                    <span className="park-list-hint">Click park to view</span>
                  </div>
                  <div className="park-list-scroll">
                    {filteredParks.map(park => {
                      const isSelected = selectedParkId === park._id;
                      return (
                        <div 
                          key={park._id} 
                          className={`map-park-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedParkId(park._id)}
                        >
                          <div className="map-park-dot" style={{ background: statusColors[park.status] || '#6b7280' }}></div>
                          <div className="map-park-info">
                            <h4>{park.name}</h4>
                            <p>{park.address || park.parkCode || 'Assigned Park'}</p>
                            <div className="map-park-meta">
                              <span className={`map-park-status map-park-status--${park.status?.replace(' ', '-').toLowerCase()}`}>
                                {park.status || 'Active'}
                              </span>
                              <span className="map-park-tasks">
                                <ClipboardList size={12} /> {getPendingCountForPark(park._id)} pending
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Operational Work & Materials Hub (2 Columns) */}
          <div className="grid-2-col">
            
            {/* Urgent Active Tasks List */}
            <div className="contractor-card">
              <div className="card-header flex-between">
                <div className="card-title-group">
                  <div className="card-icon-box amber">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <h3 className="card-title">Urgent Tasks & Maintenance Jobs</h3>
                    <p className="card-subtitle">Immediate attention items assigned to your team</p>
                  </div>
                </div>
                <Link to="/contractor/tasks" className="card-action-link">
                  View All Tasks <ChevronRight size={16} />
                </Link>
              </div>

              <div className="tasks-list-container">
                {loading ? (
                  <p className="loading-text">Loading active tasks...</p>
                ) : pendingTasksList.length === 0 ? (
                  <div className="empty-state-box">
                    <CheckCircle size={36} className="text-emerald" />
                    <h4>All caught up!</h4>
                    <p>No urgent pending tasks assigned at the moment.</p>
                  </div>
                ) : (
                  <div className="tasks-table-wrapper">
                    <table className="mini-tasks-table">
                      <thead>
                        <tr>
                          <th>Task Ref</th>
                          <th>Category & Park</th>
                          <th>SLA Status</th>
                          <th>Priority</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingTasksList.map(task => (
                          <tr key={task._id}>
                            <td>
                              <span className="task-code">#{task.complaintNumber || task._id.substring(0, 6)}</span>
                            </td>
                            <td>
                              <div className="task-cat-name">{task.category || 'General Maintenance'}</div>
                              <div className="task-park-sub">{task.parkName || 'Assigned Park'}</div>
                            </td>
                            <td>
                              <span className={`sla-badge ${task.slaStatus?.toLowerCase().replace(' ', '-') || 'on-time'}`}>
                                {task.slaStatus || 'On Time'}
                              </span>
                            </td>
                            <td>
                              <span className={`priority-pill ${task.priority?.toLowerCase() || 'medium'}`}>
                                {task.priority || 'Medium'}
                              </span>
                            </td>
                            <td>
                              <Link to={`/contractor/task/${task._id}`} className="btn-mini-action">
                                View Details
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Material Requests Status Tracker */}
            <div className="contractor-card">
              <div className="card-header flex-between">
                <div className="card-title-group">
                  <div className="card-icon-box blue">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="card-title">Material & Tool Requests</h3>
                    <p className="card-subtitle">Track requested items and equipment supply</p>
                  </div>
                </div>
                <Link to="/contractor/materials" className="card-action-link">
                  Request New <Plus size={16} />
                </Link>
              </div>

              <div className="materials-list-container">
                {materials.length === 0 ? (
                  <div className="empty-state-box">
                    <Package size={36} className="text-slate" />
                    <h4>No Material Requests</h4>
                    <p>You haven't requested any materials yet.</p>
                    <Link to="/contractor/materials" className="btn-secondary-sm" style={{ marginTop: '0.75rem' }}>
                      Request Material
                    </Link>
                  </div>
                ) : (
                  <div className="materials-mini-list">
                    {materials.slice(0, 4).map(mat => (
                      <div key={mat._id} className="material-item-card">
                        <div className="mat-icon">
                          <Package size={18} />
                        </div>
                        <div className="mat-details">
                          <div className="mat-name">{mat.materialName} ({mat.quantity} {mat.unit})</div>
                          <div className="mat-sub">{mat.parkName || 'General Request'} • {new Date(mat.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                        </div>
                        <span className={`mat-status-tag ${mat.status?.toLowerCase() || 'pending'}`}>
                          {mat.status || 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Analytics & SLA Performance Hub (3 Columns) */}
          <div className="grid-3-col" style={{ marginTop: '1.5rem' }}>
            
            {/* Task Velocity Bar Chart */}
            <div className="contractor-card">
              <div className="card-header">
                <h3 className="card-title">7-Day Completion Velocity</h3>
                <p className="card-subtitle">Daily breakdown of completed vs pending jobs</p>
              </div>
              <div style={{ height: '230px', marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 11}} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={12} />
                    <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={12} />
                    <Bar dataKey="rejected" name="Rework" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Task Breakdown Pie Chart */}
            <div className="contractor-card">
              <div className="card-header">
                <h3 className="card-title">Overall Work Breakdown</h3>
                <p className="card-subtitle">Current status proportion of all tasks</p>
              </div>
              <div style={{ height: '170px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0.5rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="pie-legend-list">
                {pieData.map(item => (
                  <div key={item.name} className="pie-legend-item">
                    <div className="pie-legend-label">
                      <span className="pie-dot" style={{ backgroundColor: item.color }}></span>
                      <span>{item.name}</span>
                    </div>
                    <span className="pie-val">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SLA Compliance & Recent Logs */}
            <div className="contractor-card">
              <div className="card-header">
                <h3 className="card-title">SLA Compliance & Logs</h3>
                <p className="card-subtitle">Active deadline status of assigned complaints</p>
              </div>

              <div className="sla-summary-list" style={{ marginTop: '0.75rem' }}>
                <div className="sla-item">
                  <div className="sla-item-icon green">
                    <CheckCircle size={16} />
                  </div>
                  <div className="sla-item-info">
                    <div className="sla-title">On Time Tasks</div>
                    <div className="sla-desc">{slaStats.onTime} active task(s) within SLA</div>
                  </div>
                  <span className="sla-count-pill green">{slaStats.onTime}</span>
                </div>

                <div className="sla-item">
                  <div className="sla-item-icon amber">
                    <Bell size={16} />
                  </div>
                  <div className="sla-item-info">
                    <div className="sla-title">Due Soon Tasks</div>
                    <div className="sla-desc">{slaStats.dueSoon} task(s) expiring within 24 hours</div>
                  </div>
                  <span className="sla-count-pill amber">{slaStats.dueSoon}</span>
                </div>

                <div className="sla-item">
                  <div className="sla-item-icon rose">
                    <Activity size={16} />
                  </div>
                  <div className="sla-item-info">
                    <div className="sla-title">Overdue Tasks</div>
                    <div className="sla-desc">{slaStats.overdue} task(s) past SLA resolution deadline</div>
                  </div>
                  <span className="sla-count-pill rose">{slaStats.overdue}</span>
                </div>
              </div>
            </div>

          </div>

        </main>
        
              </div>
    </div>
  );
};

export default ContractorDashboard;

