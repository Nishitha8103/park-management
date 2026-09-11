import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCircle2, 
  Ticket, 
  CreditCard, 
  FileText, 
  Megaphone, 
  Store, 
  Star, 
  CheckCheck, 
  ChevronRight, 
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Unread
  const [toastMessage, setToastMessage] = useState('');
  const navigate = useNavigate();

  // Detect user role & id from local storage
  const getUserInfo = () => {
    const citizenUser = localStorage.getItem('user');
    if (citizenUser) return { ...JSON.parse(citizenUser), role: 'citizen' };

    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) return { ...JSON.parse(adminUser), role: 'admin' };
    
    const contractorUser = localStorage.getItem('contractorUser');
    if (contractorUser) return { ...JSON.parse(contractorUser), role: 'contractor' };
    
    const officialUser = localStorage.getItem('officialUser');
    if (officialUser) return { ...JSON.parse(officialUser), role: 'official' };

    return null;
  };

  const user = getUserInfo();

  const fetchNotifications = async () => {
    try {
      if (!user) {
        navigate('/');
        return;
      }
      const userId = user._id || user.id;
      const phone = user.phone || user.userPhone || '';
      const phoneParam = (user.role === 'citizen' && phone) ? `&phone=${encodeURIComponent(phone)}` : '';
      const res = await axios.get(`/api/notifications?userId=${userId}&role=${user.role}${phoneParam}`);
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
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const userId = user._id || user.id;
      await axios.put('/api/notifications/mark-all-read', { userId, role: user.role });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setToastMessage('All notifications marked as read! ✅');
      setTimeout(() => setToastMessage(''), 3500);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif._id);
    }

    const meta = getCategoryMeta(notif);

    if (user.role === 'citizen') {
      if (meta.badgeText === 'Complaint' && notif.relatedEntityId) {
        navigate('/track-complaint', { state: { id: notif.relatedEntityId } });
        return;
      }
      navigate(notif.actionRoute || meta.defaultRoute);
    } else if (user.role === 'contractor') {
      if (meta.badgeText === 'Complaint') {
        navigate(notif.relatedEntityId ? `/contractor/task/${notif.relatedEntityId}` : '/contractor/tasks');
      } else {
        navigate('/announcements');
      }
    } else if (user.role === 'official') {
      if (meta.badgeText === 'Complaint') {
        navigate(notif.relatedEntityId ? `/gov-dashboard/inspections/${notif.relatedEntityId}` : '/gov-dashboard/complaints');
      } else {
        navigate('/gov-dashboard');
      }
    } else if (user.role === 'admin') {
      if (meta.badgeText === 'Complaint') navigate('/admin-dashboard/complaints');
      else if (meta.badgeText === 'Event') navigate('/admin-dashboard/events');
      else if (meta.badgeText === 'Payment') navigate('/admin-dashboard/event-registrations');
      else if (meta.badgeText === 'Stall Booking') navigate('/admin-dashboard/stall-bookings');
      else if (meta.badgeText === 'Park Announcement') navigate('/admin-dashboard/announcements');
      else navigate(notif.actionRoute || meta.defaultRoute);
    } else {
      navigate(notif.actionRoute || meta.defaultRoute);
    }
  };

  const getCategoryMeta = (notif) => {
    const title = (notif.title || '').toLowerCase();
    const cat = (notif.category || '').toLowerCase();
    const type = (notif.type || notif.relatedEntityType || '').toLowerCase();

    // 1. EVENT: Event Registration Confirmed, Event Reminder, Event Updated, etc.
    if (
      title.includes('event') || 
      title.includes('registration') || 
      cat === 'event' || 
      cat.includes('event') || 
      type.includes('event')
    ) {
      return {
        icon: <Ticket size={22} />,
        badgeText: 'Event',
        iconColor: '#059669',
        bgColor: '#dcfce7',
        actionText: 'View Registration →',
        defaultRoute: '/my-registrations'
      };
    }

    // 2. PAYMENT: Payment Successful, Payment Failed, Payment Pending, Payment Expired
    if (
      title.includes('payment') || 
      cat === 'payment' || 
      cat.includes('payment') || 
      type.includes('payment')
    ) {
      return {
        icon: <CreditCard size={22} />,
        badgeText: 'Payment',
        iconColor: '#0d9488',
        bgColor: '#ccfbf1',
        actionText: 'View Payment →',
        defaultRoute: '/my-registrations'
      };
    }

    // 3. COMPLAINT: Complaint Submitted, Complaint In Progress, Complaint Resolved
    if (
      title.includes('complaint') || 
      cat === 'complaint' || 
      cat.includes('complaint') || 
      type.includes('complaint')
    ) {
      return {
        icon: <FileText size={22} />,
        badgeText: 'Complaint',
        iconColor: '#2563eb',
        bgColor: '#dbeafe',
        actionText: 'View Complaint Details →',
        defaultRoute: '/track-complaint'
      };
    }

    // 4. PARK ANNOUNCEMENT: Park Closure, Park Maintenance, Important Park Announcement, Announcement
    if (
      title.includes('announcement') || 
      title.includes('park closure') || 
      cat.includes('announcement') || 
      type.includes('announcement')
    ) {
      return {
        icon: <Megaphone size={22} />,
        badgeText: 'Park Announcement',
        iconColor: '#d97706',
        bgColor: '#fef3c7',
        actionText: 'View Announcement →',
        defaultRoute: '/announcements'
      };
    }

    // 5. STALL BOOKING: Stall Booking Approved, Stall Booking Rejected, Payment Reminder, Stall Booking Confirmed
    if (
      title.includes('stall') || 
      cat.includes('stall') || 
      type.includes('stall')
    ) {
      return {
        icon: <Store size={22} />,
        badgeText: 'Stall Booking',
        iconColor: '#7c3aed',
        bgColor: '#f3e8ff',
        actionText: 'View Booking →',
        defaultRoute: '/stall-bookings'
      };
    }

    // 6. FEEDBACK: Feedback Submitted, Feedback Reviewed
    if (
      title.includes('feedback') || 
      cat.includes('feedback') || 
      type.includes('feedback')
    ) {
      return {
        icon: <Star size={22} />,
        badgeText: 'Feedback',
        iconColor: '#e11d48',
        bgColor: '#ffe4e6',
        actionText: 'View Feedback →',
        defaultRoute: '/feedback-history'
      };
    }

    return {
      icon: <Bell size={22} />,
      badgeText: notif.category || 'Notification',
      iconColor: '#059669',
      bgColor: '#ecfdf5',
      actionText: 'View Details →',
      defaultRoute: '/'
    };
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filteredNotifications = filter === 'Unread' ? notifications.filter(n => !n.isRead) : notifications;

  if (!user) return null;

  return (
    <div className="notifications-page-container">
      {/* Toast alert */}
      {toastMessage && (
        <div className="notifications-toast">
          {toastMessage}
        </div>
      )}

      {/* Header Banner with high contrast */}
      <div className="notifications-header-banner">
        <div className="header-left">
          <div className="header-icon-badge">
            <Bell size={26} color="#ffffff" />
          </div>
          <div>
            <h1 className="header-title">🔔 Notification Center</h1>
            <p className="header-subtitle">
              Stay updated on your park activities, complaints, events and announcements.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="notifications-tab-bar">
        <button 
          className={`tab-btn ${filter === 'All' ? 'active' : ''}`} 
          onClick={() => setFilter('All')}
        >
          All ({notifications.length})
        </button>
        <button 
          className={`tab-btn ${filter === 'Unread' ? 'active' : ''}`} 
          onClick={() => setFilter('Unread')}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Main List */}
      <div className="notifications-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          filter === 'Unread' ? (
            <div className="empty-state-card">
              <div className="empty-icon-circle" style={{ background: '#dcfce7' }}>
                <CheckCircle2 size={44} color="#166534" />
              </div>
              <h3>You're all caught up!</h3>
              <p>You have no unread notifications.</p>
            </div>
          ) : (
            <div className="empty-state-card">
              <div className="empty-icon-circle" style={{ background: '#ecfdf5' }}>
                <Bell size={44} color="#059669" />
              </div>
              <h3>No notifications yet</h3>
              <p>You'll see updates about events, complaints, payments, bookings and park announcements here.</p>
            </div>
          )
        ) : (
          <div className="notifications-list flex flex-col gap-3">
            {filteredNotifications.map(notif => {
              const meta = getCategoryMeta(notif);
              return (
                <div 
                  key={notif._id} 
                  className={`notification-item-card ${!notif.isRead ? 'unread' : 'read'}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  {/* Category Left Icon */}
                  <div className="card-left-icon" style={{ backgroundColor: meta.bgColor, color: meta.iconColor }}>
                    {meta.icon}
                  </div>

                  {/* Body Content */}
                  <div className="card-main-content">
                    <div className="card-top-header">
                      <div className="title-and-badge">
                        <h4 className="card-title">{notif.title}</h4>
                        <span className="category-pill" style={{ color: meta.iconColor, backgroundColor: meta.bgColor }}>
                          {meta.badgeText}
                        </span>
                      </div>

                      <div className="time-and-indicator">
                        <span className="card-timestamp">
                          {new Date(notif.createdAt).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                        {!notif.isRead && (
                          <span className="unread-dot" title="Unread notification">●</span>
                        )}
                      </div>
                    </div>

                    <p className="card-message">{notif.message}</p>

                    {meta.actionText && (
                      <div className="card-action-bar">
                        <span className="action-link-text">{meta.actionText}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
