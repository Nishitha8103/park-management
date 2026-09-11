import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { tempInspectionPhotos } from './GovInspectionForm';
import './GovVerifyWork.css';

const API_BASE = '/api';

const GovVerifyWork = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const formState = location.state || {};

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState(''); // 'approve', 'rework', 'reject'
  const [remarks, setRemarks] = useState(formState.remarks || 'Work is completed satisfactorily.');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchDetails = async () => {
        try {
          const res = await fetch(`${API_BASE}/complaints/${id}`);
          if (res.ok) {
            const data = await res.json();
            setComplaint(data);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleSubmit = async () => {
    if (!decision) {
      alert("Please select a decision first.");
      return;
    }

    if (decision === 'rework' && (!remarks || !remarks.trim())) {
      alert("Remarks are mandatory when Rework is required.");
      return;
    }

    const complaintId = id || complaint?._id;
    if (!complaintId) return;

    setSubmitting(true);
    try {
      // Map decisions to database status values
      let finalStatus = decision === 'approve' ? 'Inspection Approved' : 'Rework Required';

      const formData = new FormData();
      formData.append('status', finalStatus);
      formData.append('inspectionRemarks', remarks);
      formData.append('inspectionCondition', formState.rating ? `${formState.rating} Stars` : 'Good');
      formData.append('inspectionDate', new Date().toISOString());

      if (tempInspectionPhotos && tempInspectionPhotos.length > 0) {
        tempInspectionPhotos.forEach(file => formData.append('inspectionImages', file));
      }

      const res = await fetch(`${API_BASE}/complaints/${complaintId}`, {
        method: 'PUT',
        body: formData
      });

      if (res.ok) {
        alert(`Decision submitted successfully! Status: ${finalStatus}`);
        navigate('/gov-dashboard/my-inspections');
      } else {
        alert('Failed to submit decision.');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting decision.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="inspection-decision-container">
        <p style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading decision form...</p>
      </div>
    );
  }

  const displayId = complaint?.complaintNumber || 'CMP2024001';

  return (
    <div className="inspection-decision-container">
      <div className="top-nav-row mb-md">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back to Inspection Details
        </button>
      </div>

      <h1 className="page-title mb-sm">Inspection Decision - {displayId}</h1>
      <p className="text-secondary mb-lg">Please provide your decision for the completed work.</p>

      <div className="decision-cards-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {/* Approve */}
        <div 
          className={`decision-card ${decision === 'approve' ? 'selected' : ''}`}
          onClick={() => setDecision('approve')}
        >
          <div className="decision-icon-wrapper text-success bg-success-light mb-md">
            <CheckCircle size={32} />
          </div>
          <h3 className="decision-title">Approve Work</h3>
          <p className="decision-desc">Work is satisfactory and issue is resolved.</p>
          <div className="radio-custom mt-md">
            <input type="radio" checked={decision === 'approve'} readOnly />
            <span className="radio-mark"></span>
          </div>
        </div>

        {/* Rework */}
        <div 
          className={`decision-card ${decision === 'rework' ? 'selected' : ''}`}
          onClick={() => setDecision('rework')}
        >
          <div className="decision-icon-wrapper text-warning bg-warning-light mb-md">
            <RefreshCw size={32} />
          </div>
          <h3 className="decision-title">Request Rework</h3>
          <p className="decision-desc">Work needs improvement or corrections (Remarks mandatory).</p>
          <div className="radio-custom mt-md">
            <input type="radio" checked={decision === 'rework'} readOnly />
            <span className="radio-mark"></span>
          </div>
        </div>
      </div>

      <div className="remarks-section mt-xl">
        <p className="font-semibold mb-sm">Remarks / Comments {decision === 'rework' ? <span style={{ color: '#ef4444' }}>(Required)</span> : '(Optional)'}</p>
        <textarea 
          className="input-field" 
          rows="4"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder={decision === 'rework' ? "Please explain why the work failed inspection..." : "Add any details about the inspection..."}
        ></textarea>
      </div>

      <div className="action-buttons-row flex justify-between mt-xl">
        <button className="btn btn-outline" style={{minWidth: '200px'}} onClick={() => navigate(-1)}>
          Cancel
        </button>
        <button className="btn btn-primary" style={{minWidth: '200px'}} onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Decision'}
        </button>
      </div>
    </div>
  );
};

export default GovVerifyWork;
