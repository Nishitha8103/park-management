import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  AlertOctagon, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  ExternalLink, 
  AlertTriangle, 
  PhoneCall, 
  Navigation, 
  ShieldAlert, 
  ShieldCheck, 
  Send,
  Heart,
  Activity,
  Check,
  Search
} from 'lucide-react';
import { playEmergencySiren, stopEmergencySiren } from '../utils/emergencySoundUtil';
import './GovEmergencyDashboard.css';

export default function GovEmergencyDashboard() {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  
  // Note & Resolution Modals
  const [noteText, setNoteText] = useState('');
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Stop any active sound on unmount
  useEffect(() => {
    return () => {
      stopEmergencySiren();
    };
  }, []);

  const fetchEmergencies = async () => {
    try {
      let officialId = '';
      const stored = localStorage.getItem('govUser');
      if (stored) {
        const u = JSON.parse(stored);
        officialId = u._id || u.id || '';
      }

      const res = await axios.get(`/api/emergencies/official?officialId=${officialId}`);
      if (res.data && Array.isArray(res.data.emergencies)) {
        const list = res.data.emergencies;
        setEmergencies(list);
        
        if (!selectedEmergency && list.length > 0) {
          setSelectedEmergency(list[0]);
        } else if (selectedEmergency) {
          const updatedSelected = list.find(e => e._id === selectedEmergency._id);
          if (updatedSelected) setSelectedEmergency(updatedSelected);
        }
      }
    } catch (err) {
      console.error('Error fetching official emergencies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
    const interval = setInterval(fetchEmergencies, 5000); // 5 sec live polling
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const handleUpdateStatus = async (emergencyId, newStatus, customNotes = '') => {
    setActionLoading(true);
    try {
      let responderName = 'Government Official / Staff';
      let responderRole = 'Official';
      let responderId = '';
      const stored = localStorage.getItem('govUser');
      if (stored) {
        const u = JSON.parse(stored);
        responderName = u.name || 'Official Responder';
        responderRole = u.role || 'Government Official';
        responderId = u._id || u.id || '';
      }

      const res = await axios.put(`/api/emergencies/${emergencyId}/status`, {
        status: newStatus,
        updatedByName: responderName,
        updatedByRole: responderRole,
        updatedById: responderId,
        note: customNotes,
        resolutionNotes: newStatus === 'Resolved' ? customNotes : undefined
      });

      if (res.data && res.data.emergency) {
        // Refresh local list
        setEmergencies(prev => prev.map(e => e._id === emergencyId ? res.data.emergency : e));
        if (selectedEmergency?._id === emergencyId) {
          setSelectedEmergency(res.data.emergency);
        }
      }
      setResolvingId(null);
      setResolutionNotes('');
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err.response?.data?.message || 'Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddNote = async (emergencyId) => {
    if (!noteText.trim()) return;
    await handleUpdateStatus(emergencyId, selectedEmergency.status, noteText.trim());
    setNoteText('');
  };

  const filteredEmergencies = emergencies.filter(e => {
    const matchStatus = statusFilter === 'All' ? true : e.status === statusFilter;
    const matchSearch = searchQuery === '' ? true : (
      e.emergencyId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.citizenName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.parkName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.emergencyType?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchStatus && matchSearch;
  });

  const activeCount = emergencies.filter(e => ['Emergency Reported', 'Acknowledged', 'Assistance in Progress'].includes(e.status)).length;
  const criticalNewCount = emergencies.filter(e => e.status === 'Emergency Reported').length;

  return (
    <div className="gov-emerg-dashboard">
      
      {/* Top Banner Alert Bar */}
      <div className="gov-emerg-topbar">
        <div className="topbar-info">
          <div className="pulse-siren-box">
            <AlertOctagon size={24} color="#ffffff" />
          </div>
          <div>
            <h2>🚨 Park Security & Emergency Response Console</h2>
            <p>Live alert stream with siren sound for on-site park security staff and government officials</p>
          </div>
        </div>

        <div className="topbar-actions">
          <button 
            className={`btn-sound-toggle ${soundEnabled ? 'active' : 'muted'}`}
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (!next) {
                stopEmergencySiren();
              }
            }}
            title={soundEnabled ? 'Siren Sound Alert Enabled (Click to Mute)' : 'Siren Sound Muted (Click to Enable)'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? 'Siren Sound ON' : 'Siren Sound Muted'}</span>
          </button>

          <button className="btn-refresh-sos" onClick={fetchEmergencies} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spinning' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Quick KPI Bar */}
      <div className="emerg-kpi-row">
        <div className={`kpi-card ${criticalNewCount > 0 ? 'critical-pulse' : ''}`}>
          <div className="kpi-icon red"><ShieldAlert size={20} /></div>
          <div>
            <span className="kpi-num">{criticalNewCount}</span>
            <span className="kpi-lbl">New Unacknowledged SOS</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon orange"><Activity size={20} /></div>
          <div>
            <span className="kpi-num">{activeCount}</span>
            <span className="kpi-lbl">Active Park Emergencies</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon green"><CheckCircle2 size={20} /></div>
          <div>
            <span className="kpi-num">{emergencies.filter(e => e.status === 'Resolved').length}</span>
            <span className="kpi-lbl">Resolved Cases</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="emerg-filter-bar">
        <div className="search-box">
          <Search size={16} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Search by ticket ID, citizen name, park, emergency type..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          {['All', 'Emergency Reported', 'Acknowledged', 'Assistance in Progress', 'Resolved'].map(st => (
            <button
              key={st}
              className={`filter-pill ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st} {st !== 'All' && `(${emergencies.filter(e => e.status === st).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="emerg-main-split">
        
        {/* Left Column: Live Emergency Feed Cards */}
        <div className="emerg-feed-col">
          {loading && emergencies.length === 0 ? (
            <div className="feed-loading-box">
              <RefreshCw size={24} className="spinning" />
              <p>Listening for live emergency alerts...</p>
            </div>
          ) : filteredEmergencies.length === 0 ? (
            <div className="feed-empty-box">
              <ShieldCheck size={36} color="#10b981" />
              <h4>No Active Emergencies in Selected Filter</h4>
              <p>Park premises are currently clear and operational.</p>
            </div>
          ) : (
            filteredEmergencies.map((em) => {
              const isSelected = selectedEmergency?._id === em._id;
              const isCritical = em.status === 'Emergency Reported';
              return (
                <div
                  key={em._id}
                  className={`feed-card ${isSelected ? 'selected' : ''} ${isCritical ? 'critical-glow' : ''}`}
                  onClick={() => setSelectedEmergency(em)}
                >
                  <div className="feed-card-header">
                    <span className="feed-ticket-id">{em.emergencyId}</span>
                    <span className={`feed-status-badge ${em.status.replace(/\s+/g, '-').toLowerCase()}`}>
                      {isCritical ? '🚨 ' : ''}{em.status}
                    </span>
                  </div>

                  <h3 className="feed-type-title">{em.emergencyType}</h3>
                  <div className="feed-park-name">
                    <MapPin size={14} color="#ef4444" />
                    <strong>{em.parkName || em.park?.name}</strong>
                  </div>

                  <div className="feed-caller-row">
                    <div className="caller-info">
                      <User size={13} /> {em.citizenName}
                    </div>
                    <a 
                      href={`tel:${em.citizenPhone}`} 
                      className="btn-call-mini" 
                      onClick={(e) => e.stopPropagation()}
                      title="Call Citizen Directly"
                    >
                      <PhoneCall size={12} /> {em.citizenPhone}
                    </a>
                  </div>

                  <div className="feed-time-row">
                    <Clock size={12} /> Reported {new Date(em.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Emergency Action Console */}
        {selectedEmergency && (
          <div className="emerg-action-col">
            
            {/* Action Banner */}
            <div className={`action-header-banner ${selectedEmergency.status === 'Emergency Reported' ? 'critical' : ''}`}>
              <div className="banner-left">
                <span className="banner-id">{selectedEmergency.emergencyId}</span>
                <h2 className="banner-title">{selectedEmergency.emergencyType}</h2>
                <div className="banner-park">
                  <MapPin size={16} /> {selectedEmergency.parkName || selectedEmergency.park?.name}
                </div>
              </div>

              <div className="banner-right">
                <a href={`tel:${selectedEmergency.citizenPhone}`} className="btn-call-citizen-large">
                  <PhoneCall size={18} /> Call Citizen ({selectedEmergency.citizenPhone})
                </a>
              </div>
            </div>

            {/* Quick Action Progression Buttons */}
            <div className="action-workflow-bar">
              <span className="workflow-title">Responder Actions:</span>
              
              {selectedEmergency.status === 'Emergency Reported' && (
                <button
                  className="btn-action-step acknowledge"
                  onClick={() => handleUpdateStatus(selectedEmergency._id, 'Acknowledged', 'Security staff acknowledged SOS alert and dispatched on-site patrol.')}
                  disabled={actionLoading}
                >
                  <Check size={16} /> Acknowledge Emergency SOS 🟡
                </button>
              )}

              {selectedEmergency.status === 'Acknowledged' && (
                <button
                  className="btn-action-step progress"
                  onClick={() => handleUpdateStatus(selectedEmergency._id, 'Assistance in Progress', 'Security personnel arrived on-site and assisting the citizen.')}
                  disabled={actionLoading}
                >
                  <Navigation size={16} /> Mark Assistance in Progress 🔵
                </button>
              )}

              {['Emergency Reported', 'Acknowledged', 'Assistance in Progress'].includes(selectedEmergency.status) && (
                <button
                  className="btn-action-step resolve"
                  onClick={() => setResolvingId(selectedEmergency._id)}
                  disabled={actionLoading}
                >
                  <CheckCircle2 size={16} /> Resolve Emergency 🟢
                </button>
              )}

              {selectedEmergency.status === 'Resolved' && (
                <button
                  className="btn-action-step close"
                  onClick={() => handleUpdateStatus(selectedEmergency._id, 'Closed', 'Emergency case closed after complete verification.')}
                  disabled={actionLoading}
                >
                  Close Case Ticket ⚪
                </button>
              )}
            </div>

            {/* Live GPS Coordinates & Location Details Card */}
            <div className="action-info-box">
              <h4 className="box-title">
                <Navigation size={16} color="#3b82f6" /> Live GPS Location in Park
              </h4>

              <div className="gps-live-row">
                <div className="gps-coords-display">
                  <span className="chip-coord">Lat: {selectedEmergency.latitude.toFixed(6)}°</span>
                  <span className="chip-coord">Long: {selectedEmergency.longitude.toFixed(6)}°</span>
                  <span className="coord-address">{selectedEmergency.address}</span>
                </div>
                
                <a
                  href={`https://www.google.com/maps?q=${selectedEmergency.latitude},${selectedEmergency.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-open-google-maps"
                >
                  <ExternalLink size={14} /> Open in Google Maps
                </a>
              </div>

              {selectedEmergency.landmarkDescription && (
                <div className="landmark-alert-box">
                  <strong>Specific Spot in Park:</strong>
                  <p>{selectedEmergency.landmarkDescription}</p>
                </div>
              )}

              {selectedEmergency.description && (
                <div className="description-alert-box">
                  <strong>Caller Situation Description:</strong>
                  <p>{selectedEmergency.description}</p>
                </div>
              )}
            </div>

            {/* Caller Information & Assigned Staff */}
            <div className="info-dual-grid">
              <div className="dual-card">
                <h4 className="box-title"><User size={15} /> Citizen / Caller Information</h4>
                <div className="dual-item">
                  <span className="label">Name:</span>
                  <strong>{selectedEmergency.citizenName}</strong>
                </div>
                <div className="dual-item">
                  <span className="label">Phone:</span>
                  <strong>{selectedEmergency.citizenPhone}</strong>
                </div>
                {selectedEmergency.citizenEmail && (
                  <div className="dual-item">
                    <span className="label">Email:</span>
                    <span>{selectedEmergency.citizenEmail}</span>
                  </div>
                )}
              </div>

              <div className="dual-card">
                <h4 className="box-title"><ShieldCheck size={15} /> Assigned Security / Park Staff</h4>
                <div className="dual-item">
                  <span className="label">Security Staff:</span>
                  <strong>
                    {selectedEmergency.assignedSecurityStaff && selectedEmergency.assignedSecurityStaff.length > 0
                      ? selectedEmergency.assignedSecurityStaff.map(s => s.name || s).join(', ')
                      : 'Assigned Park Patrol Team'}
                  </strong>
                </div>
                <div className="dual-item">
                  <span className="label">Govt Official:</span>
                  <strong>{selectedEmergency.assignedOfficial?.name || 'Assigned Ward Officer'}</strong>
                </div>
              </div>
            </div>

            {/* Resolution Form Modal / Box */}
            {resolvingId && (
              <div className="resolution-form-modal">
                <h4>Resolve Emergency Ticket #{selectedEmergency.emergencyId}</h4>
                <p>Provide a summary of the assistance given, first aid applied, or medical transfer details:</p>
                <textarea
                  className="field-textarea"
                  rows={3}
                  placeholder="e.g. First aid administered for deep cut. Patient stabilized and escorted safely to clinic..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
                <div className="modal-btn-row">
                  <button className="btn-cancel" onClick={() => setResolvingId(null)}>Cancel</button>
                  <button 
                    className="btn-confirm-resolve"
                    onClick={() => handleUpdateStatus(selectedEmergency._id, 'Resolved', resolutionNotes)}
                    disabled={!resolutionNotes.trim() || actionLoading}
                  >
                    Confirm Emergency Resolved
                  </button>
                </div>
              </div>
            )}

            {/* Timeline & Response Notes Log */}
            <div className="action-notes-box">
              <h4 className="box-title"><Clock size={15} /> Incident Response History & Audit Trail</h4>
              
              <div className="timeline-trail">
                {selectedEmergency.statusHistory?.map((hist, idx) => (
                  <div key={idx} className="trail-item">
                    <div className="trail-dot"></div>
                    <div className="trail-body">
                      <div className="trail-head">
                        <strong>{hist.status}</strong>
                        <span>{new Date(hist.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                      </div>
                      <p className="trail-by">By: {hist.updatedBy}</p>
                      {hist.notes && <p className="trail-notes">{hist.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Responder Note */}
              <div className="add-note-row">
                <input
                  type="text"
                  placeholder="Add quick operational log note (e.g. First aid team arrived on site)..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(selectedEmergency._id); }}
                />
                <button 
                  className="btn-send-note" 
                  onClick={() => handleAddNote(selectedEmergency._id)}
                  disabled={!noteText.trim()}
                >
                  <Send size={15} /> Log Note
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
