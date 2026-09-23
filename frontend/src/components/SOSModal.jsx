import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AlertOctagon, 
  MapPin, 
  Phone, 
  User, 
  Heart, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Navigation, 
  Radio, 
  PhoneCall,
  Clock,
  Send,
  ShieldCheck
} from 'lucide-react';
import { getLiveGeoLocation, reverseGeocodeDetails } from '../utils/imageStampUtil';
import './SOSModal.css';

export default function SOSModal({ isOpen, onClose, initialParkId = null }) {
  const [step, setStep] = useState('direct'); // 'direct' | 'success'
  const [emergencyType, setEmergencyType] = useState('Medical Emergency');
  const [parks, setParks] = useState([]);
  const [selectedParkId, setSelectedParkId] = useState(initialParkId || '');
  const [selectedPark, setSelectedPark] = useState(null);
  
  // Citizen Contact (Auto-populated)
  const [citizenName, setCitizenName] = useState('Citizen Visitor');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [citizenEmail, setCitizenEmail] = useState('');
  const [citizenId, setCitizenId] = useState('');

  // Location (Auto-captured live GPS)
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [address, setAddress] = useState('Detecting live GPS location...');
  const [landmarkDescription, setLandmarkDescription] = useState('');
  const [locLoading, setLocLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submittedEmergency, setSubmittedEmergency] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Load user info from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u) {
          if (u.name) setCitizenName(u.name);
          if (u.phone) setCitizenPhone(u.phone);
          if (u.email) setCitizenEmail(u.email);
          if (u._id || u.id) setCitizenId(u._id || u.id);
        }
      }
    } catch (e) {}
  }, []);

  // Fetch parks list & live GPS
  useEffect(() => {
    const fetchParks = async () => {
      try {
        const res = await axios.get('/api/parks');
        if (Array.isArray(res.data)) {
          setParks(res.data);
          if (initialParkId) {
            setSelectedParkId(initialParkId);
            const found = res.data.find(p => p._id === initialParkId);
            if (found) setSelectedPark(found);
          } else if (res.data.length > 0 && !selectedParkId) {
            setSelectedParkId(res.data[0]._id);
            setSelectedPark(res.data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load parks', err);
      }
    };
    if (isOpen) {
      fetchParks();
      fetchCurrentGPS();
    }
  }, [isOpen, initialParkId]);

  const handleParkChange = (e) => {
    const pId = e.target.value;
    setSelectedParkId(pId);
    const p = parks.find(park => park._id === pId);
    setSelectedPark(p);
  };

  const fetchCurrentGPS = async () => {
    setLocLoading(true);
    try {
      const geo = await getLiveGeoLocation();
      if (geo && geo.latitude && geo.longitude) {
        setLatitude(geo.latitude);
        setLongitude(geo.longitude);
        const details = await reverseGeocodeDetails(geo.latitude, geo.longitude);
        if (details && details.fullAddress) {
          setAddress(details.fullAddress);
        }
      }
    } catch (err) {
      console.warn('GPS capture in SOS modal:', err);
    } finally {
      setLocLoading(false);
    }
  };

  // Immediate Direct Send Action
  const handleDirectSendSOS = async (e) => {
    if (e) e.preventDefault();
    if (!citizenName.trim()) {
      setErrorMsg('Please enter your name or contact number.');
      return;
    }
    if (!selectedParkId && parks.length > 0) {
      setSelectedParkId(parks[0]._id);
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const targetPark = selectedPark || parks.find(p => p._id === selectedParkId) || parks[0];
      const pId = selectedParkId || (targetPark ? targetPark._id : null);

      const payload = {
        citizenId: citizenId || undefined,
        citizenName: citizenName.trim() || 'Citizen in Park',
        citizenPhone: citizenPhone.trim() || 'Not Provided',
        citizenEmail: citizenEmail.trim() || undefined,
        emergencyType: emergencyType || 'Medical Emergency',
        parkId: pId,
        latitude,
        longitude,
        address: address || targetPark?.address || 'Park Premises',
        landmarkDescription: landmarkDescription.trim() || 'Inside Park Premises',
        description: 'Urgent Medical Emergency reported by visitor.'
      };

      const res = await axios.post('/api/emergencies', payload);
      if (res.data && res.data.emergency) {
        setSubmittedEmergency(res.data.emergency);
        setStep('success');
      }
    } catch (err) {
      console.error('Error directly submitting SOS:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to send SOS. Please call 112 / 108 directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setStep('direct');
    setErrorMsg('');
    setSubmittedEmergency(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="sos-modal-overlay" onClick={handleResetAndClose} role="dialog" aria-modal="true">
      <div className="sos-modal-card direct-mode" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sos-modal-header">
          <div className="sos-header-title">
            <div className="sos-pulsing-icon">
              <AlertOctagon size={26} color="#ffffff" />
            </div>
            <div>
              <h3>🚨 SOS / Medical Emergency</h3>
              <p>Direct Alert with Siren to Park Gardener & Staff</p>
            </div>
          </div>
          <button className="sos-btn-close" onClick={handleResetAndClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="sos-modal-body">
          {errorMsg && (
            <div className="sos-error-alert">
              <AlertTriangle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Direct 112 / 108 Emergency Contacts Bar */}
          <div className="sos-direct-dial-bar">
            <div className="direct-dial-text">
              <span className="live-pulse-dot"></span>
              <strong>Life-threatening emergency?</strong> Direct dial lines:
            </div>
            <div className="direct-dial-actions">
              <a href="tel:112" className="btn-dial-quick" title="National Emergency Helpline">
                <PhoneCall size={14} /> Call 112
              </a>
              <a href="tel:108" className="btn-dial-quick ambulance" title="Ambulance Emergency">
                <Heart size={14} /> Call 108
              </a>
            </div>
          </div>

          {step === 'direct' && (
            <form onSubmit={handleDirectSendSOS} className="sos-form direct-flow">
              
              {/* Emergency Highlight */}
              <div className="direct-emergency-tag">
                <Activity size={18} color="#ef4444" />
                <span>Situation: <strong>{emergencyType}</strong></span>
              </div>

              {/* Park Selector */}
              <div className="sos-form-section compact">
                <label className="sos-label" htmlFor="sos-park-select">
                  <MapPin size={15} className="text-red" /> Park Location *
                </label>
                <select 
                  id="sos-park-select"
                  className="sos-select-input"
                  value={selectedParkId}
                  onChange={handleParkChange}
                  required
                >
                  {parks.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.district?.name ? `(${p.district.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Live GPS Coordinates Card */}
              <div className="sos-form-section compact">
                <div className="sos-gps-header">
                  <label className="sos-label">
                    <Navigation size={15} className="text-red" /> Live GPS Coordinates
                  </label>
                  <button 
                    type="button" 
                    className="btn-gps-refresh" 
                    onClick={fetchCurrentGPS} 
                    disabled={locLoading}
                  >
                    <Radio size={12} /> {locLoading ? 'Locating...' : 'Refresh GPS'}
                  </button>
                </div>

                <div className="sos-gps-card">
                  <div className="coords-row">
                    <span className="coords-badge">Lat: {latitude.toFixed(6)}°</span>
                    <span className="coords-badge">Long: {longitude.toFixed(6)}°</span>
                  </div>
                  <p className="sos-loc-address">{address}</p>
                </div>

                <input 
                  type="text"
                  className="sos-text-input mt-2"
                  placeholder="Exact spot in park (e.g. Near Main Gate, Bench, Children Area)..."
                  value={landmarkDescription}
                  onChange={(e) => setLandmarkDescription(e.target.value)}
                />
              </div>

              {/* Citizen Contact Details */}
              <div className="sos-form-section compact">
                <label className="sos-label">
                  <User size={15} className="text-red" /> Caller / Citizen Details
                </label>
                <div className="sos-contact-grid">
                  <div>
                    <input 
                      type="text" 
                      className="sos-text-input" 
                      placeholder="Your Full Name" 
                      value={citizenName} 
                      onChange={(e) => setCitizenName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))} 
                      required 
                    />
                  </div>
                  <div>
                    <input 
                      type="tel" 
                      className="sos-text-input" 
                      placeholder="Phone Number for Gardener / Staff to Call" 
                      value={citizenPhone} 
                      maxLength="10"
                      onChange={(e) => setCitizenPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Instant Big Action Button */}
              <div className="direct-action-footer">
                <button 
                  type="submit" 
                  className="btn-direct-emergency-send"
                  disabled={submitting}
                >
                  <div className="btn-send-inner">
                    <span className="btn-send-title">
                      {submitting ? '🚨 BROADCASTING ALERT WITH SIREN...' : '🚨 SEND MEDICAL EMERGENCY ALERT NOW'}
                    </span>
                    <span className="btn-send-subtitle">
                      Transmits live location & alert sound directly to the assigned Park Gardener & Staff
                    </span>
                  </div>
                </button>
              </div>
            </form>
          )}

          {step === 'success' && submittedEmergency && (
            <div className="sos-success-step">
              <div className="success-icon-box">
                <CheckCircle2 size={54} color="#10b981" />
              </div>
              <h4 className="success-title">Emergency Alert Broadcasted!</h4>
              <p className="success-subtitle">
                Your emergency notification with live park coordinates has been sent with alert sound directly to the <strong>Park Gardener and on-site staff at {submittedEmergency.parkName}</strong>.
              </p>

              <div className="success-details-card">
                <div className="success-id-badge">
                  <span>Emergency Ticket ID:</span>
                  <strong>{submittedEmergency.emergencyId}</strong>
                </div>

                <div className="success-grid">
                  <div className="success-field">
                    <span className="field-name">Emergency:</span>
                    <span className="field-value text-red font-bold">{submittedEmergency.emergencyType}</span>
                  </div>
                  <div className="success-field">
                    <span className="field-name">Status:</span>
                    <span className="status-badge-live">🚨 {submittedEmergency.status}</span>
                  </div>
                  <div className="success-field">
                    <span className="field-name">Park:</span>
                    <span className="field-value">{submittedEmergency.parkName}</span>
                  </div>
                  <div className="success-field">
                    <span className="field-name">Reported:</span>
                    <span className="field-value">
                      <Clock size={13} /> {new Date(submittedEmergency.reportedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                  <div className="success-field col-span-2">
                    <span className="field-name">Live GPS Location:</span>
                    <span className="field-value">{submittedEmergency.landmarkDescription || submittedEmergency.address} ({submittedEmergency.latitude.toFixed(5)}°, {submittedEmergency.longitude.toFixed(5)}°)</span>
                  </div>
                </div>
              </div>

              <div className="sos-modal-footer">
                <button 
                  type="button" 
                  className="btn-sos-done" 
                  onClick={handleResetAndClose}
                >
                  Close Window
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
