import { useState, useEffect } from 'react';
import { TreePine, Users, UserCheck, AlertTriangle, Clock, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Red Icon for Parks with issues
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalParks: 0,
    totalContractors: 0,
    totalOfficials: 0,
    totalComplaints: 0,
    pendingComplaints: 0,
    completedComplaints: 0,
    rejectedComplaints: 0,
    closedComplaints: 0
  });

  const [slaStats, setSlaStats] = useState({
    onTime: 0,
    dueSoon: 0,
    overdue: 0,
    resolvedWithinSla: 0,
    resolvedAfterSla: 0,
    complianceRate: 0
  });

  const [recentComplaints, setRecentComplaints] = useState([]);
  const [parksData, setParksData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Analytics Data States
  const [categoryData, setCategoryData] = useState([]);
  const [statusData, setStatusData] = useState([]);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#f43f5e', '#8b5cf6'];
  const STATUS_COLORS = {
    'New': '#facc15',
    'Assigned': '#3b82f6',
    'In Progress': '#8b5cf6',
    'Completed': '#22c55e',
    'Closed': '#14b8a6',
    'Rejected': '#ef4444'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
        const authConfig = { headers: { Authorization: `Bearer ${token}` } };
        
        const [parksRes, contractorsRes, complaintsRes, officialsRes] = await Promise.all([
          axios.get('/api/parks').catch(() => ({ data: [] })),
          axios.get('/api/contractors', authConfig).catch(() => ({ data: [] })),
          axios.get('/api/complaints').catch(() => ({ data: [] })),
          axios.get('/api/auth/users?role=official').catch(() => ({ data: [] }))
        ]);

        const parks = parksRes.data || [];
        const contractors = contractorsRes.data || [];
        const complaints = complaintsRes.data || [];
        const officials = officialsRes.data || [];

        // Prepare Map Data
        const mappedParks = parks.map(p => {
           const parkComplaints = complaints.filter(c => 
              (c.park?._id === p._id || c.park === p._id) && 
              !['Closed', 'Verified'].includes(c.status)
           );
           
           // Generate random mock offset around Bangalore (12.9716, 77.5946) if lat/lng missing
           const lat = parseFloat(p.latitude) || (12.9716 + (Math.random() - 0.5) * 0.1);
           const lng = parseFloat(p.longitude) || (77.5946 + (Math.random() - 0.5) * 0.1);
           
           return {
             ...p,
             lat,
             lng,
             activeComplaints: parkComplaints.length,
             hasIssues: parkComplaints.length > 0
           };
        });
        setParksData(mappedParks);

        // Prepare Category Chart Data
        const categoryCounts = {};
        complaints.forEach(c => {
           const cat = c.category || 'Other';
           categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        setCategoryData(Object.keys(categoryCounts).map(key => ({ name: key, value: categoryCounts[key] })));

        // Prepare Status Chart Data
        const statusCounts = {};
        complaints.forEach(c => {
           let stat = c.status;
           if (['Inspection Pending', 'Completed - Waiting for Admin Review'].includes(stat)) stat = 'Completed';
           if (['Returned by Admin', 'Rework Required'].includes(stat)) stat = 'Rejected';
           statusCounts[stat] = (statusCounts[stat] || 0) + 1;
        });
        setStatusData(Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] })));

        setRecentComplaints(complaints.slice(0, 5));

        setStats({
          totalParks: parks.length,
          totalContractors: contractors.length,
          totalOfficials: officials.length,
          totalComplaints: complaints.length,
          pendingComplaints: complaints.filter(c => ['New', 'Assigned', 'In Progress'].includes(c.status)).length,
          completedComplaints: complaints.filter(c => c.status === 'Completed').length,
          rejectedComplaints: complaints.filter(c => c.status === 'Rejected').length,
          closedComplaints: complaints.filter(c => ['Closed', 'Verified'].includes(c.status)).length
        });
        // Calculate SLA Stats
        let onTime = 0, dueSoon = 0, overdue = 0, resolvedWithin = 0, resolvedAfter = 0;
        complaints.forEach(c => {
          if (c.slaStatus === 'On Time') onTime++;
          else if (c.slaStatus === 'Due Soon') dueSoon++;
          else if (c.slaStatus === 'Overdue') overdue++;
          else if (c.slaStatus === 'Resolved Within SLA') resolvedWithin++;
          else if (c.slaStatus === 'Resolved After SLA') resolvedAfter++;
        });
        
        const totalResolved = resolvedWithin + resolvedAfter;
        const complianceRate = totalResolved > 0 ? Math.round((resolvedWithin / totalResolved) * 100) : 0;

        setSlaStats({ onTime, dueSoon, overdue, resolvedWithinSla: resolvedWithin, resolvedAfterSla: resolvedAfter, complianceRate });

      } catch (error) {
        console.error('Error loading dashboard statistics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="admin-panel" style={{ padding: '1rem' }}>
      <div className="admin-panel-header" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#0f2d52', margin: 0, fontWeight: 700 }}>System Overview Dashboard</h2>
        <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Real-time statistics, geographical mapping, and analytics</p>
      </div>

      {/* Dashboard Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #16a34a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Parks</span>
              <h3 style={{ fontSize: '1.8rem', color: '#0f2d52', margin: '0.2rem 0 0 0' }}>{stats.totalParks}</h3>
            </div>
            <div style={{ background: '#dcfce7', padding: '10px', borderRadius: '50%', color: '#16a34a' }}>
              <TreePine size={24} />
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #2563eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Contractors</span>
              <h3 style={{ fontSize: '1.8rem', color: '#0f2d52', margin: '0.2rem 0 0 0' }}>{stats.totalContractors}</h3>
            </div>
            <div style={{ background: '#dbeafe', padding: '10px', borderRadius: '50%', color: '#2563eb' }}>
              <Users size={24} />
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #9333ea' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Gov Officials</span>
              <h3 style={{ fontSize: '1.8rem', color: '#0f2d52', margin: '0.2rem 0 0 0' }}>{stats.totalOfficials}</h3>
            </div>
            <div style={{ background: '#f3e8ff', padding: '10px', borderRadius: '50%', color: '#9333ea' }}>
              <UserCheck size={24} />
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #eab308' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Complaints</span>
              <h3 style={{ fontSize: '1.8rem', color: '#0f2d52', margin: '0.2rem 0 0 0' }}>{stats.totalComplaints}</h3>
            </div>
            <div style={{ background: '#fef9c3', padding: '10px', borderRadius: '50%', color: '#ca8a04' }}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* SLA Overview Section */}
      <h3 style={{ color: '#0f2d52', marginTop: '1rem', marginBottom: '1rem', fontSize: '1.2rem' }}>Service Level Agreement (SLA) Overview</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>On Time</span>
          <h3 style={{ fontSize: '1.6rem', color: '#10b981', margin: '0.2rem 0 0 0' }}>{slaStats.onTime}</h3>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #eab308' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Due Soon</span>
          <h3 style={{ fontSize: '1.6rem', color: '#eab308', margin: '0.2rem 0 0 0' }}>{slaStats.dueSoon}</h3>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Overdue</span>
          <h3 style={{ fontSize: '1.6rem', color: '#ef4444', margin: '0.2rem 0 0 0' }}>{slaStats.overdue}</h3>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>SLA Compliance Rate</span>
          <h3 style={{ fontSize: '1.6rem', color: '#3b82f6', margin: '0.2rem 0 0 0' }}>{slaStats.complianceRate}%</h3>
        </div>
      </div>

      {/* Main Content Grid: Maps and Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Geographic Map Section */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#0f2d52', marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem' }}>Park Health & Live Issues Map</h3>
          <div style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            {loading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Loading Map Data...</div>
            ) : (
              <MapContainer center={[12.9716, 77.5946]} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
                />
                {parksData.map((park) => (
                  <Marker 
                    key={park._id} 
                    position={[park.lat, park.lng]}
                    icon={park.hasIssues ? redIcon : DefaultIcon}
                  >
                    <Popup>
                      <div style={{ minWidth: '150px' }}>
                        <h4 style={{ margin: '0 0 5px 0', color: '#0f172a' }}>{park.name}</h4>
                        <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#64748b' }}>Code: {park.parkCode}</p>
                        {park.hasIssues ? (
                          <div style={{ padding: '4px 8px', background: '#fee2e2', color: '#ef4444', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {park.activeComplaints} Active Issue(s)
                          </div>
                        ) : (
                          <div style={{ padding: '4px 8px', background: '#dcfce7', color: '#15803d', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            Healthy (No issues)
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </div>

      </div>

      {/* Analytics Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Complaints by Category Chart */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#0f2d52', marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem' }}>Complaints by Category</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{fontSize: 12}} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaints by Status Chart */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#0f2d52', marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem' }}>Complaint Status Breakdown</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ color: '#0f2d52', marginTop: 0, marginBottom: '1rem', fontSize: '1.2rem' }}>Recent Complaints Log</h3>
        {recentComplaints.length === 0 ? (
          <p style={{ color: '#64748b', fontStyle: 'italic' }}>No complaints submitted yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '8px' }}>Complaint #</th>
                  <th style={{ padding: '8px' }}>Park</th>
                  <th style={{ padding: '8px' }}>Category</th>
                  <th style={{ padding: '8px' }}>Priority</th>
                  <th style={{ padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map(c => (
                  <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 600, color: '#2563eb' }}>{c.complaintNumber}</td>
                    <td style={{ padding: '10px 8px' }}>{c.parkName || c.park?.name || 'N/A'}</td>
                    <td style={{ padding: '10px 8px' }}>{c.category}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                        background: c.priority === 'Urgent' ? '#fee2e2' : c.priority === 'High' ? '#ffedd5' : '#e0f2fe',
                        color: c.priority === 'Urgent' ? '#ef4444' : c.priority === 'High' ? '#f97316' : '#0284c7'
                      }}>
                        {c.priority}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                        background: c.status === 'Completed' || c.status === 'Verified' ? '#dcfce7' : c.status === 'New' ? '#fef9c3' : '#f1f5f9',
                        color: c.status === 'Completed' || c.status === 'Verified' ? '#15803d' : c.status === 'New' ? '#ca8a04' : '#475569'
                      }}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOverview;
