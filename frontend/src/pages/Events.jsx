import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, MapPin, Search, UserPlus, X, CheckCircle, Download, CreditCard, Receipt, ExternalLink, User, PhoneCall, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Events.css';

const Events = () => {
  const [events, setEvents] = useState(() => {
    try {
      const cached = sessionStorage.getItem('cached_events_list');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  });
  const [filteredEvents, setFilteredEvents] = useState(() => {
    try {
      const cached = sessionStorage.getItem('cached_events_list');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = sessionStorage.getItem('cached_events_list');
      return !cached;
    } catch {
      return true;
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const getStoredUserData = () => {
    try {
      const userStr = localStorage.getItem('public_user') || localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        const userObj = u.user || u;
        return {
          name: userObj.name || userObj.fullName || userObj.firstName || '',
          email: userObj.email || '',
          phone: (userObj.phone || userObj.mobile || userObj.phoneNumber || '').replace(/\D/g, '').slice(0, 10),
          age: userObj.age || '',
          gender: userObj.gender || ''
        };
      }
    } catch (e) {
      console.error('Error reading stored user data:', e);
    }
    return { name: '', email: '', phone: '', age: '', gender: '' };
  };

  const initialUser = getStoredUserData();

  // Registration states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: initialUser.name,
    email: initialUser.email,
    phone: initialUser.phone,
    age: initialUser.age,
    gender: initialUser.gender,
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    numberOfAttendees: 1,
    declarationAccepted: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmedRegistration, setConfirmedRegistration] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('/api/events');
        const data = Array.isArray(response.data) ? response.data : [];
        setEvents(data);
        if (!searchTerm) {
          setFilteredEvents(data);
        }
        try {
          sessionStorage.setItem('cached_events_list', JSON.stringify(data));
        } catch (e) {}
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEvents(events);
    } else {
      const lc = searchTerm.toLowerCase();
      setFilteredEvents(events.filter(e =>
        e.title.toLowerCase().includes(lc) ||
        e.description.toLowerCase().includes(lc) ||
        (e.location && e.location.toLowerCase().includes(lc))
      ));
    }
  }, [searchTerm, events]);

  const handleOpenRegister = (event) => {
    setSelectedEvent(event);
    const u = getStoredUserData();
    setFormData({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      age: u.age || '',
      gender: u.gender || '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      numberOfAttendees: 1,
      declarationAccepted: false
    });
    setSubmitSuccess(false);
    setSubmitError('');
    setConfirmedRegistration(null);
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    let { name, value, type, checked } = e.target;
    if (name === 'phone' || name === 'emergencyContactPhone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    if (name === 'name' || name === 'emergencyContactName') {
      value = value.replace(/[^a-zA-Z\s]/g, '');
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!formData.name.trim()) return setSubmitError('Full Name is required');
    if (!/^\d+$/.test(formData.age) || formData.age < 1 || formData.age > 120) return setSubmitError('Please enter a valid age');
    if (!formData.gender) return setSubmitError('Gender is required');
    if (!/^\d{10}$/.test(formData.phone)) return setSubmitError('Mobile number must be exactly 10 digits');
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return setSubmitError('A valid Email Address is required');
    
    // Mandatory Emergency Contact validation
    if (!formData.emergencyContactName.trim()) {
      return setSubmitError('Emergency Contact Name is required');
    }
    if (!/^\d{10}$/.test(formData.emergencyContactPhone)) {
      return setSubmitError('Emergency Contact Number is required and must be exactly 10 digits');
    }
    if (!formData.emergencyContactRelation) {
      return setSubmitError('Emergency Contact Relationship is required');
    }

    if (selectedEvent.isPaid) {
      await processRazorpayPayment();
    } else {
      await processFreeRegistration();
    }
  };

  const processRazorpayPayment = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await loadRazorpayScript();
      if (!res) {
        setSubmitError('Razorpay SDK failed to load. Are you online?');
        setIsSubmitting(false);
        return;
      }

      // Create Razorpay order on backend
      const { data: order } = await axios.post(`/api/events/${selectedEvent._id}/create-order`, {
        numberOfAttendees: formData.numberOfAttendees
      });

      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : null;

      const options = {
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: 'INR',
        name: 'Parks Monitoring System',
        description: `Registration for ${selectedEvent.title}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(`/api/events/${selectedEvent._id}/verify-payment`, {
              ...formData,
              userId: userObj?._id || userObj?.id || null,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            setConfirmedRegistration(verifyRes.data.registration);
            setSubmitSuccess(true);
          } catch (err) {
            setSubmitError(err.response?.data?.message || 'Payment verification failed. Please contact support.');
          }
        },
        prefill: { name: formData.name, email: formData.email, contact: formData.phone },
        theme: { color: '#059669' },
        modal: {
          ondismiss: () => {
            setSubmitError('Payment was cancelled. You can try again.');
            setIsSubmitting(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        setSubmitError(`Payment failed: ${response.error.description}`);
        setIsSubmitting(false);
      });
      paymentObject.open();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
      setIsSubmitting(false);
    }
  };

  const processFreeRegistration = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const userStr = localStorage.getItem('user');
      const userObj = userStr ? JSON.parse(userStr) : null;
      const payload = {
        ...formData,
        userId: userObj?._id || userObj?.id || null
      };
      const result = await axios.post(`/api/events/${selectedEvent._id}/register`, payload);
      setConfirmedRegistration(result.data.registration);
      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAndPrintReceipt = (reg) => {
    if (!reg) return;
    const ev = reg.event || selectedEvent || {};
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
            .header p { color: #64748b; margin: 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            .ids-row { display: flex; justify-content: space-between; background: #ecfdf5; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; color: #047857; border: 1px solid #a7f3d0; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            td.label { font-weight: 600; color: #475569; width: 42%; }
            td.value { font-weight: 600; color: #0f172a; }
            .footer-note { text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; font-size: 13px; color: #047857; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <h2>🌿 Parks Monitoring System</h2>
              <p>Official Event Registration Receipt</p>
            </div>
            <div class="ids-row">
              <div>Receipt No: ${reg.receiptNumber || 'N/A'}</div>
              <div>Registration ID: ${reg.registrationId || 'N/A'}</div>
            </div>
            <table>
              <tbody>
                <tr><td class="label">Participant Name</td><td class="value">${reg.name || 'N/A'}</td></tr>
                <tr><td class="label">Email</td><td class="value">${reg.email || 'N/A'}</td></tr>
                <tr><td class="label">Phone</td><td class="value">${reg.phone || 'N/A'}</td></tr>
                <tr><td class="label">Event Name</td><td class="value">${ev.title || 'N/A'}</td></tr>
                <tr><td class="label">Park Name</td><td class="value">${ev.parkName || ev.location || 'N/A'}</td></tr>
                <tr><td class="label">Event Date</td><td class="value">${ev.eventDate ? new Date(ev.eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</td></tr>
                <tr><td class="label">Event Time</td><td class="value">${ev.eventDate ? new Date(ev.eventDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td></tr>
                <tr><td class="label">No. of Attendees</td><td class="value">${reg.numberOfAttendees || 1}</td></tr>
                <tr><td class="label">Amount Paid</td><td class="value">₹${reg.totalAmount !== undefined ? reg.totalAmount : 0}</td></tr>
                <tr><td class="label">Transaction ID</td><td class="value">${reg.razorpayPaymentId || 'Free Entry'}</td></tr>
                <tr><td class="label">Payment Date</td><td class="value">${reg.paymentDate ? new Date(reg.paymentDate).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}</td></tr>
                <tr><td class="label">Payment Status</td><td class="value">${reg.paymentStatus || 'Successful'}</td></tr>
                <tr><td class="label">Registration Status</td><td class="value">${reg.registrationStatus || 'Confirmed'}</td></tr>
                <tr><td class="label">Payment Receiver</td><td class="value">${reg.paymentReceiverType || 'Authorized Corporation/Government Account'}</td></tr>
              </tbody>
            </table>
            <div class="footer-note">
              <p style="margin:0 0 4px 0; font-weight:bold;">✅ This is an official digitally generated receipt.</p>
              <p style="margin:0;">Keep this receipt for your records.</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
  };

  const handleDownloadReceipt = () => {
    generateAndPrintReceipt(confirmedRegistration);
  };

  const upcomingEvents = filteredEvents.filter(e => new Date(e.eventDate) >= new Date());
  const pastEvents = filteredEvents.filter(e => new Date(e.eventDate) < new Date());

  const badgeStyle = (color) => ({
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '4px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '700',
    background: color === 'green' ? '#dcfce7' : color === 'yellow' ? '#fef9c3' : '#fee2e2',
    color: color === 'green' ? '#166534' : color === 'yellow' ? '#854d0e' : '#991b1b'
  });



  const renderEventCard = (event, isUpcoming) => (
    <div key={event._id} className="event-card">
      {event.image ? (
        <div className="event-card-img-wrap">
          <img src={event.image} alt={event.title} />
        </div>
      ) : (
        <div className="event-card-img-wrap" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <Calendar size={64} opacity={0.5} />
        </div>
      )}
      <div className="event-card-body">
        <div className="event-card-header">
          <h3 className="event-card-title">{event.title}</h3>
          {event.isPaid ? (
            <span className="price-pill-paid">₹{event.price}</span>
          ) : (
            <span className="price-pill-free">Free</span>
          )}
        </div>
        <p className="event-card-desc">{event.description}</p>
        <div className="event-meta-box">
          {event.parkName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} color="#059669" />
              <span style={{ fontWeight: 600 }}>{event.parkName}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="#10b981" />
            <span style={{ fontWeight: 600 }}>{new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '24px', color: '#64748b' }}>
            {new Date(event.eventDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <MapPin size={16} color="#ef4444" />
            <span>{event.location}</span>
          </div>
        </div>
        {isUpcoming && (
          event.capacity > 0 && event.registeredCount >= event.capacity ? (
            <button disabled style={{ width: '100%', padding: '12px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1rem', cursor: 'not-allowed' }}>
              Registration Closed (Full)
            </button>
          ) : (
            <button onClick={() => handleOpenRegister(event)} className="btn-register-action">
              <UserPlus size={18} /> {event.isPaid ? `Register Now – ₹${event.price}` : 'Register Now (Free)'}
            </button>
          )
        )}
      </div>
    </div>
  );

  return (
    <div className="events-page-container">
      {/* Background Orbs */}
      <div className="events-bg-shape events-bg-shape-1"></div>
      <div className="events-bg-shape events-bg-shape-2"></div>

      <div className="events-wrapper">
        {/* Header Hero */}
        <div className="events-hero-header">
          <div className="hero-title-group">
            <h1>Parks Events 🎪</h1>
            <p>Discover and register for upcoming community events at parks near you.</p>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#a7f3d0', padding: '4rem', fontSize: '1.1rem', fontWeight: 600 }}>Loading events...</p>
        ) : (
          <>
            {upcomingEvents.length > 0 && (
              <>
                <h2 className="events-section-title">🎉 Upcoming Events</h2>
                <div className="events-grid">
                  {upcomingEvents.map(event => renderEventCard(event, true))}
                </div>
              </>
            )}
            {pastEvents.length > 0 && (
              <>
                <h2 className="events-section-title" style={{ opacity: 0.85, marginTop: '2rem' }}>📅 Past Events</h2>
                <div className="events-grid" style={{ opacity: 0.85 }}>
                  {pastEvents.map(event => renderEventCard(event, false))}
                </div>
              </>
            )}
            {upcomingEvents.length === 0 && pastEvents.length === 0 && (
              <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#a7f3d0', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
                <Calendar size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', color: '#fff' }}>No events found</h3>
                <p>Check back later for exciting upcoming events.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Registration Modal */}
      {isModalOpen && selectedEvent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            {/* Modal Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #064e3b, #059669)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 800 }}>
                  {submitSuccess ? 'Registration Confirmed! 🎉' : '📝 Public Event Registration Form'}
                </h3>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', fontWeight: 600 }}>
                  {selectedEvent.title} • {selectedEvent.parkName || selectedEvent.location}
                </p>
              </div>
              {!submitSuccess && (
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', padding: '6px', borderRadius: '6px' }}>
                  <X size={22} />
                </button>
              )}
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* ── SUCCESS SCREEN ── */}
              {submitSuccess && confirmedRegistration ? (
                <div>
                  {/* Success Banner */}
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <CheckCircle size={60} color="#059669" style={{ marginBottom: '0.75rem' }} />
                    <h2 style={{ color: '#064e3b', fontSize: '1.4rem', margin: '0 0 8px' }}>Registration Confirmed Successfully!</h2>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={badgeStyle('green')}>🟢 Payment Successful</span>
                      <span style={badgeStyle('green')}>🟢 Registration Confirmed</span>
                    </div>
                  </div>

                  {/* Registration Details Card */}
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: '0 0 1rem', color: '#064e3b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registration Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.5rem' }}>
                      {[
                        ['Registration ID', confirmedRegistration.registrationId, true],
                        ['Receipt No.', confirmedRegistration.receiptNumber, true],
                        ['Event', confirmedRegistration.event?.title],
                        ['Park', confirmedRegistration.event?.parkName || confirmedRegistration.event?.location],
                        ['Date', confirmedRegistration.event?.eventDate ? new Date(confirmedRegistration.event.eventDate).toLocaleDateString('en-IN') : 'N/A'],
                        ['Time', confirmedRegistration.event?.eventDate ? new Date(confirmedRegistration.event.eventDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'],
                        ['Amount Paid', `₹${confirmedRegistration.totalAmount}`, false, '#059669'],
                        ['Transaction ID', confirmedRegistration.razorpayPaymentId || 'Free Entry'],
                        ['Payment Date', confirmedRegistration.paymentDate ? new Date(confirmedRegistration.paymentDate).toLocaleDateString('en-IN') : 'N/A'],
                        ['Payment Status', 'Successful', false, '#059669'],
                        ['Payment Receiver', 'Authorized Corporation/Government Account'],
                      ].map(([label, value, bold, color]) => (
                        <div key={label}>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: bold ? '800' : '600', color: color || '#0f172a', wordBreak: 'break-all' }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notification hint */}
                  <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', margin: '0 0 1.25rem' }}>
                    📬 A confirmation notification has been sent to your account.
                  </p>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                      onClick={() => { setIsModalOpen(false); navigate('/my-registrations'); }}
                      style={{ padding: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <ExternalLink size={18} /> View My Registrations
                    </button>
                    <button
                      onClick={handleDownloadReceipt}
                      style={{ padding: '12px', background: '#f0fdf4', color: '#064e3b', border: '1px solid #86efac', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Download size={18} /> Download Receipt
                    </button>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      style={{ padding: '10px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer' }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                /* ── 4-SECTION PUBLIC EVENT REGISTRATION FORM ── */
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {submitError && (
                    <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, border: '1px solid #fca5a5' }}>
                      {submitError}
                    </div>
                  )}

                  {selectedEvent.isPaid && (
                    <div style={{ padding: '12px 14px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CreditCard size={22} color="#059669" />
                      <div>
                        <div style={{ fontWeight: '700', color: '#064e3b', fontSize: '0.95rem' }}>Paid Event</div>
                        <div style={{ fontSize: '0.85rem', color: '#059669' }}>₹{selectedEvent.price} per person · Secure payment via Razorpay</div>
                      </div>
                    </div>
                  )}

                  {/* 1. Participant Information */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <h4 style={{ margin: 0, color: '#0f172a', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={16} color="#059669" /> 1. Participant Information
                    </h4>

                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Full Name *</label>
                      <input
                        type="text" name="name" required
                        value={formData.name} onChange={handleInputChange}
                        placeholder="Enter full name"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem', background: '#fff' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Age *</label>
                        <input
                          type="number" name="age" min="1" max="120" required
                          value={formData.age} onChange={handleInputChange}
                          placeholder="e.g. 25"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem', background: '#fff' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Gender *</label>
                        <select
                          name="gender" required
                          value={formData.gender} onChange={handleInputChange}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem', background: '#fff' }}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Mobile Number *</label>
                      <input
                        type="tel" name="phone" required
                        value={formData.phone} onChange={handleInputChange}
                        placeholder="+91 9876543210"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem', background: '#fff' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Email Address *</label>
                      <input
                        type="email" name="email" required
                        value={formData.email} onChange={handleInputChange}
                        placeholder="name@example.com"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem', background: '#fff' }}
                      />
                    </div>
                  </div>

                  {/* 2. Emergency Contact */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', color: '#0f172a', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PhoneCall size={16} color="#059669" /> 2. Emergency Contact
                      </h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
                        Required for participant safety during sports, yoga, fitness, and park events.
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Emergency Contact Name *</label>
                      <input
                        type="text" name="emergencyContactName" required
                        value={formData.emergencyContactName} onChange={handleInputChange}
                        placeholder="Contact person's full name"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem', background: '#fff' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Emergency Contact Number *</label>
                        <input
                          type="tel" name="emergencyContactPhone" required
                          value={formData.emergencyContactPhone} onChange={handleInputChange}
                          placeholder="10-digit phone number"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem', background: '#fff' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Relationship *</label>
                        <select
                          name="emergencyContactRelation" required
                          value={formData.emergencyContactRelation} onChange={handleInputChange}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem', background: '#fff' }}
                        >
                          <option value="">Select Relationship</option>
                          <option value="Parent">Parent</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Child">Child</option>
                          <option value="Friend">Friend</option>
                          <option value="Relative">Relative</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 3. Attendees & Payment */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                    <h4 style={{ margin: '0 0 0.85rem 0', color: '#0f172a', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={16} color="#059669" /> 3. Attendees & Payment
                    </h4>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Number of Attendees</label>
                      <input
                        type="number" name="numberOfAttendees" min="1" max="10"
                        value={formData.numberOfAttendees} onChange={handleInputChange}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem', background: '#fff' }}
                      />
                    </div>

                    {selectedEvent.isPaid && (
                      <div style={{ marginTop: '0.85rem', padding: '10px 14px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 700, color: '#047857', display: 'block', fontSize: '0.88rem' }}>Total Amount</span>
                          <span style={{ fontSize: '0.78rem', color: '#065f46' }}>₹{selectedEvent.price} × {formData.numberOfAttendees || 1} attendee(s)</span>
                        </div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#047857' }}>
                          ₹{selectedEvent.price * (formData.numberOfAttendees || 1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 4. Declaration */}
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.1rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#064e3b', fontSize: '0.92rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      4. Declaration
                    </h4>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', color: '#0f172a', lineHeight: 1.45, fontWeight: 500 }}>
                      <input
                        type="checkbox"
                        name="declarationAccepted"
                        required
                        checked={formData.declarationAccepted}
                        onChange={handleInputChange}
                        style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: '#059669', cursor: 'pointer' }}
                      />
                      <span>I confirm that the information provided is correct and I agree to follow the event and park rules. *</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.declarationAccepted}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: (isSubmitting || !formData.declarationAccepted) ? '#94a3b8' : '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '800',
                      fontSize: '1rem',
                      cursor: (isSubmitting || !formData.declarationAccepted) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      boxShadow: (isSubmitting || !formData.declarationAccepted) ? 'none' : '0 4px 12px rgba(5, 150, 105, 0.25)'
                    }}
                  >
                    {isSubmitting
                      ? 'Processing Registration...'
                      : selectedEvent.isPaid
                      ? `Pay ₹${selectedEvent.price * (formData.numberOfAttendees || 1)} & Register`
                      : 'Complete Registration ➔'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Events;
