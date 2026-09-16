import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  AlertOctagon, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle2, 
  ArrowLeft, 
  RefreshCw, 
  ShieldCheck, 
  Activity,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import './EmergencyHistory.css';

const STATUS_STEPS = [
  'Emergency Reported',
  'Acknowledged',
  'Assistance in Progress',
  'Resolved'
];

export default function EmergencyHistory() {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmergency, setSelectedEmergency] = useState(null);

  const fetchMyEmergencies = async () => {
    setLoading(true);
    try {
      let userId = '';
      let phone = '';
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        userId = u._id || u.id || '';
        phone = u.phone || '';
      }

      const res = await axios.get(`/api/emergencies/my?userId=${userId}&phone=${phone}`);
      if (res.data && Array.isArray(res.data.emergencies)) {
        setEmergencies(res.data.emergencies);
        if (res.data.emergencies.length > 0 && !selectedEmergency) {
          setSelectedEmergency(res.data.emergencies[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load emergency history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEmergencies();
    // Auto-refresh every 10 seconds to show real-time responder updates
    const interval = setInterval(fetchMyEmergencies, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusStepIndex = (status) => {
    if (status === 'Closed' || status === 'Resolved') return 3;
    if (status === 'Assistance in Progress') return 2;
    if (status === 'Acknowledged') return 1;
    return 0;
  };

  return (
    <div className="emerg-history-page">
      <div className="emerg-history-container">
        
        {/* Top Header */}
        <div className="emerg-header-bar">
          <div className="header-left">
            <Link to="/emergency-sos" className="btn-back-sos">
              <ArrowLeft size={16} /> SOS Button
            </Link>
            <h2>🚨 My Emergency SOS History</h2>
          </div>
          <button className="btn-refresh-history" onClick={fetchMyEmergencies} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spinning' : ''} /> Refresh Status
          </button>
        </div>

        {/* Content Area */}
        {loading && emergencies.length === 0 ? (
          <div className="emerg-loading-state">
            <div className="spinner-emerg"></div>
            <p>Checking active emergency assistance requests...</p>
          </div>
        ) : emergencies.length === 0 ? (
          <div className="emerg-empty-state">
            <AlertOctagon size={48} color="#94a3b8" />
            <h3>No Emergency Requests Found</h3>
            <p>You have not triggered any Emergency SOS alerts yet.</p>
            <Link to="/emergency-sos" className="btn-trigger-now">
              Open SOS Emergency Panel
            </Link>
          </div>
        ) : (
          <div className="emerg-split-layout">
            
            {/* Left List */}
            <div className="emerg-list-col">
              <span className="list-title">Your SOS Records ({emergencies.length})</span>
              {emergencies.map((item) => {
                const isSelected = selectedEmergency?._id === item._id;
                const isResolved = item.status === 'Resolved' || item.status === 'Closed';
                return (
                  <div
                    key={item._id}
                    className={`emerg-list-card ${isSelected ? 'active' : ''} ${isResolved ? 'resolved' : 'active-sos'}`}
                    onClick={() => setSelectedEmergency(item)}
                  >
                    <div className="card-top-row">
                      <span className="card-type-tag">{item.emergencyType}</span>
                      <span className={`card-status-badge ${item.status.replace(/\s+/g, '-').toLowerCase()}`}>
                        {item.status}
                      </span>
                    </div>

                    <h4 className="card-park-name">{item.parkName || item.park?.name || 'Park Premises'}</h4>
                    
                    <div className="card-bottom-row">
                      <span className="card-ticket-id">{item.emergencyId}</span>
                      <span className="card-time">
                        <Clock size={12} /> {new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Details Panel */}
            {selectedEmergency && (
              <div className="emerg-details-col">
                
                {/* Status Stepper Card */}
                <div className="detail-stepper-card">
                  <div className="stepper-header">
                    <div>
                      <span className="stepper-ticket">{selectedEmergency.emergencyId}</span>
                      <h3 className="stepper-title">{selectedEmergency.emergencyType}</h3>
                    </div>
                    <span className={`status-pill ${selectedEmergency.status.replace(/\s+/g, '-').toLowerCase()}`}>
                      {selectedEmergency.status}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="stepper-progress-bar">
                    {STATUS_STEPS.map((stepName, idx) => {
                      const currentIdx = getStatusStepIndex(selectedEmergency.status);
                      const isDone = idx <= currentIdx;
                      return (
                        <div key={stepName} className={`step-node ${isDone ? 'completed' : ''}`}>
                          <div className="step-circle">
                            {idx < currentIdx ? '✓' : idx + 1}
                          </div>
                          <span className="step-label">{stepName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Information Card */}
                <div className="detail-info-card">
                  <h4 className="info-card-title">Emergency Response Information</h4>

                  <div className="info-grid-2">
                    <div className="info-item">
                      <span className="info-label"><MapPin size={14} /> Park Location:</span>
                      <strong className="info-val">{selectedEmergency.parkName || selectedEmergency.park?.name}</strong>
                    </div>

                    <div className="info-item">
                      <span className="info-label"><Clock size={14} /> Reported Time:</span>
                      <strong className="info-val">
                        {new Date(selectedEmergency.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </strong>
                    </div>

                    <div className="info-item col-2">
                      <span className="info-label">Live GPS Coordinates & Spot:</span>
                      <strong className="info-val text-blue">
                        {selectedEmergency.landmarkDescription || selectedEmergency.address} ({selectedEmergency.latitude}°, {selectedEmergency.longitude}°)
                      </strong>
                    </div>

                    <div className="info-item">
                      <span className="info-label"><User size={14} /> Contact Person:</span>
                      <strong className="info-val">{selectedEmergency.citizenName} ({selectedEmergency.citizenPhone})</strong>
                    </div>

                    <div className="info-item">
                      <span className="info-label"><ShieldCheck size={14} /> Security Staff Responding:</span>
                      <strong className="info-val">
                        {selectedEmergency.assignedSecurityStaff && selectedEmergency.assignedSecurityStaff.length > 0 
                          ? selectedEmergency.assignedSecurityStaff.map(s => s.name || 'Assigned Security Staff').join(', ')
                          : 'On-Site Security Staff Alerted'}
                      </strong>
                    </div>
                  </div>

                  {/* Resolution Notes if Resolved */}
                  {selectedEmergency.resolutionNotes && (
                    <div className="resolution-notes-box">
                      <strong>Resolution Notes:</strong>
                      <p>{selectedEmergency.resolutionNotes}</p>
                    </div>
                  )}

                  {/* Action Helpline */}
                  <div className="emergency-call-helpline-box">
                    <div className="helpline-msg">
                      <AlertTriangle size={18} color="#ef4444" />
                      <span>Need immediate external ambulance backup?</span>
                    </div>
                    <div className="helpline-btns">
                      <a href="tel:112" className="btn-direct-call">Call 112 (National)</a>
                      <a href="tel:108" className="btn-direct-call green">Call 108 (Ambulance)</a>
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
