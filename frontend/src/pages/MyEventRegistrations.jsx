import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Receipt, 
  Download, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ExternalLink,
  Store,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Tag,
  User,
  ShoppingBag
} from 'lucide-react';
import './MyEventRegistrations.css';

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

const MyEventRegistrations = () => {
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'stalls'
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [stallBookings, setStallBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEventReceipt, setSelectedEventReceipt] = useState(null);
  const [selectedStallReceipt, setSelectedStallReceipt] = useState(null);
  const navigate = useNavigate();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchData = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);
    const email = user.email || '';
    const userId = user._id || user.id || '';
    const token = user.token;

    setLoading(true);
    setError('');

    try {
      // 1. Fetch Event Registrations
      const eventPromise = axios.get(`/api/events/registrations/my?email=${encodeURIComponent(email)}&userId=${encodeURIComponent(userId)}`)
        .then(res => res.data)
        .catch(err => {
          console.error("Error fetching event registrations:", err);
          return [];
        });

      // 2. Fetch Stall Bookings
      const stallPromise = axios.get(`/api/stall-bookings/user/${userId}?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(user.phone || '')}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
        .then(res => res.data)
        .catch(err => {
          console.error("Error fetching stall bookings:", err);
          return [];
        });

      const [eventsData, stallsData] = await Promise.all([eventPromise, stallPromise]);
      setEventRegistrations(Array.isArray(eventsData) ? eventsData : []);
      setStallBookings(Array.isArray(stallsData) ? stallsData : []);
    } catch (err) {
      setError('Failed to load your registrations. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handlePayStall = async (booking) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const parsed = JSON.parse(userStr);
      const token = parsed.token;

      const res = await loadRazorpayScript();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
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
            alert('Payment successful! Your stall registration is now confirmed.');
            fetchData();
          } catch (err) {
            alert(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: parsed.name || "Citizen",
          email: parsed.email || "citizen@example.com",
          contact: parsed.phone || "9999999999"
        },
        theme: {
          color: "#059669"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      
      paymentObject.on('payment.failed', function (response) {
        alert(response.error.description);
      });
      
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert(error.response?.data?.message || 'Failed to initiate payment.');
    }
  };

  const getEventPaymentBadge = (status) => {
    switch (status) {
      case 'Successful': return <span className="reg-badge badge-success">🟢 Paid</span>;
      case 'Pending': return <span className="reg-badge badge-pending">🟡 Pending</span>;
      case 'Processing': return <span className="reg-badge badge-pending">🟡 Processing</span>;
      case 'Failed': return <span className="reg-badge badge-failed">🔴 Failed</span>;
      default: return <span className="reg-badge">{status}</span>;
    }
  };

  const getEventRegBadge = (status) => {
    switch (status) {
      case 'Confirmed': return <span className="reg-badge badge-success">🟢 Confirmed</span>;
      case 'Completed': return <span className="reg-badge badge-completed">✅ Completed</span>;
      case 'Pending Payment': return <span className="reg-badge badge-pending">🟡 Pending Payment</span>;
      default: return <span className="reg-badge">{status}</span>;
    }
  };

  const getStallStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
      case 'Approved':
        return <span className="reg-badge badge-success"><CheckCircle2 size={13} /> Confirmed</span>;
      case 'Pending Approval':
        return <span className="reg-badge badge-pending"><Clock size={13} /> Pending Admin Approval</span>;
      case 'Pending Payment':
        return <span className="reg-badge badge-payment-needed"><CreditCard size={13} /> Action: Payment Required</span>;
      case 'Rejected':
        return <span className="reg-badge badge-failed"><XCircle size={13} /> Rejected</span>;
      case 'Expired':
        return <span className="reg-badge badge-failed"><XCircle size={13} /> Expired</span>;
      default:
        return <span className="reg-badge">{status}</span>;
    }
  };

  const generateAndPrintEventReceipt = (reg) => {
    if (!reg) return;
    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      alert('Pop-up blocked! Please allow pop-ups to print/download your receipt.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt_${reg.receiptNumber || reg.registrationId || 'Event'}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; line-height: 1.5; background: #ffffff; }
            .receipt-box { border: 2px solid #059669; border-radius: 12px; padding: 24px; max-width: 650px; margin: 0 auto; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; }
            .header h2 { color: #047857; margin: 0 0 6px 0; font-size: 24px; font-weight: 700; }
            .ids-row { display: flex; justify-content: space-between; background: #ecfdf5; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; color: #047857; border: 1px solid #a7f3d0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .label { font-weight: 600; color: #475569; width: 40%; }
            .footer-note { text-align: center; background: #f8fafc; padding: 14px; border-radius: 8px; font-size: 13px; color: #047857; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header"><h2>🌿 Parks Monitoring System</h2><p>Official Event Registration Receipt</p></div>
            <div class="ids-row">
              <div>Receipt No: ${reg.receiptNumber || 'N/A'}</div>
              <div>Registration ID: ${reg.registrationId || 'N/A'}</div>
            </div>
            <table>
              <tr><td class="label">Event Title</td><td class="value">${(reg.eventSnapshot || reg.event || {}).title || 'N/A'}</td></tr>
              <tr><td class="label">Location / Park</td><td class="value">${(reg.eventSnapshot || reg.event || {}).parkName || (reg.eventSnapshot || reg.event || {}).location || 'N/A'}</td></tr>
              <tr><td class="label">Event Date</td><td class="value">${(reg.eventSnapshot || reg.event || {}).eventDate ? new Date((reg.eventSnapshot || reg.event || {}).eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</td></tr>
              <tr><td class="label">Attendee Name</td><td class="value">${reg.name || 'Citizen'}</td></tr>
              <tr><td class="label">Attendee Email</td><td class="value">${reg.email || 'N/A'}</td></tr>
              <tr><td class="label">Attendees Count</td><td class="value">${reg.numberOfAttendees || 1} Person(s)</td></tr>
              <tr><td class="label">Amount Paid</td><td class="value">₹${reg.totalAmount || 0} (${reg.paymentGateway || 'Online'})</td></tr>
              <tr><td class="label">Payment Status</td><td class="value" style="color:#059669;">${reg.paymentStatus || 'Successful'}</td></tr>
              <tr><td class="label">Registration Status</td><td class="value" style="color:#059669;">${reg.registrationStatus || 'Confirmed'}</td></tr>
            </table>
            <div class="footer-note">Thank you for participating in community park events! Please present this receipt or Registration ID at the venue.</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  const generateAndPrintStallReceipt = (booking) => {
    if (!booking) return;
    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      alert('Pop-up blocked! Please allow pop-ups to print/download your invoice.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stall_Invoice_${booking._id}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1e293b; line-height: 1.5; background: #ffffff; }
            .receipt-box { border: 2px solid #059669; border-radius: 12px; padding: 24px; max-width: 650px; margin: 0 auto; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; }
            .header h2 { color: #047857; margin: 0 0 6px 0; font-size: 24px; font-weight: 700; }
            .ids-row { display: flex; justify-content: space-between; background: #ecfdf5; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; color: #047857; border: 1px solid #a7f3d0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .label { font-weight: 600; color: #475569; width: 40%; }
            .footer-note { text-align: center; background: #f8fafc; padding: 14px; border-radius: 8px; font-size: 13px; color: #047857; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header"><h2>🌿 Parks Monitoring System</h2><p>Official Park Stall Booking Invoice / Permit</p></div>
            <div class="ids-row">
              <div>Booking ID: ${booking._id}</div>
              <div>Status: ${booking.status}</div>
            </div>
            <table>
              <tr><td class="label">Stall Name</td><td class="value">${booking.stallName}</td></tr>
              <tr><td class="label">Park Location</td><td class="value">${booking.park?.name || 'Park'}</td></tr>
              <tr><td class="label">Slot Date & Time</td><td class="value">${booking.slot ? new Date(booking.slot.date).toLocaleDateString('en-IN') + ' (' + booking.slot.startTime + ' - ' + booking.slot.endTime + ')' : 'Assigned Slot'}</td></tr>
              <tr><td class="label">Slot Spot / Location</td><td class="value">${booking.slot?.location || 'Designated Stall Area'}</td></tr>
              <tr><td class="label">Applicant Name</td><td class="value">${booking.applicantName}</td></tr>
              <tr><td class="label">Contact Phone</td><td class="value">${booking.applicantPhone}</td></tr>
              <tr><td class="label">Products Type</td><td class="value">${booking.productsType}</td></tr>
              <tr><td class="label">Amount Paid</td><td class="value" style="color:#059669; font-weight:bold;">₹${booking.amountPaid}</td></tr>
              <tr><td class="label">Requested Date</td><td class="value">${new Date(booking.bookingDate || booking.createdAt).toLocaleDateString('en-IN')}</td></tr>
            </table>
            <div class="footer-note">This permit grants vendor access for the approved date and slot at the designated park. Maintain cleanliness in park premises.</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  return (
    <div className="my-reg-page">
      <div className="my-reg-header">
        <div>
          <h1>My Registrations & Bookings</h1>
          <p>View your registered park events and stall slot bookings in one place</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="my-reg-tabs-bar">
        <button 
          className={`my-reg-tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <Calendar size={18} />
          <span>Event Registrations</span>
          <span className="tab-count-pill">{eventRegistrations.length}</span>
        </button>
        <button 
          className={`my-reg-tab ${activeTab === 'stalls' ? 'active' : ''}`}
          onClick={() => setActiveTab('stalls')}
        >
          <Store size={18} />
          <span>Stall Registrations</span>
          <span className="tab-count-pill">{stallBookings.length}</span>
        </button>
      </div>

      {loading ? (
        <div className="reg-loading"><Clock size={32} /> Loading your records...</div>
      ) : error ? (
        <div className="reg-error"><XCircle size={32} /> {error}</div>
      ) : activeTab === 'events' ? (
        /* EVENT REGISTRATIONS TAB */
        eventRegistrations.length === 0 ? (
          <div className="reg-empty">
            <Calendar size={54} color="#059669" />
            <h3>No event registrations yet</h3>
            <p>You haven't registered for any community park events. Browse upcoming events to participate!</p>
            <button className="btn-browse-events" onClick={() => navigate('/events')}><ExternalLink size={16} /> Browse Events</button>
          </div>
        ) : (
          <div className="my-reg-list">
            {eventRegistrations.map((reg) => {
              const ev = reg.eventSnapshot || reg.event || {};
              return (
                <div key={reg._id} className="reg-card">
                  <div className="reg-card-header">
                    <div>
                      <h3 className="reg-event-title">{ev.title || 'Event'}</h3>
                      {(ev.parkName || ev.location) && (
                        <div className="reg-park-name"><MapPin size={14} /> {ev.parkName || ev.location}</div>
                      )}
                    </div>
                    <div className="reg-badges-col">
                      {getEventPaymentBadge(reg.paymentStatus)}
                      {getEventRegBadge(reg.registrationStatus)}
                    </div>
                  </div>
                  <div className="reg-card-details">
                    <div className="reg-detail-item">
                      <Calendar size={14} className="reg-detail-icon" />
                      <div>
                        <div className="reg-detail-label">Event Date</div>
                        <div className="reg-detail-value">{ev.eventDate ? new Date(ev.eventDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</div>
                      </div>
                    </div>
                    <div className="reg-detail-item">
                      <Receipt size={14} className="reg-detail-icon" />
                      <div>
                        <div className="reg-detail-label">Registration ID</div>
                        <div className="reg-detail-value reg-id-value">{reg.registrationId || '—'}</div>
                      </div>
                    </div>
                    <div className="reg-detail-item">
                      <CheckCircle size={14} className="reg-detail-icon" />
                      <div>
                        <div className="reg-detail-label">Attendees</div>
                        <div className="reg-detail-value">{reg.numberOfAttendees} Person(s)</div>
                      </div>
                    </div>
                    <div className="reg-detail-item">
                      <div className="reg-amount">₹{reg.totalAmount}</div>
                      <div>
                        <div className="reg-detail-label">Amount Paid</div>
                        <div className="reg-detail-value">{reg.paymentGateway || (reg.totalAmount === 0 ? 'Free' : 'Razorpay')}</div>
                      </div>
                    </div>
                  </div>
                  {reg.registrationId && (
                    <div className="reg-card-actions no-print">
                      <button className="btn-view-receipt" onClick={() => setSelectedEventReceipt(reg)}>
                        <Receipt size={15} /> View Official Receipt
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* STALL REGISTRATIONS TAB */
        stallBookings.length === 0 ? (
          <div className="reg-empty">
            <Store size={54} color="#059669" />
            <h3>No stall registrations found</h3>
            <p>You haven't submitted any park stall booking applications yet. Explore available slots across parks to apply!</p>
            <button className="btn-browse-events" onClick={() => navigate('/stall-bookings')}><Store size={16} /> View Stall Slots</button>
          </div>
        ) : (
          <div className="my-reg-list">
            {stallBookings.map((booking) => {
              return (
                <div key={booking._id} className="reg-card">
                  <div className="reg-card-header">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                          🏪 Stall Booking
                        </span>
                      </div>
                      <h3 className="reg-event-title">{booking.stallName}</h3>
                      <div className="reg-park-name">
                        <MapPin size={14} /> {booking.park?.name || 'Park Area'}
                      </div>
                    </div>
                    <div className="reg-badges-col">
                      {getStallStatusBadge(booking.status)}
                    </div>
                  </div>

                  <div className="reg-card-details">
                    <div className="reg-detail-item">
                      <Calendar size={14} className="reg-detail-icon" />
                      <div>
                        <div className="reg-detail-label">Slot Date & Time</div>
                        <div className="reg-detail-value">
                          {booking.slot ? (
                            <>
                              {new Date(booking.slot.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>
                                {booking.slot.startTime} - {booking.slot.endTime}
                              </span>
                            </>
                          ) : 'Scheduled Slot'}
                        </div>
                      </div>
                    </div>

                    <div className="reg-detail-item">
                      <Tag size={14} className="reg-detail-icon" />
                      <div>
                        <div className="reg-detail-label">Location / Spot</div>
                        <div className="reg-detail-value">{booking.slot?.location || 'Designated Area'}</div>
                      </div>
                    </div>

                    <div className="reg-detail-item">
                      <ShoppingBag size={14} className="reg-detail-icon" />
                      <div>
                        <div className="reg-detail-label">Products Type</div>
                        <div className="reg-detail-value">{booking.productsType}</div>
                      </div>
                    </div>

                    <div className="reg-detail-item">
                      <div className="reg-amount">₹{booking.amountPaid}</div>
                      <div>
                        <div className="reg-detail-label">Slot Fee</div>
                        <div className="reg-detail-value">Requested: {new Date(booking.bookingDate || booking.createdAt).toLocaleDateString('en-IN')}</div>
                      </div>
                    </div>
                  </div>

                  {booking.status === 'Pending Payment' && (
                    <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#854d0e', fontSize: '0.92rem' }}>
                          🎉 Your application is approved! Please complete payment to confirm your slot.
                        </div>
                        <BookingTimer expiresAt={booking.paymentExpiresAt} />
                      </div>
                      {(!booking.paymentExpiresAt || new Date(booking.paymentExpiresAt) > new Date()) ? (
                        <button 
                          onClick={() => handlePayStall(booking)}
                          style={{ padding: '0.65rem 1.4rem', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
                        >
                          <CreditCard size={16} /> Pay ₹{booking.amountPaid} Now
                        </button>
                      ) : (
                        <button 
                          disabled
                          style={{ padding: '0.65rem 1.4rem', backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '8px', cursor: 'not-allowed', fontWeight: 'bold' }}
                        >
                          Payment Window Expired
                        </button>
                      )}
                    </div>
                  )}

                  <div className="reg-card-actions no-print">
                    <button 
                      className="btn-view-receipt"
                      onClick={() => setSelectedStallReceipt(booking)}
                    >
                      <Receipt size={15} /> View Permit / Invoice
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Event Receipt Modal */}
      {selectedEventReceipt && (
        <div className="receipt-overlay" onClick={() => setSelectedEventReceipt(null)}>
          <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-modal-header">
              <div className="receipt-logo-title">
                <Receipt size={24} color="#059669" />
                <h3>Official Event Registration Receipt</h3>
              </div>
              <button className="receipt-close-btn" onClick={() => setSelectedEventReceipt(null)}>&times;</button>
            </div>
            <div className="receipt-modal-body">
              <div className="receipt-badge-strip">
                <span className="receipt-status-pill">{selectedEventReceipt.paymentStatus || 'Successful'}</span>
                <span className="receipt-id-pill">ID: {selectedEventReceipt.registrationId}</span>
              </div>
              <div className="receipt-details-table">
                <div className="receipt-row"><span className="lbl">Event Name:</span><span className="val highlight">{(selectedEventReceipt.eventSnapshot || selectedEventReceipt.event || {}).title || 'Event'}</span></div>
                <div className="receipt-row"><span className="lbl">Park / Venue:</span><span className="val">{(selectedEventReceipt.eventSnapshot || selectedEventReceipt.event || {}).parkName || (selectedEventReceipt.eventSnapshot || selectedEventReceipt.event || {}).location || 'N/A'}</span></div>
                <div className="receipt-row"><span className="lbl">Event Date:</span><span className="val">{(selectedEventReceipt.eventSnapshot || selectedEventReceipt.event || {}).eventDate ? new Date((selectedEventReceipt.eventSnapshot || selectedEventReceipt.event || {}).eventDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span></div>
                <div className="receipt-row"><span className="lbl">Registrant:</span><span className="val">{selectedEventReceipt.name || 'Citizen'} ({selectedEventReceipt.email})</span></div>
                <div className="receipt-row"><span className="lbl">Attendees:</span><span className="val">{selectedEventReceipt.numberOfAttendees} Person(s)</span></div>
                <div className="receipt-row"><span className="lbl">Amount Paid:</span><span className="val price">₹{selectedEventReceipt.totalAmount}</span></div>
                <div className="receipt-row"><span className="lbl">Payment Method:</span><span className="val">{selectedEventReceipt.paymentGateway || (selectedEventReceipt.totalAmount === 0 ? 'Free' : 'Razorpay')}</span></div>
                <div className="receipt-row"><span className="lbl">Receipt Number:</span><span className="val code">{selectedEventReceipt.receiptNumber || 'REC-' + (selectedEventReceipt.registrationId || '').slice(-6)}</span></div>
              </div>
            </div>
            <div className="receipt-modal-actions no-print">
              <button className="btn-download-receipt" onClick={() => generateAndPrintEventReceipt(selectedEventReceipt)}><Download size={16} /> Download / Print</button>
              <button className="btn-receipt-close" onClick={() => setSelectedEventReceipt(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Stall Receipt Modal */}
      {selectedStallReceipt && (
        <div className="receipt-overlay" onClick={() => setSelectedStallReceipt(null)}>
          <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-modal-header">
              <div className="receipt-logo-title">
                <Store size={24} color="#059669" />
                <h3>Official Stall Booking Permit & Invoice</h3>
              </div>
              <button className="receipt-close-btn" onClick={() => setSelectedStallReceipt(null)}>&times;</button>
            </div>
            <div className="receipt-modal-body">
              <div className="receipt-badge-strip">
                <span className="receipt-status-pill">{selectedStallReceipt.status}</span>
                <span className="receipt-id-pill">ID: {selectedStallReceipt._id}</span>
              </div>
              <div className="receipt-details-table">
                <div className="receipt-row"><span className="lbl">Stall Name:</span><span className="val highlight">{selectedStallReceipt.stallName}</span></div>
                <div className="receipt-row"><span className="lbl">Park Location:</span><span className="val">{selectedStallReceipt.park?.name || 'Park Area'}</span></div>
                <div className="receipt-row"><span className="lbl">Slot Date & Time:</span><span className="val">{selectedStallReceipt.slot ? new Date(selectedStallReceipt.slot.date).toLocaleDateString('en-IN') + ' (' + selectedStallReceipt.slot.startTime + ' - ' + selectedStallReceipt.slot.endTime + ')' : 'Scheduled'}</span></div>
                <div className="receipt-row"><span className="lbl">Spot Location:</span><span className="val">{selectedStallReceipt.slot?.location || 'Designated Area'}</span></div>
                <div className="receipt-row"><span className="lbl">Applicant Name:</span><span className="val">{selectedStallReceipt.applicantName}</span></div>
                <div className="receipt-row"><span className="lbl">Phone Number:</span><span className="val">{selectedStallReceipt.applicantPhone}</span></div>
                <div className="receipt-row"><span className="lbl">Products Type:</span><span className="val">{selectedStallReceipt.productsType}</span></div>
                <div className="receipt-row"><span className="lbl">Slot Fee Amount:</span><span className="val price">₹{selectedStallReceipt.amountPaid}</span></div>
                <div className="receipt-row"><span className="lbl">Application Date:</span><span className="val">{new Date(selectedStallReceipt.bookingDate || selectedStallReceipt.createdAt).toLocaleDateString('en-IN')}</span></div>
              </div>
            </div>
            <div className="receipt-modal-actions no-print">
              <button className="btn-download-receipt" onClick={() => generateAndPrintStallReceipt(selectedStallReceipt)}><Download size={16} /> Download / Print</button>
              <button className="btn-receipt-close" onClick={() => setSelectedStallReceipt(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyEventRegistrations;
