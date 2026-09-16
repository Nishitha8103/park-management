import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Clock, Info, FileText, Wrench, Megaphone, Star, AlertOctagon } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './NotificationDropdown.css';

const NotificationDropdown = ({ userId, role, onNotificationClick }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const lastAlertTimeRef = useRef(0);

  const fetchNotifications = async () => {
    try {
      if (!userId || !role) return;
      const res = await axios.get(`/api/notifications?userId=${userId}&role=${role}`);
      if (res.data) {
        const notifList = res.data.notifications || [];
        setNotifications(notifList);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId && role) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, role]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await axios.put('/api/notifications/mark-all-read', { userId, role });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkAsRead({ stopPropagation: () => {} }, notif._id);
    }
    setIsOpen(false);
    
    if (onNotificationClick) {
      onNotificationClick(notif);
    } else if (notif.actionRoute) {
      navigate(notif.actionRoute);
    } else {
      if (role === 'citizen') navigate('/track-complaint');
      else if (role === 'contractor') navigate('/contractor/tasks');
      else if (role === 'official') navigate('/gov-dashboard/complaints');
      else if (role === 'admin') navigate('/admin-dashboard/complaints');
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    if (role === 'citizen') navigate('/notifications');
    else if (role === 'contractor') navigate('/contractor/notifications');
    else if (role === 'admin') navigate('/admin-dashboard/notifications');
    else if (role === 'official') navigate('/official/notifications');
  };

  const getIconForCategory = (category, type = '') => {
    const cat = (category || '').toLowerCase();
    const t = (type || '').toLowerCase();

    if (t.includes('resolved') || cat.includes('resolved')) return <CheckCircle2 size={18} />;
    if (t.includes('maintenance') || cat.includes('maintenance') || t.includes('repair')) return <Wrench size={18} />;
    if (t.includes('inspection') || cat.includes('inspection')) return <FileText size={18} />;
    if (t.includes('overdue') || t.includes('due') || cat.includes('sla')) return <Clock size={18} />;
    if (cat.includes('complaint')) return <FileText size={18} />;
    if (cat.includes('feedback')) return <Star size={18} />;
    if (cat.includes('announcement')) return <Megaphone size={18} />;
    if (cat.includes('verification')) return <CheckCircle2 size={18} />;
    
    return <Info size={18} />;
  };

  const getPriorityColor = (priority, type = '') => {
    const p = (priority || '').toUpperCase();
    const t = (type || '').toLowerCase();
    if (t.includes('overdue') || p === 'URGENT') return '#ef4444';
    if (t.includes('due') || p === 'HIGH') return '#f59e0b';
    if (t.includes('resolved')) return '#10b981';
    if (p === 'LOW') return '#6b7280';
    return '#3b82f6';
  };

  return (
    <div className="notification-wrapper" ref={dropdownRef}>
      <button className="notification-bell-btn" onClick={() => setIsOpen(!isOpen)}>
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">
                <p>Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <CheckCircle2 size={40} color="#10b981" style={{ marginBottom: '10px' }} />
                <p style={{ fontWeight: 600, color: '#1f2937' }}>You're all caught up!</p>
                <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>You don't have any new notifications.</p>
              </div>
            ) : (
              notifications.slice(0, 8).map(notif => (
                <div 
                  key={notif._id} 
                  className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notification-icon" style={{ color: getPriorityColor(notif.priority), backgroundColor: `${getPriorityColor(notif.priority)}15` }}>
                    {getIconForCategory(notif.category)}
                  </div>
                  <div className="notification-content">
                    <h4 style={{ color: notif.isRead ? '#4b5563' : '#111827' }}>{notif.title}</h4>
                    <p style={{ color: notif.isRead ? '#6b7280' : '#374151' }}>{notif.message}</p>
                    <span className="notification-time">
                      {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  {!notif.isRead && (
                    <div className="notification-actions">
                      <button className="mark-read-btn" onClick={(e) => handleMarkAsRead(e, notif._id)} title="Mark as read">
                        <span className="read-dot"></span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="notification-footer">
              <button className="view-all-btn" onClick={handleViewAll}>
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
