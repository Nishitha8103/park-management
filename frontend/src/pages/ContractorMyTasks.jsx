import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Menu, TreePine, HardHat, LogOut, CheckCircle, Wrench, Clock, FileText, AlertTriangle, Eye, Bell, XCircle, RotateCcw } from 'lucide-react';
import './ContractorDashboard.css';

import ContractorSidebar from '../components/ContractorSidebar';
import RequestReassignmentModal from '../components/RequestReassignmentModal';

const ContractorMyTasks = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFilter = searchParams.get('filter');
  const filter = queryFilter ? (queryFilter.charAt(0).toUpperCase() + queryFilter.slice(1)) : 'All';
  const setFilter = (val) => {
    if (val === 'All') {
      searchParams.delete('filter');
    } else {
      searchParams.set('filter', val.toLowerCase());
    }
    setSearchParams(searchParams);
  };
  const [contractor, setContractor] = useState(() => {
    try {
      const stored = localStorage.getItem('contractorUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Rejection state
  const [rejectingJob, setRejectingJob] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Initialize empty jobs array, fetch from backend
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    if (!contractor) {
      navigate('/login');
      return;
    }

    const contractorId = contractor.id || contractor._id;
    if (contractorId) {
      fetch(`/api/complaints?contractorId=${contractorId}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          const list = Array.isArray(data) ? data : [];
          const fetchedJobs = list.map(c => ({
            id: c.complaintNumber,
            _id: c._id,
            park: c.parkName || (c.park ? c.park.name : 'Unknown Park'),
            type: c.category || 'Maintenance',
            desc: c.description,
            priority: c.priority || 'Medium',
            status: c.status ? (c.status.toLowerCase() === 'new' ? 'assigned' : c.status.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) : 'assigned',
            date: new Date(c.createdAt).toLocaleDateString(),
            remarks: c.contractorRemarks || '',
            rejectionReason: c.rejectionReason || ''
          }));
          setJobs(fetchedJobs);
        })
        .catch(err => console.error('Error fetching jobs:', err));
    }
  }, [contractor, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('contractorUser');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const startJob = async (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    try {
      await fetch(`/api/complaints/${job._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'In Progress' })
      });
      setJobs(prevJobs => 
        prevJobs.map(j => 
          j.id === jobId ? { ...j, status: 'in-progress' } : j
        )
      );
    } catch (error) {
      console.error('Error starting job:', error);
    }
  };

  const openRejectModal = (job) => {
    setRejectingJob(job);
    setShowRejectModal(true);
  };

  const handleReassignmentSuccess = () => {
    if (rejectingJob) {
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === rejectingJob.id
            ? { ...job, status: 'reassignment-requested' }
            : job
        )
      );
    }
    setShowRejectModal(false);
    setRejectingJob(null);
  };

  const openCompletionModal = (job) => {
    setSelectedJob(job);
    setRemarks('');
    setShowModal(true);
  };

  const submitCompletion = async () => {
    if (!remarks.trim()) {
      alert("Please enter work completion remarks.");
      return;
    }

    try {
      await fetch(`/api/complaints/${selectedJob._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed', contractorRemarks: remarks, completionDate: new Date() })
      });

      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === selectedJob.id 
            ? { ...job, status: 'completed', remarks: remarks } 
            : job
        )
      );

      setShowModal(false);
      setSelectedJob(null);
    } catch (error) {
      console.error('Error completing job:', error);
    }
  };

  // Stats calculation
  const totalJobs = jobs.length;
  const inProgressJobs = jobs.filter(j => j.status === 'in-progress').length;
  const completedJobs = jobs.filter(j => ['completed', 'completed-waiting-for-admin-review', 'inspection-pending', 'inspection-approved', 'closed'].includes(j.status)).length;
  const pendingJobs = jobs.filter(j => ['assigned', 'reassigned-to-contractor', 'returned-by-admin', 'rework-required'].includes(j.status)).length;

  const filteredJobs = jobs.filter(job => {
    if (filter === 'All') return true;
    if (filter === 'Active') return ['assigned', 'in-progress', 'returned-by-admin', 'rework-required', 'reassigned-to-contractor'].includes(job.status);
    if (filter === 'Progress') return job.status === 'in-progress';
    if (filter === 'Completed') return ['completed', 'completed-waiting-for-admin-review', 'inspection-pending', 'inspection-approved', 'closed'].includes(job.status);
    return true;
  });

  if (!contractor) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 'bold' }}>Verifying authorization...</div>;
  }

  return (
    <div className="contractor-dashboard-page">
      <ContractorSidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        handleLogout={handleLogout} 
        contractor={contractor} 
      />
      
      <div className={`contractor-main-wrapper ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Header bar */}
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

        {/* Main dashboard content */}
        <main className="container contractor-dashboard-container">


        {/* Jobs List Panel */}
        <div className="contractor-main-panel">
          <div className="contractor-panel-header">
            <h3>My Maintenance Jobs</h3>
            <div className="contractor-filters">
              <button 
                className={`contractor-filter-btn ${filter === 'All' ? 'active' : ''}`}
                onClick={() => setFilter('All')}
              >
                All Jobs
              </button>
              <button 
                className={`contractor-filter-btn ${filter === 'Active' ? 'active' : ''}`}
                onClick={() => setFilter('Active')}
              >
                Active ({pendingJobs + inProgressJobs})
              </button>
              <button 
                className={`contractor-filter-btn ${filter === 'Completed' ? 'active' : ''}`}
                onClick={() => setFilter('Completed')}
              >
                Completed ({completedJobs})
              </button>
            </div>
          </div>

          <div className="contractor-table-container">
            {filteredJobs.length > 0 ? (
              <table className="contractor-table">
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Park Name</th>
                    <th>Job Type</th>
                    <th>Description</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map(job => (
                    <tr key={job.id}>
                      <td style={{ fontWeight: 'bold', color: '#1e293b' }}>{job.id}</td>
                      <td style={{ fontWeight: '500' }}>{job.park}</td>
                      <td>{job.type}</td>
                      <td style={{ maxWidth: '300px' }}>{job.desc}</td>
                      <td>
                        <span className={`job-priority-badge ${job.priority.toLowerCase()}`}>
                          {job.priority}
                        </span>
                      </td>
                      <td>
                        <span 
                          className={`job-status-badge ${job.status}`}
                          style={{
                            background: ['returned-by-admin', 'rework-required', 'rejected-by-contractor'].includes(job.status) 
                              ? '#fee2e2' 
                              : job.status === 'reassignment-requested'
                              ? '#fffbeb'
                              : undefined,
                            color: ['returned-by-admin', 'rework-required', 'rejected-by-contractor'].includes(job.status) 
                              ? '#ef4444' 
                              : job.status === 'reassignment-requested'
                              ? '#d97706'
                              : undefined,
                            border: ['returned-by-admin', 'rework-required', 'rejected-by-contractor'].includes(job.status) 
                              ? '1px solid #fca5a5' 
                              : job.status === 'reassignment-requested'
                              ? '1px solid #fde68a'
                              : undefined
                          }}
                        >
                          {['returned-by-admin', 'rework-required'].includes(job.status) 
                            ? 'Rework' 
                            : job.status === 'rejected-by-contractor'
                            ? 'Declined'
                            : job.status === 'reassignment-requested'
                            ? 'Reassignment Requested'
                            : job.status.replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button className="btn-job-action" style={{ background: '#f8fafc', color: '#3b82f6', border: '1px solid #bfdbfe' }} onClick={() => navigate(`/contractor/task/${job.id}`)}>
                          <Eye size={14} /> View
                        </button>
                        {['assigned', 'reassigned-to-contractor'].includes(job.status) && (
                          <>
                            <button className="btn-job-action" onClick={() => startJob(job.id)}>
                              <Clock size={14} /> Accept Task
                            </button>
                            <button className="btn-job-action reject" onClick={() => openRejectModal(job)}>
                              <XCircle size={14} /> Reject Task
                            </button>
                          </>
                        )}
                        {['in-progress', 'returned-by-admin', 'rework-required'].includes(job.status) && (
                          <button className="btn-job-action complete" onClick={() => navigate(`/contractor/progress/${job.id}`)}>
                            <CheckCircle size={14} /> Start Work
                          </button>
                        )}
                        {['completed', 'completed-waiting-for-admin-review', 'inspection-pending', 'inspection-approved', 'closed'].includes(job.status) && (
                          <span style={{ fontSize: '0.85rem', color: '#16a34a', fontStyle: 'italic', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                            Report Submitted
                          </span>
                        )}
                        {job.status === 'reassignment-requested' && (
                          <span style={{ fontSize: '0.85rem', color: '#d97706', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            <RotateCcw size={13} /> Reassignment Pending
                          </span>
                        )}
                        {job.status === 'rejected-by-contractor' && (
                          <span style={{ fontSize: '0.85rem', color: '#dc2626', fontStyle: 'italic', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                            Task Declined
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="contractor-empty-state">
                <FileText size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                <h4>No jobs found</h4>
                <p>There are no jobs matching your filter right now.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Completion proof Modal */}
      {showModal && (
        <div className="contractor-modal-overlay">
          <div className="contractor-modal">
            <h4>Submit Job Completion</h4>
            <div className="contractor-modal-body">
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
                Job <strong>{selectedJob?.id}</strong> at <strong>{selectedJob?.park}</strong>
              </p>
              <div className="contractor-form-group">
                <label className="contractor-input-label">Completion Remarks / Notes</label>
                <textarea 
                  className="contractor-input-field" 
                  rows={4} 
                  placeholder="Describe the maintenance actions completed..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  style={{ resize: 'none', padding: '0.75rem' }}
                />
              </div>
            </div>
            <div className="contractor-modal-actions">
              <button className="btn-modal-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-job-action complete" onClick={submitCompletion}>Submit Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Decline / Reassignment Modal */}
      <RequestReassignmentModal
        isOpen={showRejectModal}
        onClose={() => { setShowRejectModal(false); setRejectingJob(null); }}
        task={rejectingJob}
        user={contractor}
        userRole="contractor"
        onSuccess={handleReassignmentSuccess}
      />

      
      </div>
    </div>
  );
};

export default ContractorMyTasks;

