import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TreePine, HardHat, Menu, LogOut, Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import ContractorSidebar from '../components/ContractorSidebar';
import './ContractorSchedule.css';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const statusConfig = {
  Pending:     { color: '#f59e0b', bg: '#fef3c7', label: 'Pending' },
  'In Progress':{ color: '#3b82f6', bg: '#dbeafe', label: 'In Progress' },
  Completed:   { color: '#16a34a', bg: '#dcfce7', label: 'Completed' },
  Overdue:     { color: '#ef4444', bg: '#fee2e2', label: 'Overdue' },
};

const ContractorSchedule = () => {
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [view, setView] = useState('month'); // 'month' | 'list'

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const handleLogout = () => {
    localStorage.removeItem('contractorUser');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const stored = localStorage.getItem('contractorUser');
    if (!stored) { navigate('/login'); return; }
    const user = JSON.parse(stored);
    setContractor(user);

    const cId = user._id || user.id;
    fetch(`/api/complaints?contractorId=${cId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        const now = new Date();
        const mappedTasks = list.map(c => {
          const isCompleted = ['Completed', 'Completed - Waiting for Admin Review', 'Inspection Pending', 'Inspection Approved', 'Closed'].includes(c.status);
          const isInProgress = ['In Progress', 'Reassigned to Contractor', 'Rework Required'].includes(c.status);
          
          const rawDeadline = c.slaDeadline || c.targetResolutionDate;
          const deadlineDate = rawDeadline ? new Date(rawDeadline) : (c.createdAt ? new Date(new Date(c.createdAt).getTime() + 48 * 3600 * 1000) : new Date());

          let computedStatus = 'Pending';
          if (isCompleted) {
            computedStatus = 'Completed';
          } else if (deadlineDate < now) {
            computedStatus = 'Overdue';
          } else if (isInProgress) {
            computedStatus = 'In Progress';
          } else {
            computedStatus = 'Pending';
          }

          return {
            _id: c._id,
            complaintNumber: c.complaintNumber,
            title: `Task #${c.complaintNumber} - ${c.category || 'Maintenance'}`,
            parkName: c.parkName || (c.park && c.park.name ? c.park.name : 'Assigned Park'),
            category: c.category || 'General',
            priority: c.priority || 'Medium',
            status: c.status || 'Assigned',
            computedStatus,
            deadline: deadlineDate,
            description: c.description || 'No description provided.',
            userPhone: c.userPhone,
            locationInPark: c.locationInPark || 'Main Park Area'
          };
        });
        setTasks(mappedTasks);
      })
      .catch((err) => {
        console.error('Error fetching contractor tasks:', err);
        setTasks([]);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getTasksForDay = (day) => {
    return tasks.filter(t => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const selectedTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  // Stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.computedStatus === 'Pending').length,
    inProgress: tasks.filter(t => t.computedStatus === 'In Progress').length,
    completed: tasks.filter(t => t.computedStatus === 'Completed').length,
    overdue: tasks.filter(t => t.computedStatus === 'Overdue').length,
  };

  // Upcoming (next 7 days, not completed)
  const upcoming = tasks
    .filter(t => t.deadline && t.computedStatus !== 'Completed')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 8);

  return (
    <div className="contractor-dashboard-page">
      <ContractorSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} handleLogout={handleLogout} contractor={contractor} />

      <div className={`contractor-main-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="contractor-header">
          <div className="container contractor-header-content">
            <div className="contractor-brand">
              <button className="contractor-menu-toggle" onClick={toggleSidebar}><Menu size={24} /></button>
              <TreePine size={28} color="#e5ede7" />
              <h1>Parks Monitoring System</h1>
            </div>
            <div className="contractor-user-info">
              <div className="contractor-user-details">
                <h4 className="contractor-user-name">{contractor?.name}</h4>
                <p className="contractor-user-role">
                  {contractor?.maintenanceSkills?.length > 0 ? contractor.maintenanceSkills.join(', ') : 'Maintenance Contractor'}
                </p>
              </div>
              <button className="btn-contractor-logout" onClick={handleLogout}><LogOut size={16} /> Logout</button>
            </div>
          </div>
        </header>

        <div className="schedule-page container">
          {/* Header */}
          <div className="schedule-header">
            <div className="schedule-title">
              <Calendar size={28} className="schedule-title-icon" />
              <div>
                <h2>Work Schedule</h2>
                <p>Track your task deadlines and upcoming work</p>
              </div>
            </div>
            <div className="schedule-view-toggle">
              <button className={view === 'month' ? 'active' : ''} onClick={() => setView('month')}>📅 Calendar</button>
              <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>📋 List View</button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="schedule-stats">
            {[
              { label: 'Total Tasks', value: stats.total, icon: <Clock size={20}/>, color: '#6366f1' },
              { label: 'Pending', value: stats.pending, icon: <Clock size={20}/>, color: '#f59e0b' },
              { label: 'In Progress', value: stats.inProgress, icon: <AlertTriangle size={20}/>, color: '#3b82f6' },
              { label: 'Completed', value: stats.completed, icon: <CheckCircle size={20}/>, color: '#16a34a' },
              { label: 'Overdue', value: stats.overdue, icon: <AlertTriangle size={20}/>, color: '#ef4444' },
            ].map(s => (
              <div key={s.label} className="schedule-stat-card" style={{ borderTopColor: s.color }}>
                <div className="schedule-stat-icon" style={{ color: s.color }}>{s.icon}</div>
                <div className="schedule-stat-num" style={{ color: s.color }}>{s.value}</div>
                <div className="schedule-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="schedule-loading"><div className="schedule-spinner"></div><p>Loading schedule…</p></div>
          ) : view === 'month' ? (
            <div className="schedule-body">
              {/* Calendar */}
              <div className="calendar-panel">
                <div className="calendar-nav">
                  <button onClick={prevMonth}><ChevronLeft size={20}/></button>
                  <h3>{MONTHS[month]} {year}</h3>
                  <button onClick={nextMonth}><ChevronRight size={20}/></button>
                </div>
                <div className="calendar-grid">
                  {DAYS.map(d => <div key={d} className="cal-day-header">{d}</div>)}
                  {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} className="cal-cell empty"/>)}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dayTasks = getTasksForDay(day);
                    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                    const isSelected = selectedDay === day;
                    return (
                      <div
                        key={day}
                        className={`cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''}`}
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                      >
                        <span className="cal-day-num">{day}</span>
                        {dayTasks.slice(0, 2).map(t => (
                          <div key={t._id} className="cal-task-dot" style={{ background: statusConfig[t.computedStatus]?.color || '#6b7280' }}>
                            <span className="cal-task-label">{t.title}</span>
                          </div>
                        ))}
                        {dayTasks.length > 2 && <div className="cal-more">+{dayTasks.length - 2} more</div>}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="calendar-legend">
                  {Object.entries(statusConfig).map(([k, v]) => (
                    <span key={k} className="legend-item">
                      <span className="legend-dot" style={{ background: v.color }}></span>{v.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Day Detail Panel */}
              <div className="schedule-detail-panel">
                {selectedDay ? (
                  <>
                    <h3 className="detail-panel-title">
                      {MONTHS[month]} {selectedDay}, {year}
                      {' '}<span className="detail-task-count">{selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}</span>
                    </h3>
                    {selectedTasks.length === 0 ? (
                      <div className="detail-empty">
                        <CheckCircle size={32} />
                        <p>No tasks due on this day</p>
                      </div>
                    ) : (
                      selectedTasks.map(t => (
                        <div key={t._id} className="detail-task-card" style={{ borderLeftColor: statusConfig[t.computedStatus]?.color }}>
                          <div className="detail-task-header">
                            <h4>{t.title}</h4>
                            <span className="detail-task-status" style={{ background: statusConfig[t.computedStatus]?.bg, color: statusConfig[t.computedStatus]?.color }}>
                              {t.computedStatus}
                            </span>
                          </div>
                          <p className="detail-task-desc">{t.description || 'No description'}</p>
                          <div className="detail-task-meta">
                            <span>Park: {t.parkName || t.park?.name || '—'}</span>
                            <span>Priority: {t.priority || 'Normal'}</span>
                          </div>
                          <Link to={`/contractor/task/${t._id}`} className="detail-task-link">View Details →</Link>
                        </div>
                      ))
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="detail-panel-title">Upcoming Tasks</h3>
                    {upcoming.length === 0 ? (
                      <div className="detail-empty"><CheckCircle size={32}/><p>No upcoming tasks</p></div>
                    ) : upcoming.map(t => (
                      <div key={t._id} className="detail-task-card" style={{ borderLeftColor: statusConfig[t.computedStatus]?.color }}>
                        <div className="detail-task-header">
                          <h4>{t.title}</h4>
                          <span className="detail-task-status" style={{ background: statusConfig[t.computedStatus]?.bg, color: statusConfig[t.computedStatus]?.color }}>
                            {t.computedStatus}
                          </span>
                        </div>
                        <p className="detail-task-meta-line">
                          Due: {t.deadline ? new Date(t.deadline).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                        </p>
                        <Link to={`/contractor/task/${t._id}`} className="detail-task-link">View Details →</Link>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          ) : (
            /* LIST VIEW */
            <div className="schedule-list-view">
              {['Overdue', 'In Progress', 'Pending', 'Completed'].map(status => {
                const grouped = tasks.filter(t => t.computedStatus === status);
                if (grouped.length === 0) return null;
                return (
                  <div key={status} className="list-group">
                    <h3 className="list-group-title" style={{ color: statusConfig[status]?.color }}>
                      <span className="list-group-dot" style={{ background: statusConfig[status]?.color }}></span>
                      {status} <span className="list-group-count">({grouped.length})</span>
                    </h3>
                    {grouped.map(t => (
                      <div key={t._id} className="list-task-row">
                        <div className="list-task-info">
                          <h4>{t.title}</h4>
                          <span>Park: {t.parkName || t.park?.name || '—'} · Due: {t.deadline ? new Date(t.deadline).toLocaleDateString('en-IN') : 'No deadline'}</span>
                        </div>
                        <Link to={`/contractor/task/${t._id}`} className="list-task-btn">View</Link>
                      </div>
                    ))}
                  </div>
                );
              })}
              {tasks.length === 0 && (
                <div className="detail-empty"><CheckCircle size={48}/><p>No tasks assigned yet</p></div>
              )}
            </div>
          )}
        </div>

              </div>
    </div>
  );
};

export default ContractorSchedule;

