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
  ShieldCheck,
  Trash2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Download
} from 'lucide-react';

import Swal from 'sweetalert2';
import { resolveMediaUrl } from '../../utils/imageUtils';

const getAdminToken = () => {
  try {
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      const parsed = JSON.parse(adminUser);
      if (parsed?.token) return parsed.token;
    }
    const genericUser = localStorage.getItem('user');
    if (genericUser) {
      const parsed = JSON.parse(genericUser);
      if (parsed?.token) return parsed.token;
    }
    const token = localStorage.getItem('token');
    if (token) return token;
  } catch (e) {
    console.error('Error getting admin token:', e);
  }
  return '';
};

const AdminStallBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected booking for Review Modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Modals
  const [rejectModal, setRejectModal] = useState({ isOpen: false, bookingId: null, reason: '', loading: false });
  const [infoModal, setInfoModal] = useState({ isOpen: false, bookingId: null, message: '', loading: false });
  const [actionLoading, setActionLoading] = useState(false);

  const handleDeleteBooking = async (id, e) => {
    if (e) e.stopPropagation();
    const result = await Swal.fire({
      title: 'Delete Booking?',
      text: 'Are you sure you want to delete this stall booking record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;

    try {
      setActionLoading(true);
      const token = getAdminToken();
      await axios.delete(`/api/stall-bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (selectedBooking && selectedBooking._id === id) {
        setSelectedBooking(null);
      }
      Swal.fire({
        title: 'Deleted!',
        text: 'Stall booking removed successfully.',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false
      });
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to delete booking',
        icon: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearAll = async () => {
    const result = await Swal.fire({
      title: 'Clear All Bookings?',
      text: 'Are you sure you want to permanently clear ALL stall bookings? This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, clear all!'
    });
    if (!result.isConfirmed) return;

    try {
      setActionLoading(true);
      const token = getAdminToken();
      await axios.delete('/api/stall-bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedBooking(null);
      Swal.fire({
        title: 'Cleared!',
        text: 'All stall bookings cleared successfully.',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false
      });
      fetchBookings();
    } catch (error) {
      console.error('Error clearing bookings:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to clear bookings',
        icon: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };


  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async (showLoading = false) => {
    try {
      if (showLoading) setRefreshing(true);
      const token = getAdminToken();
      const res = await axios.get('/api/stall-bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : (res.data?.bookings || []);
      setBookings(data);
      if (selectedBooking) {
        const updated = data.find(b => b._id === selectedBooking._id);
        if (updated) setSelectedBooking(updated);
      }
    } catch (error) {
      console.error('Error fetching stall bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // Auto-poll every 8 seconds for dynamic updates when public citizens apply or update
    const interval = setInterval(() => {
      fetchBookings(false);
    }, 8000);

    const handleFocusOrVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchBookings(false);
      }
    };

    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
    };
  }, []);

  // Admin Actions: Address Verification
  const handleVerifyAddress = async (id, status = 'Verified') => {
    try {
      setActionLoading(true);
      const token = getAdminToken();
      await axios.put(`/api/stall-bookings/${id}/verify-address`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        title: 'Address Updated',
        text: `Residential Address marked as ${status}!`,
        icon: 'success',
        timer: 1800,
        showConfirmButton: false
      });
      fetchBookings();
    } catch (error) {
      console.error('Error verifying address:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update address verification',
        icon: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Admin Actions: Approve Stall
  const handleApproveStall = async (id) => {
    const result = await Swal.fire({
      title: 'Approve Stall Allocation?',
      text: 'The user will be notified to make payment and finalize their reservation.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Approve Stall'
    });
    if (!result.isConfirmed) return;

    try {
      setActionLoading(true);
      const token = getAdminToken();
      await axios.put(`/api/stall-bookings/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        title: 'Approved!',
        text: 'Stall booking approved successfully!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      fetchBookings();
    } catch (error) {
      console.error('Error approving booking:', error);
      Swal.fire({
        title: 'Approval Failed',
        text: error.response?.data?.message || 'Failed to approve booking',
        icon: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Admin Actions: Request More Info
  const submitRequestInfo = async () => {
    if (!infoModal.message.trim()) {
      Swal.fire({
        title: 'Input Required',
        text: 'Please enter the specific info or document needed from applicant.',
        icon: 'warning'
      });
      return;
    }
    setInfoModal(prev => ({ ...prev, loading: true }));
    try {
      const token = getAdminToken();
      await axios.put(`/api/stall-bookings/${infoModal.bookingId}/request-info`, { message: infoModal.message }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        title: 'Request Sent',
        text: 'Information request notification sent to the applicant.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      setInfoModal({ isOpen: false, bookingId: null, message: '', loading: false });
      fetchBookings();
    } catch (error) {
      console.error('Error requesting info:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to send request',
        icon: 'error'
      });
      setInfoModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Admin Actions: Reject Stall
  const submitReject = async () => {
    if (!rejectModal.reason.trim()) {
      Swal.fire({
        title: 'Reason Required',
        text: 'Please provide a reason for rejection.',
        icon: 'warning'
      });
      return;
    }
    setRejectModal(prev => ({ ...prev, loading: true }));
    try {
      const token = getAdminToken();
      await axios.put(`/api/stall-bookings/${rejectModal.bookingId}/reject`, { reason: rejectModal.reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        title: 'Booking Rejected',
        text: 'The booking has been rejected and the slot has been released.',
        icon: 'info',
        timer: 2000,
        showConfirmButton: false
      });
      setRejectModal({ isOpen: false, bookingId: null, reason: '', loading: false });
      fetchBookings();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to reject booking',
        icon: 'error'
      });
      setRejectModal(prev => ({ ...prev, loading: false }));
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading stall bookings...</div>;
  }

  return (
    <div className="admin-stall-bookings-view" style={{ padding: '0.5rem', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, color: '#F0F4FF', fontSize: '1.6rem', fontWeight: 800 }}>Stall Bookings & Address Review</h2>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              color: '#10b981', 
              background: 'rgba(16, 185, 129, 0.12)', 
              border: '1px solid rgba(16, 185, 129, 0.3)', 
              padding: '2px 8px', 
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Live Dynamic Polling
            </span>
          </div>
          <p style={{ margin: '6px 0 0', color: '#A8B0C8', fontSize: '0.92rem' }}>
            Review applicant details, Aadhaar cards, cross-city residential addresses, address proofs, and allocate stalls in real time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => fetchBookings(true)}
            disabled={refreshing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#242e4c',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div style={{ background: '#1E2438', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#1A2035', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '1rem', color: '#8F9CAE', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applicant</th>
                <th style={{ padding: '1rem', color: '#8F9CAE', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stall & Park</th>
                <th style={{ padding: '1rem', color: '#8F9CAE', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Residential Address</th>
                <th style={{ padding: '1rem', color: '#8F9CAE', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Documents</th>
                <th style={{ padding: '1rem', color: '#8F9CAE', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '1rem', color: '#8F9CAE', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3.5rem', textAlign: 'center', color: '#666E85', fontSize: '0.95rem' }}>
                    No stall booking applications found.
                  </td>
                </tr>
              ) : (
                bookings.map(b => {
                  const isSameAddr = b.isAddressSameAsAadhaar;

                  return (
                    <tr key={b._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      
                      {/* Applicant */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {(b.photoUrl || b.user?.profilePic) ? (
                            <img 
                              src={resolveMediaUrl(b.photoUrl || b.user?.profilePic)} 
                              alt="Applicant" 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(b.applicantName || 'Applicant') + '&background=059669&color=fff&size=128';
                              }}
                              style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }} 
                            />
                          ) : (
                            <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#2A334E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F0F4FF', fontWeight: 'bold' }}>
                              {(b.applicantName || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 700, color: '#F0F4FF', fontSize: '0.95rem' }}>{b.applicantName}</div>
                            <div style={{ fontSize: '0.82rem', color: '#A8B0C8' }}>{b.applicantPhone || b.user?.phone || 'No phone'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Stall & Park */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 700, color: '#F0F4FF' }}>{b.stallName}</div>
                        <div style={{ fontSize: '0.85rem', color: '#32C48D', fontWeight: 600 }}>{b.park?.name || 'Park'}</div>
                        <div style={{ fontSize: '0.78rem', color: '#A8B0C8' }}>{b.productsType}</div>
                      </td>

                      {/* Current Residential Address */}
                      <td style={{ padding: '1rem', fontSize: '0.88rem', color: '#CBD5E1', maxWidth: '240px' }}>
                        <div>{b.currentAddress || b.nativeAddress || '—'}</div>
                        {!isSameAddr && b.differentAddressReason && (
                          <div style={{ fontSize: '0.76rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '4px', marginTop: '4px', display: 'inline-block', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                            {b.differentAddressReason}
                          </div>
                        )}
                      </td>

                      {/* Documents */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {(b.documentUrl || b.user?.aadhaarFrontImage) ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <a 
                                href={resolveMediaUrl(b.documentUrl || b.user?.aadhaarFrontImage)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '4px 8px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(59, 130, 246, 0.3)' }}
                              >
                                <FileText size={13} /> Aadhaar Card <ExternalLink size={11} />
                              </a>
                              <a 
                                href={resolveMediaUrl(b.documentUrl || b.user?.aadhaarFrontImage)} 
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Download Aadhaar Document"
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '4px 6px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.78rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                              >
                                <Download size={13} />
                              </a>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>No doc attached</span>
                          )}
                          {b.currentAddressProofUrl && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <a 
                                href={resolveMediaUrl(b.currentAddressProofUrl)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '4px 8px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(245, 158, 11, 0.3)' }}
                              >
                                <FileText size={13} /> Address Proof <ExternalLink size={11} />
                              </a>
                              <a 
                                href={resolveMediaUrl(b.currentAddressProofUrl)} 
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Download Address Proof"
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '4px 6px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.78rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                              >
                                <Download size={13} />
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Overall Stall Status */}
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700,
                          backgroundColor: (b.status === 'Confirmed' || b.status === 'Approved') ? 'rgba(34, 197, 94, 0.15)' : b.status === 'Rejected' ? 'rgba(239, 68, 68, 0.15)' : b.status === 'Pending Payment' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: (b.status === 'Confirmed' || b.status === 'Approved') ? '#4ade80' : b.status === 'Rejected' ? '#f87171' : b.status === 'Pending Payment' ? '#a5b4fc' : '#fbbf24',
                          border: `1px solid ${(b.status === 'Confirmed' || b.status === 'Approved') ? 'rgba(34, 197, 94, 0.3)' : b.status === 'Rejected' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                        }}>
                          {b.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {b.status === 'Pending Approval' && (
                            <>
                              <button
                                onClick={() => handleApproveStall(b._id)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: 'white', border: 'none', padding: '7px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 6px rgba(5,150,105,0.3)' }}
                                title="Approve stall and request fee payment"
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                onClick={() => setRejectModal({ isOpen: true, bookingId: b._id, reason: '', loading: false })}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', border: 'none', padding: '7px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 6px rgba(239,68,68,0.3)' }}
                                title="Reject stall application"
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedBooking(b)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#3b82f6', color: 'white', border: 'none', padding: '7px 12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(59,130,246,0.3)' }}
                          >
                            <Eye size={14} /> Review & Verify
                          </button>
                        </div>
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
                  {(selectedBooking.photoUrl || selectedBooking.user?.profilePic) ? (
                    <img 
                      src={resolveMediaUrl(selectedBooking.photoUrl || selectedBooking.user?.profilePic)} 
                      alt="Applicant Photo" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(selectedBooking.applicantName || 'Applicant') + '&background=059669&color=fff&size=128';
                      }}
                      style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #059669' }} 
                    />
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

              {/* Address & Document Verification */}
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.92rem', color: '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Home size={17} color="#059669" /> Address & Document Verification
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: selectedBooking.isAddressSameAsAadhaar ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  {/* Permanent / Aadhaar Address */}
                  <div style={{ background: 'white', padding: '1.15rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Aadhaar / Permanent Address
                      </div>
                      {(selectedBooking.documentUrl || selectedBooking.user?.aadhaarFrontImage) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <a 
                            href={resolveMediaUrl(selectedBooking.documentUrl || selectedBooking.user?.aadhaarFrontImage)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, border: '1px solid #bfdbfe' }}
                          >
                            <FileText size={14} /> View Aadhaar Card <ExternalLink size={12} />
                          </a>
                          <a 
                            href={resolveMediaUrl(selectedBooking.documentUrl || selectedBooking.user?.aadhaarFrontImage)} 
                            download
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', color: '#334155', padding: '4px 10px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, border: '1px solid #cbd5e1' }}
                          >
                            <Download size={14} /> Download
                          </a>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 600, lineHeight: 1.5 }}>
                      {selectedBooking.nativeAddress || selectedBooking.currentAddress || 'Not provided'}
                    </div>

                    {/* Aadhaar Document Preview */}
                    {(selectedBooking.documentUrl || selectedBooking.user?.aadhaarFrontImage) && (
                      <div style={{ marginTop: '10px', border: '1px dashed #cbd5e1', borderRadius: '6px', padding: '8px', textAlign: 'center', background: '#f8fafc' }}>
                        {(selectedBooking.documentUrl || selectedBooking.user?.aadhaarFrontImage || '').toLowerCase().endsWith('.pdf') ? (
                          <iframe src={resolveMediaUrl(selectedBooking.documentUrl || selectedBooking.user?.aadhaarFrontImage)} title="Aadhaar Preview" style={{ width: '100%', height: '220px', border: 'none' }} />
                        ) : (
                          <img 
                            src={resolveMediaUrl(selectedBooking.documentUrl || selectedBooking.user?.aadhaarFrontImage)} 
                            alt="Aadhaar Document Preview"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                            style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '4px' }} 
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Current Residential Address (if different) */}
                  {!selectedBooking.isAddressSameAsAadhaar && (
                    <div style={{ background: 'white', padding: '1.15rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          Current Residential Address
                        </div>
                        {selectedBooking.currentAddressProofUrl && (
                          <a 
                            href={resolveMediaUrl(selectedBooking.currentAddressProofUrl)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, border: '1px solid #fde68a' }}
                          >
                            <FileText size={14} /> View Address Proof <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      <div style={{ fontSize: '0.92rem', color: '#0f172a', fontWeight: 600, lineHeight: 1.5 }}>
                        {selectedBooking.currentAddress || 'Not provided'}
                      </div>
                      {selectedBooking.differentAddressReason && (
                        <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#b45309', background: '#fffbeb', padding: '4px 8px', borderRadius: '4px' }}>
                          Reason: {selectedBooking.differentAddressReason} {selectedBooking.differentAddressOtherReason ? `(${selectedBooking.differentAddressOtherReason})` : ''}
                        </div>
                      )}

                      {/* Current Address Proof Preview */}
                      {selectedBooking.currentAddressProofUrl && (
                        <div style={{ marginTop: '10px', border: '1px dashed #cbd5e1', borderRadius: '6px', padding: '8px', textAlign: 'center', background: '#f8fafc' }}>
                          {selectedBooking.currentAddressProofUrl.toLowerCase().endsWith('.pdf') ? (
                            <iframe src={resolveMediaUrl(selectedBooking.currentAddressProofUrl)} title="Address Proof Preview" style={{ width: '100%', height: '220px', border: 'none' }} />
                          ) : (
                            <img 
                              src={resolveMediaUrl(selectedBooking.currentAddressProofUrl)} 
                              alt="Address Proof Preview"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                              style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '4px' }} 
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
