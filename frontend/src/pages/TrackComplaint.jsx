import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './TrackComplaint.css';
import { getSlaStatusAndRemaining } from '../utils/slaUtils';

const TrackComplaint = () => {
  const location = useLocation();
  const [complaintId, setComplaintId] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If navigated from the success page with an ID, pre-fill and track
    if (location.state && location.state.id) {
      setComplaintId(location.state.id);
      trackComplaint(location.state.id);
    }
  }, [location]);

  const handleTrack = (e) => {
    e.preventDefault();
    if (complaintId.trim()) {
      trackComplaint(complaintId);
    }
  };

  const trackComplaint = async (id) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/complaints/${id}`);
      if (res.ok) {
        const c = await res.json();
        
        let stateText = 'Submitted';
        if (['Completed', 'Verified', 'Resolved', 'Closed', 'Inspection Approved'].includes(c.status)) {
          stateText = 'Resolved';
        } else if (['In Progress', 'Assigned', 'Pending', 'Completed - Waiting for Admin Review', 'Returned by Admin', 'Inspection Pending', 'Rework Required', 'Reassigned to Contractor'].includes(c.status)) {
          stateText = 'Under Review';
        }

        setStatus({
          id: c.complaintNumber,
          date: new Date(c.createdAt).toLocaleDateString(),
          park: c.parkName || (c.park ? c.park.name : 'Unknown Park'),
          category: c.category || 'General',
          state: stateText,
          slaData: getSlaStatusAndRemaining(c),
          afterImages: c.afterImages || [],
          inspectionImages: c.inspectionImages || [],
          contractorRemarks: c.contractorRemarks || c.inspectionRemarks || ''
        });
      } else {
        setStatus(null);
        setError('Complaint not found. Please check the ID and try again.');
      }
    } catch (err) {
      console.error(err);
      setStatus(null);
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="track-page">
      <div className="track-card">
        <div className="track-header">
          <h2>Track Complaint</h2>
          <p>Enter your complaint ID to check its status</p>
        </div>
        
        <form className="track-form" onSubmit={handleTrack}>
          <div className="form-group">
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. CMP123456789" 
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary track-submit-btn" disabled={loading}>
            {loading ? 'Tracking...' : 'Track Status'}
          </button>
        </form>

        {error && <div style={{ color: '#ef4444', textAlign: 'center', marginTop: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '8px' }}>{error}</div>}

        {status && (
          <div className="track-result">
            <h3>Complaint Status</h3>
            <div className="status-timeline">
              <div className="timeline-item active">
                <div className="timeline-dot"></div>
                <div className="timeline-line"></div>
                <div className="timeline-content">
                  <h4>Submitted</h4>
                  <p>{status.date}</p>
                </div>
              </div>
              <div className={`timeline-item ${status.state === 'Under Review' || status.state === 'Resolved' ? 'active' : ''}`}>
                <div className="timeline-dot"></div>
                <div className="timeline-line"></div>
                <div className="timeline-content">
                  <h4>Under Review</h4>
                  <p>{status.state === 'Under Review' || status.state === 'Resolved' ? 'Your complaint is being reviewed by the authorities.' : 'Pending review'}</p>
                </div>
              </div>
              <div className={`timeline-item ${status.state === 'Resolved' ? 'active' : ''}`}>
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <h4>{status.state === 'Resolved' ? 'Complaint Resolved ✅' : 'Resolved'}</h4>
                  <p>{status.state === 'Resolved' ? `Your reported ${status.category.toLowerCase()} issue has been fixed.` : 'Pending'}</p>
                </div>
              </div>
            </div>
            
            <div className="complaint-details-box">
              <p><strong>Complaint ID:</strong> {status.id}</p>
              <p><strong>Park:</strong> {status.park}</p>
              <p><strong>Category:</strong> {status.category}</p>
              {status.slaData && status.slaData.status !== 'Not Applicable' && (
                <p><strong>Expected Resolution:</strong> <span style={{ color: status.slaData.colorCode, fontWeight: 600 }}>{status.slaData.text}</span></p>
              )}
            </div>

            {status.state === 'Resolved' && (status.afterImages.length > 0 || status.inspectionImages.length > 0 || status.contractorRemarks) && (
              <div className="resolution-details-box" style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>✓</span> Resolution Details
                </h4>
                
                {status.contractorRemarks && (
                  <p style={{ margin: '0 0 1rem 0', color: '#15803d', fontSize: '0.95rem' }}>
                    <strong>Remarks:</strong> {status.contractorRemarks}
                  </p>
                )}

                {(status.afterImages.length > 0 || status.inspectionImages.length > 0) && (
                  <div>
                    <strong style={{ color: '#15803d', display: 'block', marginBottom: '0.5rem' }}>Resolution Photos:</strong>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {[...status.afterImages, ...status.inspectionImages].map((img, idx) => (
                        <a href={`http://localhost:5000${img}`} target="_blank" rel="noopener noreferrer" key={idx} style={{ display: 'block', width: '200px', height: '150px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #bbf7d0', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                          <img src={`http://localhost:5000${img}`} alt="Resolved" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackComplaint;
