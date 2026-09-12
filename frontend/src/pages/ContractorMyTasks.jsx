import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Menu, HardHat, LogOut, CheckCircle, Wrench, Clock, FileText, AlertTriangle, Eye, Bell, XCircle } from 'lucide-react';
import './ContractorDashboard.css';

import ContractorSidebar from '../components/ContractorSidebar';

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
  const [contractor, setContractor] = useState(null);
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
    const storedUser = localStorage.getItem('contractorUser');
    if (!storedUser) {
      navigate('/contractor/login');
    } else {
      setContractor(JSON.parse(storedUser));
    }
  }, [navigate]);

  useEffect(() => {
    const contractorId = contractor?.id || contractor?._id;
    if (contractorId) {
      const fetchJobs = async () => {
        try {
          const res = await fetch(`/api/complaints?contractorId=${contractorId}`);
          if (res.ok) {
            const data = await res.json();
            const fetchedJobs = data.map(c => ({
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
          }
        } catch (error) {
          console.error('Error fetching jobs:', error);
        }
      };
      fetchJobs();
    }
  }, [contractor]);

  const handleLogout = () => {
    localStorage.removeItem('contractorUser');
    navigate('/contractor/login');
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
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for declining/rejecting this task.");
      return;
    }

    setIsSubmittingReject(true);
    try {
      const res = await fetch(`/api/complaints/${rejectingJob._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Rejected by Contractor',
          rejectionReason: rejectionReason.trim()
        })
      });

      if (res.ok) {
        setJobs(prevJobs =>
          prevJobs.map(job =>
            job.id === rejectingJob.id
              ? { ...job, status: 'rejected-by-contractor', rejectionReason: rejectionReason.trim() }
              : job
          )
        );
        setShowRejectModal(false);
        setRejectingJob(null);
        alert('Task has been declined/rejected successfully. Admin will be notified.');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to decline task.');
      }
    } catch (error) {
      console.error('Error declining task:', error);
      alert('Error declining task.');
    } finally {
      setIsSubmittingReject(false);
    }
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
                            background: ['returned-by-admin', 'rework-required', 'rejected-by-contractor'].includes(job.status) ? '#fee2e2' : undefined,
                            color: ['returned-by-admin', 'rework-required', 'rejected-by-contractor'].includes(job.status) ? '#ef4444' : undefined,
                            border: ['returned-by-admin', 'rework-required', 'rejected-by-contractor'].includes(job.status) ? '1px solid #fca5a5' : undefined
                          }}
                        >
                          {['returned-by-admin', 'rework-required'].includes(job.status) 
                            ? 'Rework' 
                            : job.status === 'rejected-by-contractor'
                            ? 'Declined'
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

      {/* Reject / Decline Modal */}
      {showRejectModal && (
        <div className="contractor-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="contractor-modal" onClick={(e) => e.stopPropagation()}>
            <h4 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} color="#dc2626" /> Decline / Reject Task
            </h4>
            <div className="contractor-modal-body">
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>
                Job <strong>{rejectingJob?.id}</strong> at <strong>{rejectingJob?.park}</strong>
              </p>
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', lineHeight: '1.4' }}>
                Are you sure you want to decline this task? Please provide a reason so the administrator can reassign it appropriately.
              </p>
              <div className="contractor-form-group">
                <label className="contractor-input-label">Reason for Rejection *</label>
                <textarea 
                  className="contractor-input-field" 
                  rows={4} 
                  placeholder="e.g., Specialized tools unavailable, schedule conflict, outside service capacity..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{ resize: 'none', padding: '0.75rem' }}
                  autoFocus
                />
              </div>
            </div>
            <div className="contractor-modal-actions">
              <button 
                className="btn-modal-cancel" 
                onClick={() => { setShowRejectModal(false); setRejectingJob(null); }}
              >
                Cancel
              </button>
              <button 
                className="btn-job-action" 
                style={{ background: '#dc2626', color: '#ffffff', borderColor: '#dc2626', padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}
                onClick={submitRejection}
                disabled={isSubmittingReject}
              >
                {isSubmittingReject ? 'Declining...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      
      </div>
    </div>
  );
};

export default ContractorMyTasks;
