import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  X, 
  FileText, 
  AlertTriangle, 
  Home, 
  Eye, 
  MessageSquare, 
  Check, 
  Info,
  ShieldCheck
} from 'lucide-react';

const AdminStallBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected booking for Review Modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Modals
  const [rejectModal, setRejectModal] = useState({ isOpen: false, bookingId: null, reason: '', loading: false });
  const [infoModal, setInfoModal] = useState({ isOpen: false, bookingId: null, message: '', loading: false });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      const res = await axios.get('/api/stall-bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
      if (selectedBooking) {
        const updated = res.data.find(b => b._id === selectedBooking._id);
        if (updated) setSelectedBooking(updated);
      }
    } catch (error) {
      console.error('Error fetching stall bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Admin Actions: Address Verification
  const handleVerifyAddress = async (id, status = 'Verified') => {
    try {
      setActionLoading(true);
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      await axios.put(`/api/stall-bookings/${id}/verify-address`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Residential Address marked as ${status}!`);
      fetchBookings();
    } catch (error) {
      console.error('Error verifying address:', error);
      alert(error.response?.data?.message || 'Failed to update address verification');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin Actions: Approve Stall
  const handleApproveStall = async (id) => {
    if (!window.confirm("Approve this Stall Allocation? The user will be notified to make payment/finalize.")) return;
    try {
      setActionLoading(true);
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      await axios.put(`/api/stall-bookings/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Stall booking approved successfully!");
      fetchBookings();
    } catch (error) {
      console.error('Error approving booking:', error);
      alert(error.response?.data?.message || 'Failed to approve booking');
    } finally {
      setActionLoading(false);
    }
  };

  // Admin Actions: Request More Info
  const submitRequestInfo = async () => {
    if (!infoModal.message.trim()) {
      alert("Please enter the specific info or document needed from applicant.");
      return;
    }
    setInfoModal(prev => ({ ...prev, loading: true }));
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      await axios.put(`/api/stall-bookings/${infoModal.bookingId}/request-info`, { message: infoModal.message }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Information request notification sent to the applicant.");
      setInfoModal({ isOpen: false, bookingId: null, message: '', loading: false });
      fetchBookings();
    } catch (error) {
      console.error('Error requesting info:', error);
      alert(error.response?.data?.message || 'Failed to send request');
      setInfoModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Admin Actions: Reject Stall
  const submitReject = async () => {
    if (!rejectModal.reason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    setRejectModal(prev => ({ ...prev, loading: true }));
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      await axios.put(`/api/stall-bookings/${rejectModal.bookingId}/reject`, { reason: rejectModal.reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Booking rejected!");
      setRejectModal({ isOpen: false, bookingId: null, reason: '', loading: false });
      fetchBookings();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert(error.response?.data?.message || 'Failed to reject booking');
      setRejectModal(prev => ({ ...prev, loading: false }));
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading stall bookings...</div>;
  }

  return (
    <div className="admin-panel" style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.6rem', fontWeight: 800 }}>Stall Bookings & Address Review</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Review applicant details, Aadhaar cards, cross-city residential addresses, address proofs, and allocate stalls.
          </p>
        </div>
      </div>

      {/* Bookings Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: '700', fontSize: '0.85rem' }}>Applicant</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: '700', fontSize: '0.85rem' }}>Stall & Park</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: '700', fontSize: '0.85rem' }}>Aadhaar Address</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: '700', fontSize: '0.85rem' }}>Current Residential Address</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: '700', fontSize: '0.85rem' }}>Documents</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: '700', fontSize: '0.85rem' }}>Address Status</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: '700', fontSize: '0.85rem' }}>Status</th>
                <th style={{ padding: '1rem', color: '#475569', fontWeight: '700', fontSize: '0.85rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    No stall booking applications found.
                  </td>
                </tr>
              ) : (
                bookings.map(b => {
                  const isSameAddr = b.isAddressSameAsAadhaar;

                  return (
                    <tr key={b._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      
                      {/* Applicant */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {b.photoUrl ? (
                            <img src={b.photoUrl} alt="Applicant" style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                          ) : (
                            <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontWeight: 'bold' }}>
                              {(b.applicantName || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{b.applicantName}</div>
                            <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{b.applicantPhone || b.user?.phone || 'No phone'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Stall & Park */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.stallName}</div>
                        <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>{b.park?.name || 'Park'}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{b.productsType}</div>
                      </td>

                      {/* Aadhaar Address */}
                      <td style={{ padding: '1rem', fontSize: '0.86rem', color: '#334155', maxWidth: '170px' }}>
                        {b.nativeAddress || '—'}
                      </td>

                      {/* Current Residential Address */}
                      <td style={{ padding: '1rem', fontSize: '0.86rem', color: '#334155', maxWidth: '190px' }}>
                        <div>{b.currentAddress || '—'}</div>
                        {!isSameAddr && b.differentAddressReason && (
                          <div style={{ fontSize: '0.76rem', color: '#b45309', background: '#fffbeb', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
                            {b.differentAddressReason}
                          </div>
                        )}
                      </td>

                      {/* Documents */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {b.documentUrl && (
                            <a 
                              href={b.documentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600 }}
                            >
                              <FileText size={13} /> Aadhaar Card
                            </a>
                          )}
                          {b.currentAddressProofUrl && (
                            <a 
                              href={b.currentAddressProofUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600 }}
                            >
                              <FileText size={13} /> Address Proof
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Address Verification Badge */}
                      <td style={{ padding: '1rem' }}>
                        {isSameAddr ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: '#dcfce7', color: '#15803d', fontSize: '0.82rem', fontWeight: 700 }}>
                            <CheckCircle2 size={13} /> Same as Aadhaar
                          </span>
                        ) : b.currentAddressProofUrl ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: '#fef3c7', color: '#b45309', fontSize: '0.82rem', fontWeight: 700 }}>
                            <AlertTriangle size={13} /> Proof Uploaded
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: '#fee2e2', color: '#b91c1c', fontSize: '0.82rem', fontWeight: 700 }}>
                            <XCircle size={13} /> Proof Missing
                          </span>
                        )}
                      </td>

                      {/* Overall Stall Status */}
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700,
                          backgroundColor: (b.status === 'Confirmed' || b.status === 'Approved') ? '#dcfce7' : b.status === 'Rejected' ? '#fee2e2' : b.status === 'Pending Payment' ? '#e0e7ff' : '#fffbeb',
                          color: (b.status === 'Confirmed' || b.status === 'Approved') ? '#166534' : b.status === 'Rejected' ? '#991b1b' : b.status === 'Pending Payment' ? '#3730a3' : '#92400e',
                          border: `1px solid ${(b.status === 'Confirmed' || b.status === 'Approved') ? '#bbf7d0' : b.status === 'Rejected' ? '#fecaca' : '#fde68a'}`
                        }}>
                          {b.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem' }}>
                        <button
                          onClick={() => setSelectedBooking(b)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#059669', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          <Eye size={14} /> Review & Verify
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DETAILED VERIFICATION & DECISION MODAL (ADMIN)
      ────────────────────────────────────────────────────────────── */}
      {selectedBooking && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', width: '800px', maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={22} color="#059669" />
                  Stall Booking Review — {selectedBooking.applicantName}
                </h3>
                <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.84rem' }}>
                  Stall: <strong>{selectedBooking.stallName}</strong> at <strong>{selectedBooking.park?.name || 'Park'}</strong>
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedBooking(null)} 
                style={{ background: '#e2e8f0', border: 'none', cursor: 'pointer', borderRadius: '50%', padding: '6px', color: '#475569' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Informational Guidance Alert */}
              {selectedBooking.isAddressSameAsAadhaar ? (
                <div style={{ padding: '10px 14px', background: '#ecfdf5', color: '#065f46', borderRadius: '8px', fontSize: '0.86rem', fontWeight: 600, border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} />
                  Current address matches Aadhaar address.
                </div>
              ) : selectedBooking.currentAddressProofUrl ? (
                <div style={{ padding: '12px 16px', background: '#eff6ff', color: '#1e40af', borderRadius: '8px', fontSize: '0.86rem', fontWeight: 600, border: '1px solid #bfdbfe', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Info size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Cross-City Address:</strong> Current address differs from Aadhaar address. Review submitted current-address proof document below.
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px 16px', background: '#fffbeb', color: '#b45309', borderRadius: '8px', fontSize: '0.86rem', fontWeight: 600, border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Current address proof required:</strong> Applicant stays in another city but proof document is missing.
                  </div>
                </div>
              )}

              {/* Applicant Card */}
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#1e293b', fontWeight: 700 }}>Applicant & Stall Information</h4>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '12px' }}>
                  {selectedBooking.photoUrl ? (
                    <img src={selectedBooking.photoUrl} alt="Photo" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #059669' }} />
                  ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      No Photo
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>{selectedBooking.applicantName}</div>
                    <div style={{ fontSize: '0.85rem', color: '#475569' }}>Phone: {selectedBooking.applicantPhone}</div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Fee Paid: ₹{selectedBooking.amountPaid} • Products: {selectedBooking.productsType}</div>
                  </div>
                </div>
              </div>

              {/* Address Comparison & Proof Document */}
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.92rem', color: '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Home size={17} color="#059669" /> Address & Document Verification
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1rem' }}>
                  
                  {/* Aadhaar Address & Card Link */}
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Aadhaar Address
                      </div>
                      {selectedBooking.documentUrl && (
                        <a 
                          href={selectedBooking.documentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #bfdbfe' }}
                        >
                          <FileText size={12} /> View Aadhaar Card
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 }}>
                      {selectedBooking.nativeAddress || 'Not provided'}
                    </div>
                  </div>

                  {/* Current Residential Address */}
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Current Residential Address
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 }}>
                      {selectedBooking.currentAddress || 'Not provided'}
                    </div>
                    
                    {!selectedBooking.isAddressSameAsAadhaar && (
                      <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#b45309', background: '#fffbeb', padding: '4px 8px', borderRadius: '4px' }}>
                        <strong>Reason for different address:</strong> {selectedBooking.differentAddressReason} {selectedBooking.differentAddressOtherReason && `(${selectedBooking.differentAddressOtherReason})`}
                      </div>
                    )}
                  </div>

                </div>

                {/* Uploaded Address Proof Document */}
                {!selectedBooking.isAddressSameAsAadhaar && (
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                        Current Address Proof
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {selectedBooking.currentAddressProofUrl ? 'Document uploaded and available for review' : 'No document uploaded'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {selectedBooking.currentAddressProofUrl ? (
                        <a 
                          href={selectedBooking.currentAddressProofUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#2563eb', padding: '6px 14px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '0.84rem', border: '1px solid #bfdbfe' }}
                        >
                          <FileText size={15} /> View Address Proof
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: 700 }}>Proof Missing</span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleVerifyAddress(selectedBooking._id, 'Verified')}
                        style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Approve Address Proof
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setInfoModal({ isOpen: true, bookingId: selectedBooking._id, message: '', loading: false })}
                  style={{ padding: '0.75rem 1.25rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <MessageSquare size={16} /> Request More Information
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setRejectModal({ isOpen: true, bookingId: selectedBooking._id, reason: '', loading: false })}
                    style={{ padding: '0.75rem 1.5rem', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <XCircle size={16} /> Reject Stall
                  </button>

                  <button
                    type="button"
                    disabled={selectedBooking.status === 'Confirmed' || selectedBooking.status === 'Pending Payment'}
                    onClick={() => handleApproveStall(selectedBooking._id)}
                    style={{ padding: '0.75rem 2rem', background: (selectedBooking.status === 'Confirmed' || selectedBooking.status === 'Pending Payment') ? '#94a3b8' : 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: (selectedBooking.status === 'Confirmed' || selectedBooking.status === 'Pending Payment') ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(5,150,105,0.25)' }}
                  >
                    <Check size={18} /> {selectedBooking.status === 'Confirmed' ? 'Stall Confirmed' : selectedBooking.status === 'Pending Payment' ? 'Awaiting Payment' : 'Approve Stall'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '420px', maxWidth: '92%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#1f2937' }}>Reject Stall Booking</h3>
              <button type="button" onClick={() => setRejectModal({ isOpen: false, bookingId: null, reason: '', loading: false })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151', fontSize: '0.88rem' }}>Reason for Rejection *</label>
              <textarea 
                value={rejectModal.reason} 
                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))} 
                required 
                placeholder="e.g. Products not permitted under park vendor policy or incomplete address proofs..."
                rows="4"
                style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setRejectModal({ isOpen: false, bookingId: null, reason: '', loading: false })} style={{ padding: '0.6rem 1rem', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#475569', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                Cancel
              </button>
              <button type="button" onClick={submitReject} disabled={rejectModal.loading} style={{ padding: '0.6rem 1.25rem', border: 'none', backgroundColor: '#ef4444', color: 'white', borderRadius: '6px', cursor: rejectModal.loading ? 'not-allowed' : 'pointer', fontWeight: '700' }}>
                {rejectModal.loading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Info Modal */}
      {infoModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '450px', maxWidth: '92%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#1f2937' }}>Request Additional Information</h3>
              <button type="button" onClick={() => setInfoModal({ isOpen: false, bookingId: null, message: '', loading: false })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151', fontSize: '0.88rem' }}>Message to Applicant *</label>
              <textarea 
                value={infoModal.message} 
                onChange={(e) => setInfoModal(prev => ({ ...prev, message: e.target.value }))} 
                required 
                placeholder="e.g. Please upload a clearer copy of your Bengaluru Rental Agreement or college bonafide letter..."
                rows="4"
                style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setInfoModal({ isOpen: false, bookingId: null, message: '', loading: false })} style={{ padding: '0.6rem 1rem', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#475569', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                Cancel
              </button>
              <button type="button" onClick={submitRequestInfo} disabled={infoModal.loading} style={{ padding: '0.6rem 1.25rem', border: 'none', backgroundColor: '#2563eb', color: 'white', borderRadius: '6px', cursor: infoModal.loading ? 'not-allowed' : 'pointer', fontWeight: '700' }}>
                {infoModal.loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminStallBookings;
