import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Receipt, Download, CheckCircle, Clock, XCircle, ExternalLink } from 'lucide-react';
import './MyEventRegistrations.css';

const MyEventRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRegistrations = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        navigate('/login');
        return;
      }
      const user = JSON.parse(userStr);
      const email = user.email || '';
      const userId = user._id || user.id || '';
      if (!email && !userId) {
        setError('Could not identify user. Please log in again.');
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`/api/events/registrations/my?email=${encodeURIComponent(email)}&userId=${encodeURIComponent(userId)}`);
        setRegistrations(res.data);
      } catch (err) {
        setError('Failed to load your registrations. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, [navigate]);

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'Successful': return <span className="reg-badge badge-success">🟢 Successful</span>;
      case 'Pending': return <span className="reg-badge badge-pending">🟡 Pending</span>;
      case 'Processing': return <span className="reg-badge badge-pending">🟡 Processing</span>;
      case 'Failed': return <span className="reg-badge badge-failed">🔴 Failed</span>;
      default: return <span className="reg-badge">{status}</span>;
    }
  };

  const getRegBadge = (status) => {
    switch (status) {
      case 'Confirmed': return <span className="reg-badge badge-success">🟢 Confirmed</span>;
      case 'Completed': return <span className="reg-badge badge-completed">✅ Completed</span>;
      case 'Pending Payment': return <span className="reg-badge badge-pending">🟡 Pending Payment</span>;
      default: return <span className="reg-badge">{status}</span>;
    }
  };

  const generateAndPrintReceipt = (reg) => {
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

  const ReceiptModal = ({ reg, onClose }) => {
    if (!reg) return null;
    const ev = reg.eventSnapshot || reg.event || {};
    return (
      <div className="receipt-overlay" onClick={onClose}>
        <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
          <div className="receipt-modal-header">
            <div className="receipt-logo-title">
              <Receipt size={24} color="#059669" />
              <h3>Official Event Receipt</h3>
            </div>
            <button className="receipt-close-btn" onClick={onClose}>&times;</button>
          </div>
          <div className="receipt-modal-body">
            <div className="receipt-badge-strip">
              <span className="receipt-status-pill">{reg.paymentStatus || 'Successful'}</span>
              <span className="receipt-id-pill">ID: {reg.registrationId}</span>
            </div>
            <div className="receipt-details-table">
              <div className="receipt-row"><span className="lbl">Event Name:</span><span className="val highlight">{ev.title || 'Event'}</span></div>
              <div className="receipt-row"><span className="lbl">Park / Venue:</span><span className="val">{ev.parkName || ev.location || 'N/A'}</span></div>
              <div className="receipt-row"><span className="lbl">Event Date:</span><span className="val">{ev.eventDate ? new Date(ev.eventDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span></div>
              <div className="receipt-row"><span className="lbl">Registrant:</span><span className="val">{reg.name || 'Citizen'} ({reg.email})</span></div>
              <div className="receipt-row"><span className="lbl">Attendees:</span><span className="val">{reg.numberOfAttendees} Person(s)</span></div>
              <div className="receipt-row"><span className="lbl">Amount Paid:</span><span className="val price">₹{reg.totalAmount}</span></div>
              <div className="receipt-row"><span className="lbl">Payment Method:</span><span className="val">{reg.paymentGateway || (reg.totalAmount === 0 ? 'Free' : 'Razorpay')}</span></div>
              <div className="receipt-row"><span className="lbl">Receipt Number:</span><span className="val code">{reg.receiptNumber || 'REC-' + (reg.registrationId || '').slice(-6)}</span></div>
            </div>
          </div>
          <div className="receipt-modal-actions no-print">
            <button className="btn-download-receipt" onClick={() => generateAndPrintReceipt(reg)}><Download size={16} /> Download / Print</button>
            <button className="btn-receipt-close" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="my-reg-page">
      <style>{`
        @media print {
          .no-print, .my-reg-header, .my-reg-list { display: none !important; }
          .receipt-overlay { position: static !important; background: none !important; }
          .receipt-modal { box-shadow: none !important; max-height: none !important; }
          .receipt-actions { display: none !important; }
        }
      `}</style>
      <div className="my-reg-header">
        <div>
          <h1>My Event Registrations</h1>
          <p>Your registered events and payment history</p>
        </div>
      </div>

      {loading ? (
        <div className="reg-loading"><Clock size={32} /> Loading your registrations...</div>
      ) : error ? (
        <div className="reg-error"><XCircle size={32} /> {error}</div>
      ) : registrations.length === 0 ? (
        <div className="reg-empty">
          <Calendar size={54} color="#059669" />
          <h3>No registrations yet</h3>
          <p>You haven't registered for any events. Browse upcoming events to get started!</p>
          <button className="btn-browse-events" onClick={() => navigate('/events')}><ExternalLink size={16} /> Browse Events</button>
        </div>
      ) : (
        <div className="my-reg-list">
          {registrations.map((reg) => {
            const ev = reg.eventSnapshot || reg.event || {};
            return (
              <div key={reg._id} className="reg-card">
                <div className="reg-card-header">
                  <div><h3 className="reg-event-title">{ev.title || 'Event'}</h3>{(ev.parkName || ev.location) && <div className="reg-park-name"><MapPin size={14} /> {ev.parkName || ev.location}</div>}</div>
                  <div className="reg-badges-col">{getPaymentBadge(reg.paymentStatus)}{getRegBadge(reg.registrationStatus)}</div>
                </div>
                <div className="reg-card-details">
                  <div className="reg-detail-item"><Calendar size={14} className="reg-detail-icon" /><div><div className="reg-detail-label">Event Date</div><div className="reg-detail-value">{ev.eventDate ? new Date(ev.eventDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</div></div></div>
                  <div className="reg-detail-item"><Receipt size={14} className="reg-detail-icon" /><div><div className="reg-detail-label">Registration ID</div><div className="reg-detail-value reg-id-value">{reg.registrationId || '—'}</div></div></div>
                  <div className="reg-detail-item"><CheckCircle size={14} className="reg-detail-icon" /><div><div className="reg-detail-label">Attendees</div><div className="reg-detail-value">{reg.numberOfAttendees} Person(s)</div></div></div>
                  <div className="reg-detail-item"><div className="reg-amount">₹{reg.totalAmount}</div><div><div className="reg-detail-label">Amount Paid</div><div className="reg-detail-value">{reg.paymentGateway || (reg.totalAmount === 0 ? 'Free' : 'Razorpay')}</div></div></div>
                </div>
                {reg.registrationId && (
                  <div className="reg-card-actions no-print">
                    <button className="btn-view-receipt" onClick={() => setSelectedReceipt(reg)}><Receipt size={15} /> View Receipt</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedReceipt && <ReceiptModal reg={selectedReceipt} onClose={() => setSelectedReceipt(null)} />}
    </div>
  );
};

export default MyEventRegistrations;
