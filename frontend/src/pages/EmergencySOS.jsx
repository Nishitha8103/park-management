import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  AlertOctagon, 
  MapPin, 
  Phone, 
  User, 
  Heart, 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  X, 
  Navigation, 
  Radio, 
  PhoneCall,
  Clock,
  ArrowLeft,
  Info,
  ShieldCheck,
  History
} from 'lucide-react';
import { getLiveGeoLocation, reverseGeocodeDetails } from '../utils/imageStampUtil';
import './EmergencySOS.css';

const EMERGENCY_TYPES = [
  { id: 'Medical Emergency', label: 'Medical Emergency', desc: 'Heart attack, chest pain, breathing difficulty', icon: Heart, color: '#ef4444' },
  { id: 'Unconscious / Fainted Person', label: 'Unconscious / Fainted Person', desc: 'Person passed out, unresponsive', icon: Activity, color: '#dc2626' },
  { id: 'Serious Injury', label: 'Serious Injury', desc: 'Deep cuts, falls, blunt trauma', icon: AlertTriangle, color: '#ea580c' },
  { id: 'Fracture / Broken Bone', label: 'Fracture / Broken Bone', desc: 'Broken hand, leg, severe dislocation', icon: AlertOctagon, color: '#d97706' },
  { id: 'Severe Bleeding', label: 'Severe Bleeding', desc: 'Heavy blood loss requiring immediate tourniquet', icon: AlertOctagon, color: '#b91c1c' },
  { id: 'Accident', label: 'Accident', desc: 'Collision, equipment collapse, playground accident', icon: ShieldAlert, color: '#c026d3' },
  { id: 'Other Emergency', label: 'Other Emergency', desc: 'Immediate security threat, animal attack, etc.', icon: AlertTriangle, color: '#e11d48' }
];

