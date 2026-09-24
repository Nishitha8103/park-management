import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Edit, Trash2, Plus, X, Image as ImageIcon, Users, IndianRupee, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

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

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conflictWarning, setConflictWarning] = useState('');
  const [selectedCorp, setSelectedCorp] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const navigate = useNavigate();
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    startTime: '09:00',
    endTime: '11:00',
    location: '',
    parkId: '',
    parkName: '',
    image: '',
    isActive: true,
    isPaid: false,
    price: 0,
    capacity: 0
  });

  // Extract unique Corporations, Zones, and Wards from parks list
  const corporations = React.useMemo(() => {
    const map = new Map();
    parks.forEach(p => {
      const c = p.corporation;
      if (c && typeof c === 'object' && c._id && !map.has(c._id)) {
        map.set(c._id, c);
      } else if (c && typeof c === 'string' && !map.has(c)) {
        map.set(c, { _id: c, name: c });
      }
    });
    return Array.from(map.values());
  }, [parks]);

  const zones = React.useMemo(() => {
    const map = new Map();
    parks.forEach(p => {
      const corpId = (p.corporation?._id || p.corporation || '').toString();
      const z = p.zone;
      if (z && (!selectedCorp || corpId === selectedCorp)) {
        if (typeof z === 'object' && z._id && !map.has(z._id)) {
          map.set(z._id, z);
        } else if (typeof z === 'string' && !map.has(z)) {
          map.set(z, { _id: z, name: z });
        }
      }
    });
    return Array.from(map.values());
  }, [parks, selectedCorp]);

  const wards = React.useMemo(() => {
    const map = new Map();
    parks.forEach(p => {
      const corpId = (p.corporation?._id || p.corporation || '').toString();
      const zoneId = (p.zone?._id || p.zone || '').toString();
      const w = p.ward;
      if (w && (!selectedCorp || corpId === selectedCorp) && (!selectedZone || zoneId === selectedZone)) {
        if (typeof w === 'object' && w._id && !map.has(w._id)) {
          map.set(w._id, w);
        } else if (typeof w === 'string' && !map.has(w)) {
          map.set(w, { _id: w, name: w });
        }
      }
    });
    return Array.from(map.values());
  }, [parks, selectedCorp, selectedZone]);

  const filteredParks = React.useMemo(() => {
    return parks.filter(p => {
      const corpId = (p.corporation?._id || p.corporation || '').toString();
      const zoneId = (p.zone?._id || p.zone || '').toString();
      const wardId = (p.ward?._id || p.ward || '').toString();
      if (selectedCorp && corpId !== selectedCorp) return false;
      if (selectedZone && zoneId !== selectedZone) return false;
      if (selectedWard && wardId !== selectedWard) return false;
      return true;
    });
  }, [parks, selectedCorp, selectedZone, selectedWard]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      const response = await axios.get('/api/events/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchParks = async () => {
    try {
      const res = await axios.get('/api/parks');
      if (Array.isArray(res.data)) {
        setParks(res.data);
      }
    } catch (err) {
      console.error('Error fetching parks list:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchParks();
  }, []);

  // Helper to compute start and end timestamps in client
  const computeClientInterval = (eventDateStr, startTimeStr, endTimeStr) => {
    if (!eventDateStr) return { start: null, end: null };
    const dateObj = new Date(eventDateStr);
    if (isNaN(dateObj.getTime())) return { start: null, end: null };

    const start = new Date(dateObj);
    if (startTimeStr) {
      const [sh, sm] = startTimeStr.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(sm)) {
        start.setHours(sh, sm, 0, 0);
      }
    }

    let end = new Date(dateObj);
    if (endTimeStr) {
      const [eh, em] = endTimeStr.split(':').map(Number);
      if (!isNaN(eh) && !isNaN(em)) {
        end.setHours(eh, em, 0, 0);
      }
    } else {
      end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    }

    if (end.getTime() <= start.getTime()) {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }

    return { start, end };
  };

  // Client-side quick conflict detector as the user inputs park and time
  useEffect(() => {
    if (!formData.eventDate || (!formData.parkId && !formData.parkName && !formData.location)) {
      setConflictWarning('');
      return;
    }

    const { start: targetStart, end: targetEnd } = computeClientInterval(
      formData.eventDate,
      formData.startTime,
      formData.endTime
    );

    if (!targetStart || !targetEnd) {
      setConflictWarning('');
      return;
    }

    const selectedVenue = (formData.parkName || formData.location || '').toLowerCase().trim();
    const selectedParkId = formData.parkId || '';

    const existingConflict = events.find(ev => {
      if (isEditing && ev._id === currentEventId) return false;

      // Check Park ID or Park Name / Venue matching
      const sameParkId = selectedParkId && ev.parkId && String(ev.parkId) === String(selectedParkId);
      const evVenue = (ev.parkName || ev.location || '').toLowerCase().trim();
      const venueMatches = sameParkId || (selectedVenue && evVenue && (evVenue.includes(selectedVenue) || selectedVenue.includes(evVenue)));

      if (!venueMatches) return false;

      const { start: evStart, end: evEnd } = computeClientInterval(ev.eventDate, ev.startTime, ev.endTime);
      if (!evStart || !evEnd) return false;

      // Overlap check: (targetStart < evEnd) && (targetEnd > evStart)
      return (targetStart < evEnd) && (targetEnd > evStart);
    });

    if (existingConflict) {
      setConflictWarning("Event scheduling conflict! Another event is already scheduled in this park during the selected date and time. Please choose a different time or park.");
    } else {
      setConflictWarning('');
    }
  }, [formData.eventDate, formData.startTime, formData.endTime, formData.parkId, formData.parkName, formData.location, events, isEditing, currentEventId]);

  const handleInputChange = (e) => {
    let { name, value, type, checked } = e.target;
    if (name === 'location') {
      value = value.replace(/[^a-zA-Z0-9\s,.-/#]/g, '');
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentEventId(null);
    setConflictWarning('');
    setSelectedCorp('');
    setSelectedZone('');
    setSelectedWard('');
    setFormData({
      title: '',
      description: '',
      eventDate: '',
      startTime: '09:00',
      endTime: '11:00',
      location: '',
      parkId: '',
      parkName: '',
      image: '',
      isActive: true,
      isPaid: false,
      price: 0,
      capacity: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (event) => {
    setIsEditing(true);
    setCurrentEventId(event._id);
    setConflictWarning('');
    const eventParkId = event.parkId?._id || event.parkId || '';
    const targetPark = parks.find(p => p._id === eventParkId || p.name === event.parkName);
    if (targetPark) {
      setSelectedCorp((targetPark.corporation?._id || targetPark.corporation || '').toString());
      setSelectedZone((targetPark.zone?._id || targetPark.zone || '').toString());
      setSelectedWard((targetPark.ward?._id || targetPark.ward || '').toString());
    } else {
      setSelectedCorp('');
      setSelectedZone('');
      setSelectedWard('');
    }
    
    // Format date for datetime-local / date input
    let formattedDate = '';
    let startT = event.startTime || '';
    let endT = event.endTime || '';

    if (event.eventDate) {
      const dateObj = new Date(event.eventDate);
      formattedDate = dateObj.toISOString().slice(0, 10);
      if (!startT) {
        const hh = String(dateObj.getHours()).padStart(2, '0');
        const mm = String(dateObj.getMinutes()).padStart(2, '0');
        startT = `${hh}:${mm}`;
      }
    }

    if (!endT && startT) {
      const [sh, sm] = startT.split(':').map(Number);
      const endH = (sh + 2) % 24;
      endT = `${String(endH).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
    }
    
    setFormData({
      title: event.title || '',
      description: event.description || '',
      eventDate: formattedDate,
      startTime: startT || '09:00',
      endTime: endT || '11:00',
      location: event.location || '',
      parkId: event.parkId?._id || event.parkId || '',
      parkName: event.parkName || '',
      image: event.image || '',
      isActive: event.isActive !== undefined ? event.isActive : true,
      isPaid: event.isPaid || false,
      price: event.price || 0,
      capacity: event.capacity || 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      Swal.fire({ title: 'Validation Error', text: 'Event Title is required', icon: 'warning' });
      return;
    }
    if (!formData.description.trim()) {
      Swal.fire({ title: 'Validation Error', text: 'Description is required', icon: 'warning' });
      return;
    }
    if (!formData.eventDate) {
      Swal.fire({ title: 'Validation Error', text: 'Event Date is required', icon: 'warning' });
      return;
    }
    if (!formData.startTime) {
      Swal.fire({ title: 'Validation Error', text: 'Start Time is required', icon: 'warning' });
      return;
    }
    if (!formData.endTime) {
      Swal.fire({ title: 'Validation Error', text: 'End Time is required', icon: 'warning' });
      return;
    }
    if (formData.isPaid && formData.price < 0) {
      Swal.fire({ title: 'Validation Error', text: 'Price cannot be negative', icon: 'warning' });
      return;
    }
    if (formData.capacity < 0) {
      Swal.fire({ title: 'Validation Error', text: 'Capacity cannot be negative', icon: 'warning' });
      return;
    }

    // Client-side conflict check before sending request
    const { start: targetStart, end: targetEnd } = computeClientInterval(
      formData.eventDate,
      formData.startTime,
      formData.endTime
    );

    const selectedVenue = (formData.parkName || formData.location || '').toLowerCase().trim();
    const selectedParkId = formData.parkId || '';

    const clientConflict = events.find(ev => {
      if (isEditing && ev._id === currentEventId) return false;
      const sameParkId = selectedParkId && ev.parkId && String(ev.parkId) === String(selectedParkId);
      const evVenue = (ev.parkName || ev.location || '').toLowerCase().trim();
      const venueMatches = sameParkId || (selectedVenue && evVenue && (evVenue.includes(selectedVenue) || selectedVenue.includes(evVenue)));
      if (!venueMatches) return false;

      const { start: evStart, end: evEnd } = computeClientInterval(ev.eventDate, ev.startTime, ev.endTime);
      if (!evStart || !evEnd) return false;

      return (targetStart < evEnd) && (targetEnd > evStart);
    });

    if (clientConflict) {
      const conflictMsg = "Event scheduling conflict! Another event is already scheduled in this park during the selected date and time. Please choose a different time or park.";
      setConflictWarning(conflictMsg);
      Swal.fire({
        title: 'Event Scheduling Conflict',
        text: conflictMsg,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    try {
      const token = getAdminToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Ensure combined eventDate and explicit startTime / endTime are passed
      const combinedDate = new Date(formData.eventDate);
      if (formData.startTime) {
        const [sh, sm] = formData.startTime.split(':').map(Number);
        if (!isNaN(sh) && !isNaN(sm)) {
          combinedDate.setHours(sh, sm, 0, 0);
        }
      }

      const payload = {
        ...formData,
        eventDate: combinedDate.toISOString()
      };
      
      if (isEditing) {
        await axios.put(`/api/events/${currentEventId}`, payload, config);
      } else {
        await axios.post('/api/events', payload, config);
      }
      
      setIsModalOpen(false);
      Swal.fire({
        title: 'Success!',
        text: isEditing ? 'Event updated successfully.' : 'Event created successfully.',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false
      });
      fetchEvents();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error saving event';
      setConflictWarning(errorMsg);
      Swal.fire({
        title: 'Event Scheduling Conflict',
        text: errorMsg,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
      // Do NOT close modal so admin retains entered form data
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Event?',
      text: 'Are you sure you want to delete this event? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;

    try {
      const token = getAdminToken();
      await axios.delete(`/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
        title: 'Deleted!',
        text: 'Event has been removed.',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false
      });
      fetchEvents();
    } catch (err) {
      Swal.fire({
        title: 'Error!',
        text: err.response?.data?.message || 'Error deleting event',
        icon: 'error'
      });
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      await axios.put(`/api/events/${id}`, { isActive: !currentStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvents();
    } catch (err) {
      alert('Error updating status');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Manage Events</h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>Create and manage public events</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/admin-dashboard/event-registrations')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', color: '#059669', border: '1px solid #86efac', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Users size={18} /> View All Registrations
          </button>
          <button
            onClick={openAddModal}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <Plus size={18} /> Add Event
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading events...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : events.length === 0 ? (
        <div style={{ background: '#fff', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: '#64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          No events created yet. Click "Add Event" to create one.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {events.map(event => (
            <div key={event._id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
              {event.image ? (
                <img src={event.image} alt={event.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '160px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                  <ImageIcon size={48} />
                </div>
              )}
              
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>{event.title}</h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {event.isPaid ? (
                      <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', background: '#fef08a', color: '#854d0e' }}>
                        ₹{event.price}
                      </span>
                    ) : (
                      <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', background: '#e0e7ff', color: '#4338ca' }}>
                        Free
                      </span>
                    )}
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                      background: event.isActive ? '#dcfce7' : '#f1f5f9',
                      color: event.isActive ? '#16a34a' : '#64748b'
                    }}>
                      {event.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>
                
                <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '1rem', flex: 1 }}>
                  {event.description.length > 100 ? event.description.substring(0, 100) + '...' : event.description}
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    {new Date(event.eventDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    {event.startTime ? ` (${event.startTime} - ${event.endTime || 'End'})` : ` (${new Date(event.eventDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})`}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 600 }}>
                    <MapPin size={14} />
                    {event.parkName || event.location}
                  </div>
                </div>

                {/* Registration stats */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: '#475569' }}>
                    <Users size={13} color="#059669" />
                    <span style={{ fontWeight: 700 }}>{event.confirmedCount || 0}</span> Confirmed
                  </div>
                  {event.isPaid && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: '#475569' }}>
                      <IndianRupee size={13} color="#059669" />
                      ₹<span style={{ fontWeight: 700 }}>{(event.totalRevenue || 0).toLocaleString('en-IN')}</span> Collected
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    onClick={() => navigate(`/admin-dashboard/event-registrations?eventId=${event._id}`)}
                    style={{ width: '100%', background: '#ecfdf5', color: '#047857', border: '1px solid #86efac', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s ease' }}
                  >
                    <Users size={15} /> View Registrations
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => toggleStatus(event._id, event.isActive)}
                      style={{ flex: 1, background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                    >
                      {event.isActive ? 'Hide' : 'Show'}
                    </button>
                    <button 
                      onClick={() => openEditModal(event)}
                      style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                      title="Edit Event"
                    >
                      <Edit size={15} />
                    </button>
                    <button 
                      onClick={() => handleDelete(event._id)}
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                      title="Delete Event"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', color: '#0f172a', padding: '2rem', borderRadius: '14px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.4rem', fontWeight: 800 }}>{isEditing ? 'Edit Event' : 'Create New Event'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {conflictWarning && (
                <div style={{ padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.86rem', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>{conflictWarning}</div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>Event Title *</label>
                <input 
                  type="text" name="title" required
                  value={formData.title} onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '0.92rem', boxSizing: 'border-box' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>Description *</label>
                <textarea 
                  name="description" required rows="4"
                  value={formData.description} onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '0.92rem', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>Event Date *</label>
                  <input 
                    type="date" name="eventDate" required
                    value={formData.eventDate} onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '0.92rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>Start Time *</label>
                  <input 
                    type="time" name="startTime" required
                    value={formData.startTime} onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '0.92rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>End Time *</label>
                  <input 
                    type="time" name="endTime" required
                    value={formData.endTime} onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '0.92rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              
              {/* Corporation, Zone, Ward Cascade Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.84rem', color: '#1e293b' }}>Corporation</label>
                  <select
                    value={selectedCorp}
                    onChange={(e) => {
                      setSelectedCorp(e.target.value);
                      setSelectedZone('');
                      setSelectedWard('');
                    }}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  >
                    <option value="">-- All Corporations --</option>
                    {corporations.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.84rem', color: '#1e293b' }}>Zone</label>
                  <select
                    value={selectedZone}
                    onChange={(e) => {
                      setSelectedZone(e.target.value);
                      setSelectedWard('');
                    }}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  >
                    <option value="">-- All Zones --</option>
                    {zones.map(z => (
                      <option key={z._id} value={z._id}>{z.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.84rem', color: '#1e293b' }}>Ward</label>
                  <select
                    value={selectedWard}
                    onChange={(e) => setSelectedWard(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  >
                    <option value="">-- All Wards --</option>
                    {wards.map(w => (
                      <option key={w._id} value={w._id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>Select Park / Venue *</label>
                <select
                  name="parkId"
                  value={formData.parkId || (formData.parkName === 'custom' ? 'custom' : '')}
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    if (selectedVal === 'custom') {
                      setFormData(prev => ({
                        ...prev,
                        parkId: '',
                        parkName: 'custom'
                      }));
                    } else {
                      const foundPark = parks.find(p => p._id === selectedVal || p.name === selectedVal);
                      if (foundPark) {
                        const corpId = (foundPark.corporation?._id || foundPark.corporation || '').toString();
                        const zoneId = (foundPark.zone?._id || foundPark.zone || '').toString();
                        const wardId = (foundPark.ward?._id || foundPark.ward || '').toString();
                        if (corpId) setSelectedCorp(corpId);
                        if (zoneId) setSelectedZone(zoneId);
                        if (wardId) setSelectedWard(wardId);
                      }
                      setFormData(prev => ({
                        ...prev,
                        parkId: foundPark ? foundPark._id : '',
                        parkName: foundPark ? foundPark.name : '',
                        location: foundPark ? foundPark.name : ''
                      }));
                    }
                  }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '0.92rem', boxSizing: 'border-box' }}
                >
                  <option value="">-- Choose Park from System ({filteredParks.length} available) --</option>
                  {filteredParks.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.ward?.name ? `(Ward: ${p.ward?.name})` : p.zone?.name ? `(Zone: ${p.zone?.name})` : ''}
                    </option>
                  ))}
                  <option value="custom">-- Or enter custom venue name below --</option>
                </select>
                {formData.parkName === 'custom' && (
                  <input 
                    type="text"
                    placeholder="Enter Custom Park or Facility Name"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value, parkName: e.target.value }))}
                    style={{ width: '100%', marginTop: '6px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '0.92rem', boxSizing: 'border-box' }}
                  />
                )}
              </div>
              
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>Image URL</label>
                <input 
                  type="url" name="image" placeholder="https://example.com/image.jpg"
                  value={formData.image} onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '0.92rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>Maximum Capacity (0 for unlimited)</label>
                <input 
                  type="number" name="capacity" min="0"
                  value={formData.capacity} onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '0.92rem', boxSizing: 'border-box' }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.25rem' }}>
                <input 
                  type="checkbox" name="isPaid" id="isPaid"
                  checked={formData.isPaid} onChange={handleInputChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="isPaid" style={{ fontWeight: 700, color: '#1e293b', cursor: 'pointer', fontSize: '0.9rem' }}>This is a paid event</label>
              </div>

              {formData.isPaid && (
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>Ticket Price (₹) *</label>
                  <input 
                    type="number" name="price" min="0" required
                    value={formData.price} onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontSize: '0.92rem', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.25rem' }}>
                <input 
                  type="checkbox" name="isActive" id="isActive"
                  checked={formData.isActive} onChange={handleInputChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="isActive" style={{ fontWeight: 700, color: '#1e293b', cursor: 'pointer', fontSize: '0.9rem' }}>Publish this event immediately</label>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 1, padding: '12px', background: '#2563eb', border: 'none', borderRadius: '8px', fontWeight: 800, color: '#ffffff', cursor: 'pointer' }}>
                  {isEditing ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
