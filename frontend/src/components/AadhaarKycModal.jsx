import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, X, Upload, Eye, CheckCircle2, AlertCircle, Loader2, ChevronRight, ImagePlus, FileCheck2, RotateCcw } from 'lucide-react';
import './AadhaarKycModal.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * AadhaarKycModal — Custom document-upload KYC
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - onSubmitted: () => void  — called after successful submission
 *  - currentStatus: 'not_started' | 'pending' | 'verified' | 'rejected'
 */
const AadhaarKycModal = ({ isOpen, onClose, onSubmitted, currentStatus = 'not_started' }) => {
  const [step, setStep] = useState('form');  // 'form' | 'success'
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [frontFile, setFrontFile] = useState(null);
  const [backFile,  setBackFile]  = useState(null);
  const [frontPreview, setFrontPreview] = useState('');
  const [backPreview,  setBackPreview]  = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const frontInputRef = useRef(null);
  const backInputRef  = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setAadhaarNumber('');
      setFrontFile(null);
      setBackFile(null);
      setFrontPreview('');
      setBackPreview('');
      setConsent(false);
      setError('');
    }
  }, [isOpen]);

  const formatAadhaar = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const handleFileChange = (side, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }
    setError('');
    const url = URL.createObjectURL(file);
    if (side === 'front') { setFrontFile(file); setFrontPreview(url); }
    else                  { setBackFile(file);  setBackPreview(url); }
  };

  const getToken = () => {
    const user = JSON.parse(
      localStorage.getItem('contractorUser') ||
      localStorage.getItem('govUser') ||
      localStorage.getItem('adminUser') ||
      localStorage.getItem('user') ||
      '{}'
    );
    return user.token || '';
  };

  const handleSubmit = async () => {
    setError('');
    if (aadhaarNumber.replace(/\s/g, '').length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    if (!frontFile) { setError('Please upload the front side of your Aadhaar card.'); return; }
    if (!backFile)  { setError('Please upload the back side of your Aadhaar card.'); return; }
    if (!consent)   { setError('Please provide your consent to proceed.'); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('aadhaarNumber', aadhaarNumber.replace(/\s/g, ''));
      formData.append('aadhaarFront', frontFile);
      formData.append('aadhaarBack', backFile);

      const res = await fetch(`${API_BASE}/api/kyc/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setStep('success');
        if (onSubmitted) onSubmitted();
      } else {
        setError(data.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      setError('Server error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="kyc-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="kyc-modal">
        {/* Header */}
        <div className="kyc-header">
          <div className="kyc-header-icon">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h2 className="kyc-title">Aadhaar KYC Verification</h2>
            <p className="kyc-subtitle">Upload your Aadhaar card for identity verification</p>
          </div>
          <button className="kyc-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="kyc-steps">
          {['form', 'success'].map((s, i) => {
            const isActive = step === s;
            const isDone   = step === 'success' && s === 'form';
            return (
              <div key={s} className={`kyc-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                <div className="kyc-step-circle">
                  {isDone ? <CheckCircle2 size={14} /> : <span>{i + 1}</span>}
                </div>
                <span className="kyc-step-label">
                  {s === 'form' ? 'Upload Documents' : 'Submitted'}
                </span>
                {i < 1 && <div className={`kyc-step-line ${isDone ? 'done' : ''}`} />}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="kyc-body">

          {/* ---- FORM STEP ---- */}
          {step === 'form' && (
            <div className="kyc-section">
              {/* Aadhaar Number */}
              <div className="kyc-field">
                <label htmlFor="kyc-aadhaar-no" className="kyc-label">Aadhaar Number</label>
                <input
                  id="kyc-aadhaar-no"
                  type="text"
                  inputMode="numeric"
                  className="kyc-input"
                  placeholder="XXXX XXXX XXXX"
                  value={aadhaarNumber}
                  onChange={e => { setAadhaarNumber(formatAadhaar(e.target.value)); setError(''); }}
                  maxLength={14}
                  autoComplete="off"
                />
                <span className="kyc-field-hint">{aadhaarNumber.replace(/\s/g, '').length} / 12 digits</span>
              </div>

              {/* Document Uploads */}
              <div className="kyc-upload-grid">
                {/* Front */}
                <div className="kyc-upload-card" onClick={() => frontInputRef.current?.click()}>
                  {frontPreview ? (
                    <div className="kyc-img-preview-wrapper">
                      <img src={frontPreview} alt="Aadhaar Front" className="kyc-img-preview" />
                      <div className="kyc-img-overlay">
                        <RotateCcw size={18} /> Change
                      </div>
                      <span className="kyc-img-badge"><FileCheck2 size={12} /> Front</span>
                    </div>
                  ) : (
                    <div className="kyc-upload-placeholder">
                      <ImagePlus size={28} className="kyc-upload-icon" />
                      <span className="kyc-upload-label">Front of Aadhaar</span>
                      <span className="kyc-upload-hint">Click to upload</span>
                    </div>
                  )}
                  <input
                    ref={frontInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => handleFileChange('front', e.target.files[0])}
                    id="kyc-front-input"
                  />
                </div>

                {/* Back */}
                <div className="kyc-upload-card" onClick={() => backInputRef.current?.click()}>
                  {backPreview ? (
                    <div className="kyc-img-preview-wrapper">
                      <img src={backPreview} alt="Aadhaar Back" className="kyc-img-preview" />
                      <div className="kyc-img-overlay">
                        <RotateCcw size={18} /> Change
                      </div>
                      <span className="kyc-img-badge back"><FileCheck2 size={12} /> Back</span>
                    </div>
                  ) : (
                    <div className="kyc-upload-placeholder">
                      <ImagePlus size={28} className="kyc-upload-icon" />
                      <span className="kyc-upload-label">Back of Aadhaar</span>
                      <span className="kyc-upload-hint">Click to upload</span>
                    </div>
                  )}
                  <input
                    ref={backInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => handleFileChange('back', e.target.files[0])}
                    id="kyc-back-input"
                  />
                </div>
              </div>

              <div className="kyc-upload-tips">
                <span>📸 Tips: Ensure photos are clear, well-lit, and all text is readable. Max 5MB per image.</span>
              </div>

              {/* Consent */}
              <label className="kyc-consent-label">
                <input
                  type="checkbox"
                  className="kyc-checkbox"
                  checked={consent}
                  onChange={() => setConsent(c => !c)}
                  id="kyc-consent-cb"
                />
                <span>
                  I voluntarily submit my Aadhaar card images for identity verification as required by this platform.
                  I understand these documents will be reviewed securely by authorized administrators only.
                </span>
              </label>

              {error && (
                <div className="kyc-error">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              <button
                className="kyc-btn-primary"
                onClick={handleSubmit}
                disabled={loading}
                id="kyc-submit-btn"
              >
                {loading ? (
                  <><Loader2 size={16} className="kyc-spin" /> Submitting…</>
                ) : (
                  <>Submit for Review <ChevronRight size={16} /></>
                )}
              </button>
            </div>
          )}

          {/* ---- SUCCESS STEP ---- */}
          {step === 'success' && (
            <div className="kyc-section kyc-success-section">
              <div className="kyc-success-icon">
                <CheckCircle2 size={52} />
              </div>
              <h3 className="kyc-success-title">Documents Submitted!</h3>
              <p className="kyc-success-sub">Your Aadhaar card has been submitted for review. The admin will verify your documents within 1–2 business days.</p>

              <div className="kyc-status-pill pending">
                <span>🕐 Pending Review</span>
              </div>

              <button className="kyc-btn-primary" onClick={onClose} id="kyc-done-btn">
                Got it, Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AadhaarKycModal;
