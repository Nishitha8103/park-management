import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  TreePine,
  LogOut, 
  HardHat, 
  Bell, 
  CheckCircle, 
  Wrench, 
  AlertTriangle, 
  Clock, 
  ClipboardCheck, 
  CheckCheck, 
  ArrowRight, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import './ContractorNotifications.css';
import ContractorSidebar from '../components/ContractorSidebar';
import NotificationDropdown from '../components/NotificationDropdown';
import axios from 'axios';

const ContractorNotifications = () => {
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(() => {
    try {
      const storedUser = localStorage.getItem('contractorUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All, Unread, Alerts, Inspections

  useEffect(() => {
    if (!contractor) {
      const storedUser = localStorage.getItem('contractorUser');
      if (!storedUser) {
        navigate('/login');
        return;
      }
      try {
        setContractor(JSON.parse(storedUser));
      } catch {
        navigate('/login');
      }
    }
  }, [contractor, navigate]);

  const fetchNotifications = async () => {
    if (!contractor) return;
    try {
      setLoading(true);
      const contractorId = contractor._id || contractor.id || contractor.contractorId;
      const res = await axios.get(`/api/notifications?userId=${contractorId}&role=contractor`);
      if (res.data) {
        setNotifications(res.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractor) {
      fetchNotifications();
    }
  }, [contractor]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('contractorUser');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(notif => notif._id === id ? { ...notif, isRead: true } : notif)
      );
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const contractorId = contractor._id || contractor.id || contractor.contractorId;
      await axios.put('/api/notifications/mark-all-read', { userId: contractorId, role: 'contractor' });
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleActionClick = (notif) => {
    markAsRead(notif._id);
    if (notif.actionRoute) {
      navigate(notif.actionRoute);
    } else {
      navigate('/contractor/tasks');
    }
  };

  const getIcon = (notif) => {
    const title = (notif.title || '').toLowerCase();
    const type = (notif.type || '').toLowerCase();
    const cat = (notif.category || '').toLowerCase();

    if (title.includes('maintenance alert') || type.includes('maintenance')) return <Wrench size={22} />;
    if (title.includes('overdue') || type.includes('overdue')) return <AlertTriangle size={22} />;
    if (title.includes('due') || type.includes('due')) return <Clock size={22} />;
    if (title.includes('inspection') || cat.includes('inspection')) return <ClipboardCheck size={22} />;
    if (title.includes('verified') || title.includes('approved')) return <CheckCircle size={22} />;
    if (title.includes('reassigned') || type.includes('reassigned')) return <RefreshCw size={22} />;
    return <Bell size={22} />;
  };

  const getStyleClass = (notif) => {
    const title = (notif.title || '').toLowerCase();
    const priority = (notif.priority || '').toUpperCase();
    if (title.includes('maintenance alert') || priority === 'URGENT') return 'alert-urgent';
    if (title.includes('due today') || title.includes('overdue')) return 'alert-danger';
    if (title.includes('due soon') || priority === 'HIGH') return 'alert-warning';
    if (title.includes('inspection')) return 'alert-info';
    if (title.includes('verified') || title.includes('approved')) return 'alert-success';
    return 'alert-default';
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'Unread') return !n.isRead;
    if (filter === 'Alerts') return (n.title || '').toLowerCase().includes('alert') || (n.type || '').toLowerCase().includes('maintenance');
    if (filter === 'Inspections') return (n.category || '').toLowerCase().includes('inspection') || (n.title || '').toLowerCase().includes('inspection');
    return true;
  });

  if (!contractor) return null;

  return (
    <div className="contractor-dashboard-page">
      <ContractorSidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        handleLogout={handleLogout} 
        contractor={contractor} 
      />
      
      <div className={`contractor-main-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="contractor-header">
          <div className="container contractor-header-content">
            <div className="contractor-brand">
              <button className="contractor-menu-toggle" onClick={toggleSidebar}>
                <Menu size={24} />
              </button>
              <TreePine size={28} color="#e5ede7" />
              <h1>Parks Monitoring System</h1>
            </div>
            
            <div className="contractor-user-info">
              <NotificationDropdown userId={contractor._id || contractor.id || contractor.contractorId} role="contractor" />
              <div className="contractor-user-details">
                <h4 className="contractor-user-name">{contractor.name}</h4>
                <p className="contractor-user-role">{contractor.department || 'Maintenance Contractor'}</p>
              </div>
              <button className="btn-contractor-logout" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </header>

        <main className="contractor-dashboard-container container">
          <div className="contractor-notifications-page">
            <div className="notifications-header">
              <div>
                <h2>Maintenance & Task Alerts</h2>
                <p style={{ color: '#ecfdf5', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Real-time alerts, scheduled reminders, and task status updates</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            {['All', 'Unread', 'Alerts', 'Inspections'].map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  background: filter === t ? '#10b981' : '#f1f5f9',
                  color: filter === t ? '#ffffff' : '#475569'
                }}
              >
                {t} {t === 'Unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
              </button>
            ))}
          </div>

          <div className="notifications-list">
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading alerts and notifications...</div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map(notif => (
                <div 
                  key={notif._id} 
                  className={`notification-card ${!notif.isRead ? 'unread' : ''} ${getStyleClass(notif)}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.2rem',
                    marginBottom: '0.75rem',
                    borderRadius: '12px',
                    background: notif.isRead ? '#ffffff' : '#f8fafc',
                    border: notif.isRead ? '1px solid #e2e8f0' : '1px solid #10b981',
                    boxShadow: notif.isRead ? 'none' : '0 2px 6px rgba(16, 185, 129, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                    <div className="notif-icon-circle" style={{ padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getIcon(notif)}
                    </div>
                    <div className="notification-content" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', color: notif.isRead ? '#334155' : '#0f172a' }}>
                          {notif.title}
                        </h4>
                        {!notif.isRead && (
                          <span style={{ background: '#10b981', color: 'white', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>NEW</span>
                        )}
                        {notif.priority === 'URGENT' && (
                          <span style={{ background: '#ef4444', color: 'white', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>URGENT</span>
                        )}
                      </div>
                      <p style={{ margin: '0 0 6px 0', color: notif.isRead ? '#64748b' : '#1e293b', fontSize: '0.9rem', lineHeight: 1.4 }}>
                        {notif.message}
                      </p>
                      <span className="notification-date" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(notif.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '1rem' }}>
                    {!notif.isRead && (
                      <button 
                        onClick={() => markAsRead(notif._id)}
                        title="Mark as read"
                        style={{ background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#64748b' }}
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-notifications" style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <Bell size={48} style={{ color: '#cbd5e1', margin: '0 auto 1rem' }} />
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>No alerts found</h3>
                <p style={{ margin: 0, color: '#64748b' }}>You're all caught up with your park maintenance tasks and inspections!</p>
              </div>
            )}
          </div>
        </div>
      </main>
      </div>
    </div>
  );
};

export default ContractorNotifications;

