import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertTriangle, ShieldCheck, Filter, List, Grid, MapPin, Eye, FileText, UserCheck, CheckCircle2 } from 'lucide-react';
import './GovWorkSchedule.css';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const statusConfig = {
  'Inspection Pending': { color: '#ea580c', bg: '#ffedd5', label: 'Inspection Pending' },
  'In Progress':       { color: '#2563eb', bg: '#eff6ff', label: 'In Progress' },
  'Verified':          { color: '#16a34a', bg: '#dcfce7', label: 'Verified & Closed' },
  'Overdue':           { color: '#ef4444', bg: '#fef2f2', label: 'Overdue SLA' },
  'Assigned':          { color: '#8b5cf6', bg: '#f3e8ff', label: 'Assigned to Contractor' }
};

const GovWorkSchedule = () => {
  const navigate = useNavigate();
  const [govUser, setGovUser] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [view, setView] = useState('month'); // 'month' | 'list'
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    const stored = localStorage.getItem('govUser');
    if (!stored) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(stored);
    setGovUser(user);

    const userId = user._id || user.id;
    fetch(`/api/complaints?officialId=${userId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        const now = new Date();
        
        const mapped = list.map(c => {
          const isVerified = ['Verified', 'Closed', 'Inspection Approved'].includes(c.status);
          const isInspectionPending = ['Inspection Pending', 'Completed', 'Completed - Waiting for Admin Review'].includes(c.status);
          const isInProgress = ['In Progress', 'Reassigned to Contractor', 'Rework Required'].includes(c.status);
          
          const rawDeadline = c.slaDeadline || c.targetResolutionDate;
          const deadlineDate = rawDeadline ? new Date(rawDeadline) : (c.createdAt ? new Date(new Date(c.createdAt).getTime() + 48 * 3600 * 1000) : new Date());

          let computedStatus = 'Assigned';
          if (isVerified) {
            computedStatus = 'Verified';
          } else if (deadlineDate < now && !isVerified) {
            computedStatus = 'Overdue';
          } else if (isInspectionPending) {
            computedStatus = 'Inspection Pending';
          } else if (isInProgress) {
            computedStatus = 'In Progress';
          }

          return {
            _id: c._id,
            complaintNumber: c.complaintNumber,
            title: `Inspection #${c.complaintNumber} - ${c.category || 'Park Maintenance'}`,
            parkName: c.parkName || (c.park && c.park.name ? c.park.name : 'Assigned Park'),
            category: c.category || 'General',
            priority: c.priority || 'Medium',
            status: c.status || 'Assigned',
            computedStatus,
            deadline: deadlineDate,
            description: c.description || 'No description provided.',
            contractorName: c.assignedContractor ? c.assignedContractor.name : 'Assigned Contractor',
            locationInPark: c.locationInPark || 'Park Premises'
          };
        });
        setInspections(mapped);
      })
      .catch(err => {
        console.error('Error fetching official schedule:', err);
        setInspections([]);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getInspectionsForDay = (day) => {
    return inspections.filter(t => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const isToday = (day) => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  // Selected day items or all filtered items for list view
  const filteredList = inspections.filter(item => {
    if (filterStatus === 'All') return true;
    return item.computedStatus === filterStatus;
  });

  const selectedDayItems = selectedDay ? getInspectionsForDay(selectedDay) : [];

  if (loading) return (
    <div className="gov-schedule-loading">
      <div className="gov-spinner"></div>
      <p>Loading Official Work Schedule...</p>
    </div>
  );

  return (
    <div className="gov-schedule-page">
      
      {/* Header Banner */}
      <div className="gov-schedule-header">
        <div className="gov-header-title-box">
          <span className="gov-badge-pill">
            <CalendarIcon size={14} /> OFFICIAL INSPECTION SCHEDULE
          </span>
          <h2>Government Work & Inspection Schedule</h2>
          <p>Track inspection deadlines, contractor completion milestones, and SLA targets across parks.</p>
        </div>

        <div className="gov-header-actions">
          <div className="view-toggle-btns">
            <button 
              className={`btn-view-toggle ${view === 'month' ? 'active' : ''}`}
              onClick={() => setView('month')}
            >
              <Grid size={16} /> Calendar View
            </button>
            <button 
              className={`btn-view-toggle ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              <List size={16} /> List View
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="gov-schedule-kpi-grid">
        <div className="kpi-card kpi-total">
          <div className="kpi-icon"><CalendarIcon size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-val">{inspections.length}</span>
            <span className="kpi-label">Total Scheduled</span>
          </div>
        </div>

        <div className="kpi-card kpi-pending">
          <div className="kpi-icon"><Clock size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-val">{inspections.filter(i => i.computedStatus === 'Inspection Pending').length}</span>
            <span className="kpi-label">Inspection Pending</span>
          </div>
        </div>

        <div className="kpi-card kpi-verified">
          <div className="kpi-icon"><ShieldCheck size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-val">{inspections.filter(i => i.computedStatus === 'Verified').length}</span>
            <span className="kpi-label">Verified & Closed</span>
          </div>
        </div>

        <div className="kpi-card kpi-overdue">
          <div className="kpi-icon"><AlertTriangle size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-val">{inspections.filter(i => i.computedStatus === 'Overdue').length}</span>
            <span className="kpi-label">SLA Overdue</span>
          </div>
        </div>
      </div>

      {/* View Content: Calendar or List */}
      {view === 'month' ? (
        <div className="gov-calendar-layout">
          
          {/* Calendar Box */}
          <div className="gov-calendar-card">
            
            {/* Calendar Controls */}
            <div className="calendar-nav-bar">
              <div className="month-title-group">
                <h3>{MONTHS[month]} {year}</h3>
                <button className="btn-today" onClick={() => { setCurrentDate(new Date()); setSelectedDay(today.getDate()); }}>
                  Jump to Today
                </button>
              </div>

              <div className="month-arrows">
                <button onClick={prevMonth} className="btn-nav-month" title="Previous Month">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={nextMonth} className="btn-nav-month" title="Next Month">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Calendar Grid Header */}
            <div className="calendar-weekdays-grid">
              {DAYS.map(day => (
                <div key={day} className="weekday-cell">{day}</div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="calendar-days-grid">
              {/* Empty cells before 1st day */}
              {Array.from({ length: firstDay }).map((_, idx) => (
                <div key={`empty-${idx}`} className="day-cell empty"></div>
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dayTasks = getInspectionsForDay(dayNum);
                const isSelected = selectedDay === dayNum;
                const currentToday = isToday(dayNum);

                return (
                  <div 
                    key={`day-${dayNum}`}
                    className={`day-cell ${currentToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${dayTasks.length > 0 ? 'has-tasks' : ''}`}
                    onClick={() => setSelectedDay(dayNum)}
                  >
                    <div className="day-number-row">
                      <span className="day-number">{dayNum}</span>
                      {currentToday && <span className="today-badge">TODAY</span>}
                    </div>

                    <div className="day-tasks-container">
                      {dayTasks.slice(0, 2).map((task, tIdx) => {
                        const conf = statusConfig[task.computedStatus] || statusConfig['Assigned'];
                        return (
                          <div 
                            key={tIdx} 
                            className="mini-task-pill"
                            style={{ backgroundColor: conf.bg, color: conf.color }}
                            title={task.title}
                          >
                            <span className="dot" style={{ backgroundColor: conf.color }}></span>
                            <span className="task-pill-text">{task.parkName}</span>
                          </div>
                        );
                      })}
                      {dayTasks.length > 2 && (
                        <div className="mini-task-more">+{dayTasks.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Date Inspector Sidebar Panel */}
          <div className="gov-date-panel-card">
            <div className="date-panel-header">
              <CalendarIcon size={18} className="text-emerald" />
              <h4>
                {selectedDay 
                  ? `${MONTHS[month]} ${selectedDay}, ${year}` 
                  : 'Upcoming Inspection Watchlist'}
              </h4>
            </div>

            <div className="date-panel-body">
              {selectedDay ? (
                selectedDayItems.length > 0 ? (
                  <div className="inspections-list-stack">
                    {selectedDayItems.map(item => {
                      const conf = statusConfig[item.computedStatus] || statusConfig['Assigned'];
                      return (
                        <div key={item._id} className="schedule-item-card">
                          <div className="item-header-row">
                            <span className="item-status-pill" style={{ backgroundColor: conf.bg, color: conf.color }}>
                              {conf.label}
                            </span>
                            <span className={`priority-tag-inline ${item.priority.toLowerCase()}`}>
                              {item.priority} Priority
                            </span>
                          </div>

                          <h5 className="item-title">{item.title}</h5>
                          <p className="item-location"><MapPin size={13} /> {item.parkName} ({item.locationInPark})</p>
                          <p className="item-contractor"><UserCheck size={13} /> Contractor: <strong>{item.contractorName}</strong></p>

                          <div className="item-actions-row">
                            {item.computedStatus === 'Inspection Pending' ? (
                              <Link to={`/gov-dashboard/verify-work/${item._id}`} className="btn-item-action verify">
                                <ShieldCheck size={14} /> Conduct Inspection
                              </Link>
                            ) : (
                              <Link to={`/gov-dashboard/inspections/${item._id}`} className="btn-item-action details">
                                <Eye size={14} /> View Details
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-inspections-box">
                    <CheckCircle2 size={32} className="text-emerald" />
                    <p>No specific inspections scheduled for this date.</p>
                    <button className="btn-reset-date" onClick={() => setSelectedDay(null)}>
                      View All Upcoming
                    </button>
                  </div>
                )
              ) : (
                <div className="inspections-list-stack">
                  <div className="panel-sub-header">
                    <span>Priority Inspections ({inspections.slice(0, 4).length})</span>
                    <small>Auto-sorted by SLA target</small>
                  </div>

                  {inspections.slice(0, 4).map(item => {
                    const conf = statusConfig[item.computedStatus] || statusConfig['Assigned'];
                    return (
                      <div key={item._id} className="schedule-item-card">
                        <div className="item-header-row">
                          <span className="item-status-pill" style={{ backgroundColor: conf.bg, color: conf.color }}>
                            {conf.label}
                          </span>
                          <span className={`priority-tag-inline ${item.priority.toLowerCase()}`}>
                            {item.priority}
                          </span>
                        </div>

                        <h5 className="item-title">{item.title}</h5>
                        <p className="item-location"><MapPin size={13} /> {item.parkName}</p>
                        <p className="item-contractor"><Clock size={13} /> Target: {item.deadline.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>

                        <div className="item-actions-row">
                          {item.computedStatus === 'Inspection Pending' ? (
                            <Link to={`/gov-dashboard/verify-work/${item._id}`} className="btn-item-action verify">
                              <ShieldCheck size={14} /> Conduct Inspection
                            </Link>
                          ) : (
                            <Link to={`/gov-dashboard/inspections/${item._id}`} className="btn-item-action details">
                              <Eye size={14} /> View Details
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {inspections.length === 0 && (
                    <div className="no-inspections-box">
                      <CalendarIcon size={32} />
                      <p>No upcoming inspections in watchlist.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Action Footer */}
            <div className="date-panel-footer">
              <Link to="/gov-dashboard/my-inspections" className="btn-panel-footer">
                <FileText size={15} /> All Assigned Inspections ({inspections.length})
              </Link>
            </div>
          </div>

        </div>
      ) : (
        /* List View */
        <div className="gov-list-layout-card">
          <div className="list-filter-bar">
            <div className="filter-title">
              <Filter size={16} />
              <span>Filter Status:</span>
            </div>

            <div className="filter-chips">
              {['All', 'Inspection Pending', 'In Progress', 'Verified', 'Overdue'].map(st => (
                <button 
                  key={st} 
                  className={`btn-filter-chip ${filterStatus === st ? 'active' : ''}`}
                  onClick={() => setFilterStatus(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="schedule-table-container">
            <table className="gov-schedule-table">
              <thead>
                <tr>
                  <th>Ticket ID & Title</th>
                  <th>Park & Location</th>
                  <th>Assigned Contractor</th>
                  <th>SLA Target Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(item => {
                  const conf = statusConfig[item.computedStatus] || statusConfig['Assigned'];
                  return (
                    <tr key={item._id}>
                      <td>
                        <div className="table-ticket-cell">
                          <span className="ticket-id">{item.complaintNumber}</span>
                          <span className="ticket-cat">{item.category}</span>
                        </div>
                      </td>
                      <td>
                        <div className="table-park-cell">
                          <strong>{item.parkName}</strong>
                          <span>{item.locationInPark}</span>
                        </div>
                      </td>
                      <td>{item.contractorName}</td>
                      <td>
                        <div className="table-date-cell">
                          <Clock size={13} /> {item.deadline.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        <span className="status-pill-table" style={{ backgroundColor: conf.bg, color: conf.color }}>
                          {conf.label}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          {item.computedStatus === 'Inspection Pending' ? (
                            <Link to={`/gov-dashboard/verify-work/${item._id}`} className="btn-table-action action-verify">
                              <ShieldCheck size={14} /> Verify Work
                            </Link>
                          ) : (
                            <Link to={`/gov-dashboard/inspections/${item._id}`} className="btn-table-action action-view">
                              <Eye size={14} /> View
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      No inspection records match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default GovWorkSchedule;
