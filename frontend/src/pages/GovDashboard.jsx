import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ClipboardList, 
  Calendar, 
  CheckCircle, 
  RotateCcw, 
  Bell, 
  Activity, 
  MapPin, 
  AlertCircle, 
  Wrench, 
  ChevronRight, 
  ShieldCheck, 
  Package, 
  Plus,
  TreePine,
  Search
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell 
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ContractorDashboard.css';
import './GovDashboard.css';

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

const GovDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('govUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [complaints, setComplaints] = useState([]);
  const [parks, setParks] = useState([]);
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
    overdue: 0
  });

  const [pieData, setPieData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchParks = async () => {
      try {
        setLoadingParks(true);
        const res = await fetch(`${API_BASE}/parks`);
        const data = await res.json();
        setParks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch parks:', err);
      } finally {
        setLoadingParks(false);
      }
    };

    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/complaints?officialId=${user._id || user.id}`);
        const data = await res.json();

        // Also fetch all complaints as fallback/context
        const allRes = await fetch(`${API_BASE}/complaints`);
        const allData = await allRes.json();

        const source = Array.isArray(data) && data.length > 0 ? data : (Array.isArray(allData) ? allData : []);
        setComplaints(source);

        // Stats calculations
        const todayStr = new Date().toDateString();
        const pending = source.filter(c =>
          ['New', 'Assigned', 'Started', 'In Progress', 'Waiting for Parts', 'Inspection Pending', 'Completed - Waiting for Admin Review'].includes(c.status)
        ).length;

        const todayCount = source.filter(c => {
          const d = new Date(c.createdAt || c.updatedAt);
          return d.toDateString() === todayStr;
        }).length;

        const completed = source.filter(c =>
          ['Completed', 'Verified', 'Closed', 'Inspection Approved'].includes(c.status)
        ).length;

        const rework = source.filter(c => ['Returned by Admin', 'Rework Required', 'Rejected'].includes(c.status)).length;

        setStats({ pending, today: todayCount, completed, rework });

        // SLA calculation
        let onTime = 0, dueSoon = 0, overdue = 0;
        source.forEach(c => {
          if (!['Completed', 'Verified', 'Closed', 'Inspection Approved'].includes(c.status)) {
            if (c.slaStatus === 'On Time') onTime++;
            else if (c.slaStatus === 'Due Soon') dueSoon++;
            else if (c.slaStatus === 'Overdue') overdue++;
            else onTime++;
          }
        });
        setSlaStats({ onTime, dueSoon, overdue });

        // Pie chart breakdown
        const pie = [];
        if (completed > 0) pie.push({ name: 'Verified/Completed', value: completed, color: '#10b981' });
        if (pending > 0) pie.push({ name: 'Pending Inspection', value: pending, color: '#f59e0b' });
        if (rework > 0) pie.push({ name: 'Rework/Returned', value: rework, color: '#ef4444' });

        if (pie.length === 0) {
          pie.push({ name: 'No Active Tasks', value: 1, color: '#cbd5e1' });
        }
        setPieData(pie);

        // Recent activities
        const sorted = [...source]
          .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
          .slice(0, 5);

        setRecentActivities(sorted.map(c => ({
          id: c._id,
          text: `Complaint #${c.complaintNumber} — ${c.category} at ${c.parkName || 'Park'} [${c.status}]`,
          time: new Date(c.updatedAt || c.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        })));

      } catch (err) {
        console.error('Failed to fetch complaints:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchParks();
    fetchComplaints();
  }, [user]);

  // 7-day velocity bar chart
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

      const completed = dayComplaints.filter(c => ['Completed', 'Verified', 'Closed', 'Inspection Approved'].includes(c.status)).length;
      const pending = dayComplaints.filter(c => ['New', 'Assigned', 'In Progress', 'Inspection Pending', 'Completed - Waiting for Admin Review'].includes(c.status)).length;
      const rework = dayComplaints.filter(c => ['Returned by Admin', 'Rework Required', 'Rejected'].includes(c.status)).length;

      days.push({ date: label, completed, pending, rework });
    }
    return days;
  })();

  // Filter parks for official
  const assignedParkIds = new Set([
    ...(user?.assignedParks || []).map(id => typeof id === 'object' ? id._id || id.id : id),
    ...(user?.park ? [typeof user.park === 'object' ? user.park._id || user.park.id : user.park] : []),
    ...complaints.map(c => c.park?._id || c.park).filter(Boolean)
  ].map(id => String(id)));

  const assignedParksOnly = parks.filter(p => {
    if (assignedParkIds.size > 0) {
      return assignedParkIds.has(String(p._id));
    }
    return true;
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
    const isCompleted = ['Completed', 'Verified', 'Closed', 'Inspection Approved'].includes(t.status);
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

  const pendingComplaintsList = complaints.filter(c =>
    !['Completed', 'Verified', 'Closed', 'Inspection Approved'].includes(c.status)
  ).slice(0, 5);

  if (!user) return null;

  return (
    <div className="gov-dashboard-main-container">
      
      {/* Welcome Hero Banner */}
      <div className="contractor-hero-banner gov-hero-banner">
        <div className="hero-banner-main">
          <div className="hero-greeting">
            <h2>Welcome back, <span className="highlight">{user.name}!</span></h2>
            <p>Overview of assigned parks, active inspections, and complaint resolutions.</p>
          </div>
        </div>
      </div>

      {/* Key Metric Stats Grid (4 Cards) */}
      <div className="contractor-stats-grid">
        <div className="contractor-stat-card amber" onClick={() => navigate('/gov-dashboard/my-inspections')}>
          <div className="stat-card-top">
            <div className="stat-icon amber">
              <ClipboardList size={24} />
            </div>
            <span className="stat-tag amber">Active Work</span>
          </div>
          <div className="stat-card-bottom">
            <h3>{loading ? '—' : String(stats.pending).padStart(2, '0')}</h3>
            <p>Pending Inspections</p>
          </div>
        </div>
        
        <div className="contractor-stat-card blue" onClick={() => navigate('/gov-dashboard/schedule')}>
          <div className="stat-card-top">
            <div className="stat-icon blue">
              <Calendar size={24} />
            </div>
            <span className="stat-tag blue">Scheduled</span>
          </div>
          <div className="stat-card-bottom">
            <h3>{loading ? '—' : String(stats.today).padStart(2, '0')}</h3>
            <p>Complaints Today</p>
          </div>
        </div>

        <div className="contractor-stat-card green" onClick={() => navigate('/gov-dashboard/analytics')}>
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

        <div className="contractor-stat-card rose" onClick={() => navigate('/gov-dashboard/complaints')}>
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
              <p className="card-subtitle">Visual overview of your assigned park locations and active inspection workloads</p>
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
            <p>You have no parks assigned to your official jurisdiction yet.</p>
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
                {filteredParks.map((park, index) => {
                  let lat = parseFloat(park.latitude);
                  let lng = parseFloat(park.longitude);
                  
                  const sameCoordIndex = filteredParks.slice(0, index).filter(p => 
                    parseFloat(p.latitude) === lat && parseFloat(p.longitude) === lng
                  ).length;
                  
                  if (sameCoordIndex > 0) {
                    const angle = (sameCoordIndex * 137.5) * (Math.PI / 180);
                    const radius = 0.003 * Math.ceil(sameCoordIndex / 3);
                    lat += Math.sin(angle) * radius;
                    lng += Math.cos(angle) * radius;
                  }
                  
                  return (
                    <Marker
                      key={park._id}
                      position={[lat, lng]}
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
                              <span className="popup-stat-label">Total Complaints</span>
                            </div>
                            <div className="popup-stat">
                              <span className="popup-stat-num pending">{getPendingCountForPark(park._id)}</span>
                              <span className="popup-stat-label">Pending</span>
                            </div>
                          </div>
                          <Link to="/gov-dashboard/complaints" className="popup-link">
                            <ClipboardList size={14} /> View Complaints
                          </Link>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
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

      {/* Operational Work & Recent Activity Hub (2 Columns) */}
      <div className="grid-2-col">
        
        {/* Urgent Inspections & Complaints Table */}
        <div className="contractor-card">
          <div className="card-header flex-between">
            <div className="card-title-group">
              <div className="card-icon-box amber">
                <Wrench size={20} />
              </div>
              <div>
                <h3 className="card-title">Urgent Complaints & Inspection Tasks</h3>
                <p className="card-subtitle">Pending verification and monitoring actions</p>
              </div>
            </div>
            <Link to="/gov-dashboard/complaints" className="card-action-link">
              View All <ChevronRight size={16} />
            </Link>
          </div>

          <div className="tasks-list-container">
            {loading ? (
              <p className="loading-text">Loading active complaints...</p>
            ) : pendingComplaintsList.length === 0 ? (
              <div className="empty-state-box">
                <CheckCircle size={36} className="text-emerald" />
                <h4>All caught up!</h4>
                <p>No urgent pending complaints requiring inspection at the moment.</p>
              </div>
            ) : (
              <div className="tasks-table-wrapper">
                <table className="mini-tasks-table">
                  <thead>
                    <tr>
                      <th>Ref #</th>
                      <th>Category & Park</th>
                      <th>SLA Status</th>
                      <th>Priority</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingComplaintsList.map(task => (
                      <tr key={task._id}>
                        <td>
                          <span className="task-code">#{task.complaintNumber || task._id.substring(0, 6)}</span>
                        </td>
                        <td>
                          <div className="task-cat-name">{task.category || 'Maintenance'}</div>
                          <div className="task-park-sub">{task.parkName || 'Park'}</div>
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
                          <Link to={`/gov-dashboard/inspection-details/${task._id}`} className="btn-mini-action">
                            Inspect
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

        {/* Recent Official Activity Timeline */}
        <div className="contractor-card">
          <div className="card-header flex-between">
            <div className="card-title-group">
              <div className="card-icon-box blue">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="card-title">Recent Inspection Activity</h3>
                <p className="card-subtitle">Latest status updates & workflow actions</p>
              </div>
            </div>
          </div>

          <div className="materials-list-container">
            {recentActivities.length === 0 ? (
              <div className="empty-state-box">
                <Activity size={36} className="text-slate" />
                <h4>No Recent Activity</h4>
                <p>No recent activity logs found for your jurisdiction.</p>
              </div>
            ) : (
              <div className="materials-mini-list">
                {recentActivities.map(act => (
                  <div key={act.id} className="material-item-card">
                    <div className="mat-icon">
                      <ShieldCheck size={18} />
                    </div>
                    <div className="mat-details">
                      <div className="mat-name">{act.text}</div>
                      <div className="mat-sub">{act.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Analytics & SLA Performance Hub (3 Columns) */}
      <div className="grid-3-col" style={{ marginTop: '1.5rem' }}>
        
        {/* 7-Day Completion Velocity Bar Chart */}
        <div className="contractor-card">
          <div className="card-header">
            <h3 className="card-title">7-Day Inspection Velocity</h3>
            <p className="card-subtitle">Daily breakdown of completed vs pending inspections</p>
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
                <Bar dataKey="rework" name="Rework" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inspection Breakdown Pie Chart */}
        <div className="contractor-card">
          <div className="card-header">
            <h3 className="card-title">Overall Status Breakdown</h3>
            <p className="card-subtitle">Current status proportion of all complaints</p>
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

        {/* SLA Compliance & Deadlines */}
        <div className="contractor-card">
          <div className="card-header">
            <h3 className="card-title">SLA Compliance & Deadlines</h3>
            <p className="card-subtitle">Active deadline status of assigned complaints</p>
          </div>

          <div className="sla-summary-list" style={{ marginTop: '0.75rem' }}>
            <div className="sla-item">
              <div className="sla-item-icon green">
                <CheckCircle size={16} />
              </div>
              <div className="sla-item-info">
                <div className="sla-title">On Time Tasks</div>
                <div className="sla-desc">{slaStats.onTime} active complaint(s) within SLA</div>
              </div>
              <span className="sla-count-pill green">{slaStats.onTime}</span>
            </div>

            <div className="sla-item">
              <div className="sla-item-icon amber">
                <Bell size={16} />
              </div>
              <div className="sla-item-info">
                <div className="sla-title">Due Soon Tasks</div>
                <div className="sla-desc">{slaStats.dueSoon} complaint(s) expiring within 24 hours</div>
              </div>
              <span className="sla-count-pill amber">{slaStats.dueSoon}</span>
            </div>

            <div className="sla-item">
              <div className="sla-item-icon rose">
                <Activity size={16} />
              </div>
              <div className="sla-item-info">
                <div className="sla-title">Overdue Tasks</div>
                <div className="sla-desc">{slaStats.overdue} complaint(s) past SLA resolution deadline</div>
              </div>
              <span className="sla-count-pill rose">{slaStats.overdue}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default GovDashboard;
