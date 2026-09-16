import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  ArrowLeft, 
  Copy, 
  MapPin, 
  AlertTriangle, 
  Upload, 
  Phone, 
  Mail, 
  ShieldAlert, 
  Sparkles, 
  FileText, 
  X, 
  Check, 
  Camera,
  User as UserIcon
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import LiveCameraCaptureModal from '../components/LiveCameraCaptureModal';
import { stampImageWithGeoAndTimestamp } from '../utils/imageStampUtil';
import './SubmitComplaint.css';

const SubmitComplaint = () => {
  const location = useLocation();
  const parkState = location.state || {};

  const getInitialCitizenName = () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        return u.name || u.firstName || '';
      }
    } catch (e) {}
    return '';
  };

  const [formData, setFormData] = useState({
    parkName: parkState.parkName || '',
    locationInPark: '',
    category: '',
    fullName: getInitialCitizenName(),
    mobileNumber: '',
    title: '',
    email: '',
    description: '',
    priority: 'Medium'
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (parkState.parkName) {
      setFormData(prev => ({
        ...prev,
        parkName: parkState.parkName
      }));
    }
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePrioritySelect = (pri) => {
    setFormData(prev => ({ ...prev, priority: pri }));
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsProcessingFile(true);
      try {
        const stamped = await stampImageWithGeoAndTimestamp(file, {
          tag: 'Citizen Grievance',
          fileName: `complaint_${Date.now()}.jpg`
        });
        setSelectedFile(stamped.file);
        setFileName(stamped.file.name);
        setFilePreview(stamped.preview);
      } catch (err) {
        console.warn('Stamp fallback to raw file:', err);
        setSelectedFile(file);
        setFileName(file.name);
        setFilePreview(URL.createObjectURL(file));
      } finally {
        setIsProcessingFile(false);
      }
    }
  };

  const handleCameraCapture = (captured) => {
    if (captured && captured.file) {
      setSelectedFile(captured.file);
      setFileName(captured.file.name);
      setFilePreview(captured.preview);
    }
  };

  const removeFile = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFileName('');
    setFilePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.fullName || !formData.fullName.trim()) return setErrorMsg('Your Full Name is required');
    if (!formData.parkName.trim()) return setErrorMsg('Park Name is required');
    if (!formData.locationInPark.trim()) return setErrorMsg('Location in park is required');
    if (!formData.category) return setErrorMsg('Complaint Category is required');
    if (!formData.priority) return setErrorMsg('Priority Level is required');
    if (!/^\d{10}$/.test(formData.mobileNumber)) return setErrorMsg('Mobile number must be exactly 10 digits');
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) return setErrorMsg('Please enter a valid email format');
    if (!formData.description.trim() || formData.description.trim().length < 10) return setErrorMsg('Please provide a detailed description (minimum 10 characters)');
    if (!selectedFile) return setErrorMsg('Live Geotagged Photo Evidence is mandatory (*). Please capture a photo using the Live Camera.');

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('parkName', formData.parkName);
      submitData.append('locationInPark', formData.locationInPark);
      submitData.append('category', formData.category);
      submitData.append('priority', formData.priority);
      submitData.append('userPhone', formData.mobileNumber);
      submitData.append('description', formData.description);
      if (formData.title) submitData.append('title', formData.title);
      
      if (parkState.parkId) submitData.append('parkId', parkState.parkId);
      if (parkState.district) submitData.append('district', parkState.district);
      if (parkState.zone) submitData.append('zone', parkState.zone);
      if (parkState.ward) submitData.append('ward', parkState.ward);

      const userStr = localStorage.getItem('user');
      let userId = null;
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          userId = userObj._id || userObj.id || null;
        } catch(e) {}
      }
      
      const complainantName = formData.fullName.trim();
      submitData.append('userName', complainantName);
      if (userId) submitData.append('userId', userId);

      if (selectedFile) {
        submitData.append('images', selectedFile);
      }

      const res = await axios.post('/api/complaints', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newId = res.data.complaintNumber || ('CMP' + Math.floor(100000000 + Math.random() * 900000000));
      setComplaintId(newId);

      const newEntry = {
        id: newId,
        date: new Date().toISOString().split('T')[0],
        park: formData.parkName || 'Central Park',
        category: formData.category || 'General',
        title: formData.description || 'Issue Reported',
        status: 'Submitted'
      };

      try {
        const existing = JSON.parse(localStorage.getItem('my_complaints') || '[]');
        localStorage.setItem('my_complaints', JSON.stringify([newEntry, ...existing]));
        window.dispatchEvent(new Event('complaints-updated'));
      } catch (e) {
        console.error("Error saving local complaint:", e);
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Failed to submit complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(complaintId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const priorities = [
    { label: 'Low', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', icon: '🟢' },
    { label: 'Medium', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: '🟡' },
    { label: 'High', color: '#f97316', bg: '#fff7ed', border: '#ffedd5', icon: '🟠' },
    { label: 'Urgent', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '🔴' }
  ];

  if (isSubmitted) {
    return (
      <div className="complaint-page">
        <div className="complaint-card success-card">
          <div className="success-banner-gradient">
            <div className="success-icon-ring">
              <CheckCircle size={70} color="#059669" />
            </div>
            <h2>Complaint Submitted Successfully!</h2>
            <p>Your grievance has been registered and auto-assigned to officials.</p>
          </div>
          
          <div className="success-body">
            <div className="complaint-id-badge">
              <div className="id-badge-header">
                <span>OFFICIAL COMPLAINT TRACKING NUMBER</span>
              </div>
              <div className="id-value-container">
                <span className="id-value">{complaintId}</span>
                <button className="btn-copy-chip" onClick={copyToClipboard} type="button">
                  {copied ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                  <span>{copied ? 'Copied!' : 'Copy ID'}</span>
                </button>
              </div>
            </div>

            <div className="summary-box">
              <div className="summary-row">
                <span>Park Name:</span>
                <strong>{formData.parkName || 'N/A'}</strong>
              </div>
              <div className="summary-row">
                <span>Category:</span>
                <strong>{formData.category || 'General'}</strong>
              </div>
              <div className="summary-row">
                <span>Priority:</span>
                <span className={`priority-tag priority-${formData.priority.toLowerCase()}`}>
                  {formData.priority}
                </span>
              </div>
            </div>

            <div className="success-actions">
              <button 
                type="button" 
                className="btn-track-action"
                onClick={() => navigate('/track-complaint', { state: { id: complaintId } })}
              >
                <ShieldAlert size={18} /> Track Resolution Status
              </button>
              <button type="button" className="btn-home-action" onClick={() => navigate('/')}>
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="complaint-page">
      {/* Top Hero Banner */}
      <div className="complaint-hero">
        <div className="hero-pill">
          <Sparkles size={14} color="#34d399" />
          <span>CIVIC GRIEVANCE & MAINTENANCE PORTAL</span>
        </div>
        <h1>Submit a Park Complaint</h1>
        <p>Report issues with facilities, sanitation, lights, or horticulture for fast resolution by city officials.</p>
      </div>

      <div className="complaint-card">
        <form className="complaint-form" onSubmit={handleSubmit}>
          
          {/* Section 1: Location & Park */}
          <div className="form-section">
            <div className="section-title">
              <MapPin size={18} color="#059669" />
              <h3>1. Park & Location Information</h3>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="input-label">Park Name *</label>
                <input 
                  type="text" 
                  name="parkName" 
                  className="input-field" 
                  placeholder="e.g. Coles Park / Central Park" 
                  value={formData.parkName} 
                  onChange={handleInputChange} 
                  required 
                  readOnly={!!parkState.parkName} 
                />
              </div>

              <div className="form-group">
                <label className="input-label">Specific Location in Park *</label>
                <input 
                  type="text" 
                  name="locationInPark" 
                  className="input-field" 
                  placeholder="e.g., Near North Gate / Children's Play Area" 
                  value={formData.locationInPark} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="input-label">District</label>
                <input type="text" className="input-field readonly-field" value={parkState.district || 'Auto-filled'} readOnly disabled />
              </div>

              <div className="form-group">
                <label className="input-label">Zone</label>
                <input type="text" className="input-field readonly-field" value={parkState.zone || 'Auto-filled'} readOnly disabled />
              </div>

              <div className="form-group">
                <label className="input-label">Ward</label>
                <input type="text" className="input-field readonly-field" value={parkState.ward || 'Auto-filled'} readOnly disabled />
              </div>
            </div>
          </div>

          {/* Section 2: Category & Priority */}
          <div className="form-section">
            <div className="section-title">
              <AlertTriangle size={18} color="#059669" />
              <h3>2. Issue Category & Priority Level</h3>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="input-label">Complaint Category *</label>
                <select name="category" className="input-field select-field" value={formData.category} onChange={handleInputChange} required>
                  <option value="">-- Select Category --</option>
                  <option value="Electrical">💡 Electrical (Lights / Wiring)</option>
                  <option value="Plumbing">🚰 Plumbing & Water Taps</option>
                  <option value="Gardening / Horticulture">🌿 Gardening & Lawn Maintenance</option>
                  <option value="Cleaning / Sanitation">🧹 Sanitation & Garbage Bins</option>
                  <option value="Civil / Masonry">🧱 Benches & Footpaths Repair</option>
                  <option value="Carpentry">🪵 Wooden Structures & Fencing</option>
                  <option value="Painting">🎨 Equipment Painting</option>
                  <option value="Playground Equipment">🎠 Children Play Equipment</option>
                  <option value="Water Supply / Drainage">🌧️ Waterlogging & Drainage</option>
                  <option value="Gate / Fencing">🚪 Security Gate & Perimeter</option>
                  <option value="General Maintenance">🛠️ General Park Repair</option>
                </select>
              </div>

              <div className="form-group">
                <label className="input-label">Priority Level *</label>
                <div className="priority-chips-grid">
                  {priorities.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className={`priority-chip ${formData.priority === p.label ? 'active' : ''}`}
                      onClick={() => handlePrioritySelect(p.label)}
                      style={{
                        '--chip-color': p.color,
                        '--chip-bg': p.bg,
                        '--chip-border': p.border
                      }}
                    >
                      <span className="chip-icon">{p.icon}</span>
                      <span className="chip-name">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Contact Info & Description */}
          <div className="form-section">
            <div className="section-title">
              <FileText size={18} color="#059669" />
              <h3>3. Citizen Information & Grievance Details</h3>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="input-label">Your Name / Complainant Name *</label>
                <div className="input-with-icon">
                  <UserIcon size={16} className="field-icon" />
                  <input 
                    type="text" 
                    name="fullName" 
                    className="input-field icon-padding" 
                    placeholder="Enter your full name" 
                    value={formData.fullName} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Mobile Number *</label>
                <div className="input-with-icon">
                  <Phone size={16} className="field-icon" />
                  <input 
                    type="tel" 
                    name="mobileNumber" 
                    className="input-field icon-padding" 
                    placeholder="Enter 10-digit mobile number" 
                    value={formData.mobileNumber} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="input-label">Email Address (Optional)</label>
                <div className="input-with-icon">
                  <Mail size={16} className="field-icon" />
                  <input 
                    type="email" 
                    name="email" 
                    className="input-field icon-padding" 
                    placeholder="For status updates via email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Issue Headline / Title (Optional)</label>
                <div className="input-with-icon">
                  <Sparkles size={16} className="field-icon" />
                  <input 
                    type="text" 
                    name="title" 
                    className="input-field icon-padding" 
                    placeholder="e.g., Broken bench near play area" 
                    value={formData.title} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Detailed Description *</label>
              <textarea 
                name="description" 
                className="input-field textarea-field" 
                rows="4" 
                placeholder="Explain what is broken, exact location details, or any potential safety concern..." 
                value={formData.description} 
                onChange={handleInputChange} 
                required
              ></textarea>
            </div>

            {/* Photo Upload Zone */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                <label className="input-label" style={{ margin: 0, fontWeight: 700, color: '#111827' }}>
                  📷 Geotagged Photo Evidence / GPS-Stamped Photo <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <span style={{ 
                  background: '#fef2f2', 
                  color: '#dc2626', 
                  border: '1px solid #fecaca', 
                  fontSize: '0.75rem', 
                  padding: '2px 8px', 
                  borderRadius: '9999px', 
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  🚨 Mandatory Live Verification
                </span>
              </div>
              <div className="upload-dropzone" style={{ padding: '1.25rem' }}>
                <input 
                  type="file" 
                  id="image-upload" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange} 
                  accept="image/*"
                />
                
                {isProcessingFile ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: '#059669' }}>
                    <p style={{ fontWeight: 600 }}>Stamping Live Location & Timestamp...</p>
                  </div>
                ) : filePreview ? (
                  <div className="preview-container">
                    <div style={{ position: 'relative' }}>
                      <img src={filePreview} alt="Complaint Evidence Preview" className="upload-preview-img" style={{ maxHeight: '280px', width: 'auto', borderRadius: '12px' }} />
                      <div style={{ 
                        position: 'absolute', 
                        top: '8px', 
                        left: '8px', 
                        background: 'rgba(16, 185, 129, 0.9)', 
                        color: 'white', 
                        fontSize: '0.75rem', 
                        padding: '3px 8px', 
                        borderRadius: '6px', 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Check size={12} /> Live Verified & Stamped
                      </div>
                    </div>
                    <div className="preview-info" style={{ marginTop: '0.75rem' }}>
                      <span className="file-name">{fileName}</span>
                      <button type="button" className="btn-remove-file" onClick={removeFile}>
                        <X size={16} /> Remove Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {/* Live Camera Button */}
                      <button 
                        type="button" 
                        onClick={() => setIsCameraOpen(true)}
                        style={{
                          flex: 1,
                          width: '100%',
                          minWidth: '200px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          padding: '1.1rem',
                          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '12px',
                          fontWeight: 600,
                          fontSize: '1rem',
                          cursor: 'pointer',
                          boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.25)'
                        }}
                      >
                        <Camera size={22} />
                        <span>Take Photo (Live Camera)</span>
                      </button>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                      📸 Photos are automatically captured via live camera and stamped with your verified <strong>GPS coordinates, date, and live time</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {errorMsg && <div style={{ color: 'red', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 'bold', textAlign: 'center' }}>{errorMsg}</div>}

          {/* Form Submit Row */}
          <div className="form-submit-row">
            <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn-submit-complaint" disabled={loading}>
              {loading ? (
                <>Submitting Grievance...</>
              ) : (
                <>Submit Complaint Report ➔</>
              )}
            </button>
          </div>

        </form>
      </div>

      <LiveCameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        tag="Citizen Grievance"
        defaultLocation={formData.parkName ? {
          name: formData.parkName,
          address: formData.address || formData.parkName
        } : null}
      />
    </div>
  );
};

export default SubmitComplaint;
