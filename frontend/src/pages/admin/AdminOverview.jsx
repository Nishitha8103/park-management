import { useState, useEffect } from 'react';
import { TreePine, Users, UserCheck, AlertTriangle, Clock, CheckCircle2, XCircle, ShieldAlert, TrendingUp, Activity } from 'lucide-react';
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

// Dark theme color constants
const DARK = {
  card: '#1E2438',
  cardHover: '#252D47',
  bg: '#151A2B',
  border: 'rgba(255,255,255,0.06)',
  textPrimary: '#F0F4FF',
  textSec: '#A8B0C8',
  textMuted: '#666E85',
  accent: '#4F6FF5',
  success: '#32C48D',
  warning: '#F5B942',
  danger: '#FF5C67',
  purple: '#8B5CF6',
};

// Custom tooltip for dark theme charts
const DarkTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#252D47',
        border: `1px solid ${DARK.border}`,
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        color: DARK.textPrimary,
        fontSize: '0.85rem'
      }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{label || payload[0].name}</p>
        <p style={{ margin: '4px 0 0 0', color: DARK.textSec }}>
          Count: <span style={{ color: DARK.accent, fontWeight: 700 }}>{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

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
  const COLORS = ['#4F6FF5', '#32C48D', '#F5B942', '#FF5C67', '#8B5CF6', '#f43f5e', '#6C7CFF'];
  const STATUS_COLORS = {
    'New': '#F5B942',
    'Assigned': '#4F6FF5',
    'In Progress': '#8B5CF6',
    'Completed': '#32C48D',
    'Closed': '#14b8a6',
    'Rejected': '#FF5C67'
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

  const kpiCards = [
    { label: 'Total Parks', value: stats.totalParks, icon: <TreePine size={22} />, color: DARK.success, bgTint: 'rgba(50,196,141,0.12)' },
    { label: 'Contractors', value: stats.totalContractors, icon: <Users size={22} />, color: DARK.accent, bgTint: 'rgba(79,111,245,0.12)' },
    { label: 'Gov Officials', value: stats.totalOfficials, icon: <UserCheck size={22} />, color: DARK.purple, bgTint: 'rgba(139,92,246,0.12)' },
    { label: 'Total Complaints', value: stats.totalComplaints, icon: <AlertTriangle size={22} />, color: DARK.warning, bgTint: 'rgba(245,185,66,0.12)' },
  ];

  const slaCards = [
    { label: 'On Time', value: slaStats.onTime, color: DARK.success, bgTint: 'rgba(50,196,141,0.1)' },
    { label: 'Due Soon', value: slaStats.dueSoon, color: DARK.warning, bgTint: 'rgba(245,185,66,0.1)' },
    { label: 'Overdue', value: slaStats.overdue, color: DARK.danger, bgTint: 'rgba(255,92,103,0.1)' },
    { label: 'SLA Compliance Rate', value: `${slaStats.complianceRate}%`, color: DARK.accent, bgTint: 'rgba(79,111,245,0.1)', isRate: true },
  ];

  const renderDarkLegend = (props) => {
    const { payload } = props;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', paddingTop: '8px' }}>
        {payload.map((entry, index) => (
          <div key={`legend-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: DARK.textSec }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color }} />
            {entry.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '0.5rem', fontFamily: "'Inter', sans-serif" }}>
      {/* Dashboard Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ color: DARK.textPrimary, margin: 0, fontWeight: 700, fontSize: '1.5rem' }}>Dashboard</h2>
        <p style={{ color: DARK.textMuted, margin: '4px 0 0 0', fontSize: '0.88rem' }}>Real-time overview of parks, complaints, maintenance and operations</p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {kpiCards.map((card, i) => (
          <div key={i} style={{
            background: DARK.card,
            borderRadius: '14px',
            padding: '1.25rem 1.35rem',
            border: `1px solid ${DARK.border}`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'; }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: DARK.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</span>
              <h3 style={{ fontSize: '2rem', color: DARK.textPrimary, margin: '4px 0 0 0', fontWeight: 800 }}>{card.value}</h3>
            </div>
            <div style={{
              background: card.bgTint,
              padding: '12px',
              borderRadius: '12px',
              color: card.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* SLA Overview Section */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.85rem' }}>
          <Activity size={18} color={DARK.accent} />
          <h3 style={{ color: DARK.textPrimary, margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>SLA Overview</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
          {slaCards.map((card, i) => (
            <div key={i} style={{
              background: DARK.card,
              borderRadius: '14px',
              padding: '1.1rem 1.25rem',
              border: `1px solid ${DARK.border}`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              borderLeft: `3px solid ${card.color}`,
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span style={{ fontSize: '0.78rem', color: DARK.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</span>
              <h3 style={{ fontSize: card.isRate ? '1.8rem' : '1.5rem', color: card.color, margin: '4px 0 0 0', fontWeight: 800 }}>{card.value}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Map Section */}
      <div style={{
        background: DARK.card,
        borderRadius: '14px',
        padding: '1.35rem',
        border: `1px solid ${DARK.border}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        marginBottom: '1.75rem'
      }}>
        <h3 style={{ color: DARK.textPrimary, marginTop: 0, marginBottom: '1rem', fontSize: '1.05rem', fontWeight: 700 }}>Park Health & Live Issues Map</h3>
        <div style={{ height: '400px', width: '100%', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${DARK.border}` }}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: DARK.textMuted, background: DARK.bg }}>Loading Map Data...</div>
          ) : (
            <MapContainer center={[12.9716, 77.5946]} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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

      {/* Analytics Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        
        {/* Complaints by Category Chart */}
        <div style={{
          background: DARK.card,
          borderRadius: '14px',
          padding: '1.35rem',
          border: `1px solid ${DARK.border}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}>
          <h3 style={{ color: DARK.textPrimary, marginTop: 0, marginBottom: '1rem', fontSize: '1.05rem', fontWeight: 700 }}>Complaints by Category</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: DARK.textMuted }} angle={-45} textAnchor="end" height={60} axisLine={{ stroke: DARK.border }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: DARK.textMuted }} axisLine={{ stroke: DARK.border }} tickLine={false} />
                <RechartsTooltip content={<DarkTooltip />} />
                <Bar dataKey="value" fill={DARK.accent} radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaints by Status Chart */}
        <div style={{
          background: DARK.card,
          borderRadius: '14px',
          padding: '1.35rem',
          border: `1px solid ${DARK.border}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}>
          <h3 style={{ color: DARK.textPrimary, marginTop: 0, marginBottom: '1rem', fontSize: '1.05rem', fontWeight: 700 }}>Complaint Status Breakdown</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<DarkTooltip />} />
                <Legend content={renderDarkLegend} verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div style={{
        background: DARK.card,
        borderRadius: '14px',
        padding: '1.35rem',
        border: `1px solid ${DARK.border}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      }}>
        <h3 style={{ color: DARK.textPrimary, marginTop: 0, marginBottom: '1rem', fontSize: '1.05rem', fontWeight: 700 }}>Recent Complaints Log</h3>
        {recentComplaints.length === 0 ? (
          <p style={{ color: DARK.textMuted, fontStyle: 'italic' }}>No complaints submitted yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${DARK.border}` }}>
                  <th style={{ padding: '10px 12px', color: DARK.textMuted, fontWeight: 700, fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Complaint #</th>
                  <th style={{ padding: '10px 12px', color: DARK.textMuted, fontWeight: 700, fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Park</th>
                  <th style={{ padding: '10px 12px', color: DARK.textMuted, fontWeight: 700, fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                  <th style={{ padding: '10px 12px', color: DARK.textMuted, fontWeight: 700, fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</th>
                  <th style={{ padding: '10px 12px', color: DARK.textMuted, fontWeight: 700, fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map(c => (
                  <tr key={c._id} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)`, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,111,245,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px', fontWeight: 600, color: DARK.accent }}>{c.complaintNumber}</td>
                    <td style={{ padding: '12px', color: DARK.textSec }}>{c.parkName || c.park?.name || 'N/A'}</td>
                    <td style={{ padding: '12px', color: DARK.textSec }}>{c.category}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '100px', fontSize: '0.74rem', fontWeight: 700,
                        background: c.priority === 'Urgent' ? 'rgba(255,92,103,0.15)' : c.priority === 'High' ? 'rgba(245,185,66,0.15)' : 'rgba(79,111,245,0.12)',
                        color: c.priority === 'Urgent' ? DARK.danger : c.priority === 'High' ? DARK.warning : DARK.accent
                      }}>
                        {c.priority}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '100px', fontSize: '0.74rem', fontWeight: 700,
                        background: c.status === 'Completed' || c.status === 'Verified' ? 'rgba(50,196,141,0.15)' : c.status === 'New' ? 'rgba(245,185,66,0.15)' : 'rgba(255,255,255,0.06)',
                        color: c.status === 'Completed' || c.status === 'Verified' ? DARK.success : c.status === 'New' ? DARK.warning : DARK.textSec
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
