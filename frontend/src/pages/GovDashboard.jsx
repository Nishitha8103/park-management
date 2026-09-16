import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Calendar, 
  CheckCircle, 
  RotateCcw,
  Bell,
  Activity,
  CalendarDays
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell 
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './GovDashboard.css';

const API_BASE = '/api';

// Create custom inline SVG icons to ensure they render reliably everywhere
const createSvgIcon = (color) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}" stroke="white" stroke-width="1.5"/></svg>`;
  return new L.Icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

const greenIcon = createSvgIcon('#10b981');
const redIcon = createSvgIcon('#ef4444');

const GovDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Derived stats from real data
  const [stats, setStats] = useState({
    pending: 0,
    today: 0,
    completed: 0,
    rework: 0,
  });
  const [pieData, setPieData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  // Load logged-in user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('govUser');
    if (!stored) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(stored));
  }, [navigate]);

  // Fetch complaints assigned to this official once we have the user
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch complaints assigned to this official
        const res = await fetch(`${API_BASE}/complaints?officialId=${user._id || user.id}`);
        const data = await res.json();

        // Also fetch ALL complaints so we can show total overview if no assigned ones
        const allRes = await fetch(`${API_BASE}/complaints`);
        const allData = await allRes.json();

        // Fetch all parks for the map
        const parksRes = await fetch(`${API_BASE}/parks`);
        const parksData = await parksRes.json();

        // Use assigned complaints if any, else fall back to all
        const source = Array.isArray(data) && data.length > 0 ? data : (Array.isArray(allData) ? allData : []);
        setComplaints(source);
        
        if (Array.isArray(parksData)) {
          setParks(parksData);
        }

        // Calculate stats
        const todayStr = new Date().toDateString();

        const pending = source.filter(c =>
          ['New', 'Assigned', 'Started', 'In Progress', 'Waiting for Parts', 'Inspection Pending'].includes(c.status)
        ).length;

        const todayCount = source.filter(c => {
          const d = new Date(c.createdAt || c.updatedAt);
          return d.toDateString() === todayStr;
        }).length;

        const completed = source.filter(c =>
          ['Completed', 'Verified', 'Closed'].includes(c.status)
        ).length;

        const rework = source.filter(c => c.status === 'Rejected').length;

        setStats({ pending, today: todayCount, completed, rework });

        // Pie chart: group by status buckets
        const approved = source.filter(c => ['Verified', 'Closed'].includes(c.status)).length;
        const inProgress = source.filter(c =>
          ['Assigned', 'Started', 'In Progress', 'Waiting for Parts', 'Inspection Pending'].includes(c.status)
        ).length;
        const rejected = source.filter(c => c.status === 'Rejected').length;
        const newCount = source.filter(c => c.status === 'New').length;
        const total = source.length;

        const pie = [];
        if (approved > 0) pie.push({ name: 'Approved', value: approved, color: '#10b981' });
        if (inProgress > 0) pie.push({ name: 'In Progress', value: inProgress, color: '#f59e0b' });
        if (rejected > 0) pie.push({ name: 'Rejected', value: rejected, color: '#ef4444' });
        if (newCount > 0) pie.push({ name: 'New', value: newCount, color: '#3b82f6' });

        // If no data at all, show placeholder zeros
        if (pie.length === 0) {
          pie.push({ name: 'No Data', value: 1, color: '#e2e8f0' });
        }

        setPieData(pie);

        // Recent activities: last 5 updated complaints
        const sorted = [...source]
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 5);

        setRecentActivities(sorted.map(c => ({
          id: c._id,
          text: `Complaint #${c.complaintNumber} — ${c.category} at ${c.parkName || 'Unknown Park'} [${c.status}]`,
          time: new Date(c.updatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        })));
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Build line chart data from last 7 days of complaints
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

      const completed = dayComplaints.filter(c => ['Completed', 'Verified', 'Closed'].includes(c.status)).length;
      const pending = dayComplaints.filter(c => ['New', 'Assigned', 'In Progress'].includes(c.status)).length;
      const rejected = dayComplaints.filter(c => c.status === 'Rejected').length;

      days.push({ date: label, completed, pending, rejected });
    }
    return days;
  })();

  // Today's date display
  const now = new Date();
  const dayNum = now.getDate();
  const monthYear = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const weekday = now.toLocaleDateString('en-IN', { weekday: 'long' });

  const totalPie = pieData.reduce((sum, d) => sum + (d.name === 'No Data' ? 0 : d.value), 0);

  const getParkHealth = (parkId) => {
    const parkComplaints = complaints.filter(c => c.park && (c.park._id === parkId || c.park === parkId));
    const activeComplaints = parkComplaints.filter(c => ['New', 'Assigned', 'Started', 'In Progress', 'Waiting for Parts', 'Inspection Pending'].includes(c.status));
    return activeComplaints.length > 0 ? 'red' : 'green';
  };

  const mapCenter = [12.9716, 77.5946]; // Default to Bangalore coordinates

  if (!user) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 'bold' }}>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header flex justify-between items-center">
        <div>
          <h1 className="dashboard-title">Welcome back,<br/><span className="text-primary font-bold">{user.name}!</span></h1>
          <p className="text-secondary">Here's what's happening today.</p>
        </div>
        <div className="dashboard-date flex items-center gap-md">
          <div className="date-icon-box">
            <CalendarDays size={24} className="text-primary" />
          </div>
          <div className="date-text">
            <span className="day">{String(dayNum).padStart(2, '0')}</span>
            <div className="month-year">
              <span>{monthYear}</span>
              <span className="text-secondary" style={{fontSize: '0.8rem'}}>{weekday}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Cards */}
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon-wrapper text-warning bg-warning-light">
            <ClipboardList size={24} />
          </div>
          <div className="stat-info">
            <h3>{loading ? '—' : String(stats.pending).padStart(2, '0')}</h3>
            <p>Pending Complaints</p>
          </div>
        </div>
        
        <div className="card stat-card">
          <div className="stat-icon-wrapper text-blue bg-blue-light">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <h3>{loading ? '—' : String(stats.today).padStart(2, '0')}</h3>
            <p>Complaints Today</p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon-wrapper text-success bg-success-light">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>{loading ? '—' : String(stats.completed).padStart(2, '0')}</h3>
            <p>Completed</p>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon-wrapper text-error bg-error-light">
            <RotateCcw size={24} />
          </div>
          <div className="stat-info">
            <h3>{loading ? '—' : String(stats.rework).padStart(2, '0')}</h3>
            <p>Rework Requests</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="card p-md">
          <h3 className="section-title">Complaint Overview <span className="text-secondary" style={{fontWeight:'normal', fontSize:'0.9rem'}}>(Last 7 Days)</span></h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lineData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={15} />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={15} />
                <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-md">
          <h3 className="section-title">Complaint Status</h3>
          <div className="pie-chart-wrapper">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
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
            
            <div className="pie-legend-custom">
              {pieData.filter(d => d.name !== 'No Data').map(item => (
                <div key={item.name} className="pie-legend-row flex justify-between items-center">
                  <div className="flex items-center gap-sm">
                    <div className="color-dot" style={{ backgroundColor: item.color }}></div>
                    <span style={{fontSize: '0.9rem', fontWeight: 500}}>{item.name}</span>
                  </div>
                  <span className="text-secondary" style={{fontSize: '0.85rem'}}>
                    {item.value} ({totalPie > 0 ? Math.round((item.value / totalPie) * 100) : 0}%)
                  </span>
                </div>
              ))}
              <div className="pie-legend-row flex justify-between items-center" style={{borderTop: '1px solid #e2e8f0', marginTop: '8px', paddingTop: '8px'}}>
                <span className="font-bold">Total</span>
                <span className="font-bold">{totalPie}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="card p-md" style={{ marginBottom: '1.5rem' }}>
        <h3 className="section-title mb-md">Interactive Parks Map</h3>
        <div className="gov-map-container" style={{ height: '450px', width: '100%' }}>
          <MapContainer center={mapCenter} zoom={11} style={{ height: '100%', width: '100%', borderRadius: '12px', zIndex: 0 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {(() => {
              // Get unique park IDs relevant to the current user's complaints
              const relevantParkIds = new Set(complaints.filter(c => c.park).map(c => typeof c.park === 'object' ? c.park._id : c.park));
              
              return parks
                .filter(p => p.latitude && p.longitude && relevantParkIds.has(p._id))
                .map((park) => {
                  let lat = parseFloat(park.latitude);
                  let lng = parseFloat(park.longitude);
                  
                  // Add a small deterministic offset if coordinates are exactly the dummy ones
                  // so the markers spread out instead of being stacked on a single pixel
                  if (Math.abs(lat - 12.9716) < 0.0001 && Math.abs(lng - 77.5946) < 0.0001) {
                    const hash = String(park._id).charCodeAt(String(park._id).length - 1) + String(park._id).charCodeAt(String(park._id).length - 2);
                    lat += ((hash % 100) - 50) * 0.005;
                    lng += (((hash * 3) % 100) - 50) * 0.005;
                  }

                  const health = getParkHealth(park._id);
                  const activeCount = complaints.filter(c => c.park && (c.park._id === park._id || c.park === park._id) && ['New', 'Assigned', 'Started', 'In Progress', 'Waiting for Parts', 'Inspection Pending'].includes(c.status)).length;
                  
                  return (
                    <Marker 
                      key={park._id} 
                      position={[lat, lng]}
                      icon={health === 'red' ? redIcon : greenIcon}
                    >
                      <Popup>
                        <div style={{ minWidth: '200px' }}>
                          <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: '#0f172a' }}>{park.name}</h4>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#64748b' }}>
                            Ward: {park.ward?.name || park.ward?.wardNumber || 'N/A'}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: health === 'red' ? '#ef4444' : '#10b981' }}></div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: health === 'red' ? '#ef4444' : '#10b981' }}>
                              {health === 'red' ? 'Needs Attention' : 'Healthy'}
                            </span>
                          </div>
                          {health === 'red' && (
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#dc2626' }}>
                              {activeCount} active complaint{activeCount !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                });
            })()}
          </MapContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bottom-grid">
        <div className="card p-md">
          <h3 className="section-title mb-md">Recent Activities</h3>
          <div className="activity-list">
            {loading ? (
              <p className="text-secondary" style={{fontSize:'0.9rem'}}>Loading...</p>
            ) : recentActivities.length === 0 ? (
              <p className="text-secondary" style={{fontSize:'0.9rem'}}>No recent activity found.</p>
            ) : (
              recentActivities.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon text-primary bg-primary-light">
                    <Activity size={16} />
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">{activity.text}</p>
                    <p className="activity-time">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="card p-md">
          <h3 className="section-title mb-md">My Complaints Summary</h3>
          <div className="activity-list">
            {[
              { label: 'New', color: '#3b82f6' },
              { label: 'In Progress', color: '#f59e0b' },
              { label: 'Completed', color: '#10b981' },
              { label: 'Rejected', color: '#ef4444' },
            ].map(s => {
              const cnt = complaints.filter(c => {
                if (s.label === 'In Progress') return ['Assigned', 'Started', 'In Progress', 'Waiting for Parts', 'Inspection Pending'].includes(c.status);
                if (s.label === 'Completed') return ['Completed', 'Verified', 'Closed'].includes(c.status);
                return c.status === s.label;
              }).length;
              return (
                <div key={s.label} className="activity-item">
                  <div className="activity-icon" style={{ color: s.color, backgroundColor: s.color + '20' }}>
                    <ClipboardList size={16} />
                  </div>
                  <div className="activity-content">
                    <p className="activity-text" style={{ fontWeight: 600 }}>{s.label}</p>
                    <p className="activity-time">{loading ? '—' : `${cnt} complaint${cnt !== 1 ? 's' : ''}`}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-md">
          <h3 className="section-title mb-md">Account Info</h3>
          <div className="activity-list">
            {[
              { label: 'Name', value: user.name },
              { label: 'Email', value: user.email },
              { label: 'Role', value: user.role },
              { label: 'Department', value: user.department || 'N/A' },
            ].map(info => (
              <div key={info.label} className="activity-item">
                <div className="activity-icon text-success bg-success-light">
                  <Bell size={16} />
                </div>
                <div className="activity-content">
                  <p className="activity-text" style={{ fontWeight: 600 }}>{info.label}</p>
                  <p className="activity-time">{info.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovDashboard;
