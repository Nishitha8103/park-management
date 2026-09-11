import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TreePine, CheckSquare, HeartPulse, MapPin, AlertCircle, ArrowRight, PlusCircle } from 'lucide-react';

const PlantingDashboard = () => {
  const [floraList, setFloraList] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('plantingUser') || localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {}
    }
    fetchData();
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const [floraRes, tasksRes] = await Promise.all([
        fetch('/api/flora', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/flora/tasks/my-tasks', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (floraRes.ok) {
        const floraData = await floraRes.json();
        setFloraList(floraData);
      }
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const healthyCount = floraList.filter(f => f.healthStatus === 'Healthy').length;
  const needsCareCount = floraList.filter(f => f.healthStatus === 'Needs Attention' || f.healthStatus === 'Critical').length;
  const pendingTasks = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Welcome Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', 
        borderRadius: '16px', 
        padding: '2rem', 
        color: 'white', 
        marginBottom: '2rem',
        boxShadow: '0 10px 15px -3px rgba(6, 95, 70, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Welcome back, {user?.name || 'Flora Caretaker'}! 🌿</h1>
            <p style={{ color: '#a7f3d0', marginTop: '0.5rem', fontSize: '0.95rem' }}>
              Flora & Botanical Maintenance Dashboard
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/planting-dashboard/inventory" style={{
              backgroundColor: 'white',
              color: '#065f46',
              padding: '0.625rem 1.25rem',
              borderRadius: '8px',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <PlusCircle size={18} /> Manage Inventory
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #d1fae5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: '500' }}>Total Flora Tracked</span>
            <TreePine size={24} color="#10b981" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#065f46', marginTop: '0.5rem' }}>
            {loading ? '...' : floraList.length}
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #d1fae5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: '500' }}>Healthy Status</span>
            <HeartPulse size={24} color="#16a34a" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#16a34a', marginTop: '0.5rem' }}>
            {loading ? '...' : healthyCount}
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #fecaca', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: '500' }}>Needs Attention</span>
            <AlertCircle size={24} color="#dc2626" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#dc2626', marginTop: '0.5rem' }}>
            {loading ? '...' : needsCareCount}
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.25rem', border: '1px solid #dbeafe', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: '500' }}>Pending Maintenance Tasks</span>
            <CheckSquare size={24} color="#2563eb" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#2563eb', marginTop: '0.5rem' }}>
            {loading ? '...' : pendingTasks}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Tasks List */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Pending Tasks Checklist</h3>
            <Link to="/planting-dashboard/tasks" style={{ color: '#059669', fontSize: '0.875rem', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0' }}>Loading tasks...</p>
          ) : tasks.filter(t => t.status !== 'Completed').length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6b7280' }}>
              <CheckSquare size={36} color="#10b981" style={{ margin: '0 auto 0.5rem', opacity: 0.8 }} />
              <p>All plant maintenance tasks are up to date!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tasks.filter(t => t.status !== 'Completed').slice(0, 4).map(task => (
                <div key={task._id} style={{ padding: '0.875rem', borderRadius: '8px', border: '1px solid #f3f4f6', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.925rem' }}>{task.taskType} - {task.flora?.species || 'Flora Item'}</div>
                    <div style={{ fontSize: '0.775rem', color: '#6b7280', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={12} /> {task.park?.name || 'Park'}
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: '600', 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '6px',
                    backgroundColor: task.priority === 'High' ? '#fef2f2' : '#f0fdf4',
                    color: task.priority === 'High' ? '#dc2626' : '#166534'
                  }}>
                    {task.priority || 'Normal'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Inventory Summary */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Flora Inventory Summary</h3>
            <Link to="/planting-dashboard/inventory" style={{ color: '#059669', fontSize: '0.875rem', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Manage Flora <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0' }}>Loading flora...</p>
          ) : floraList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#6b7280' }}>
              <TreePine size={36} color="#059669" style={{ margin: '0 auto 0.5rem', opacity: 0.8 }} />
              <p>No plants logged in inventory yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {floraList.slice(0, 4).map(item => (
                <div key={item._id} style={{ padding: '0.875rem', borderRadius: '8px', border: '1px solid #f3f4f6', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.925rem' }}>{item.species}</div>
                    <div style={{ fontSize: '0.775rem', color: '#6b7280', marginTop: '0.2rem' }}>
                      {item.type} • {item.locationInPark || 'Main Garden'}
                    </div>
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlantingDashboard;
