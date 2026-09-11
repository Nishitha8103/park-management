import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Clock, Wrench, Megaphone, Star, FileText, Info } from 'lucide-react';
import '../NotificationsPage.css'; // Reuse styles if any, or inline

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Unread
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('adminUser'));

  const fetchNotifications = async () => {
    try {
      if (!user) {
        navigate('/admin-login');
        return;
      }
      const userId = user._id || user.id;
      const res = await axios.get(`/api/notifications?userId=${userId}&role=admin`);
      if (res.data) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const userId = user._id || user.id;
      await axios.put('/api/notifications/mark-all-read', { userId, role: 'admin' });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif._id);
    }
    // Removed navigation per user request: "when i click it it is going to another page dont give like that fix it"
  };

  const getIconForCategory = (category) => {
    switch(category) {
      case 'Complaints':
      case 'My Complaints': return <FileText size={24} />;
      case 'Maintenance':
      case 'Assigned Tasks': return <Wrench size={24} />;
      case 'SLA': return <Clock size={24} />;
      case 'Announcements': return <Megaphone size={24} />;
      case 'Feedback': return <Star size={24} />;
      case 'Verification': return <CheckCircle2 size={24} />;
      default: return <Info size={24} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'URGENT': return '#ef4444';
      case 'HIGH': return '#f59e0b';
      case 'NORMAL': return '#3b82f6';
      case 'LOW': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  const filteredNotifications = filter === 'Unread' ? notifications.filter(n => !n.isRead) : notifications;

  if (!user) return null;

  return (
    <div className="admin-panel" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="admin-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', margin: 0, color: '#0f172a' }}>
            <Bell size={28} color="#3b82f6" />
            System Notifications
          </h3>
          <p style={{ color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>Stay updated on complaints and tasks</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setFilter('All')}
          style={{ padding: '0.5rem 1.5rem', borderRadius: '20px', fontWeight: 600, cursor: 'pointer', border: 'none', background: filter === 'All' ? '#3b82f6' : '#f1f5f9', color: filter === 'All' ? '#fff' : '#64748b', transition: 'all 0.2s' }}
        >
          All ({notifications.length})
        </button>
        <button 
          onClick={() => setFilter('Unread')}
          style={{ padding: '0.5rem 1.5rem', borderRadius: '20px', fontWeight: 600, cursor: 'pointer', border: 'none', background: filter === 'Unread' ? '#3b82f6' : '#f1f5f9', color: filter === 'Unread' ? '#fff' : '#64748b', transition: 'all 0.2s' }}
        >
          Unread ({notifications.filter(n => !n.isRead).length})
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <CheckCircle2 size={64} style={{ color: '#10b981', marginBottom: '1rem', display: 'inline-block' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>You're all caught up!</h3>
            <p style={{ margin: 0, color: '#64748b' }}>You don't have any {filter === 'Unread' ? 'unread' : 'new'} notifications right now.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredNotifications.map(notif => (
              <div 
                key={notif._id} 
                onClick={() => handleNotificationClick(notif)}
                style={{ 
                  background: notif.isRead ? '#fff' : '#eff6ff', 
                  border: '1px solid',
                  borderColor: notif.isRead ? '#e2e8f0' : '#bfdbfe',
                  borderRadius: '12px', padding: '1.25rem', display: 'flex', gap: '1.25rem', cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: getPriorityColor(notif.priority), backgroundColor: `${getPriorityColor(notif.priority)}15`, flexShrink: 0 }}>
                  {getIconForCategory(notif.category)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: notif.isRead ? '#334155' : '#0f172a', fontWeight: notif.isRead ? 600 : 700 }}>{notif.title}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', marginLeft: '1rem' }}>{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, color: notif.isRead ? '#64748b' : '#334155', fontSize: '0.95rem', lineHeight: 1.5 }}>{notif.message}</p>
                </div>
                {!notif.isRead && <div style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '50%', position: 'absolute', top: '24px', right: '1.25rem' }}></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
