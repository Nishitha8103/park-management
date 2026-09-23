import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar, 
  RotateCcw, 
  Wrench, 
  Phone, 
  Paperclip, 
  Eye, 
  Menu, 
  TreePine, 
  Bell, 
  LogOut, 
  Play, 
  Edit, 
  Hourglass, 
  X, 
  Flag 
} from 'lucide-react';
import './ContractorTaskDetails.css';
import ContractorSidebar from '../components/ContractorSidebar';
import RequestReassignmentModal from '../components/RequestReassignmentModal';
import { getSlaStatusAndRemaining } from '../utils/slaUtils';

const ContractorTaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('contractorUser');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    try {
      const user = JSON.parse(storedUser);
      setContractor(user);
    } catch (e) {
      console.error(e);
      navigate('/login');
      return;
    }

    if (id) {
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
              reportedBy: c.userName || (c.user && c.user.name) || 'Anonymous (Citizen)',
              reportedPhone: c.userPhone || (c.user && c.user.phone) || 'N/A',
              reportedOn: new Date(c.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
              location: c.locationInPark || 'Not specified',
              assignedOn: new Date(c.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
              dueDate: c.slaDeadline ? new Date(c.slaDeadline).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not Applicable',
              slaData: getSlaStatusAndRemaining(c),
              priority: c.priority || 'Medium',
              assignedBy: 'Admin',
              description: c.description,
              status: c.status,
              reassignmentStatus: c.reassignmentStatus || 'None',
              reassignmentReason: c.reassignmentReason || '',
              reassignmentExplanation: c.reassignmentExplanation || '',
              reassignmentAttachment: c.reassignmentAttachment || '',
              assignmentHistory: c.assignmentHistory || [],
              rawComplaint: c,
              rejectionReason: c.rejectionReason || '',
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
    } else {
      setLoading(false);
    }
  }, [id, navigate]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('contractorUser');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
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

  const rejectTask = async () => {
    if (!task) return;
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for declining the task.");
      return;
    }
    
    try {
      const payload = { 
        status: 'Rejected by Contractor',
        rejectionReason: rejectionReason
      };

      const res = await fetch(`/api/complaints/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert('Task declined successfully.');
        setShowRejectModal(false);
        window.location.reload();
      } else {
        alert('Failed to decline task.');
      }
    } catch (error) {
      console.error(error);
      alert('Error declining task.');
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
              <TreePine size={28} color="#e5ede7" />
              <h1>Parks Monitoring System</h1>
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

        <div className="task-page-body">
          {/* Top navigation row */}
          <div className="task-top-nav">
            <Link to="/contractor/tasks" className="task-back-btn">
              <ArrowLeft size={16} /> Back to My Tasks
            </Link>
          </div>

          {/* Reassignment Pending Banner if applicable */}
          {(task.status === 'Reassignment Requested' || task.reassignmentStatus === 'Reassignment Requested') && (
            <div className="reassign-alert-box">
              <RotateCcw size={20} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 'bold', color: '#92400e', fontSize: '0.9rem' }}>Reassignment Request Pending Review</span>
                  <span style={{ backgroundColor: '#d97706', color: 'white', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '10px', fontWeight: 'bold' }}>PENDING ADMIN</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#78350f' }}>
                  <strong>Reason:</strong> {task.reassignmentReason || 'On Leave / Unavailable'}. {task.reassignmentExplanation && ` Note: "${task.reassignmentExplanation}"`}.
                </p>
              </div>
            </div>
          )}

          {/* Main Card Container (Matching 1st Image) */}
          <div className="task-main-card">
            
            {/* Left Column */}
            <div className="task-card-left">
              {/* Main Image */}
              <div className="task-img-container" onClick={() => setShowImageModal(true)}>
                <img src={task.imageUrl} alt="Task Media" className="task-feature-img" />
              </div>

              {/* Meta items stack with green icons */}
              <div className="task-meta-list">
                <div className="task-meta-item">
                  <div className="task-meta-icon"><User size={20} color="#15803d" /></div>
                  <div className="task-meta-data">
                    <span className="task-meta-heading">Issue Reported By</span>
                    <span className="task-meta-content">{task.reportedBy}</span>
                    {task.reportedPhone && task.reportedPhone !== 'N/A' && (
                      <span className="task-meta-subtext"><Phone size={12} /> {task.reportedPhone}</span>
                    )}
                  </div>
                </div>

                <div className="task-meta-item">
                  <div className="task-meta-icon"><Calendar size={20} color="#15803d" /></div>
                  <div className="task-meta-data">
                    <span className="task-meta-heading">Reported On</span>
                    <span className="task-meta-content">{task.reportedOn}</span>
                  </div>
                </div>

                <div className="task-meta-item">
                  <div className="task-meta-icon"><MapPin size={20} color="#15803d" /></div>
                  <div className="task-meta-data">
                    <span className="task-meta-heading">Location</span>
                    <span className="task-meta-content">{task.location}, {task.parkName}</span>
                  </div>
                </div>

                {task.allImages && task.allImages.length > 0 && (
                  <div className="task-meta-item">
                    <div className="task-meta-icon"><Paperclip size={20} color="#15803d" /></div>
                    <div className="task-meta-data">
                      <span className="task-meta-heading">Attachments</span>
                      <div className="task-attachments-row">
                        <div className="task-attachment-thumb" onClick={() => setShowImageModal(true)}>
                          <img src={task.allImages[0]} alt="attachment" />
                        </div>
                        {task.allImages.length > 1 && (
                          <div className="task-attachment-more" onClick={() => setShowImageModal(true)}>
                            +{task.allImages.length - 1}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="task-card-right">
              
              {/* Status Badge */}
              <div className="task-status-badge-wrapper">
                <div className={`ref-status-pill status-${task.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Hourglass size={15} />
                  <span>
                    {['Returned by Admin', 'Rework Required'].includes(task.status) 
                      ? 'Rework Required' 
                      : task.status === 'Rejected by Contractor' 
                      ? 'Declined by You' 
                      : task.status}
                  </span>
                </div>
              </div>

              {/* Titles */}
              <div className="task-titles-block">
                <h1 className="task-code-id">{task.id}</h1>
                <h2 className="task-park-headline">{task.parkName} {task.zone && task.zone !== 'Not specified' ? `- ${task.zone}` : ''}</h2>
                <h3 className="task-issue-category">{task.issueTitle}</h3>
              </div>

              {/* Key Value Details Table */}
              <div className="task-info-table">
                <div className="task-info-row">
                  <div className="task-info-label">
                    <Calendar size={18} />
                    <span>Assigned On</span>
                  </div>
                  <div className="task-info-value">{task.assignedOn}</div>
                </div>

                <div className="task-info-row">
                  <div className="task-info-label">
                    <Calendar size={18} />
                    <span>Due Date</span>
                  </div>
                  <div className="task-info-value">{task.dueDate ? task.dueDate.split(',')[0] : 'Not Applicable'}</div>
                </div>

                <div className="task-info-row">
                  <div className="task-info-label">
                    <Flag size={18} />
                    <span>Priority</span>
                  </div>
                  <div className="task-info-value">
                    <span className={`ref-priority-badge ${task.priority?.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>

                <div className="task-info-row">
                  <div className="task-info-label">
                    <User size={18} />
                    <span>Assigned By</span>
                  </div>
                  <div className="task-info-value">{task.assignedBy}</div>
                </div>

                <div className="task-info-desc-row">
                  <div className="task-info-label">
                    <FileText size={18} />
                    <span>Description</span>
                  </div>
                  <div className="task-desc-paragraph">
                    {task.description || "No detailed description was provided by the reporter."}
                  </div>
                </div>
              </div>

              {/* Work Progress & Action Card */}
              <div className="ref-progress-box">
                <div className="ref-progress-header">
                  <span className="ref-progress-title">Work Progress</span>
                  <div className="ref-progress-bar-wrap">
                    <div className="ref-progress-track">
                      <div className="ref-progress-fill" style={{ width: `${task.progress}%` }}></div>
                    </div>
                    <span className="ref-progress-num">{task.progress}%</span>
                  </div>
                </div>

                {/* All Action Buttons preserved */}
                <div className="ref-actions-container">
                  {['Assigned', 'Reassigned to Contractor', 'assigned', 'reassigned to contractor'].includes(task.status) ? (
                    <div className="ref-buttons-group">
                      <button className="ref-btn-primary" onClick={acceptTask}>
                        <Play size={16} /> Accept Task
                      </button>
                      <button 
                        type="button"
                        className="ref-btn-secondary"
                        onClick={() => setShowReassignModal(true)}
                      >
                        <RotateCcw size={16} /> Cannot Complete
                      </button>
                    </div>
                  ) : ['In Progress', 'Returned by Admin', 'Rework Required'].includes(task.status) ? (
                    <div className="ref-buttons-group">
                      <Link to={`/contractor/progress/${task.id}`} className="ref-btn-primary">
                        <Edit size={16} /> Update Work Progress
                      </Link>
                      <button 
                        type="button"
                        className="ref-btn-secondary"
                        onClick={() => setShowReassignModal(true)}
                      >
                        <RotateCcw size={16} /> Cannot Complete
                      </button>
                    </div>
                  ) : task.status === 'Reassignment Requested' ? (
                    <div className="ref-state-banner warn">
                      <RotateCcw size={18} />
                      <span>Reassignment Requested — Awaiting Admin</span>
                    </div>
                  ) : task.status === 'Rejected by Contractor' ? (
                    <div>
                      <div className="ref-state-banner danger">
                        <X size={18} />
                        <span>Task Declined by You</span>
                      </div>
                      {task.rejectionReason && (
                        <div className="ref-reason-box">
                          <strong>Reason:</strong> {task.rejectionReason}
                        </div>
                      )}
                    </div>
                  ) : task.status === 'Closed' ? (
                    <div className="ref-closed-group">
                      <div className="ref-state-banner success">
                        <CheckCircle size={18} />
                        <span>Task Closed & Verified</span>
                      </div>
                      <Link to={`/contractor/reports/${task._id}`} className="ref-btn-secondary">
                        <FileText size={16} /> Download Report
                      </Link>
                    </div>
                  ) : (
                    <div className="ref-state-banner success">
                      <CheckCircle size={18} />
                      <span>Completion Submitted - Pending Review</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Request Reassignment Modal */}
      <RequestReassignmentModal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        task={task.rawComplaint || { _id: task._id, complaintNumber: task.id, category: task.issueTitle, parkName: task.parkName }}
        user={contractor}
        userRole="contractor"
        onSuccess={() => {
          alert('Reassignment request submitted successfully to Administrator.');
          window.location.reload();
        }}
      />

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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="contractor-image-modal-overlay" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle color="#dc2626" size={24} /> Decline Task
            </h3>
            <p style={{ color: '#475569', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Are you sure you want to decline this task? Please provide a reason so the admin can reassign it appropriately.
            </p>
            <textarea
              placeholder="Reason for declining..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{ width: '100%', minHeight: '100px', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '1.5rem', fontFamily: 'inherit', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => setShowRejectModal(false)}
                style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancel
              </button>
              <button 
                onClick={rejectTask}
                style={{ padding: '10px 16px', background: '#dc2626', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorTaskDetails;

