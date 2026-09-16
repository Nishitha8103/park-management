import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, CheckCircle2, XCircle, Clock, CreditCard, ExternalLink } from 'lucide-react';
import Swal from 'sweetalert2';
import StallBookingModal from '../components/StallBookingModal';

const BookingTimer = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;
    const calculateTime = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        setIsExpired(true);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const hStr = hours < 10 ? `0${hours}` : hours;
      const mStr = minutes < 10 ? `0${minutes}` : minutes;
      const sStr = seconds < 10 ? `0${seconds}` : seconds;

      setTimeLeft(`${hStr}h ${mStr}m ${sStr}s`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) return null;

  if (isExpired) {
    return (
      <div style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '0.82rem', marginTop: '4px' }}>
        🔴 Payment Window Expired
      </div>
    );
  }

  return (
    <div style={{ color: '#d97706', fontWeight: 'bold', fontSize: '0.82rem', marginTop: '6px', backgroundColor: '#fffbe6', padding: '4px 8px', borderRadius: '4px', border: '1px solid #fef08a', display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span>⏱️ Payment Deadline:</span>
      <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#b45309' }}>{timeLeft}</span>
    </div>
  );
};

const MyStallBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedPark, setSelectedPark] = useState(null);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/stall-slots/available');
      setAvailableSlots(res.data);
    } catch (error) {
      console.error('Error fetching available slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const parsed = JSON.parse(userStr);
      const userId = parsed._id || parsed.id;
      const token = parsed.token;

      const res = await axios.get(`/api/stall-bookings/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async (booking) => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const parsed = JSON.parse(userStr);
      const token = parsed.token;

      const res = await loadRazorpayScript();
      if (!res) {
        Swal.fire({
          title: 'Offline Error',
          text: 'Razorpay SDK failed to load. Are you online?',
          icon: 'error'
        });
        return;
      }

      // Create order
      const { data: order } = await axios.post(`/api/stall-bookings/${booking._id}/create-order`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const options = {
        key: order.razorpayKeyId, 
        amount: order.amount,
        currency: "INR",
        name: "Park Stall Booking",
        description: `Payment for stall at ${booking.park?.name || 'Park'}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            await axios.post(`/api/stall-bookings/${booking._id}/pay`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire({
              title: 'Payment Successful!',
              text: 'Your stall booking is now confirmed.',
              icon: 'success',
              timer: 2200,
              showConfirmButton: false
            });
            fetchBookings();
            fetchAvailableSlots();
          } catch (err) {
            Swal.fire({
              title: 'Verification Failed',
              text: err.response?.data?.message || 'Payment verification failed',
              icon: 'error'
            });
          }
        },
        prefill: {
          name: parsed.name || "Citizen",
          email: parsed.email || "citizen@example.com",
          contact: parsed.phone || "9999999999"
        },
        theme: {
          color: "#10b981"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      
      paymentObject.on('payment.failed', function (response) {
        Swal.fire({
          title: 'Payment Failed',
          text: response.error?.description || 'Transaction could not be completed.',
          icon: 'error'
        });
      });
      
    } catch (error) {
      console.error('Error initiating payment:', error);
      Swal.fire({
        title: 'Payment Error',
        text: error.response?.data?.message || 'Failed to initiate payment.',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableSlots();
    fetchBookings();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading available slots...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>My Stall Bookings</h2>
      </div>

      {bookings.length > 0 && (
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '3rem' }}>
          {bookings.map(booking => (
            <div key={booking._id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{booking.stallName}</h3>
                <p style={{ margin: '0 0 0.25rem 0', color: '#475569' }}><strong>Park:</strong> {booking.park?.name || 'Unknown'}</p>
                {booking.slot && (
                  <p style={{ margin: '0 0 0.25rem 0', color: '#475569' }}>
                    <strong>Slot:</strong> {new Date(booking.slot.date).toLocaleDateString()} ({booking.slot.startTime} - {booking.slot.endTime}) @ {booking.slot.location}
                  </p>
                )}
                <p style={{ margin: '0 0 0.25rem 0', color: '#475569' }}><strong>Products:</strong> {booking.productsType}</p>
                <p style={{ margin: '0', color: '#475569', fontSize: '0.85rem' }}>Requested on: {new Date(booking.bookingDate).toLocaleDateString()}</p>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#059669', marginBottom: '0.25rem' }}>
                  ₹{booking.amountPaid}
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '500',
                  backgroundColor: (booking.status === 'Approved' || booking.status === 'Confirmed') ? '#dcfce7' : (booking.status === 'Rejected' || booking.status === 'Expired') ? '#fee2e2' : booking.status === 'Pending Payment' ? '#e0e7ff' : '#fef3c7',
                  color: (booking.status === 'Approved' || booking.status === 'Confirmed') ? '#166534' : (booking.status === 'Rejected' || booking.status === 'Expired') ? '#991b1b' : booking.status === 'Pending Payment' ? '#3730a3' : '#92400e'
                }}>
                  {booking.status === 'Confirmed' && <CheckCircle2 size={14} />}
                  {(booking.status === 'Rejected' || booking.status === 'Expired') && <XCircle size={14} />}
                  {booking.status === 'Pending Approval' && <Clock size={14} />}
                  {booking.status === 'Pending Payment' && <CreditCard size={14} />}
                  {booking.status}
                </span>

                {booking.status === 'Pending Payment' && (
                  <>
                    <BookingTimer expiresAt={booking.paymentExpiresAt} />
                    {(!booking.paymentExpiresAt || new Date(booking.paymentExpiresAt) > new Date()) ? (
                      <button 
                        onClick={() => handlePay(booking)}
                        style={{ marginTop: '4px', padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CreditCard size={16} /> Pay ₹{booking.amountPaid} Now
                      </button>
                    ) : (
                      <button 
                        disabled
                        style={{ marginTop: '4px', padding: '0.5rem 1rem', backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '4px', cursor: 'not-allowed', fontWeight: 'bold' }}>
                        Payment Window Expired
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderTop: bookings.length > 0 ? '2px solid #e2e8f0' : 'none', paddingTop: bookings.length > 0 ? '2rem' : '0' }}>
        <h2>Available Stall Slots</h2>
      </div>

      {(() => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const upcomingSlots = availableSlots.filter(slot => new Date(slot.date) >= today && slot.isAvailable && (slot.availableSlots === undefined || slot.availableSlots > 0));

        if (upcomingSlots.length === 0) {
          return (
            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
              No stall slots available at the moment.
            </div>
          );
        }

        return (
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
            {upcomingSlots.map(slot => {
            const avail = slot.availableSlots !== undefined ? slot.availableSlots : (slot.isAvailable ? 1 : 0);
            const total = slot.totalSlots || 1;
            const isSoldOut = avail === 0;

            // Check if current user already has an active booking for this slot
            const userExistingBooking = bookings.find(b => 
              (b.slot?._id === slot._id || b.slot === slot._id) && 
              ['Pending Approval', 'Pending Payment', 'Confirmed', 'Approved'].includes(b.status)
            );
            
            return (
            <div key={slot._id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#f8fafc' }}>
               <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{slot.park?.name || 'Park'}</h4>
                  <p style={{ margin: '0 0 0.25rem 0', color: '#475569' }}><strong>Date:</strong> {new Date(slot.date).toLocaleDateString()}</p>
                  <p style={{ margin: '0 0 0.25rem 0', color: '#475569' }}><strong>Time:</strong> {slot.startTime} - {slot.endTime}</p>
                  <p style={{ margin: '0 0 0.25rem 0', color: '#475569' }}><strong>Location:</strong> {slot.location}</p>
                  <p style={{ margin: '0 0 0.75rem 0', color: '#059669', fontWeight: 'bold' }}><strong>Price:</strong> ₹{slot.price}</p>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#b45309', fontSize: '0.82rem', fontWeight: '500' }}>
                    ⏱️ <strong>Payment Cutoff:</strong> {slot.paymentDeadlineDate ? `${new Date(slot.paymentDeadlineDate).toLocaleDateString()} ${slot.paymentDeadlineTime || ''}` : `Within ${slot.paymentWindowHours || 24}h of Admin Approval`}
                  </p>
                  
                  <p style={{ margin: '0 0 0.25rem 0', color: '#475569' }}>
                    🎟️ Available Slots: {avail} / {total}
                  </p>
                  <p style={{ margin: '0 0 1.25rem 0', color: userExistingBooking ? '#d97706' : isSoldOut ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                    {userExistingBooking ? `⏳ Status: ${userExistingBooking.status} (You Applied)` : isSoldOut ? '🔴 Status: Sold Out' : '🟢 Status: Registration Open'}
                  </p>
               </div>
               {userExistingBooking ? (
                 <button 
                    disabled
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      backgroundColor: '#fde68a', 
                      color: '#92400e', 
                      border: '1px solid #f59e0b', 
                      borderRadius: '4px', 
                      cursor: 'not-allowed', 
                      fontWeight: 'bold' 
                    }}>
                   Already Booked ({userExistingBooking.status})
                 </button>
               ) : (
                 <button 
                    onClick={() => { setSelectedPark(slot.park); setSelectedSlot(slot); setShowBookingModal(true); }}
                    disabled={isSoldOut}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      backgroundColor: isSoldOut ? '#9ca3af' : '#10b981', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: isSoldOut ? 'not-allowed' : 'pointer', 
                      fontWeight: 'bold' 
                    }}>
                   {isSoldOut ? 'Sold Out' : 'Book This Slot'}
                 </button>
               )}
            </div>
            );
          })}
        </div>
      );
    })()}

      {showBookingModal && selectedPark && selectedSlot && (
        <StallBookingModal
          parkId={selectedPark._id}
          parkName={selectedPark.name}
          slot={selectedSlot}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedSlot(null);
            setSelectedPark(null);
          }}
          onBookingSuccess={() => {
            setShowBookingModal(false);
            fetchAvailableSlots();
            fetchBookings();
            Swal.fire({
              title: 'Request Submitted!',
              text: 'Your stall booking application has been sent for admin review.',
              icon: 'success',
              timer: 2500,
              showConfirmButton: false
            });
          }}
        />
      )}

    </div>
  );
};

export default MyStallBookings;
