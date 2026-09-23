import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Bell,
  CheckCircle,
  Trees,
  ClipboardCheck,
  AlertCircle,
  HardHat,
  Clock,
  FileText,
  Megaphone,
  Calendar,
  Info,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import './GovNotifications.css';

const categoryConfig = {
  'Park Monitoring':  { icon: Trees,          bg: '#e0f2fe', color: '#0284c7', label: 'Park Monitoring' },
  'Inspection':       { icon: ClipboardCheck, bg: '#f3e8ff', color: '#7c3aed', label: 'Inspection' },
  'Complaint':        { icon: AlertCircle,    bg: '#fef3c7', color: '#d97706', label: 'Complaint' },
  'Maintenance':      { icon: HardHat,        bg: '#ffedd5', color: '#ea580c', label: 'Maintenance' },
  'Contractor Work':  { icon: HardHat,        bg: '#ecfdf5', color: '#059669', label: 'Contractor Work' },
  'Verification':     { icon: ShieldCheck,    bg: '#ecfdf5', color: '#059669', label: 'Verification' },
  'SLA':              { icon: Clock,          bg: '#fef2f2', color: '#dc2626', label: 'SLA' },
  'Report':           { icon: FileText,       bg: '#eff6ff', color: '#2563eb', label: 'Report' },
  'Park Announcement':{ icon: Megaphone,      bg: '#ffedd5', color: '#c2410c', label: 'Park Announcement' },
  'Event':            { icon: Calendar,       bg: '#f0fdf4', color: '#16a34a', label: 'Event' },
  'General':          { icon: Info,           bg: '#f1f5f9', color: '#475569', label: 'General' }
};

const defaultGovNotifs = [
  {
    _id: 'notif-sla-breached',
    title: 'SLA Breached',
    message: 'Complaint CMP-2026-0012 has exceeded its SLA deadline and requires immediate attention.',
    category: 'SLA',
    type: 'SLA Breached',
    priority: 'Urgent',
    isRead: false,
    actionLabel: 'View Complaint',
    actionRoute: '/gov-dashboard/complaints',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  },
  {
    _id: 'notif-work-completed',
    title: 'Work Completed – Verification Required',
    message: 'The contractor has submitted completion proof for the assigned maintenance task at J.P. Nagar 5th Stage Park.',
    category: 'Contractor Work',
    type: 'Contractor Work',
    priority: 'Important',
    isRead: false,
    actionLabel: 'Verify Work',
    actionRoute: '/gov-dashboard/verify-work',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    _id: 'notif-park-announcement',
    title: 'Maruthi Layout Park Temporary Closure',
    message: 'Maruthi Layout Park will remain closed temporarily due to scheduled maintenance work.',
    category: 'Park Announcement',
    type: 'Park Announcement',
    priority: 'Important',
    isRead: false,
    actionLabel: 'View Announcement',
    actionRoute: '/announcements',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  },
  {
    _id: 'notif-complaint-review',
    title: 'Complaint Requires Review',
    message: 'A citizen complaint regarding damaged playground equipment requires your review.',
    category: 'Complaint',
    type: 'Complaint',
    priority: 'Important',
    isRead: false,
    actionLabel: 'View Complaint',
    actionRoute: '/gov-dashboard/complaints',
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  },
  {
    _id: 'notif-park-due',
    title: 'Park Inspection Due',
    message: 'The scheduled inspection for J.P. Nagar 5th Stage Park is due today.',
    category: 'Park Monitoring',
    type: 'Park Monitoring',
    priority: 'Normal',
    isRead: true,
    actionLabel: 'View Park',
    actionRoute: '/gov-dashboard/parks',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    _id: 'notif-insp-assigned',
    title: 'Inspection Assigned',
    message: 'A new park inspection has been assigned to you for J.P. Nagar 5th Stage Park.',
    category: 'Inspection',
    type: 'Inspection',
    priority: 'Normal',
    isRead: true,
    actionLabel: 'View Inspection',
    actionRoute: '/gov-dashboard/my-inspections',
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  },
  {
    _id: 'notif-rework-submitted',
    title: 'Rework Request Submitted',
    message: 'A maintenance task requires rework verification after the contractor resubmitted the completion report.',
    category: 'Contractor Work',
    type: 'Contractor Work',
    priority: 'Important',
    isRead: true,
    actionLabel: 'Review Work',
    actionRoute: '/gov-dashboard/verify-work',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  },
  {
    _id: 'notif-sla-approaching',
    title: 'SLA Deadline Approaching',
    message: 'The SLA deadline for complaint CMP-2026-0012 is approaching. Please review the complaint status.',
    category: 'SLA',
    type: 'SLA',
    priority: 'Important',
    isRead: true,
    actionLabel: 'View Complaint',
    actionRoute: '/gov-dashboard/complaints',
    createdAt: new Date(Date.now() - 60 * 3600 * 1000).toISOString()
  },
  {
    _id: 'notif-report-submitted',
    title: 'Inspection Report Submitted',
    message: 'A new inspection report has been submitted and is ready for verification.',
    category: 'Report',
    type: 'Report',
    priority: 'Normal',
    isRead: true,
    actionLabel: 'View Report',
    actionRoute: '/gov-dashboard/analytics',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString()
  },
  {
    _id: 'notif-event-scheduled',
    title: 'New Event Scheduled',
    message: 'A new public event has been scheduled at an assigned park.',
    category: 'Event',
    type: 'Event',
    priority: 'Normal',
    isRead: true,
    actionLabel: 'View Event',
    actionRoute: '/events',
    createdAt: new Date(Date.now() - 84 * 3600 * 1000).toISOString()
  }
];

const GovNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All'); // 'All' | 'Unread'
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stored = localStorage.getItem('govUser');
      const userData = stored ? JSON.parse(stored) : null;
      const userId = userData ? (userData._id || userData.id) : 'official-default';

      const res = await axios.get(`/api/notifications?userId=${userId}&role=official`);
      let fetched = (res.data && Array.isArray(res.data.notifications)) ? res.data.notifications : [];
      
      if (fetched.length === 0) {
        fetched = defaultGovNotifs;
      }

      setNotifications(fetched);
    } catch (err) {
      console.error('Failed to fetch official notifications:', err);
      setNotifications(defaultGovNotifs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      if (!id.toString().startsWith('notif-')) {
        await axios.put(`/api/notifications/${id}/read`).catch(() => {});
      }
      setNotifications(prev =>
        prev.map(n => ((n._id === id || n.id === id) ? { ...n, isRead: true } : n))
      );
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const stored = localStorage.getItem('govUser');
      const userData = stored ? JSON.parse(stored) : null;
      const userId = userData ? (userData._id || userData.id) : 'official-default';
      
      await axios.put('/api/notifications/mark-all-read', { userId, role: 'official' }).catch(() => {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    const notifId = notif._id || notif.id;
    if (!notif.isRead) {
      await handleMarkAsRead(notifId);
    }
    const action = getActionDetails(notif);
    if (action && action.route) {
      navigate(action.route);
    }
  };

  const formatDateTime = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${dateStr} • ${timeStr}`;
  };

  const getCategoryMeta = (cat, type) => {
    if (cat && categoryConfig[cat]) return categoryConfig[cat];
    if (type === 'Park Announcement' || cat === 'Park Announcement') return categoryConfig['Park Announcement'];
    if (type === 'Inspection' || cat === 'Inspection') return categoryConfig['Inspection'];
    if (type === 'Complaint' || cat === 'Complaint') return categoryConfig['Complaint'];
    if (type === 'Contractor Work' || cat === 'Contractor Work') return categoryConfig['Contractor Work'];
    if (type === 'SLA' || cat === 'SLA') return categoryConfig['SLA'];
    if (type === 'Report' || cat === 'Report') return categoryConfig['Report'];
    if (type === 'Event' || cat === 'Event') return categoryConfig['Event'];
    return categoryConfig['General'];
  };

  const getActionDetails = (notif) => {
    if (notif.actionLabel && notif.actionRoute) {
      return { label: notif.actionLabel, route: notif.actionRoute };
    }
    const cat = notif.category || notif.type || '';
    switch (cat) {
      case 'Park Monitoring':
        return { label: 'View Park', route: '/gov-dashboard/parks' };
      case 'Inspection':
        return { label: 'View Inspection', route: '/gov-dashboard/my-inspections' };
      case 'Complaint':
        return { label: 'View Complaint', route: '/gov-dashboard/complaints' };
      case 'Contractor Work':
        return { label: 'Verify Work', route: '/gov-dashboard/verify-work' };
      case 'SLA':
        return { label: 'View Complaint', route: '/gov-dashboard/complaints' };
      case 'Report':
        return { label: 'View Report', route: '/gov-dashboard/analytics' };
      case 'Park Announcement':
        return { label: 'View Announcement', route: '/announcements' };
      case 'Event':
        return { label: 'View Event', route: '/events' };
      default:
        return { label: 'View Details', route: '/gov-dashboard' };
    }
  };

  const filteredNotifications = filter === 'Unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="gov-notifications-page container">
      
      {/* Header Banner */}
      <div 
        className="notifications-header"
        style={{
          background: '#4f6d54',
          borderRadius: '16px',
          padding: '1.4rem 1.75rem',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 24px rgba(45, 62, 48, 0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '1.5rem',
          color: '#ffffff'
        }}
      >
        <div className="notifications-header-left" style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
          <div 
            className="header-icon-box"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1.5px solid rgba(255, 255, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Bell size={24} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#ffffff' }}>
              Notification Center
            </h2>
            <p className="notifications-subtitle" style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#edf2ee', lineHeight: 1.4 }}>
              Stay updated on assigned parks, inspections, complaints, contractor work, SLA deadlines, reports, and important park announcements.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button className="btn-mark-all" onClick={handleMarkAllAsRead}>
            <CheckCircle size={15} />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="notifications-filter-bar">
        <button
          className={`btn-filter-tab ${filter === 'All' ? 'active' : ''}`}
          onClick={() => setFilter('All')}
        >
          All ({totalCount})
        </button>
        <button
          className={`btn-filter-tab ${filter === 'Unread' ? 'active' : ''}`}
          onClick={() => setFilter('Unread')}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications Container */}
      <div className="notifications-list">
        {loading ? (
          <div className="loading-box">
            <div className="gov-spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="error-box">
            <AlertTriangle size={36} className="text-error" />
            <p>{error}</p>
            <button className="btn-retry" onClick={fetchNotifications}>
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map(notif => {
            const notifId = notif._id || notif.id;
            const isUnread = !notif.isRead;
            const meta = getCategoryMeta(notif.category, notif.type);
            const CategoryIcon = meta.icon;
            const action = getActionDetails(notif);
            const isUrgent = notif.priority === 'Urgent' || notif.priority === 'URGENT' || notif.title === 'SLA Breached';

            return (
              <div
                key={notifId}
                className={`notification-card ${isUnread ? 'unread' : 'read'} ${isUrgent ? 'urgent' : ''}`}
                onClick={(e) => handleNotificationClick(notif, e)}
              >
                {/* Unread Blue Indicator Dot */}
                {isUnread && <div className="unread-blue-dot" title="Unread notification"></div>}

                {/* Left Category Icon */}
                <div
                  className="notification-icon-box"
                  style={{ backgroundColor: meta.bg, color: meta.color }}
                >
                  <CategoryIcon size={22} />
                </div>

                {/* Main Content */}
                <div className="notification-main-content">
                  <div className="notification-title-header">
                    <h4>{notif.title}</h4>
                    {isUrgent && (
                      <span className="priority-badge urgent">URGENT</span>
                    )}
                  </div>
                  
                  <p className="notification-message-text">{notif.message}</p>
                  
                  <div className="notification-meta-footer">
                    <span
                      className="category-pill-tag"
                      style={{ backgroundColor: meta.bg, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <span className="meta-bullet">•</span>
                    <span className="notification-timestamp">
                      {formatDateTime(notif.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-notifications">
            <Bell size={48} style={{ color: '#cbd5e1', margin: '0 auto 0.75rem' }} />
            <h3>
              {filter === 'Unread' ? 'No unread notifications' : 'No notifications yet.'}
            </h3>
            <p>
              {filter === 'Unread'
                ? 'You have read all your notifications!'
                : "You're all caught up!"}
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default GovNotifications;
