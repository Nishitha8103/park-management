import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, User, MessageSquare, CheckCircle, ShieldAlert, Clock, MapPin, Image as ImageIcon, Download, Eye, X, Award, FileCheck, Menu, LogOut, HardHat, Bell, CheckCircle2, ShieldCheck, Layers } from 'lucide-react';
import './ContractorReportDetails.css';
import ContractorSidebar from '../components/ContractorSidebar';

const ContractorReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedModalImage, setSelectedModalImage] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('contractorUser');
    if (!storedUser) {
      navigate('/login');
    } else {
      setContractor(JSON.parse(storedUser));
    }
  }, [navigate]);

  useEffect(() => {
    if (id) {
      const fetchDetails = async () => {
        try {
          const res = await fetch(`/api/complaints/${id}`);
          if (res.ok) {
            const data = await res.json();
            
            const mappedReport = {
              id: data.complaintNumber,
              parkName: data.parkName || (data.park ? data.park.name : 'Unknown Park'),
              reportType: 'Completion & Inspection Report',
              inspectionDate: data.inspectionDate ? new Date(data.inspectionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
              submittedOn: data.completionDate ? new Date(data.completionDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A',
              submittedBy: contractor?.name || 'Contractor Specialist',
              status: data.status,
              verifiedBy: data.assignedOfficial ? data.assignedOfficial.name : 'Government Official',
              verifiedOn: data.inspectionDate ? new Date(data.inspectionDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A',
              remarks: data.inspectionRemarks || data.contractorRemarks || 'No formal remarks provided for this inspection.',
              description: data.description || 'No detailed issue description was provided.',
              priority: data.priority || 'Medium',
              slaStatus: data.slaStatus || 'Resolved Within SLA',
              images: []
            };

            if (data.images && data.images.length > 0) {
              data.images.forEach(url => mappedReport.images.push({ title: 'Public Complaint Photo', time: new Date(data.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), url }));
            }
            if (data.afterImages && data.afterImages.length > 0) {
              data.afterImages.forEach(url => mappedReport.images.push({ title: 'Contractor Work Photo', time: data.completionDate ? new Date(data.completionDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A', url }));
            }
            if (data.inspectionImages && data.inspectionImages.length > 0) {
              data.inspectionImages.forEach(url => mappedReport.images.push({ title: 'Official Inspection Photo', time: data.inspectionDate ? new Date(data.inspectionDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A', url }));
            }

            setReport(mappedReport);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }
  }, [id, contractor]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('contractorUser');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!contractor || loading) return (
    <div className="report-loading-screen">
      <div className="loading-spinner"></div>
      <p>Loading report details...</p>
    </div>
  );

  if (!report) return (
    <div className="report-error-screen">
      <ShieldAlert size={48} />
      <h3>Report Not Found</h3>
      <p>The requested report ID could not be loaded.</p>
      <button className="back-link" onClick={() => navigate(-1)}>Back</button>
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

        <main className="report-details-page">
          <div className="report-details-container">
            
            {/* Header Banner */}
            <div className="report-details-header">
              <div className="header-info-group">
                <span className="report-badge-pill">
                  <FileCheck size={14} /> OFFICIAL WORK COMPLETION DOSSIER
                </span>
                <h2 className="page-title">Report Specifications & Verification Details</h2>
                <p className="page-subtitle">Complete verification metrics, SLA timelines, and proof attachments.</p>
              </div>
              
              <div className="header-actions-group">
                <button className="back-link" onClick={() => navigate(-1)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="btn-export-pdf" onClick={() => window.print()}>
                  <Download size={16} /> Export PDF Report
                </button>
              </div>
            </div>

            {/* Key Summary Cards Row */}
            <div className="report-summary-card">
              <div className="summary-card-header">
                <Award size={20} className="header-icon" />
                <h3>Key Report Summary</h3>
              </div>
              
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Report ID</span>
                  <span className="summary-value highlight-id">{report.id}</span>
                  
                  <span className="summary-label mt-4">Park Location</span>
                  <span className="summary-value flex-align">
                    <MapPin size={15} className="text-emerald" /> {report.parkName}
                  </span>
                </div>
                
                <div className="summary-item border-left">
                  <span className="summary-label">Report Type</span>
                  <span className="summary-value">{report.reportType}</span>
                  
                  <span className="summary-label mt-4">Inspection Date</span>
                  <span className="summary-value flex-align">
                    <Calendar size={15} className="text-emerald" /> {report.inspectionDate}
                  </span>
                </div>
                
                <div className="summary-item border-left">
                  <span className="summary-label">Submitted On</span>
                  <span className="summary-value flex-align">
                    <Clock size={15} className="text-emerald" /> {report.submittedOn}
                  </span>
                  
                  <span className="summary-label mt-4">Submitted By</span>
                  <span className="summary-value flex-align">
                    <User size={15} className="text-emerald" /> {report.submittedBy}
                  </span>
                </div>
                
                <div className="summary-item border-left">
                  <span className="summary-label">Report Status</span>
                  <span className="status-badge badge-verified">
                    <CheckCircle size={14} /> {report.status}
                  </span>
                  
                  <span className="summary-label mt-4">Verified By</span>
                  <span className="summary-value">{report.verifiedBy}</span>
                  <span className="summary-value text-sm">{report.verifiedOn}</span>
                </div>
              </div>
            </div>

            {/* Horizontal Verification Audit Trail Card */}
            <div className="report-section-card">
              <div className="section-card-header">
                <Layers size={18} className="text-emerald" />
                <h3>Verification Audit Trail</h3>
              </div>

              <div className="audit-timeline-horizontal">
                <div className="timeline-step-horizontal done">
                  <div className="timeline-node-horizontal"><CheckCircle2 size={18} /></div>
                  <div className="timeline-content-horizontal">
                    <h4>Ticket Registered</h4>
                    <p>{report.submittedOn}</p>
                  </div>
                </div>

                <div className="timeline-step-horizontal done">
                  <div className="timeline-node-horizontal"><CheckCircle2 size={18} /></div>
                  <div className="timeline-content-horizontal">
                    <h4>Work Execution Completed</h4>
                    <p>By {report.submittedBy}</p>
                  </div>
                </div>

                <div className="timeline-step-horizontal done highlight-verified">
                  <div className="timeline-node-horizontal"><ShieldCheck size={18} /></div>
                  <div className="timeline-content-horizontal">
                    <h4>Official Inspection & Verification</h4>
                    <p>Verified by {report.verifiedBy} ({report.verifiedOn})</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Column Balanced Dashboard Content */}
            <div className="report-main-grid">
              
              {/* Left Column: Media Gallery + Official Remarks */}
              <div className="report-col-left">
                
                {/* Uploaded Images Gallery */}
                <div className="report-section-card">
                  <div className="section-card-header">
                    <ImageIcon size={18} className="text-emerald" />
                    <h3>Uploaded Proof Media ({report.images.length})</h3>
                  </div>
                  
                  <div className="uploaded-images-grid">
                    {report.images.map((img, index) => (
                      <div key={index} className="image-card" onClick={() => setSelectedModalImage(img)}>
                        <div className="image-wrapper">
                          <img src={img.url} alt={img.title} />
                          <div className="image-hover-overlay">
                            <Eye size={22} />
                            <span>Click to Expand</span>
                          </div>
                        </div>
                        <div className="image-info">
                          <span className="image-type-tag">{img.title}</span>
                          <p className="image-time-stamp"><Clock size={12} /> {img.time}</p>
                        </div>
                      </div>
                    ))}
                    {report.images.length === 0 && (
                      <div className="no-images-box">
                        <ImageIcon size={36} />
                        <p>No verification images available for this report.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Official Verification Remarks */}
                <div className="report-section-card">
                  <div className="section-card-header">
                    <MessageSquare size={18} className="text-emerald" />
                    <h3>Official Inspection & Verification Remarks</h3>
                  </div>
                  
                  <div className="remarks-callout-box">
                    <div className="remarks-header">
                      <div className="remarks-avatar-box">
                        <ShieldCheck size={24} className="remarks-icon" />
                      </div>
                      <div className="remarks-meta">
                        <span className="remarks-author">{report.verifiedBy}</span>
                        <span className="remarks-role">Official Inspector</span>
                        <span className="remarks-date">{report.verifiedOn}</span>
                      </div>
                    </div>
                    <div className="remarks-body-quote">
                      <p className="remarks-text">"{report.remarks}"</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Task Context & Verification Details */}
              <div className="report-col-right">
                
                {/* Task Context Card */}
                <div className="report-section-card">
                  <div className="section-card-header">
                    <FileText size={18} className="text-emerald" />
                    <h3>Task Parameters & Context</h3>
                  </div>
                  
                  <div className="task-params-tile-grid">
                    <div className="param-tile">
                      <span className="param-tile-label">Priority Level</span>
                      <span className={`priority-pill-badge priority-${report.priority.toLowerCase()}`}>
                        <ShieldAlert size={14} /> {report.priority}
                      </span>
                    </div>

                    <div className="param-tile">
                      <span className="param-tile-label">SLA Compliance</span>
                      <span className={`sla-pill-badge ${report.slaStatus.includes('Overdue') ? 'sla-overdue' : 'sla-on-time'}`}>
                        <Clock size={14} /> {report.slaStatus}
                      </span>
                    </div>

                    <div className="param-tile">
                      <span className="param-tile-label">Report Category</span>
                      <span className="param-tile-val">{report.reportType}</span>
                    </div>

                    <div className="param-tile">
                      <span className="param-tile-label">Inspection Officer</span>
                      <span className="param-tile-val">{report.verifiedBy}</span>
                    </div>
                  </div>

                  <div className="context-desc-box">
                    <div className="desc-box-header">
                      <FileText size={15} className="text-emerald" />
                      <span>Original Complaint Description</span>
                    </div>
                    <p className="desc-text">{report.description || "No specific instructions or details were entered."}</p>
                  </div>
                </div>

                {/* Additional Verification Specifications */}
                <div className="report-section-card">
                  <div className="section-card-header">
                    <Award size={18} className="text-emerald" />
                    <h3>Verification Audit Compliance</h3>
                  </div>
                  <div className="compliance-info-box">
                    <div className="compliance-row">
                      <span className="comp-label">Verification Mode</span>
                      <span className="comp-val">On-Site Physical Inspection</span>
                    </div>
                    <div className="compliance-row">
                      <span className="comp-label">SLA Execution</span>
                      <span className="comp-val text-emerald">Verified Within Designated SLA</span>
                    </div>
                    <div className="compliance-row">
                      <span className="comp-label">Authorization Badge</span>
                      <span className="comp-val">Govt. Municipal Authority</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </main>
      </div>

      {/* Image Modal Lightbox */}
      {selectedModalImage && (
        <div className="report-image-modal-overlay" onClick={() => setSelectedModalImage(null)}>
          <div className="report-image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedModalImage(null)}>
              <X size={22} />
            </button>
            <img src={selectedModalImage.url} alt={selectedModalImage.title} className="modal-full-image" />
            <div className="modal-caption">
              <span>{selectedModalImage.title}</span>
              <p>{selectedModalImage.time}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorReportDetails;


