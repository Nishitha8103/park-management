import { useState } from 'react';
import axios from 'axios';
import { X, CreditCard, CheckCircle } from 'lucide-react';

const StallBookingModal = ({ parkId, parkName, slot, onClose, onBookingSuccess }) => {
  const [formData, setFormData] = useState({
    stallName: '',
    productsType: '',
    applicantName: '',
    applicantPhone: '',
  });
  const [docFile, setDocFile] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

      // Step 1: Submit booking form data to create a pending booking
      const submitData = new FormData();
      submitData.append('parkId', effectiveParkId);
      submitData.append('slotId', slot._id);
      submitData.append('userId', userId);
      submitData.append('stallName', formData.stallName);
      submitData.append('productsType', formData.productsType);
      submitData.append('applicantName', formData.applicantName);
      submitData.append('applicantPhone', formData.applicantPhone);
      submitData.append('amountPaid', slot.price);
      if (docFile) submitData.append('document', docFile);
      if (photo) submitData.append('photo', photo);

      const bookingRes = await axios.post('/api/stall-bookings', submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const booking = bookingRes.data.booking || bookingRes.data;
      const bookingId = booking._id;

      // Step 2: Load Razorpay and trigger payment
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      // Step 3: Create Razorpay order
      const orderRes = await axios.post(`/api/stall-bookings/${bookingId}/create-order`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const order = orderRes.data;

      // Step 4: Open Razorpay checkout
      const options = {
        key: order.razorpayKeyId || 'rzp_test_TZpwFUaag8MfCo',
        amount: order.amount,
        currency: 'INR',
        name: 'Parks Monitoring System',
        description: `Stall Booking at ${parkName}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // Step 5: Verify payment on backend
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
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '420px', maxWidth: '90%', padding: '2rem', textAlign: 'center' }}>
          <CheckCircle size={64} color="#059669" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: '#064e3b', margin: '0 0 8px' }}>Booking Confirmed!</h3>
          <p style={{ color: '#475569', marginBottom: '1.5rem' }}>
            Your stall at <strong>{parkName}</strong> has been booked successfully. Pending Admin approval.
          </p>
          <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>Stall Name:</span>
              <span style={{ fontWeight: 700 }}>{formData.stallName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>Location:</span>
              <span style={{ fontWeight: 700 }}>{parkName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Amount Paid:</span>
              <span style={{ fontWeight: 700, color: '#059669' }}>₹{slot.price}</span>
            </div>
          </div>
          <button
            onClick={() => { onClose(); }}
            style={{ width: '100%', padding: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ── Booking Form ──────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', borderRadius: '12px', width: '520px', maxWidth: '92%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, color: '#1f2937' }}>Book a Stall at {parkName}</h3>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CreditCard size={14} color="#059669" /> Payment via Razorpay — ₹{slot.price}
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={22} /></button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, border: '1px solid #fca5a5' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#374151', fontSize: '0.88rem' }}>Applicant Name *</label>
            <input type="text" name="applicantName" value={formData.applicantName} onChange={handleInputChange} required placeholder="Full Name"
              style={{ width: '100%', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#374151', fontSize: '0.88rem' }}>Phone Number *</label>
            <input type="tel" name="applicantPhone" value={formData.applicantPhone} onChange={handleInputChange} required placeholder="9876543210"
              style={{ width: '100%', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#374151', fontSize: '0.88rem' }}>Stall Name *</label>
          <input type="text" name="stallName" value={formData.stallName} onChange={handleInputChange} required placeholder="e.g. Fresh Juices & Snacks"
            style={{ width: '100%', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#374151', fontSize: '0.88rem' }}>Types of Products *</label>
          <textarea name="productsType" value={formData.productsType} onChange={handleInputChange} required placeholder="Describe what you will be selling..."
            style={{ width: '100%', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '70px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#374151', fontSize: '0.88rem' }}>Upload Photo *</label>
            <input type="file" onChange={(e) => setPhoto(e.target.files[0])} required accept=".jpg,.jpeg,.png"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Recent passport size photo</p>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#374151', fontSize: '0.88rem' }}>ID Document *</label>
            <input type="file" onChange={(e) => setDocFile(e.target.files[0])} required accept=".pdf,.jpg,.jpeg,.png"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Aadhaar/PAN/License</p>
          </div>
        </div>

        {/* Summary */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
            <span style={{ color: '#475569', fontWeight: 600 }}>Date & Time:</span>
            <span style={{ fontWeight: 700 }}>{new Date(slot.date).toLocaleDateString()} ({slot.startTime} - {slot.endTime})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
            <span style={{ color: '#475569', fontWeight: 600 }}>Location:</span>
            <span style={{ fontWeight: 700 }}>{slot.location}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginTop: '6px' }}>
            <span style={{ color: '#475569', fontWeight: 600 }}>Booking Amount:</span>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#059669' }}>₹{slot.price}</span>
          </div>
        </div>

        {/* Payment note */}
        <div style={{ padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '0.85rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={16} />
          Clicking "Pay Now" will open the Razorpay secure payment gateway to complete your booking.
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={{ flex: 2, padding: '0.75rem', backgroundColor: loading ? '#94a3b8' : '#059669', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <CreditCard size={17} /> {loading ? 'Processing...' : `Pay ₹${slot.price} & Confirm Booking`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StallBookingModal;
