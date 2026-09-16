import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, 
  CreditCard, 
  CheckCircle, 
  MapPin, 
  FileText, 
  Home, 
  User, 
  Package, 
  Image as ImageIcon,
  CheckCircle2,
  HelpCircle,
  Store,
  AlertCircle,
  Upload
} from 'lucide-react';

const DEFAULT_PROOF_TYPES = [
  'Studying in another city',
  'Working in another city',
  'Rented accommodation',
  'Currently staying in another city',
  'Other'
];

const StallBookingModal = ({ parkId, parkName, slot, onClose, onBookingSuccess }) => {
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantPhone: '',
    stallName: '',
    productsType: '',
    nativeAddress: '',
    currentAddress: '',
    isAddressSameAsAadhaar: 'yes', // 'yes' | 'no'
    differentAddressReason: 'Studying in another city',
    differentAddressOtherReason: '',
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [aadhaarDocFile, setAadhaarDocFile] = useState(null);
  const [currentAddressProofFile, setCurrentAddressProofFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    // Autofill user details if available
    const userStr = localStorage.getItem('user') || localStorage.getItem('public_user') || localStorage.getItem('govUser');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        if (parsed.name && !formData.applicantName) {
          setFormData(prev => ({
            ...prev,
            applicantName: parsed.name || '',
            applicantPhone: parsed.phone || ''
          }));
        }
      } catch (_) {}
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file for applicant photo.');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = window.document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      window.document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!photoFile) {
      setError('Applicant Photo is required.');
      setLoading(false);
      return;
    }

    if (formData.isAddressSameAsAadhaar === 'no' && !currentAddressProofFile) {
      setError('Current address proof document is required when current address differs from Aadhaar.');
      setLoading(false);
      return;
    }

    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('public_user') || localStorage.getItem('govUser') || localStorage.getItem('contractorUser');
      let userId, token;
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr);
          userId = parsed._id || parsed.id || (parsed.user && (parsed.user._id || parsed.user.id));
          token = parsed.token || localStorage.getItem('token');
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      if (!token) token = localStorage.getItem('token');

      if (!userId || !token) {
        setError('Please login to book a stall.');
        setLoading(false);
        return;
      }

      const effectiveParkId = parkId || slot?.park || slot?.parkId;

      if (!effectiveParkId || effectiveParkId === 'dummy-park-id') {
        alert('This is a demo park! Stall booking request simulated successfully.');
        onBookingSuccess();
        onClose();
        setLoading(false);
        return;
      }

      // Submit booking form data
      const submitData = new FormData();
      submitData.append('parkId', effectiveParkId);
      submitData.append('slotId', slot._id);
      submitData.append('userId', userId);
      submitData.append('applicantName', formData.applicantName);
      submitData.append('applicantPhone', formData.applicantPhone);
      submitData.append('stallName', formData.stallName);
      submitData.append('productsType', formData.productsType);
      submitData.append('amountPaid', slot.price || 0);

      // Address Information
      submitData.append('nativeAddress', formData.nativeAddress);
      submitData.append('currentAddress', formData.currentAddress);
      submitData.append('isAddressSameAsAadhaar', formData.isAddressSameAsAadhaar === 'yes');

      if (formData.isAddressSameAsAadhaar === 'no') {
        submitData.append('differentAddressReason', formData.differentAddressReason);
        submitData.append('differentAddressOtherReason', formData.differentAddressOtherReason);
        if (currentAddressProofFile) {
          submitData.append('currentAddressProof', currentAddressProofFile);
        }
      }

      if (photoFile) submitData.append('photo', photoFile);
      if (aadhaarDocFile) submitData.append('document', aadhaarDocFile);

      const bookingRes = await axios.post('/api/stall-bookings', submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const booking = bookingRes.data.booking || bookingRes.data;
      const bookingId = booking._id;

      // Razorpay checkout
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      const orderRes = await axios.post(`/api/stall-bookings/${bookingId}/create-order`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const order = orderRes.data;

      const options = {
        key: order.razorpayKeyId || 'rzp_test_TZpwFUaag8MfCo',
        amount: order.amount,
        currency: 'INR',
        name: 'Parks Monitoring System',
        description: `Stall Booking at ${parkName}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            await axios.post(`/api/stall-bookings/${bookingId}/pay`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });

            setPaymentSuccess(true);
            setLoading(false);
            onBookingSuccess();
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.message || 'Payment verification failed. Please contact support.');
            setLoading(false);
          }
        },
        prefill: {
          name: formData.applicantName,
          contact: formData.applicantPhone
        },
        theme: { color: '#059669' },
        modal: {
          ondismiss: () => {
            setError('Payment was cancelled. Your booking request is saved. You can pay from My Stall Bookings.');
            setLoading(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        setError(`Payment failed: ${response.error.description}. Your request is saved — retry from My Stall Bookings.`);
        setLoading(false);
      });
      paymentObject.open();

    } catch (err) {
      console.error('Error booking stall:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to process booking. Please try again.';
      setError(errMsg);
      setLoading(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────────────
  if (paymentSuccess) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '450px', maxWidth: '92%', padding: '2.25rem', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
          <CheckCircle size={64} color="#059669" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <h3 style={{ color: '#064e3b', margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 800 }}>Stall Booking Submitted!</h3>
          <p style={{ color: '#475569', marginBottom: '1.5rem', fontSize: '0.92rem', lineHeight: 1.5 }}>
            Your application for <strong>{formData.stallName}</strong> at <strong>{parkName}</strong> has been submitted.
          </p>
          <div style={{ background: '#f0fdf4', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'left', border: '1px solid #bbf7d0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Applicant:</span>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>{formData.applicantName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Location:</span>
              <span style={{ fontWeight: 700, color: '#1e293b' }}>{parkName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Aadhaar Address:</span>
              <span style={{ fontWeight: 600, color: '#334155' }}>{formData.nativeAddress || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Current Address:</span>
              <span style={{ fontWeight: 600, color: '#334155' }}>{formData.currentAddress || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #dcfce7', paddingTop: '8px' }}>
              <span style={{ color: '#64748b' }}>Amount Paid:</span>
              <span style={{ fontWeight: 800, color: '#059669', fontSize: '1.05rem' }}>₹{slot?.price || 0}</span>
            </div>
          </div>
          <button
            onClick={() => { onClose(); }}
            style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}
          >
            Done & View Status
          </button>
        </div>
      </div>
    );
  }

  // ── Booking Form ──────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
      <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', borderRadius: '16px', width: '620px', maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#065f46', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
              <Store size={13} /> Official Park Stall Application
            </div>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.35rem', fontWeight: 800 }}>Book Stall at {parkName}</h3>
            <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CreditCard size={14} color="#059669" /> Fee: <strong>₹{slot?.price || 0}</strong> • {new Date(slot?.date).toLocaleDateString()} ({slot?.startTime} - {slot?.endTime})
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#b91c1c', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {/* Section 1: Applicant Details */}
        <div style={{ background: '#f8fafc', padding: '1.1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', color: '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '7px' }}>
            <User size={16} color="#059669" /> 1. Applicant Details
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#374151', fontSize: '0.84rem' }}>
                Applicant Name *
              </label>
              <input 
                type="text" 
                name="applicantName" 
                value={formData.applicantName} 
                onChange={handleInputChange} 
                required 
                placeholder="Full Legal Name"
                style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#374151', fontSize: '0.84rem' }}>
                Phone Number *
              </label>
              <input 
                type="tel" 
                name="applicantPhone" 
                value={formData.applicantPhone} 
                onChange={handleInputChange} 
                required 
                placeholder="10-digit mobile number"
                style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }} 
              />
            </div>
          </div>

          {/* Photo Upload with live preview */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#374151', fontSize: '0.84rem' }}>
              Applicant Photo * (Passport size)
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #059669' }} />
              ) : (
                <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <ImageIcon size={24} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input 
                  type="file" 
                  onChange={handlePhotoChange} 
                  required={!photoFile}
                  accept=".jpg,.jpeg,.png"
                  style={{ width: '100%', padding: '0.45rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} 
                />
                <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: '#64748b' }}>Clear face photo for stall license ID badge.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Stall & Products */}
        <div style={{ background: '#f8fafc', padding: '1.1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', color: '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Package size={16} color="#059669" /> 2. Stall & Business Information
          </h4>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#374151', fontSize: '0.84rem' }}>Stall Name *</label>
            <input 
              type="text" 
              name="stallName" 
              value={formData.stallName} 
              onChange={handleInputChange} 
              required 
              placeholder="e.g. Green Valley Organic Juices & Snacks"
              style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }} 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#374151', fontSize: '0.84rem' }}>Types of Products *</label>
            <textarea 
              name="productsType" 
              value={formData.productsType} 
              onChange={handleInputChange} 
              required 
              rows="2"
              placeholder="List items sold (e.g. Fresh sugarcane juice, cut fruits, coconut water, packaged snacks)..."
              style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box', resize: 'vertical' }} 
            />
          </div>
        </div>

        {/* Section 3: Address Details */}
        <div style={{ background: '#f8fafc', padding: '1.1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', color: '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Home size={16} color="#059669" /> 3. Address Details
          </h4>

          {/* Aadhaar Address */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#374151', fontSize: '0.84rem' }}>
              Aadhaar Address *
            </label>
            <textarea 
              name="nativeAddress" 
              value={formData.nativeAddress} 
              onChange={handleInputChange} 
              required 
              rows="2"
              placeholder="Enter address"
              style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }} 
            />
          </div>

          {/* Aadhaar Card Document Upload */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#374151', fontSize: '0.84rem' }}>
              Aadhaar Card Upload (Front / Back / PDF) *
            </label>
            <input 
              type="file" 
              onChange={(e) => setAadhaarDocFile(e.target.files[0])} 
              required={!aadhaarDocFile}
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', backgroundColor: 'white', boxSizing: 'border-box' }} 
            />
            <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              Upload your official Aadhaar card copy (PDF or Image).
            </p>
          </div>

          {/* Current Residential Address */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#374151', fontSize: '0.84rem' }}>
              Current Residential Address *
            </label>
            <textarea 
              name="currentAddress" 
              value={formData.currentAddress} 
              onChange={handleInputChange} 
              required 
              rows="2"
              placeholder="Enter current address"
              style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }} 
            />
          </div>

          {/* Is your current address the same as Aadhaar? */}
          <div style={{ marginBottom: '0.5rem', background: '#ffffff', padding: '0.9rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#1e293b', fontSize: '0.86rem' }}>
              Is your current address the same as Aadhaar? *
            </label>
            
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.5rem' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                <input 
                  type="radio" 
                  name="isAddressSameAsAadhaar" 
                  value="yes" 
                  checked={formData.isAddressSameAsAadhaar === 'yes'} 
                  onChange={handleInputChange} 
                />
                Yes
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
                <input 
                  type="radio" 
                  name="isAddressSameAsAadhaar" 
                  value="no" 
                  checked={formData.isAddressSameAsAadhaar === 'no'} 
                  onChange={handleInputChange} 
                />
                No
              </label>
            </div>

            {/* Conditional Display for YES */}
            {formData.isAddressSameAsAadhaar === 'yes' ? (
              <div style={{ padding: '8px 12px', background: '#ecfdf5', color: '#065f46', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #a7f3d0' }}>
                <CheckCircle2 size={14} /> Current address matches Aadhaar address.
              </div>
            ) : (
              /* Conditional Display for NO */
              <div style={{ marginTop: '0.8rem', padding: '1rem', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#92400e', fontSize: '0.82rem' }}>
                    Reason for different address *
                  </label>
                  <select 
                    name="differentAddressReason" 
                    value={formData.differentAddressReason} 
                    onChange={handleInputChange} 
                    required 
                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #f59e0b', borderRadius: '6px', fontSize: '0.88rem', backgroundColor: 'white' }}
                  >
                    <option value="Studying in another city">Studying in another city</option>
                    <option value="Working in another city">Working in another city</option>
                    <option value="Rented accommodation">Rented accommodation</option>
                    <option value="Currently staying in another city">Currently staying in another city</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {formData.differentAddressReason === 'Other' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#92400e', fontSize: '0.82rem' }}>
                      Please specify reason *
                    </label>
                    <input 
                      type="text" 
                      name="differentAddressOtherReason" 
                      value={formData.differentAddressOtherReason} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="State your reason..."
                      style={{ width: '100%', padding: '0.55rem', border: '1px solid #f59e0b', borderRadius: '6px', fontSize: '0.88rem', boxSizing: 'border-box' }} 
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: '600', color: '#92400e', fontSize: '0.82rem' }}>
                    Current Address Proof *
                  </label>
                  <input 
                    type="file" 
                    onChange={(e) => setCurrentAddressProofFile(e.target.files[0])} 
                    required 
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ width: '100%', padding: '0.45rem', border: '1px solid #f59e0b', borderRadius: '6px', fontSize: '0.82rem', backgroundColor: 'white' }} 
                  />
                  <p style={{ margin: '3px 0 0', fontSize: '0.74rem', color: '#92400e' }}>
                    Upload rental agreement, college ID, utility bill, or employment proof.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary & Fee */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
            <span style={{ color: '#475569', fontWeight: 600 }}>Stall Slot:</span>
            <span style={{ fontWeight: 700, color: '#1e293b' }}>{slot?.location || 'Allocated Zone'} ({slot?.startTime} - {slot?.endTime})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginTop: '6px' }}>
            <span style={{ color: '#475569', fontWeight: 600 }}>Booking Fee:</span>
            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#059669' }}>₹{slot?.price || 0}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ flex: 1, padding: '0.85rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            style={{ flex: 2, padding: '0.85rem', background: loading ? '#94a3b8' : 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(5,150,105,0.25)' }}
          >
            <CreditCard size={18} /> {loading ? 'Processing Application...' : `Pay ₹${slot?.price || 0} & Submit Application`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StallBookingModal;
