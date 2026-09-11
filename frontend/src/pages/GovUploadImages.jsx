import { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, CheckCircle, AlertCircle } from 'lucide-react';
import './GovUploadImages.css';

const GovUploadImages = () => {
  const fileInputRef = useRef(null);
  
  const [parkId, setParkId] = useState('');
  const [imageType, setImageType] = useState('before'); // 'before' or 'after'
  const [images, setImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    const newImages = [];
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push({
            id: Date.now() + Math.random(),
            file,
            preview: reader.result,
            type: imageType
          });
          
          if (newImages.length === files.filter(f => f.type.startsWith('image/')).length) {
            setImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleUpload = () => {
    if (!parkId) {
      alert("Please select a park first.");
      return;
    }
    
    if (images.length === 0) {
      alert("Please select at least one image to upload.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadComplete(false);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadComplete(true);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleCancel = () => {
    if (images.length > 0) {
      if (window.confirm("Are you sure you want to cancel? All selected images will be removed.")) {
        setImages([]);
        setUploadProgress(0);
        setUploadComplete(false);
      }
    }
  };

  const beforeImages = images.filter(img => img.type === 'before');
  const afterImages = images.filter(img => img.type === 'after');

  return (
    <div className="gov-upload-page">
      <div className="gov-page-header">
        <h1 className="gov-page-title">Upload Inspection Images</h1>
        <p className="gov-page-subtitle">Upload before and after images of park maintenance work.</p>
      </div>

      <div className="gov-upload-grid">
        {/* Left Column: Upload Controls */}
        <div className="gov-card upload-controls-card">
          <div className="gov-card-header">
            <h3 className="gov-card-title">Upload Settings</h3>
          </div>
          <div className="upload-settings-body">
            <div className="form-group">
              <label>Select Park</label>
              <select 
                className="form-control" 
                value={parkId}
                onChange={(e) => setParkId(e.target.value)}
              >
                <option value="">-- Select Park --</option>
                <option value="1">Cubbon Park</option>
                <option value="2">Lalbagh Botanical Garden</option>
                <option value="3">Jayaprakash Narayan Biodiversity Park</option>
              </select>
            </div>

            <div className="form-group">
              <label>Image Type</label>
              <div className="radio-group-type">
                <label className={`type-radio ${imageType === 'before' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="imageType" 
                    value="before" 
                    checked={imageType === 'before'}
                    onChange={() => setImageType('before')}
                  />
                  Before Work
                </label>
                <label className={`type-radio ${imageType === 'after' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    name="imageType" 
                    value="after" 
                    checked={imageType === 'after'}
                    onChange={() => setImageType('after')}
                  />
                  After Work
                </label>
              </div>
            </div>

            <div 
              className="drag-drop-zone"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <UploadCloud size={48} className="upload-icon-large" />
              <h4>Drag & Drop images here</h4>
              <p>or click to browse from your computer</p>
              <span className="file-hint">Supports: JPG, PNG, WEBP (Max 5MB each)</span>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileInput}
                style={{ display: 'none' }} 
              />
            </div>
          </div>
        </div>

        {/* Right Column: Preview & Status */}
        <div className="gov-card upload-preview-card">
          <div className="gov-card-header">
            <h3 className="gov-card-title">Image Gallery</h3>
          </div>
          
          <div className="preview-body">
            {images.length === 0 ? (
              <div className="empty-gallery">
                <ImageIcon size={48} />
                <p>No images selected yet.</p>
              </div>
            ) : (
              <div className="gallery-sections">
                {beforeImages.length > 0 && (
                  <div className="gallery-section">
                    <h4>Before Work Images ({beforeImages.length})</h4>
                    <div className="preview-grid">
                      {beforeImages.map(img => (
                        <div key={img.id} className="preview-item">
                          <img src={img.preview} alt="Before" />
                          {!isUploading && !uploadComplete && (
                            <button className="btn-remove" onClick={() => removeImage(img.id)}>
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {afterImages.length > 0 && (
                  <div className="gallery-section">
                    <h4>After Work Images ({afterImages.length})</h4>
                    <div className="preview-grid">
                      {afterImages.map(img => (
                        <div key={img.id} className="preview-item">
                          <img src={img.preview} alt="After" />
                          {!isUploading && !uploadComplete && (
                            <button className="btn-remove" onClick={() => removeImage(img.id)}>
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="upload-footer">
            {isUploading && (
              <div className="progress-container">
                <div className="progress-header">
                  <span>Uploading {images.length} images...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}
            
            {uploadComplete && (
              <div className="upload-success-msg">
                <CheckCircle size={20} />
                <span>Images uploaded successfully!</span>
              </div>
            )}
            
            <div className="upload-actions">
              <button 
                className="btn-form btn-reset" 
                onClick={handleCancel}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button 
                className="btn-form btn-submit" 
                onClick={handleUpload}
                disabled={images.length === 0 || isUploading || uploadComplete}
              >
                <UploadCloud size={18} /> Upload Images
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovUploadImages;
