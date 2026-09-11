import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, HardHat, Bell, CheckCircle } from 'lucide-react';
import './ContractorNotifications.css';
import ContractorSidebar from '../components/ContractorSidebar';


const API_BASE = '/api';

const ContractorNotifications = () => {
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('contractorUser');
    if (!storedUser) {
      navigate('/contractor/login');
    } else {
      setContractor(JSON.parse(storedUser));
    }
  }, [navigate]);

  useEffect(() => {
    if (!contractor) return;
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/complaints?contractorId=${contractor._id || contractor.id}`);
        const data = await res.json();
        
        const source = Array.isArray(data) ? data : [];
        
        // Map tasks to notifications based on status, EXCLUDING 'In Progress'
        const sortedTasks = [...source]
          .filter(task => task.status !== 'In Progress') // User requested to not show 'In Progress' notifications
          .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
        
        const mappedNotifs = sortedTasks.map(task => {
          let title = 'Task Update';
          let message = `Task at ${task.parkName || 'Park'} has been updated.`;
          const status = task.status || '';

          if (['Assigned', 'New'].includes(status)) {
            title = 'New Task Assigned';
            message = `You have been assigned a new task at ${task.parkName || 'Park'}: ${task.description || task.category}.`;
          } else if (['Returned by Admin', 'Rework Required', 'Reassigned to Contractor'].includes(status)) {
            title = 'Rework Complaint';
            message = `Admin has requested rework on ${task.parkName || 'Park'} for task ${task.complaintNumber}. Reason: ${task.rejectionReason || 'Please check task details.'}`;
          } else if (['Completed', 'Completed - Waiting for Admin Review'].includes(status)) {
            title = 'Completed Complaint';
            message = `You have submitted the completion report for task ${task.complaintNumber} at ${task.parkName || 'Park'}.`;
          } else if (['Inspection Approved', 'Inspection Pending'].includes(status)) {
            title = 'Approved by Govt Official';
            message = `Your completed task ${task.complaintNumber} at ${task.parkName || 'Park'} has been reviewed and approved.`;
          } else if (status === 'Closed') {
            title = 'Closed Complaint';
            message = `The task ${task.complaintNumber} at ${task.parkName || 'Park'} has been officially closed.`;
          }

          return {
            id: task.complaintNumber || task._id,
            _id: task._id,
            title,
            message,
            date: new Date(task.updatedAt || task.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
            read: false
          };
        });
        
        // Add a few dummy notifications just to show if there are none
        if (mappedNotifs.length === 0) {
          mappedNotifs.push({
            id: 'demo-1',
            title: 'Welcome to Park Maintenance Portal',
            message: 'You have no new tasks assigned at the moment. Keep an eye out for new notifications.',
            date: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
            read: true
          });
        }
        
        setNotifications(mappedNotifs);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [contractor]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('contractorUser');
    navigate('/contractor/login');
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

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
              <HardHat size={28} className="contractor-text-primary" />
              <h1>PARK MAINTENANCE</h1>
              <span>Portal</span>
            </div>
            
            <div className="contractor-user-info" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div 
                className="header-notification-icon" 
                onClick={() => navigate('/contractor/notifications')}
                style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Bell size={22} style={{ color: '#475569' }} />
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 5px', borderRadius: '10px', minWidth: '16px', textAlign: 'center' }}>{notifications.filter(n => !n.read).length}</span>
              </div>
              <div className="contractor-user-details" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '0.5rem' }}>
                <h4 className="contractor-user-name" style={{ margin: 0 }}>{contractor.name}</h4>
                <p className="contractor-user-role" style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{contractor.department || 'General Maintenance'} Specialist</p>
              </div>
              <button className="btn-contractor-logout" onClick={handleLogout} style={{ marginLeft: '0.5rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </header>

        <div className="contractor-notifications-page container">
          <div className="notifications-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={24} className="contractor-text-primary" />
              <h2>Notifications</h2>
            </div>
          </div>

          <div className="notifications-list">
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading notifications...</div>
            ) : notifications.length > 0 ? (
              notifications.map(notif => (
                <div key={notif.id} className={`notification-card ${!notif.read ? 'unread' : ''}`}>
                  <div className="notification-icon">
                    <Bell size={20} />
                  </div>
                  <div className="notification-content">
                    <h4>{notif.title}</h4>
                    <p>{notif.message}</p>
                    <span className="notification-date">{notif.date}</span>
                  </div>
                  {!notif.read && (
                    <button className="btn-mark-read" onClick={() => markAsRead(notif.id)}>
                      Mark as read
                    </button>
                  )}
                  {notif._id && (
                    <button className="btn-mark-read" style={{ marginLeft: '10px', backgroundColor: '#e2e8f0', color: '#1e293b' }} onClick={() => navigate(`/contractor/task/${notif.id}`)}>
                      View Task
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-notifications">
                <Bell size={48} style={{ color: '#cbd5e1', margin: '0 auto 1rem' }} />
                <h3>No new notifications</h3>
                <p>You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ContractorNotifications;
