import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Menu, LogOut, ArrowLeft, HardHat, Check, X, Plus, Save, Bell } from 'lucide-react';
import './ContractorWorkProgress.css';
import ContractorSidebar from '../components/ContractorSidebar';


const ContractorWorkProgress = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [status, setStatus] = useState('In Progress');
  const [description, setDescription] = useState('');
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [location, setLocation] = useState(null);
  const [completionReportFile, setCompletionReportFile] = useState(null);
  const [completionReportName, setCompletionReportName] = useState('');

  const [taskDetails, setTaskDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const taskId = id || 'CMP2024001';

  useEffect(() => {
    const storedUser = localStorage.getItem('contractorUser');
    if (!storedUser) {
      navigate('/contractor/login');
    } else {
      setContractor(JSON.parse(storedUser));
    }
  }, [navigate]);

  useEffect(() => {
    if (taskId) {
      const fetchTask = async () => {
        try {
          const res = await fetch(`/api/complaints/${taskId}`);
          if (res.ok) {
            const data = await res.json();
            setTaskDetails(data);
            const initialStatus = ['Completed', 'Completed - Waiting for Admin Review', 'Returned by Admin', 'Rework Required'].includes(data.status) ? 'Completed' : 'In Progress';
            setStatus(initialStatus);
            if (data.contractorRemarks) {
              setDescription(data.contractorRemarks);
            } else {
              setDescription('');
            }
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchTask();
    }
  }, [taskId]);

  const handleSaveUpdate = async () => {
    if (!taskDetails?._id) return;

    if (status === 'Completed') {
      if (afterPhotos.length === 0) {
        alert("Completed Works Images are mandatory for completion.");
        return;
      }
      if (!description.trim()) {
        alert("Completion Remarks are mandatory for completion.");
        return;
      }
    }

    setSaving(true);
    
    try {
      const formData = new FormData();
      const finalStatus = status === 'Completed' ? 'Completed - Waiting for Admin Review' : status;
      formData.append('status', finalStatus);
      formData.append('contractorRemarks', description);
      formData.append('completionDate', new Date().toISOString());
      
      if (location) {
        formData.append('latitude', location.latitude);
        formData.append('longitude', location.longitude);
      }
      
      afterPhotos.forEach(p => formData.append('afterImages', p.file));

      const res = await fetch(`/api/complaints/${taskDetails._id}`, {
        method: 'PUT',
        body: formData
      });
      
      if (res.status === 403) {
         const errData = await res.json();
         alert(errData.message || 'Error updating task');
         return;
      }

      if (res.ok) {
        alert('Work updated successfully!');
        navigate(`/contractor/task/${taskId}`);
      } else {
        alert('Failed to update progress.');
      }
    } catch (error) {
      console.error(error);
      alert('Error updating progress.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBeforePhoto = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setBeforePhotos(prev => [...prev, ...newPhotos]);
    e.target.value = '';
  };

  const handleRemoveBeforePhoto = (index) => {
    setBeforePhotos(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleAddAfterPhoto = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setAfterPhotos(prev => [...prev, ...newPhotos]);
    e.target.value = '';

    if (!location && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Location access denied or unavailable. Photos will upload without location.", error);
        }
      );
    }
  };

  const handleRemoveAfterPhoto = (index) => {
    setAfterPhotos(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleReportChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCompletionReportFile(file);
      setCompletionReportName(file.name);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('contractorUser');
    navigate('/contractor/login');
  };

  if (!contractor) return null;

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

        <div className="contractor-work-progress-page container">
          <div className="contractor-work-progress-container">
            
            <div className="work-progress-header">
              <div className="progress-title-section">
                <h2>Work Progress - {taskId}</h2>
                <p>Track the timeline and update current status.</p>
              </div>
              <Link to={`/contractor/task/${taskId}`} className="btn-back-details">
                <ArrowLeft size={16} />
                Back to Details
              </Link>
            </div>

            <div className="progress-timeline">
              <div className="timeline-step completed">
                <div className="timeline-circle">
                  <Check size={20} />
                </div>
                <h4>Assigned</h4>
                <p>16 May</p>
              </div>
              
              <div className="timeline-step completed">
                <div className="timeline-circle">
                  <Check size={20} />
                </div>
                <h4>Started</h4>
                <p>16 May</p>
              </div>

              <div className="timeline-step active">
                <div className="timeline-circle">3</div>
                <h4>In Progress</h4>
                <p>17 May</p>
              </div>

              <div className="timeline-step">
                <div className="timeline-circle">4</div>
                <h4>Work Completed</h4>
                <p>&nbsp;</p>
              </div>

              <div className="timeline-step">
                <div className="timeline-circle">5</div>
                <h4>Inspection Pending</h4>
                <p>&nbsp;</p>
              </div>
            </div>

            <div className="update-progress-card">
              <h3>Update Progress</h3>

              {taskDetails && taskDetails.rejectionReason && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', marginBottom: '1.5rem', color: '#b91c1c' }}>
                  <strong>Returned Remarks from Admin:</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>{taskDetails.rejectionReason}</p>
                </div>
              )}

              <div className="update-form-group">
                <label>Progress Status</label>
                <select 
                  className="update-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Work Completed</option>
                </select>
              </div>

              <div className="update-form-group">
                <label>{status === 'Completed' ? 'Completion Remarks' : 'Work Description'}</label>
                <textarea 
                  className="update-textarea" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={status === 'Completed' ? "Provide detailed completion remarks..." : "Describe the progress..."}
                ></textarea>
              </div>

              {/* Works Images Upload */}
              <div className="upload-photos-section" style={{ marginBottom: '1.5rem' }}>
                <h3 className="upload-photos-title">
                  {status === 'Completed' ? 'Upload Completed Works Image' : 'Upload Progress Image'}
                </h3>
                <input
                  type="file"
                  id="after-photo-input"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleAddAfterPhoto}
                />
                <div className="upload-photos-grid">
                  {afterPhotos.map((p, i) => (
                    <div className="photo-thumb-wrap" key={i}>
                      <img src={p.preview} alt={`Completed ${i + 1}`} className="photo-thumb-img" />
                      <button className="photo-thumb-remove" type="button" onClick={() => handleRemoveAfterPhoto(i)}>
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  <div
                    className="photo-add-box"
                    onClick={() => document.getElementById('after-photo-input').click()}
                  >
                    <Plus size={22} />
                    <span>Add Photo</span>
                  </div>
                </div>
                {/* Location Status Indicator */}
                <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: location ? '#10b981' : '#64748b' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {location ? 
                    `Location Attached: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 
                    "Location will be captured automatically when you add a photo."
                  }
                </div>
              </div>

              <div className="update-form-actions">
                <button className="btn-save-update" onClick={handleSaveUpdate} disabled={saving || !taskDetails}>
                  <Save size={18} /> {saving ? 'Submitting...' : status === 'Completed' ? 'Submit Completion Report' : 'Save Update'}
                </button>
                <button className="btn-cancel-update" onClick={() => navigate(`/contractor/task/${taskId}`)} disabled={saving}>
                  Cancel
                </button>
              </div>

            </div>

          </div>
        </div>

        
      </div>
    </div>
  );
};

export default ContractorWorkProgress;
