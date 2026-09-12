import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, XCircle, Clock, Plus, X, FileText, CreditCard } from 'lucide-react';

const AdminStallBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // For the Add Booking Modal
  const [showModal, setShowModal] = useState(false);
  const [parksList, setParksList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [formData, setFormData] = useState({
    parkId: '',
    userId: '',
    stallName: '',
    productsType: '',
    amountPaid: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [rejectModal, setRejectModal] = useState({ isOpen: false, bookingId: null, reason: '', loading: false });

  const fetchBookings = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      const res = await axios.get('/api/stall-bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch (error) {
      console.error('Error fetching stall bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParksAndUsers = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      const [parksRes, usersRes] = await Promise.all([
        axios.get('/api/parks', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/auth/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setParksList(parksRes.data);
      setUsersList(usersRes.data);
    } catch (error) {
      console.error('Error fetching parks or users:', error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchParksAndUsers();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this booking?")) return;
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      await axios.put(`/api/stall-bookings/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Booking approved!");
      fetchBookings();
    } catch (error) {
      console.error('Error approving booking:', error);
      alert(error.response?.data?.message || 'Failed to approve booking');
    }
  };

  const handleReject = (id) => {
    setRejectModal({ isOpen: true, bookingId: id, reason: '', loading: false });
  };

  const submitReject = async () => {
    if (!rejectModal.reason.trim()) {
      alert("Please provide a reason for rejection");
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-fill amount paid if park is selected
    if (name === 'parkId') {
      const selectedPark = parksList.find(p => p._id === value);
      if (selectedPark) {
        setFormData(prev => ({ ...prev, amountPaid: selectedPark.stallBookingAmount || 0, [name]: value }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.parkId) {
      alert("Please select a park.");
      return;
    }
    if (!formData.userId) {
      alert("Please select a user.");
      return;
    }
    if (!formData.stallName.trim()) {
      alert("Stall Name is required.");
      return;
    }
    if (!formData.productsType.trim()) {
      alert("Products Type is required.");
      return;
    }
    if (formData.amountPaid < 0) {
      alert("Amount Paid cannot be negative.");
      return;
    }

    setSubmitting(true);
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      await axios.post('/api/stall-bookings', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Stall booking created successfully!');
      setShowModal(false);
      setFormData({ parkId: '', userId: '', stallName: '', productsType: '', amountPaid: '' });
      fetchBookings();
    } catch (error) {
      console.error('Error creating booking:', error);
      alert(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading bookings...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#1f2937' }}>Stall Bookings Management</h2>
      </div>
      
      <div className="admin-table-container" style={{ padding: '2rem' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
              <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>Park & Slot</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>Applicant</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>Stall Details</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>Docs & Price</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  No stall bookings found.
                </td>
              </tr>
            ) : (
              bookings.map(booking => (
                <tr key={booking._id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: 'white' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{booking.park?.name || 'Unknown Park'}</div>
                    {booking.slot ? (
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {new Date(booking.slot.date).toLocaleDateString()} <br/>
                        {booking.slot.startTime} - {booking.slot.endTime} <br/>
                        <span style={{ fontWeight: '600' }}>{booking.slot.location}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{booking.park?.parkCode}</div>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {booking.photoUrl ? (
                        <img src={booking.photoUrl} alt="Applicant" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 'bold' }}>
                          {(booking.applicantName || booking.user?.name || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: '500', color: '#334155' }}>{booking.applicantName || booking.user?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{booking.applicantPhone || booking.user?.phone || booking.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '500', color: '#334155' }}>{booking.stallName}</div>
                    <div style={{ color: '#475569', fontSize: '0.85rem' }}>{booking.productsType}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold', color: '#059669', marginBottom: '0.25rem' }}>₹{booking.amountPaid}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      {booking.documentUrl && (
                        <a href={booking.documentUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#2563eb', textDecoration: 'none', backgroundColor: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>
                          <FileText size={12} /> View Doc
                        </a>
                      )}
                      {booking.photoUrl && (
                        <a href={booking.photoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#0284c7', textDecoration: 'none', backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
                          <FileText size={12} /> View Photo
                        </a>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: '600',
                      backgroundColor: (booking.status === 'Approved' || booking.status === 'Confirmed') ? '#dcfce7' : booking.status === 'Rejected' ? '#fee2e2' : booking.status === 'Pending Payment' ? '#e0e7ff' : '#fef3c7',
                      color: (booking.status === 'Approved' || booking.status === 'Confirmed') ? '#166534' : booking.status === 'Rejected' ? '#991b1b' : booking.status === 'Pending Payment' ? '#3730a3' : '#92400e'
                    }}>
                      {booking.status === 'Confirmed' && <CheckCircle2 size={14} />}
                      {booking.status === 'Rejected' && <XCircle size={14} />}
                      {booking.status === 'Pending Approval' && <Clock size={14} />}
                      {booking.status === 'Pending Payment' && <CreditCard size={14} />}
                      {booking.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#475569' }}>
                    {new Date(booking.bookingDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {booking.status === 'Pending Approval' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleApprove(booking._id)}
                          style={{ padding: '0.5rem 0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Approve
                        </button>
                        <button 
                          onClick={() => handleReject(booking._id)}
                          style={{ padding: '0.5rem 0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <form className="admin-modal" onSubmit={handleSubmit} style={{ backgroundColor: 'white', borderRadius: '12px', width: '550px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>Add Manual Booking</h3>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', borderRadius: '50%', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>Select Park *</label>
                <select name="parkId" value={formData.parkId} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f8fafc', color: '#1e293b', fontSize: '0.95rem' }}>
                  <option value="">Select a Park</option>
                  {parksList.map(p => {
                    const hasSlots = p.availableStallSlots > 0;
                    return (
                      <option key={p._id} value={p._id} disabled={!hasSlots}>
                        {p.name} ({p.parkCode || 'N/A'}) {hasSlots ? '' : '- No available slots'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>Select User *</label>
                <select name="userId" value={formData.userId} onChange={handleInputChange} required style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f8fafc', color: '#1e293b', fontSize: '0.95rem' }}>
                  <option value="">Select a User</option>
                  {usersList.map(u => (
                    <option key={u._id} value={u._id}>{u.name} - {u.email}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>Stall Name *</label>
                <input 
                  type="text" name="stallName" value={formData.stallName} onChange={handleInputChange} required placeholder="e.g. Fresh Juices & Snacks"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>Products Type *</label>
                <input 
                  type="text" name="productsType" value={formData.productsType} onChange={handleInputChange} required placeholder="e.g. Beverages, Snacks"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>Amount Paid (₹) *</label>
                <input 
                  type="number" name="amountPaid" value={formData.amountPaid} onChange={handleInputChange} required min="0" placeholder="0"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', backgroundColor: '#f8fafc' }} 
                />
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Amount is automatically filled when a park is selected.</p>
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem', backgroundColor: '#f8fafc', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1.25rem', backgroundColor: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} style={{ padding: '0.6rem 1.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}>
                {submitting ? 'Saving...' : 'Add Booking'}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '400px', maxWidth: '90%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#1f2937' }}>Reject Booking</h3>
              <button 
                type="button" 
                onClick={() => setRejectModal({ isOpen: false, bookingId: null, reason: '', loading: false })} 
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>Reason for Rejection *</label>
              <textarea 
                value={rejectModal.reason} 
                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))} 
                required 
                placeholder="Please provide a reason..."
                rows="4"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical' }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => setRejectModal({ isOpen: false, bookingId: null, reason: '', loading: false })}
                style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#475569', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={submitReject}
                disabled={rejectModal.loading}
                style={{ padding: '0.5rem 1rem', border: 'none', backgroundColor: '#ef4444', color: 'white', borderRadius: '4px', cursor: rejectModal.loading ? 'not-allowed' : 'pointer', fontWeight: '500' }}
              >
                {rejectModal.loading ? 'Rejecting...' : 'Reject Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStallBookings;