export default function EmergencySOS() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // 'form' | 'confirm' | 'success'
  const [emergencyType, setEmergencyType] = useState('Medical Emergency');
  const [parks, setParks] = useState([]);
  const [selectedParkId, setSelectedParkId] = useState('');
  const [selectedPark, setSelectedPark] = useState(null);
  
  // Citizen Contact
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [citizenEmail, setCitizenEmail] = useState('');
  const [citizenId, setCitizenId] = useState('');

  // Location (Auto-detected live GPS)
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [address, setAddress] = useState('Detecting live GPS location...');
  const [landmarkDescription, setLandmarkDescription] = useState('');
  const [description, setDescription] = useState('');
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
          setCitizenName(u.name || '');
          setCitizenPhone(u.phone || '');
          setCitizenEmail(u.email || '');
          setCitizenId(u._id || u.id || '');
        }
      }
    } catch (e) {}
  }, []);

  // Fetch parks list & live GPS on mount
  useEffect(() => {
    const fetchParks = async () => {
      try {
        const res = await axios.get('/api/parks');
        if (Array.isArray(res.data)) {
          setParks(res.data);
          if (res.data.length > 0 && !selectedParkId) {
            setSelectedParkId(res.data[0]._id);
            setSelectedPark(res.data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load parks', err);
      }
    };
    fetchParks();
    fetchCurrentGPS();
  }, []);

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
      console.warn('GPS capture error:', err);
    } finally {
      setLocLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!citizenName.trim()) {
      setErrorMsg('Please enter your Name.');
      return;
    }
    if (!citizenPhone.trim()) {
      setErrorMsg('Please enter a reachable contact Phone Number.');
      return;
    }
    if (!selectedParkId) {
      setErrorMsg('Please select the Park where emergency occurred.');
      return;
    }
    setErrorMsg('');
    setStep('confirm');
  };

  const handleConfirmSendSOS = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        citizenId: citizenId || undefined,
        citizenName: citizenName.trim(),
        citizenPhone: citizenPhone.trim(),
        citizenEmail: citizenEmail.trim() || undefined,
        emergencyType,
        parkId: selectedParkId,
        latitude,
        longitude,
        address: address || selectedPark?.address || 'Park Premises',
        landmarkDescription: landmarkDescription.trim(),
        description: description.trim()
      };

      const res = await axios.post('/api/emergencies', payload);
      if (res.data && res.data.emergency) {
        setSubmittedEmergency(res.data.emergency);
        setStep('success');
      }
    } catch (err) {
      console.error('Error submitting SOS:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to send SOS. Please call 112 or 108 directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sos-page-wrapper">
      <div className="sos-container">
        
        {/* Top Bar Header */}
        <div className="sos-top-header">
          <Link to="/" className="btn-back-home">
            <ArrowLeft size={18} /> Back
          </Link>
          <div className="sos-badge-critical">
            <span className="live-siren-dot"></span>
            <span>HIGH PRIORITY EMERGENCY</span>
          </div>
          <Link to="/emergency-history" className="btn-history-link" title="My Emergency Requests">
            <History size={16} /> My History
          </Link>
        </div>

        {/* Hero Emergency Banner */}
        <div className="sos-hero-card">
          <div className="sos-hero-icon-pulse">
            <AlertOctagon size={36} color="#ffffff" />
          </div>
          <div className="sos-hero-text">
            <h2>🚨 SOS / Emergency Assistance</h2>
            <p>
              Instantly transmits your information and live GPS location inside the park to the <strong>assigned on-site security staff and officials</strong> with alert sound.
            </p>
          </div>
        </div>

        {/* Direct Emergency Call Helpline Quick Bar */}
        <div className="sos-helplines-strip">
          <div className="helpline-left">
            <ShieldCheck size={18} color="#dc2626" />
            <span>Direct Emergency Helplines:</span>
          </div>
          <div className="helpline-buttons">
            <a href="tel:112" className="btn-call-helpline national">
              <PhoneCall size={14} /> Dial 112 (National Emergency)
            </a>
            <a href="tel:108" className="btn-call-helpline ambulance">
              <Heart size={14} /> Dial 108 (Ambulance)
            </a>
          </div>
        </div>

        {errorMsg && (
          <div className="sos-error-box">
            <AlertTriangle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Emergency Form */}
        {step === 'form' && (
          <form onSubmit={handleFormSubmit} className="sos-main-form">
            
            {/* Section 1: Emergency Type */}
            <div className="sos-section-card">
              <h3 className="section-title">
                <Activity size={18} color="#ef4444" /> 1. Select Emergency Type *
              </h3>
              <div className="sos-types-selection-grid">
                {EMERGENCY_TYPES.map((t) => {
                  const IconC = t.icon;
                  const isSel = emergencyType === t.id;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      className={`type-select-card ${isSel ? 'active' : ''}`}
                      onClick={() => setEmergencyType(t.id)}
                    >
                      <div className="type-icon-circle" style={{ backgroundColor: `${t.color}20`, color: t.color }}>
                        <IconC size={22} />
                      </div>
                      <div className="type-card-body">
                        <span className="type-title">{t.label}</span>
                        <span className="type-details">{t.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Park & Live Location */}
            <div className="sos-section-card">
              <h3 className="section-title">
                <MapPin size={18} color="#ef4444" /> 2. Park & Live Park Location *
              </h3>

              <div className="form-group-field mb-3">
                <label className="field-label">Select Park *</label>
                <select
                  className="field-input select"
                  value={selectedParkId}
                  onChange={handleParkChange}
                  required
                >
                  <option value="">-- Choose Park Location --</option>
                  {parks.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.district?.name ? `(${p.district.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* GPS Coordinates Box */}
              <div className="gps-live-display-box">
                <div className="gps-box-top">
                  <div className="gps-status-indicator">
                    <span className="live-siren-dot"></span>
                    <strong>Live GPS Coordinates</strong>
                  </div>
                  <button
                    type="button"
                    className="btn-refresh-gps"
                    onClick={fetchCurrentGPS}
                    disabled={locLoading}
                  >
                    <Radio size={14} /> {locLoading ? 'Acquiring GPS...' : 'Refresh GPS'}
                  </button>
                </div>

                <div className="gps-coordinates-strip">
                  <span className="coord-chip">Latitude: {latitude.toFixed(6)}°</span>
                  <span className="coord-chip">Longitude: {longitude.toFixed(6)}°</span>
                </div>
                <p className="gps-address-text">{address}</p>
              </div>

              <div className="form-group-field mt-3">
                <label className="field-label">Exact Spot in Park (Landmark / Bench / Gate / Play area)</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Near Gazebo, South Walking Track, Children Play Area, Main Gate..."
                  value={landmarkDescription}
                  onChange={(e) => setLandmarkDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Section 3: Citizen Info */}
            <div className="sos-section-card">
              <h3 className="section-title">
                <User size={18} color="#ef4444" /> 3. Citizen / Caller Details *
              </h3>
              <div className="form-row-2col">
                <div className="form-group-field">
                  <label className="field-label">Your Full Name *</label>
                  <input
                    type="text"
                    className="field-input"
                    placeholder="Enter your name"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group-field">
                  <label className="field-label">Reachable Phone Number *</label>
                  <input
                    type="tel"
                    className="field-input"
                    placeholder="Phone number for responders to call"
                    value={citizenPhone}
                    onChange={(e) => setCitizenPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group-field mt-3">
                <label className="field-label">Additional Emergency Situation Details (Optional)</label>
                <textarea
                  className="field-textarea"
                  rows={2}
                  placeholder="Describe patient condition or immediate assistance needed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Bottom Action */}
            <div className="sos-submit-strip">
              <button type="submit" className="btn-proceed-sos">
                Review & Send SOS Emergency Alert 🚨
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Confirmation */}
        {step === 'confirm' && (
          <div className="sos-confirm-box">
            <div className="confirm-header-icon">
              <AlertOctagon size={52} color="#dc2626" />
            </div>
            <h3 className="confirm-heading">Confirm Emergency SOS Broadcast</h3>
            <p className="confirm-desc">
              Sending this will immediately notify the <strong>on-site security staff and officials at {selectedPark?.name || 'the park'}</strong> with a siren alert and your live location.
            </p>

            <div className="confirm-specs-card">
              <div className="spec-row">
                <span className="spec-label">Emergency Type:</span>
                <span className="spec-val text-red font-bold">{emergencyType}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Park:</span>
                <span className="spec-val font-semibold">{selectedPark?.name || 'Selected Park'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Exact Location / Landmark:</span>
                <span className="spec-val">{landmarkDescription || address}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Citizen Contact:</span>
                <span className="spec-val">{citizenName} ({citizenPhone})</span>
              </div>
            </div>

            <div className="confirm-actions-row">
              <button
                type="button"
                className="btn-confirm-back"
                onClick={() => setStep('form')}
                disabled={submitting}
              >
                Back to Edit
              </button>
              <button
                type="button"
                className="btn-confirm-trigger"
                onClick={handleConfirmSendSOS}
                disabled={submitting}
              >
                {submitting ? 'Broadcasting SOS...' : '🚨 Broadcast Emergency SOS Now'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success Screen */}
        {step === 'success' && submittedEmergency && (
          <div className="sos-success-box">
            <div className="success-icon-wrap">
              <CheckCircle2 size={60} color="#10b981" />
            </div>
            <h3 className="success-heading">Emergency SOS Broadcasted!</h3>
            <p className="success-desc">
              Your SOS alert for <strong>{submittedEmergency.emergencyType}</strong> at <strong>{submittedEmergency.parkName}</strong> has been transmitted with highest priority to the assigned on-site park security staff and government officials.
            </p>

            <div className="success-ticket-card">
              <div className="ticket-header-row">
                <span>Emergency Ticket ID:</span>
                <strong>{submittedEmergency.emergencyId}</strong>
              </div>

              <div className="ticket-body-grid">
                <div className="ticket-item">
                  <span className="ticket-label">Status:</span>
                  <span className="ticket-badge-live">🚨 {submittedEmergency.status}</span>
                </div>
                <div className="ticket-item">
                  <span className="ticket-label">Park:</span>
                  <span className="ticket-value">{submittedEmergency.parkName}</span>
                </div>
                <div className="ticket-item">
                  <span className="ticket-label">Reported At:</span>
                  <span className="ticket-value">
                    <Clock size={13} /> {new Date(submittedEmergency.reportedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                </div>
                <div className="ticket-item col-span-2">
                  <span className="ticket-label">Live Park Coordinates:</span>
                  <span className="ticket-value">{submittedEmergency.landmarkDescription || submittedEmergency.address} ({submittedEmergency.latitude.toFixed(5)}°, {submittedEmergency.longitude.toFixed(5)}°)</span>
                </div>
              </div>
            </div>

            <div className="success-actions-row">
              <Link to="/emergency-history" className="btn-view-history">
                View My SOS History & Status
              </Link>
              <Link to="/" className="btn-home-return">
                Return to Home
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
