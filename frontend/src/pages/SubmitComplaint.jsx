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
  Check
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './SubmitComplaint.css';

const SubmitComplaint = () => {
  const location = useLocation();
  const parkState = location.state || {};

  const [formData, setFormData] = useState({
    parkName: parkState.parkName || '',
    locationInPark: '',
    category: '',
    mobileNumber: '',
    title: '',
    email: '',
    description: '',
    priority: 'Medium'
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFileName(file.name);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileName('');
    setFilePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('parkName', formData.parkName);
      submitData.append('locationInPark', formData.locationInPark);
      submitData.append('category', formData.category);
      submitData.append('priority', formData.priority);
      submitData.append('userPhone', formData.mobileNumber);
      submitData.append('description', formData.description);
      
      if (parkState.parkId) submitData.append('parkId', parkState.parkId);
      if (parkState.district) submitData.append('district', parkState.district);
      if (parkState.zone) submitData.append('zone', parkState.zone);
      if (parkState.ward) submitData.append('ward', parkState.ward);

      const userStr = localStorage.getItem('user');
      let userName = 'Citizen';
      let userId = null;
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          userName = userObj.name || userObj.firstName || 'Citizen';
          userId = userObj._id || userObj.id || null;
        } catch(e) {}
      }
      submitData.append('userName', userName);
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
              <h3>3. Complaint Details & Contact</h3>
            </div>

            <div className="form-grid-2">
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
              <label className="input-label">Attach Photo Evidence (Optional)</label>
              <div className="upload-dropzone">
                <input 
                  type="file" 
                  id="image-upload" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange} 
                  accept="image/*"
                />
                
                {filePreview ? (
                  <div className="preview-container">
                    <img src={filePreview} alt="Complaint Evidence Preview" className="upload-preview-img" />
                    <div className="preview-info">
                      <span className="file-name">{fileName}</span>
                      <button type="button" className="btn-remove-file" onClick={removeFile}>
                        <X size={16} /> Remove Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="dropzone-content" onClick={() => document.getElementById('image-upload').click()}>
                    <div className="upload-icon-ring">
                      <Upload size={24} color="#059669" />
                    </div>
                    <div className="upload-text">
                      <strong>Click to upload photo evidence</strong>
                      <span>Supports PNG, JPG, JPEG</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

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
    </div>
  );
};

export default SubmitComplaint;
