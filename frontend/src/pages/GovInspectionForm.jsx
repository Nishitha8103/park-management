import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Plus, X } from 'lucide-react';
import './GovInspectionForm.css';

const API_BASE = '/api';

// Temporary storage to pass File objects between routes since React Router state strips them
export let tempInspectionPhotos = [];

const GovInspectionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  const checklistItems = [
    { key: 'workCompleted', text: 'Work completed as per requirement' },
    { key: 'qualitySatisfactory', text: 'Quality of work is satisfactory' },
    { key: 'materialsAppropriate', text: 'Materials used are appropriate' },
    { key: 'areaCleaned', text: 'Area cleaned after completion' },
    { key: 'safetyStandards', text: 'Safety standards followed' },
    { key: 'issueResolved', text: 'Issue resolved completely' },
  ];

  const [checklist, setChecklist] = useState({
    workCompleted: 'Yes',
    qualitySatisfactory: 'Yes',
    materialsAppropriate: 'Yes',
    areaCleaned: 'Yes',
    safetyStandards: 'Yes',
    issueResolved: 'Yes',
    otherIssues: 'No',
  });

  const [rating, setRating] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [photos, setPhotos] = useState([]); // { file, preview }

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

  const handleStatusChange = (key, value) => {
    setChecklist(prev => ({ ...prev, [key]: value }));
  };

  const handleAddPhoto = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos(prev => [...prev, ...newPhotos]);
    e.target.value = '';
  };

  const handleRemovePhoto = (index) => {
    setPhotos(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSaveAndProceed = () => {
    // Navigate to Decision Page
    const complaintId = id || (complaint?._id);
    
    // Store files in module scope to bypass React Router serialization stripping
    tempInspectionPhotos = photos.map(p => p.file);

    navigate(`/gov-dashboard/verify-work/${complaintId}`, {
      state: {
        rating,
        remarks,
        checklist
      }
    });
  };

  if (loading) {
    return (
      <div className="conduct-inspection-container">
        <p style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading inspection form...</p>
      </div>
    );
  }

  const displayId = complaint?.complaintNumber || 'CMP2024001';

  return (
    <div className="conduct-inspection-container">
      <div className="top-nav-row flex items-center mb-md">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back to Inspection Details
        </button>
      </div>

      <h1 className="page-title mb-lg">5. Conduct Inspection</h1>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' }}>
        Conduct Inspection - {displayId}
      </h2>




      <div className="inspection-grid">
        {/* Left Column - Checklist */}
        <div className="left-column">
          <div className="card">
            <h3 className="card-header-title" style={{ padding: '1.5rem', marginBottom: 0 }}>
              Inspection Checklist
            </h3>

            <div className="checklist-table">
              <div className="checklist-header">
                <div className="col-item font-semibold">Item</div>
                <div className="col-status font-semibold">Status</div>
              </div>

              {checklistItems.map(item => (
                <div key={item.key} className="checklist-row">
                  <div className="col-item flex items-center gap-sm">
                    <div className="checkbox-custom">
                      <input type="checkbox" checked={checklist[item.key] === 'Yes'} readOnly />
                      <span></span>
                    </div>
                    <span>{item.text}</span>
                  </div>
                  <div className="col-status">
                    <select
                      className="input-field select-small"
                      value={checklist[item.key]}
                      onChange={(e) => handleStatusChange(item.key, e.target.value)}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              ))}

              <div className="checklist-row mt-sm" style={{ borderBottom: 'none' }}>
                <div className="col-item flex items-center gap-sm">
                  <div className="checkbox-custom">
                    <input
                      type="checkbox"
                      checked={checklist.otherIssues === 'Yes'}
                      onChange={(e) => handleStatusChange('otherIssues', e.target.checked ? 'Yes' : 'No')}
                    />
                    <span></span>
                  </div>
                  <span>Any other issues found</span>
                </div>
                <div className="col-status">
                  <select
                    className="input-field select-small"
                    value={checklist.otherIssues}
                    onChange={(e) => handleStatusChange('otherIssues', e.target.value)}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Photos & Remarks */}
        <div className="right-column flex-col gap-lg">

          <div className="card p-xl">
            <h3 className="card-header-title" style={{ border: 'none', paddingBottom: '0' }}>
              Inspection Photos <span style={{ fontWeight: 'normal', fontSize: '0.9rem', color: '#64748b' }}>(On Site)</span>
            </h3>

            <input
              type="file"
              id="inspection-photo-input"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleAddPhoto}
            />

            <div className="photos-upload-grid mt-md">
              {photos.map((p, i) => (
                <div className="photo-item-wrap" key={i} style={{ position: 'relative' }}>
                  <img src={p.preview} alt={`Inspection ${i + 1}`} className="uploaded-photo-thumb" />
                  <button className="photo-thumb-remove" type="button" onClick={() => handleRemovePhoto(i)}>
                    <X size={13} />
                  </button>
                </div>
              ))}
              <div className="upload-placeholder" onClick={() => document.getElementById('inspection-photo-input').click()}>
                <div className="upload-content text-primary">
                  <Plus size={24} />
                  <span>Upload Photo</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-xl flex gap-lg" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <p className="font-semibold mb-sm">Overall Condition</p>
              <div className="star-rating flex gap-xs text-primary">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    size={24}
                    fill={star <= rating ? '#06402b' : 'transparent'}
                    color={star <= rating ? '#06402b' : '#cbd5e1'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
              <p className="text-secondary mt-xs" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {rating === 5 ? 'Excellent' : rating === 4 ? 'Good' : rating === 3 ? 'Average' : rating === 2 ? 'Poor' : 'Critical'}
              </p>
            </div>

            <div style={{ flex: '2' }}>
              <p className="font-semibold mb-sm">Remarks</p>
              <textarea
                className="input-field"
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="action-buttons-row flex gap-md mt-auto">
            <button className="btn btn-outline flex-1" style={{ fontWeight: 600 }} onClick={handleSaveAndProceed}>
              Save Inspection
            </button>
            <button className="btn btn-primary flex-1" style={{ fontWeight: 600 }} onClick={handleSaveAndProceed}>
              Submit Inspection
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GovInspectionForm;
