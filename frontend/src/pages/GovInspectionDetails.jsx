import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Download, RotateCcw, AlertTriangle } from 'lucide-react';
import './GovInspectionDetails.css';
import RequestReassignmentModal from '../components/RequestReassignmentModal';
import AssignmentHistoryTimeline from '../components/AssignmentHistoryTimeline';

const API_BASE = '/api';

const GovInspectionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(null);
  const [govUser, setGovUser] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('govUser');
    if (stored) {
      try {
        setGovUser(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_BASE}/complaints/${id}`);
        if (!res.ok) throw new Error('Complaint not found');
        const data = await res.json();
        setInspection(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load inspection details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetails();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="inspection-details-container">
        <p style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading inspection details...</p>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="inspection-details-container">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        <p style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>{error || 'Inspection not found.'}</p>
      </div>
    );
  }

  const contractor = inspection.assignedContractor;
  const park = inspection.park;

  return (
    <div className="inspection-details-container">
      <div className="top-nav-row flex justify-between items-center">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back to Assigned Inspections
        </button>
        <div className="flex gap-md" style={{ display: 'flex', gap: '10px' }}>
          {inspection.status !== 'Closed' && inspection.status !== 'Reassignment Requested' && (
            <>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/gov-dashboard/conduct-inspection/${inspection._id}`)}
              >
                {inspection.inspectionDate ? 'Edit Inspection' : 'Start Inspection'}
              </button>
              <button
                type="button"
                className="btn"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setShowReassignModal(true)}
              >
                <RotateCcw size={16} /> Cannot Complete Task
              </button>
            </>
          )}
          {(inspection.inspectionDate || ['Inspection Approved', 'Closed', 'Rework Required', 'Returned by Admin'].includes(inspection.status)) && (
            <button
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#334155', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
              onClick={() => window.print()}
            >
              <Download size={18} /> Download Report
            </button>
          )}
        </div>
      </div>

      {/* Reassignment Pending Banner */}
      {(inspection.status === 'Reassignment Requested' || inspection.reassignmentStatus === 'Reassignment Requested') && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <RotateCcw size={24} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 'bold', color: '#92400e', fontSize: '0.95rem' }}>Inspection Reassignment Pending Administrator Review</span>
              <span style={{ backgroundColor: '#d97706', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>PENDING REVIEW</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350f' }}>
              You submitted a reassignment request for this inspection. <strong>Reason:</strong> {inspection.reassignmentReason || 'On Leave / Unavailable'}.
              {inspection.reassignmentExplanation && ` Note: "${inspection.reassignmentExplanation}"`}.
              Administrator review is in progress.
            </p>
          </div>
        </div>
      )}

      <h1 className="page-title">Inspection Details — {inspection.complaintNumber}</h1>

      <div className="details-grid">
        {/* Left Column */}
        <div className="left-column">
          <div className="card details-card mb-md">
            <h3 className="card-header-title">Complaint Information</h3>
            <div className="info-list">
              <div className="info-row">
                <span className="info-label">Complaint No.</span>
                <span className="info-value" style={{ fontWeight: 700 }}>{inspection.complaintNumber}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Reported By</span>
                <span className="info-value">{inspection.userName || 'Anonymous'}</span>
              </div>
              {inspection.userPhone && (
                <div className="info-row">
                  <span className="info-label">Phone No.</span>
                  <span className="info-value">{inspection.userPhone}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Park Name</span>
                <span className="info-value">{inspection.parkName || park?.name || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Location in Park</span>
                <span className="info-value">{inspection.locationInPark || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">District / Zone / Ward</span>
                <span className="info-value">
                  {[inspection.district, inspection.zone, inspection.ward].filter(Boolean).join(' / ') || '—'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Category</span>
                <span className="info-value">{inspection.category || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Priority</span>
                <span className="info-value text-error font-semibold">{inspection.priority || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Status</span>
                <span className="info-value">{inspection.status || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Inspection Due Date</span>
                <span className="info-value" style={{ fontWeight: 700, color: '#b45309' }}>
                  {inspection.slaDeadline ? formatDate(inspection.slaDeadline) : formatDate(new Date(new Date(inspection.createdAt).getTime() + 48 * 3600 * 1000))}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Submitted On</span>
                <span className="info-value">{formatDate(inspection.createdAt)}</span>
              </div>
              {inspection.completionDate && (
                <div className="info-row">
                  <span className="info-label">Work Completed On</span>
                  <span className="info-value">{formatDate(inspection.completionDate)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card details-card">
            <h3 className="card-header-title">Contractor Information</h3>
            <div className="info-list">
              {contractor ? (
                <>
                  <div className="info-row">
                    <span className="info-label">Contractor Name</span>
                    <span className="info-value">{contractor.name || contractor.companyName || '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email</span>
                    <span className="info-value">{contractor.email || '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Phone</span>
                    <span className="info-value">{contractor.phone || '—'}</span>
                  </div>
                </>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', padding: '0.5rem 0' }}>No contractor assigned yet.</p>
              )}
              {inspection.contractorRemarks && (
                <div className="info-row">
                  <span className="info-label">Contractor Remarks</span>
                  <span className="info-value">{inspection.contractorRemarks}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="right-column">
          <div className="card details-card flex-col gap-md">

          {/* Official Verification Details moved to the top of the right column */}
          {(inspection.inspectionDate || inspection.inspectionRemarks || ['Inspection Approved', 'Closed', 'Rework Required', 'Returned by Admin'].includes(inspection.status)) && (
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '0.5rem' }}>
              <h3 className="card-header-title" style={{ color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Official Verification Details</h3>
              <div className="info-list">
                <div className="info-row">
                  <span className="info-label">Decision</span>
                  <span className="info-value font-semibold text-primary">{inspection.status}</span>
                </div>
                {inspection.inspectionDate && (
                  <div className="info-row">
                    <span className="info-label">Inspection Date</span>
                    <span className="info-value">{formatDate(inspection.inspectionDate)}</span>
                  </div>
                )}
                {inspection.inspectionRating && (
                  <div className="info-row">
                    <span className="info-label">Rating</span>
                    <span className="info-value font-semibold" style={{ color: '#eab308' }}>
                      {'★'.repeat(inspection.inspectionRating)}{'☆'.repeat(5 - inspection.inspectionRating)} ({inspection.inspectionRating}/5)
                    </span>
                  </div>
                )}
                {inspection.inspectionRemarks && (
                  <div className="info-row">
                    <span className="info-label">Remarks</span>
                    <span className="info-value">{inspection.inspectionRemarks}</span>
                  </div>
                )}
              </div>
            </div>
          )}

            <div>
              <h3 className="card-header-title" style={{ border: 'none', paddingBottom: '0.5rem' }}>
                Complaint Description
              </h3>
              <p className="text-secondary" style={{ fontSize: '0.95rem' }}>
                {inspection.description || 'No description provided.'}
              </p>
            </div>

            {/* Complaint Images */}
            {inspection.images && inspection.images.length > 0 && (
              <div className="images-section">
                <div className="section-label-row">
                  <h3 className="card-header-title" style={{ border: 'none', paddingBottom: '0', marginTop: '1rem', marginBottom: '0' }}>
                    Complaint Photos
                  </h3>
                  <span className="photo-section-badge badge-complaint">Submitted by Public</span>
                </div>
                <div className="photos-grid">
                  {inspection.images.map((src, idx) => (
                    <div key={`complaint-${idx}`} className="photo-item" onClick={() => setActiveImage(`${src}`)}>
                      <img src={`${src}`} alt={`Complaint ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Work Completion Images */}
            {inspection.beforeImages && inspection.beforeImages.length > 0 && (
              <div className="images-section">
                <div className="section-label-row">
                  <h3 className="card-header-title" style={{ border: 'none', paddingBottom: '0', marginTop: '1rem', marginBottom: '0' }}>
                    Work Completion Photos
                  </h3>
                  <span className="photo-section-badge badge-contractor">Uploaded by Contractor</span>
                </div>
                <div className="photos-grid">
                  {inspection.beforeImages.map((src, idx) => (
                    <div key={`before-${idx}`} className="photo-item" onClick={() => setActiveImage(`${src}`)}>
                      <img src={`${src}`} alt={`Work ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* After Repair Images */}
            {inspection.afterImages && inspection.afterImages.length > 0 && (
              <div className="images-section">
                <div className="section-label-row">
                  <h3 className="card-header-title" style={{ border: 'none', paddingBottom: '0', marginTop: '1rem', marginBottom: '0' }}>
                    After Work Photos
                  </h3>
                  <span className="photo-section-badge badge-contractor">Uploaded by Contractor</span>
                </div>
                <div className="photos-grid">
                  {inspection.afterImages.map((src, idx) => (
                    <div key={`after-${idx}`} className="photo-item" onClick={() => setActiveImage(`${src}`)}>
                      <img src={`${src}`} alt={`After ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inspection Photos */}
            {inspection.inspectionImages && inspection.inspectionImages.length > 0 && (
              <div className="images-section">
                <div className="section-label-row">
                  <h3 className="card-header-title" style={{ border: 'none', paddingBottom: '0', marginTop: '1rem', marginBottom: '0' }}>
                    Inspection Photos
                  </h3>
                  <span className="photo-section-badge badge-official" style={{ background: '#ede9fe', color: '#6d28d9' }}>Uploaded by Official</span>
                </div>
                <div className="photos-grid">
                  {inspection.inspectionImages.map((src, idx) => (
                    <div key={`inspection-${idx}`} className="photo-item" onClick={() => setActiveImage(`${src}`)}>
                      <img src={`${src}`} alt={`Inspection ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}



          </div>
        </div>
      </div>

      {/* Assignment & Reassignment Audit History Timeline */}
      <AssignmentHistoryTimeline 
        history={inspection.assignmentHistory} 
        currentAssignee={govUser?.name || 'Government Official'} 
        currentRole="government_official" 
        initialAssignedDate={inspection.assignedAt || inspection.createdAt} 
        dueDate={inspection.slaDeadline || (inspection.createdAt ? new Date(new Date(inspection.createdAt).getTime() + 48 * 3600 * 1000) : null)}
      />

      {/* Full Image Overlay Modal */}
      {activeImage && (
        <div className="image-overlay-modal" onClick={() => setActiveImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={() => setActiveImage(null)}>
              <X size={24} />
            </button>
            <img src={activeImage} alt="Full view" className="full-modal-img" />
          </div>
        </div>
      )}

      {/* Request Reassignment Modal for Official */}
      <RequestReassignmentModal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        task={inspection}
        user={govUser}
        userRole="government_official"
        onSuccess={() => {
          alert('Inspection reassignment request submitted successfully to Administrator.');
          window.location.reload();
        }}
      />
    </div>
  );
};

export default GovInspectionDetails;
