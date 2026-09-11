import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Users, IndianRupee, CheckCircle, Clock, XCircle, Filter, Download, Eye, Receipt, ChevronDown, ChevronUp } from 'lucide-react';

const AdminEventPayments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedEventId = searchParams.get('eventId');

  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ total: 0, successful: 0, pending: 0, failed: 0, confirmed: 0, totalCollection: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedReg, setSelectedReg] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const getAdminToken = () => JSON.parse(localStorage.getItem('adminUser'))?.token;

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getAdminToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [regRes, statsRes] = await Promise.all([
        axios.get('/api/events/registrations/all', { headers }),
        axios.get('/api/events/payments/stats', { headers })
      ]);
      setRegistrations(regRes.data);
      setStats(statsRes.data);
    } catch (err) {
      setError('Failed to load registrations. Please refresh.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const eventFilteredRegs = selectedEventId
    ? registrations.filter(r => {
        const evId = typeof r.event === 'object' ? r.event?._id : r.event;
        const snapEvId = typeof r.eventSnapshot === 'object' ? r.eventSnapshot?._id : r.eventSnapshot;
        return String(evId || snapEvId || '') === String(selectedEventId);
      })
    : registrations;

  const filteredRegs = filterStatus === 'All'
    ? eventFilteredRegs
    : eventFilteredRegs.filter(r => r.paymentStatus === filterStatus);

  const selectedEventObj = selectedEventId && registrations.find(r => {
    const evId = typeof r.event === 'object' ? r.event?._id : r.event;
    const snapEvId = typeof r.eventSnapshot === 'object' ? r.eventSnapshot?._id : r.eventSnapshot;
    return String(evId || snapEvId || '') === String(selectedEventId);
  });
  const selectedEventTitle = selectedEventObj?.eventSnapshot?.title || selectedEventObj?.event?.title || 'Selected Event';

  const displayTotal = selectedEventId ? eventFilteredRegs.length : stats.total;
  const displaySuccessful = selectedEventId ? eventFilteredRegs.filter(r => r.paymentStatus === 'Successful').length : stats.successful;
  const displayPending = selectedEventId ? eventFilteredRegs.filter(r => r.paymentStatus === 'Pending' || r.paymentStatus === 'Processing').length : stats.pending;
  const displayFailed = selectedEventId ? eventFilteredRegs.filter(r => r.paymentStatus === 'Failed').length : stats.failed;
  const displayCollection = selectedEventId ? eventFilteredRegs.filter(r => r.paymentStatus === 'Successful').reduce((sum, r) => sum + (r.totalAmount || 0), 0) : (stats.totalCollection || 0);

  const getPaymentBadge = (status) => {
    const styles = {
      Successful: { bg: '#dcfce7', color: '#166534', icon: '🟢' },
      Pending: { bg: '#fef9c3', color: '#854d0e', icon: '🟡' },
      Processing: { bg: '#fef9c3', color: '#854d0e', icon: '🟡' },
      Failed: { bg: '#fee2e2', color: '#991b1b', icon: '🔴' },
    };
    const s = styles[status] || { bg: '#f1f5f9', color: '#475569', icon: '⚪' };
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: s.bg, color: s.color }}>
        {s.icon} {status}
      </span>
    );
  };

  const getRegBadge = (status) => {
    const styles = {
      Confirmed: { bg: '#dcfce7', color: '#166534' },
      Completed: { bg: '#e0e7ff', color: '#3730a3' },
      'Pending Payment': { bg: '#fef9c3', color: '#854d0e' },
    };
    const s = styles[status] || { bg: '#f1f5f9', color: '#475569' };
    return (
      <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: s.bg, color: s.color }}>
        {status}
      </span>
    );
  };

  const statCards = [
    { label: 'Total Registrations', value: displayTotal, icon: <Users size={24} />, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Successful Payments', value: displaySuccessful, icon: <CheckCircle size={24} />, color: '#059669', bg: '#f0fdf4' },
    { label: 'Pending Payments', value: displayPending, icon: <Clock size={24} />, color: '#d97706', bg: '#fffbeb' },
    { label: 'Failed Payments', value: displayFailed, icon: <XCircle size={24} />, color: '#dc2626', bg: '#fef2f2' },
    { label: 'Total Collection', value: `₹${displayCollection.toLocaleString('en-IN')}`, icon: <IndianRupee size={24} />, color: '#059669', bg: '#ecfdf5', highlight: true },
  ];

  const generateAndPrintReceipt = (reg) => {
    if (!reg) return;
    const ev = reg.eventSnapshot || reg.event || {};
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
                <tr><td class="label">Amount Paid</td><td class="value">₹${reg.totalAmount || 0}</td></tr>
                <tr><td class="label">Transaction ID</td><td class="value">${reg.razorpayPaymentId || 'Free Entry'}</td></tr>
                <tr><td class="label">Payment Date</td><td class="value">${reg.paymentDate ? new Date(reg.paymentDate).toLocaleString('en-IN') : 'N/A'}</td></tr>
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

  const ReceiptModal = ({ reg, onClose }) => {
    const ev = reg.eventSnapshot || reg.event || {};
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }} onClick={onClose}>
        <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', border: '2px solid #059669', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
          <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)', padding: '1.5rem', textAlign: 'center', color: 'white', borderTopLeftRadius: '14px', borderTopRightRadius: '14px' }}>
            <h2 style={{ margin: 0 }}>🌿 Parks Monitoring System</h2>
            <p style={{ margin: '4px 0 0', opacity: 0.9 }}>Official Event Registration Receipt</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div><div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Receipt Number</div><div style={{ fontWeight: 800, fontSize: '1rem', color: '#064e3b', fontFamily: 'monospace' }}>{reg.receiptNumber}</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Registration ID</div><div style={{ fontWeight: 800, fontSize: '1rem', color: '#064e3b', fontFamily: 'monospace' }}>{reg.registrationId}</div></div>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginBottom: '1rem' }}>
              <tbody>
                {[
                  ['Participant Name', reg.name],
                  ['Email', reg.email],
                  ['Phone', reg.phone || 'N/A'],
                  ['Event Name', ev.title || 'N/A'],
                  ['Park Name', ev.parkName || ev.location || 'N/A'],
                  ['Event Date', ev.eventDate ? new Date(ev.eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'],
                  ['Event Time', ev.eventDate ? new Date(ev.eventDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'],
                  ['No. of Attendees', reg.numberOfAttendees],
                  ['Amount Paid', `₹${reg.totalAmount}`],
                  ['Transaction ID', reg.razorpayPaymentId || 'Free Entry'],
                  ['Payment Date', reg.paymentDate ? new Date(reg.paymentDate).toLocaleString('en-IN') : 'N/A'],
                  ['Payment Status', reg.paymentStatus],
                  ['Registration Status', reg.registrationStatus],
                  ['Payment Receiver', reg.paymentReceiverType || 'Authorized Corporation/Government Account'],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 4px', color: '#64748b', fontWeight: 600, width: '42%' }}>{label}</td>
                    <td style={{ padding: '8px 4px', color: '#0f172a', fontWeight: label === 'Amount Paid' ? 800 : 500 }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '12px', textAlign: 'center', color: '#166534', fontWeight: 600, fontSize: '0.85rem' }}>
              <p style={{ margin: 0 }}>✅ This is an official digitally generated receipt.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button onClick={() => generateAndPrintReceipt(reg)} style={{ flex: 1, padding: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Download size={16} /> Download Receipt
              </button>
              <button onClick={onClose} style={{ padding: '12px 20px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Event Registrations & Payments</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>View all event registrations, payment status, and revenue collection.</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map(card => (
          <div key={card.label} style={{ background: 'white', border: card.highlight ? `2px solid ${card.color}` : '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ background: card.bg, color: card.color, borderRadius: '8px', padding: '8px', display: 'flex' }}>{card.icon}</div>
            </div>
            <div style={{ fontSize: card.highlight ? '1.5rem' : '1.8rem', fontWeight: 800, color: card.highlight ? card.color : '#0f172a' }}>{card.value}</div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{card.label}</div>
            {card.highlight && <div style={{ fontSize: '0.75rem', color: card.color, fontWeight: 700, marginTop: '4px' }}>From successful payments only</div>}
          </div>
        ))}
      </div>

      {selectedEventId && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px 18px', borderRadius: '12px', marginBottom: '1.5rem', color: '#047857' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Filtered by Event:</span>
          <span style={{ background: '#059669', color: 'white', padding: '4px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800 }}>
            {selectedEventTitle}
          </span>
          <button 
            onClick={() => setSearchParams({})}
            style={{ marginLeft: 'auto', background: 'white', border: '1px solid #a7f3d0', color: '#047857', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            ✕ Show All Events
          </button>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 600 }}>
          <Filter size={16} /> Filter by Payment Status:
        </div>
        {['All', 'Successful', 'Pending', 'Processing', 'Failed'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '6px 16px', borderRadius: '20px', border: filterStatus === s ? 'none' : '1px solid #e2e8f0', background: filterStatus === s ? '#059669' : 'white', color: filterStatus === s ? 'white' : '#475569', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: 'white', borderRadius: '12px' }}>Loading registrations...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#dc2626', background: 'white', borderRadius: '12px' }}>{error}</div>
      ) : filteredRegs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: 'white', borderRadius: '12px' }}>No registrations found.</div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Participant', 'Event', 'Registration ID', 'Attendees', 'Amount', 'Transaction ID', 'Payment Date', 'Payment Status', 'Reg. Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRegs.map((reg) => {
                  const ev = reg.eventSnapshot || reg.event || {};
                  return (
                    <tr key={reg._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{reg.name}</div>
                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{reg.email}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{ev.title || 'N/A'}</div>
                        <div style={{ color: '#059669', fontSize: '0.8rem' }}>{ev.parkName || ev.location || ''}</div>
                      </td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#059669', fontSize: '0.85rem' }}>
                        {reg.registrationId || '—'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#1e293b' }}>{reg.numberOfAttendees}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#059669' }}>₹{reg.totalAmount}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#475569' }}>
                        {reg.razorpayPaymentId || 'Free'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#475569', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {reg.paymentDate ? new Date(reg.paymentDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>{getPaymentBadge(reg.paymentStatus)}</td>
                      <td style={{ padding: '14px 16px' }}>{getRegBadge(reg.registrationStatus)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {reg.registrationId && (
                          <button
                            onClick={() => setSelectedReg(reg)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#f0fdf4', color: '#059669', border: '1px solid #86efac', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            <Receipt size={14} /> Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
            Showing {filteredRegs.length} of {registrations.length} registrations
          </div>
        </div>
      )}

      {selectedReg && <ReceiptModal reg={selectedReg} onClose={() => setSelectedReg(null)} />}
    </div>
  );
};

export default AdminEventPayments;
