import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Menu, LogOut, ArrowLeft, User, Calendar, MapPin, Paperclip, Hourglass, Edit, Play, HardHat, FileText, Bell, Phone, Clock, AlertTriangle, CheckCircle, Tag, ExternalLink, Eye, ShieldAlert, Wrench, X } from 'lucide-react';
import './ContractorTaskDetails.css';
import ContractorSidebar from '../components/ContractorSidebar';
import { getSlaStatusAndRemaining } from '../utils/slaUtils';

const ContractorTaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('contractorUser');
    if (!storedUser) {
      navigate('/contractor/login');
    } else {
      setContractor(JSON.parse(storedUser));
    }
  }, [navigate]);

  useEffect(() => {
    const contractorId = contractor?.id || contractor?._id;
    if (contractorId && id) {
      const fetchTask = async () => {
        try {
          const res = await fetch(`/api/complaints/${id}`);
          if (res.ok) {
            const c = await res.json();
            setTask({
              id: c.complaintNumber,
              _id: c._id,
              parkName: c.parkName || (c.park ? c.park.name : 'Unknown Park'),
              parkLatitude: c.park ? c.park.latitude : null,
              parkLongitude: c.park ? c.park.longitude : null,
              zone: c.park?.zone?.name || c.zone || 'Not specified',
              district: c.park?.district?.name || c.district || 'Not specified',
              ward: c.park?.ward?.name || c.ward || 'Not specified',
              issueTitle: c.category || 'Maintenance Issue',
              reportedBy: (c.user && c.user.name) || c.userName || 'Anonymous (Citizen)',
              reportedPhone: (c.user && c.user.phone) || c.userPhone || 'N/A',
              reportedOn: new Date(c.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
              location: c.locationInPark || 'Not specified',
              assignedOn: new Date(c.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
              dueDate: c.slaDeadline ? new Date(c.slaDeadline).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not Applicable',
              slaData: getSlaStatusAndRemaining(c),
              priority: c.priority || 'Medium',
              assignedBy: 'Admin',
              description: c.description,
              status: c.status,
              progress: (() => {
                if (['Completed', 'Completed - Waiting for Admin Review', 'Inspection Pending', 'Inspection Approved', 'Verified', 'Closed'].includes(c.status)) return 100;
                if (['Returned by Admin', 'Rework Required'].includes(c.status)) return 60;
                if (['In Progress'].includes(c.status)) {
                  let p = 30;
                  if (c.contractorRemarks && c.contractorRemarks.trim()) p += 20;
                  if (c.afterImages && c.afterImages.length > 0) p += 25;
                  if (c.afterImagesLocation && c.afterImagesLocation.latitude) p += 10;
                  return Math.min(p, 95);
                }
                if (c.status === 'Assigned' || c.status === 'Reassigned to Contractor') return 10;
                return 10;
              })(),
              imageUrl: c.images && c.images.length > 0 ? `${c.images[0]}` : 'https://images.unsplash.com/photo-1618386230491-9e7ec78eb265?q=80&w=2000&auto=format&fit=crop',
              allImages: c.images && c.images.length > 0 ? c.images : ['https://images.unsplash.com/photo-1618386230491-9e7ec78eb265?q=80&w=2000&auto=format&fit=crop']
            });
          }
        } catch (error) {
          console.error('Error fetching task details:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchTask();
    }
  }, [contractor, id]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('contractorUser');
    navigate('/contractor/login');
  };

  const acceptTask = async () => {
    if (!task) return;
    
    try {
      const payload = { 
        status: 'In Progress'
      };

      const res = await fetch(`/api/complaints/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.status === 403) {
         const errData = await res.json();
         alert(errData.message || 'Error accepting task');
         return;
      }
      
      if (res.ok) {
        alert('Task accepted successfully!');
        window.location.reload();
      } else {
        alert('Failed to accept task.');
      }
    } catch (error) {
      console.error(error);
      alert('Error accepting task.');
    }
  };

  if (!contractor) return null;
  if (loading) return (
    <div className="contractor-loading-screen">
      <div className="loading-spinner"></div>
      <p>Loading task details...</p>
    </div>
  );
  if (!task) return (
    <div className="contractor-error-screen">
      <AlertTriangle size={48} />
      <h3>Task Not Found</h3>
      <p>The requested task ID could not be located.</p>
      <Link to="/contractor/tasks" className="btn-back-link">Back to Tasks</Link>
    </div>
  );

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
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 5px', borderRadius: '10px', minWidth: '16px', textAlign: 'center' }}>3</span>
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

        <div className="contractor-task-details-page">
          <div className="contractor-task-details-container">
            
            {/* Header Navigation Banner */}
            <div className="task-details-header-row">
              <div className="header-title-box">
                <span className="task-portal-badge">
                  <Wrench size={14} /> MAINTENANCE TASK DOSSIER
                </span>
                <h2 className="task-page-title">Task Specification & Execution Details</h2>
                <p className="task-page-subtitle">Complete ticket instructions, location parameters, and progress actions.</p>
              </div>
              <Link to="/contractor/tasks" className="btn-back-link">
                <ArrowLeft size={16} />
                Back to My Tasks
              </Link>
            </div>

            {/* Main Container Card */}
            <div className="task-container-card">
              
              {/* Left Column: Image & Reporter Info */}
              <div className="task-left-col">
                <div className="task-image-card">
                  <div className="image-wrapper" onClick={() => setShowImageModal(true)}>
                    <img src={task.imageUrl} alt="Task Media" className="task-main-img" />
                    <div className="image-hover-overlay">
                      <Eye size={24} />
                      <span>Click to view full photo</span>
                    </div>
                  </div>
                  <div className="image-badge">
                    <Paperclip size={13} /> {task.allImages.length} Photo{task.allImages.length > 1 ? 's' : ''} Attached
                  </div>
                </div>
                
                <div className="task-meta-stack">
                  <div className="meta-card">
                    <div className="meta-card-icon-box user-icon-box">
                      <User size={20} />
                    </div>
                    <div className="meta-card-content">
                      <span className="meta-card-label">Issue Reported By</span>
                      <p className="meta-card-value">{task.reportedBy}</p>
                      {task.reportedPhone !== 'N/A' && (
                        <span className="meta-card-sub"><Phone size={12} /> {task.reportedPhone}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="meta-card">
                    <div className="meta-card-icon-box calendar-icon-box">
                      <Calendar size={20} />
                    </div>
                    <div className="meta-card-content">
                      <span className="meta-card-label">Reported Date & Time</span>
                      <p className="meta-card-value">{task.reportedOn}</p>
                    </div>
                  </div>
                  
                  <div className="meta-card">
                    <div className="meta-card-icon-box location-icon-box">
                      <MapPin size={20} />
                    </div>
                    <div className="meta-card-content">
                      <span className="meta-card-label">Exact Location</span>
                      <p className="meta-card-value">{task.location}</p>
                      <span className="meta-card-sub park-sub">{task.parkName}</span>
                    </div>
                  </div>
                  
                  {task.allImages.length > 0 && (
                    <div className="meta-card attachments-card">
                      <div className="meta-card-icon-box attachment-icon-box">
                        <Paperclip size={20} />
                      </div>
                      <div className="meta-card-content">
                        <span className="meta-card-label">Media Attachments</span>
                        <div className="attachments-row">
                          {task.allImages.slice(0, 3).map((img, idx) => (
                            <div key={idx} className="attachment-thumb" onClick={() => setShowImageModal(true)}>
                              <img src={img} alt={`thumb-${idx}`} />
                            </div>
                          ))}
                          {task.allImages.length > 3 && (
                            <div className="attachment-more" onClick={() => setShowImageModal(true)}>
                              +{task.allImages.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Ticket Overview & Controls */}
              <div className="task-right-col">
                
                {/* Header Pills Row */}
                <div className="task-pills-row">
                  <div className={`task-status-pill status-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Hourglass size={14} /> 
                    {['Returned by Admin', 'Rework Required'].includes(task.status) ? 'Rework Required' : task.status}
                  </div>

                  <div className={`task-priority-pill priority-${task.priority.toLowerCase()}`}>
                    <ShieldAlert size={14} /> Priority: {task.priority}
                  </div>

                  <div className="task-category-pill">
                    <Tag size={13} /> {task.issueTitle}
                  </div>
                </div>

                {/* ID & Park Info */}
                <div className="task-title-group">
                  <h1 className="task-id">{task.id}</h1>
                  <h2 className="task-park-zone">{task.parkName}</h2>
                  <p className="task-location-sub"><MapPin size={14} /> Zone: {task.zone} | Ward: {task.ward}</p>
                </div>

                {/* Info Cards Grid */}
                <div className="task-params-grid">
                  <div className="param-card">
                    <div className="param-card-icon"><Calendar size={18} /></div>
                    <div className="param-card-info">
                      <span className="param-card-label">Assigned On</span>
                      <span className="param-card-val">{task.assignedOn}</span>
                    </div>
                  </div>

                  <div className="param-card highlight-due">
                    <div className="param-card-icon"><Clock size={18} /></div>
                    <div className="param-card-info">
                      <span className="param-card-label">Target Due Date</span>
                      <span className="param-card-val">{task.dueDate.split(',')[0]}</span>
                    </div>
                  </div>

                  <div className="param-card">
                    <div className="param-card-icon"><ShieldAlert size={18} /></div>
                    <div className="param-card-info">
                      <span className="param-card-label">Priority Level</span>
                      <span className={`priority-tag-inline ${task.priority.toLowerCase()}`}>{task.priority}</span>
                    </div>
                  </div>

                  <div className="param-card">
                    <div className="param-card-icon"><User size={18} /></div>
                    <div className="param-card-info">
                      <span className="param-card-label">Assigned By</span>
                      <span className="param-card-val">{task.assignedBy}</span>
                    </div>
                  </div>
                </div>

                {/* Description Card */}
                <div className="task-desc-card">
                  <div className="desc-card-header">
                    <FileText size={18} />
                    <span>Issue Description</span>
                  </div>
                  <p className="desc-card-body">{task.description || "No detailed description was provided by the reporter."}</p>
                </div>

                {/* Progress & Action Container */}
                <div className="task-action-card">
                  <div className="action-card-header">
                    <h4>Work Execution Progress</h4>
                    <span className="progress-percentage">{task.progress}%</span>
                  </div>

                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${task.progress}%` }}>
                      <div className="progress-glow"></div>
                    </div>
                  </div>
                  
                  <div className="action-buttons-row">
                    {['Assigned', 'Reassigned to Contractor'].includes(task.status) ? (
                      <button className="btn-action-primary accept" onClick={acceptTask}>
                        <Play size={18} /> Accept Task & Commence Work
                      </button>
                    ) : ['In Progress', 'Returned by Admin', 'Rework Required'].includes(task.status) ? (
                      <Link to={`/contractor/progress/${task.id}`} className="btn-action-primary progress-btn">
                        <Edit size={18} /> Start & Update Work Progress
                      </Link>
                    ) : task.status === 'Closed' ? (
                      <div className="completion-action-group">
                        <div className="completion-badge-full">
                          <CheckCircle size={20} />
                          <span>Task Closed & Verified</span>
                        </div>
                        <Link to={`/contractor/reports/${task._id}`} className="btn-action-secondary">
                          <FileText size={18} /> Download Work Completion Report
                        </Link>
                      </div>
                    ) : (
                      <div className="completion-badge-full">
                        <CheckCircle size={20} />
                        <span>Completion Submitted - Pending Review</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Image Modal Lightbox */}
      {showImageModal && (
        <div className="contractor-image-modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="contractor-image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowImageModal(false)}>
              <X size={24} />
            </button>
            <img src={task.imageUrl} alt="Enlarged Task Media" className="modal-full-image" />
            <div className="modal-caption">
              <span>{task.id} - {task.issueTitle}</span>
              <p>{task.location}, {task.parkName}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorTaskDetails;
