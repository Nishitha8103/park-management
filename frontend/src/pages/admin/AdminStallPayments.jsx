import { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, IndianRupee, CheckCircle, Clock, XCircle, Filter, Download, Receipt, Store, Building, User } from 'lucide-react';

const AdminStallPayments = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const getAdminToken = () => {
    try {
      const stored = localStorage.getItem('adminUser');
      return stored ? JSON.parse(stored)?.token : null;
    } catch (e) {
      return null;
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getAdminToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('/api/stall-bookings', { headers });
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching stall payments:', err);
      setError('Failed to load stall payment records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const confirmedBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Approved');
  const pendingBookings = bookings.filter(b => b.status === 'Pending Payment' || b.status === 'Pending Approval');
  const rejectedBookings = bookings.filter(b => b.status === 'Rejected');

  const totalCollection = confirmedBookings.reduce((sum, b) => sum + (Number(b.amountPaid) || 0), 0);

  const filteredBookings = filterStatus === 'All'
    ? bookings
    : bookings.filter(b => {
        if (filterStatus === 'Confirmed') return b.status === 'Confirmed' || b.status === 'Approved';
        if (filterStatus === 'Pending') return b.status === 'Pending Payment' || b.status === 'Pending Approval';
        return b.status === filterStatus;
      });

  const getStatusBadge = (status) => {
    const config = {
      Confirmed: { bg: '#dcfce7', color: '#166534', label: 'Confirmed' },
      Approved: { bg: '#dcfce7', color: '#166534', label: 'Approved' },
      'Pending Payment': { bg: '#e0e7ff', color: '#3730a3', label: 'Pending Payment' },
      'Pending Approval': { bg: '#fef3c7', color: '#92400e', label: 'Pending Approval' },
      Rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' }
    };
    const c = config[status] || { bg: '#f1f5f9', color: '#475569', label: status || 'Unknown' };
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: '700',
        background: c.bg,
        color: c.color
      }}>
        {c.label}
      </span>
    );
  };

  const generateAndPrintReceipt = (booking) => {
    if (!booking) return;
    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) {
      alert('Pop-up blocked! Please allow pop-ups to print or download the receipt.');
      return;
    }

    const parkName = booking.park?.name || 'Park';
    const applicantName = booking.applicantName || booking.user?.name || 'Stall Owner';
    const receiptNo = `STALL-REC-${(booking._id || '').slice(-6).toUpperCase()}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stall_Receipt_${receiptNo}</title>
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
              <p>Official Stall Booking & Payment Receipt</p>
            </div>
            <div class="ids-row">
              <div>Receipt No: ${receiptNo}</div>
              <div>Booking ID: ${booking._id || 'N/A'}</div>
            </div>
            <table>
              <tbody>
                <tr><td class="label">Applicant Name</td><td class="value">${applicantName}</td></tr>
                <tr><td class="label">Contact Phone</td><td class="value">${booking.applicantPhone || booking.user?.phone || 'N/A'}</td></tr>
                <tr><td class="label">Email</td><td class="value">${booking.user?.email || 'N/A'}</td></tr>
                <tr><td class="label">Stall Name</td><td class="value">${booking.stallName || 'N/A'}</td></tr>
                <tr><td class="label">Products Type</td><td class="value">${booking.productsType || 'N/A'}</td></tr>
                <tr><td class="label">Park Location</td><td class="value">${parkName}</td></tr>
                <tr><td class="label">Booking Fee Paid</td><td class="value">₹${booking.amountPaid || 0}</td></tr>
                <tr><td class="label">Booking Date</td><td class="value">${booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-IN') : 'N/A'}</td></tr>
                <tr><td class="label">Payment Status</td><td class="value">${booking.status || 'Confirmed'}</td></tr>
              </tbody>
            </table>
            <div class="footer-note">
              <p style="margin:0 0 4px 0; font-weight:bold;">✅ This is an official digitally generated stall receipt.</p>
              <p style="margin:0;">Keep this receipt for your records and park authority verification.</p>
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

  const ReceiptModal = ({ booking, onClose }) => {
    const parkName = booking.park?.name || 'Park';
    const applicantName = booking.applicantName || booking.user?.name || 'Stall Owner';
    const receiptNo = `STALL-REC-${(booking._id || '').slice(-6).toUpperCase()}`;

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }} onClick={onClose}>
        <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', border: '2px solid #059669', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
          
          <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)', padding: '1.5rem', textAlign: 'center', color: 'white', borderTopLeftRadius: '14px', borderTopRightRadius: '14px' }}>
            <h2 style={{ margin: 0 }}>🌿 Parks Monitoring System</h2>
            <p style={{ margin: '4px 0 0', opacity: 0.9 }}>Official Stall Booking Payment Receipt</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Receipt Number</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#064e3b', fontFamily: 'monospace' }}>{receiptNo}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Booking ID</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#064e3b', fontFamily: 'monospace' }}>{(booking._id || '').slice(-8).toUpperCase()}</div>
            </div>
          </div>

          <div style={{ padding: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginBottom: '1rem' }}>
              <tbody>
                {[
                  ['Applicant Name', applicantName],
                  ['Contact Phone', booking.applicantPhone || booking.user?.phone || 'N/A'],
                  ['Email', booking.user?.email || 'N/A'],
                  ['Stall Name', booking.stallName || 'N/A'],
                  ['Products Type', booking.productsType || 'N/A'],
                  ['Park Location', parkName],
                  ['Booking Fee', `₹${booking.amountPaid || 0}`],
                  ['Booking Date', booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-IN') : 'N/A'],
                  ['Status', booking.status || 'Confirmed']
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 4px', color: '#64748b', fontWeight: 600, width: '42%' }}>{label}</td>
                    <td style={{ padding: '8px 4px', color: '#0f172a', fontWeight: label === 'Booking Fee' ? 800 : 500 }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '12px', textAlign: 'center', color: '#166534', fontWeight: 600, fontSize: '0.85rem' }}>
              <p style={{ margin: 0 }}>✅ Official stall payment receipt generated.</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                onClick={() => generateAndPrintReceipt(booking)}
                style={{ flex: 1, padding: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Download size={16} /> Download Receipt
              </button>
              <button
                onClick={onClose}
                style={{ padding: '12px 20px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  };

  const statCards = [
    { label: 'Total Bookings', value: bookings.length, icon: <Store size={24} />, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Confirmed / Paid', value: confirmedBookings.length, icon: <CheckCircle size={24} />, color: '#059669', bg: '#f0fdf4' },
    { label: 'Pending Payments', value: pendingBookings.length, icon: <Clock size={24} />, color: '#d97706', bg: '#fffbeb' },
    { label: 'Rejected Bookings', value: rejectedBookings.length, icon: <XCircle size={24} />, color: '#dc2626', bg: '#fef2f2' },
    { label: 'Total Revenue', value: `₹${totalCollection.toLocaleString('en-IN')}`, icon: <IndianRupee size={24} />, color: '#059669', bg: '#ecfdf5', highlight: true }
  ];

  return (
    <div style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Stall Booking Payments</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>Track stall booking payments, collection revenues, and payment receipts across all parks.</p>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map(card => (
          <div key={card.label} style={{ background: 'white', border: card.highlight ? `2px solid ${card.color}` : '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ background: card.bg, color: card.color, borderRadius: '8px', padding: '8px', display: 'flex' }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: card.highlight ? '1.5rem' : '1.8rem', fontWeight: 800, color: card.highlight ? card.color : '#0f172a' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{card.label}</div>
            {card.highlight && <div style={{ fontSize: '0.75rem', color: card.color, fontWeight: 700, marginTop: '4px' }}>From confirmed stall payments</div>}
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 600 }}>
          <Filter size={16} /> Filter Status:
        </div>
        {['All', 'Confirmed', 'Pending', 'Rejected'].map(statusKey => (
          <button
            key={statusKey}
            onClick={() => setFilterStatus(statusKey)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: filterStatus === statusKey ? 'none' : '1px solid #e2e8f0',
              background: filterStatus === statusKey ? '#059669' : 'white',
              color: filterStatus === statusKey ? 'white' : '#475569',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {statusKey}
          </button>
        ))}
      </div>

      {/* Main Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: 'white', borderRadius: '12px' }}>Loading stall payment records...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#dc2626', background: 'white', borderRadius: '12px' }}>{error}</div>
      ) : filteredBookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: 'white', borderRadius: '12px' }}>No stall bookings match the selected filter.</div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Applicant', 'Stall & Products', 'Park Location', 'Amount Paid', 'Status', 'Booking Date', 'Receipt Action'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => {
                  const applicantName = b.applicantName || b.user?.name || 'Stall Owner';
                  const applicantPhone = b.applicantPhone || b.user?.phone || b.user?.email || 'N/A';

                  return (
                    <tr key={b._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{applicantName}</div>
                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{applicantPhone}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{b.stallName || 'Stall'}</div>
                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{b.productsType || 'General Products'}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#059669' }}>{b.park?.name || 'Park'}</div>
                        {b.park?.parkCode && <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{b.park.parkCode}</div>}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                        ₹{b.amountPaid || 0}
                      </td>
                      <td style={{ padding: '14px 16px' }}>{getStatusBadge(b.status)}</td>
                      <td style={{ padding: '14px 16px', color: '#475569', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => setSelectedBooking(b)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            background: '#f0fdf4',
                            color: '#059669',
                            border: '1px solid #86efac',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          <Receipt size={14} /> View Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
            Showing {filteredBookings.length} of {bookings.length} stall payment records
          </div>
        </div>
      )}

      {selectedBooking && <ReceiptModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}
    </div>
  );
};

export default AdminStallPayments;
