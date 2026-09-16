import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, MapPin, Calendar, Clock, AlertTriangle, Navigation, Search, CheckCircle2, Globe, Crosshair } from 'lucide-react';
import { stampImageWithGeoAndTimestamp, reverseGeocodeDetails, getLiveGeoLocation, forwardGeocode } from '../utils/imageStampUtil';
import './LiveCameraCaptureModal.css';

export default function LiveCameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  tag = 'Citizen Evidence',
  defaultLocation = null // { name, address, latitude, longitude }
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const watchIdRef = useRef(null);

  const [location, setLocation] = useState(null);
  const [placeName, setPlaceName] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [locLoading, setLocLoading] = useState(true);
  const [locError, setLocError] = useState('');
  const [capturedData, setCapturedData] = useState(null); // { file, preview, location, timestamp }
  const [cameraError, setCameraError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Location Search & Manual Edit State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isManualEditing, setIsManualEditing] = useState(false);
  const [customPlaceInput, setCustomPlaceInput] = useState('');
  const [customAddrInput, setCustomAddrInput] = useState('');

  // Live timer for modal display
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Set location directly via search or explicit coordinates
  const applyCustomLocation = useCallback(async (queryOrCoords) => {
    setLocLoading(true);
    setLocError('');
    try {
      if (typeof queryOrCoords === 'string') {
        const geo = await forwardGeocode(queryOrCoords);
        if (geo && geo.latitude && geo.longitude) {
          setLocation({
            latitude: geo.latitude,
            longitude: geo.longitude
          });
          setPlaceName(geo.cityStateCountry || queryOrCoords);
          setFullAddress(geo.fullAddress || queryOrCoords);
        } else {
          // If geocoding server doesn't find it, still allow the custom text input
          setPlaceName(queryOrCoords);
          setFullAddress(queryOrCoords);
        }
      } else if (queryOrCoords && queryOrCoords.latitude) {
        setLocation({
          latitude: queryOrCoords.latitude,
          longitude: queryOrCoords.longitude
        });
        if (queryOrCoords.placeName || queryOrCoords.name) {
          setPlaceName(queryOrCoords.placeName || queryOrCoords.name);
          setFullAddress(queryOrCoords.fullAddress || queryOrCoords.address || queryOrCoords.name);
        } else {
          const details = await reverseGeocodeDetails(queryOrCoords.latitude, queryOrCoords.longitude);
          if (details) {
            setPlaceName(details.cityStateCountry);
            setFullAddress(details.fullAddress);
          }
        }
      }
    } catch (err) {
      console.warn('Apply location failed:', err);
      if (typeof queryOrCoords === 'string') {
        setPlaceName(queryOrCoords);
        setFullAddress(queryOrCoords);
      }
    } finally {
      setLocLoading(false);
      setShowSearch(false);
      setIsManualEditing(false);
    }
  }, []);

  // Process new coordinates from live GPS
  const handleNewCoords = useCallback(async (lat, lon) => {
    setLocation({ latitude: lat, longitude: lon });
    setLocLoading(true);
    try {
      const details = await reverseGeocodeDetails(lat, lon);
      if (details) {
        setPlaceName(details.cityStateCountry);
        setFullAddress(details.fullAddress);
      } else {
        setPlaceName(`Lat ${lat.toFixed(5)}°, Lon ${lon.toFixed(5)}°`);
        setFullAddress(`GPS: ${lat.toFixed(6)}, ${lon.toFixed(6)}`);
      }
      setLocError('');
    } catch (err) {
      console.warn('Reverse geocode error:', err);
    } finally {
      setLocLoading(false);
    }
  }, []);

  // Function to fetch true real-time GPS from browser
  const refreshLocation = useCallback(async () => {
    setLocLoading(true);
    setLocError('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      setLocLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (pos && pos.coords) {
          handleNewCoords(pos.coords.latitude, pos.coords.longitude);
        }
      },
      (err) => {
        console.warn('Browser GPS capture error:', err);
        if (err.code === 1) {
          setLocError('Location permission denied in browser. Use Search/Edit location below.');
        } else {
          setLocError('GPS timeout. Click "Detect GPS" again or enter location manually.');
        }
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [handleNewCoords]);

  // Initialize location on open
  useEffect(() => {
    if (!isOpen) {
      if (watchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    // Default to Live Device GPS detection
    refreshLocation();

    // Start active GPS watch
    if (navigator.geolocation) {
      try {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            if (pos && pos.coords && !isManualEditing) {
              handleNewCoords(pos.coords.latitude, pos.coords.longitude);
            }
          },
          (err) => console.warn('GPS watch error:', err),
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
        );
      } catch (e) {}
    }

    return () => {
      if (watchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isOpen, refreshLocation, handleNewCoords, isManualEditing]);

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedData(null);
      setCameraError('');
      setShowSearch(false);
      return;
    }

    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError('');
    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera stream access failed:', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play();
        }
      } catch (fallbackErr) {
        console.error('Camera fallback failed:', fallbackErr);
        setCameraError('Camera access denied or unavailable. Please enable camera permissions in your browser.');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    await applyCustomLocation(searchQuery.trim());
    setIsSearching(false);
  };  const [rawPhotoBlob, setRawPhotoBlob] = useState(null);

  const handleTakeSnapshot = async () => {
    if (!videoRef.current || cameraError) return;
    setProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      setRawPhotoBlob(blob);
      const rawFile = new File([blob], `live_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Resolve live GPS or currently selected coordinates
      const finalLat = location?.latitude;
      const finalLon = location?.longitude;
      const finalPlaceName = placeName || fullAddress || 'Live Verified Location';
      const finalFullAddr = fullAddress || placeName || 'Live Verified Location';

      // Apply watermark stamp with verified live location and timestamp
      const stamped = await stampImageWithGeoAndTimestamp(rawFile, {
        location: {
          latitude: finalLat || 0,
          longitude: finalLon || 0,
          placeName: finalPlaceName,
          fullAddress: finalFullAddr
        },
        tag,
        fileName: `verified_capture_${Date.now()}.jpg`
      });

      setCapturedData(stamped);
      stopCamera();
    } catch (err) {
      console.error('Snapshot capture error:', err);
      alert('Failed to capture photo. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Re-stamp existing photo when location is modified
  const reStampPhotoWithNewLocation = async (newPlace, newAddr, newLat, newLon) => {
    if (!rawPhotoBlob) return;
    setProcessing(true);
    try {
      const chosenPlace = newPlace || placeName || 'Live Verified Location';
      const chosenAddr = newAddr || fullAddress || chosenPlace;
      const chosenLat = newLat ?? location?.latitude ?? 0;
      const chosenLon = newLon ?? location?.longitude ?? 0;

      const rawFile = new File([rawPhotoBlob], `live_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const stamped = await stampImageWithGeoAndTimestamp(rawFile, {
        location: {
          latitude: chosenLat,
          longitude: chosenLon,
          placeName: chosenPlace,
          fullAddress: chosenAddr
        },
        tag,
        fileName: `verified_capture_${Date.now()}.jpg`
      });
      setCapturedData(stamped);
    } catch (err) {
      console.error('Re-stamp error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleRetake = () => {
    if (capturedData && capturedData.preview) {
      URL.revokeObjectURL(capturedData.preview);
    }
    setCapturedData(null);
    setRawPhotoBlob(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedData) {
      onCapture(capturedData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="live-camera-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="live-camera-modal" onClick={(e) => e.stopPropagation()}>
        <div className="live-camera-header">
          <div className="live-camera-title">
            <Camera size={20} className="text-emerald" />
            <h3>Live Verified Camera</h3>
          </div>
          <button className="live-camera-close" onClick={onClose} aria-label="Close camera">
            <X size={20} />
          </button>
        </div>

        {/* Location Control Bar */}
        <div className="camera-location-toolbar">
          <div className="active-loc-display" title={fullAddress || 'Live Location'}>
            <MapPin size={16} className="text-emerald" style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span className="loc-text" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#38bdf8' }}>
                {locLoading ? 'Detecting Location...' : (placeName || fullAddress || 'Live GPS Active')}
              </span>
              {fullAddress && fullAddress !== placeName && (
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {fullAddress}
                </span>
              )}
            </div>
          </div>

          <div className="location-toolbar-actions">
            {defaultLocation && (defaultLocation.name || defaultLocation.placeName) && (
              <button 
                type="button" 
                className="btn-quick-chip"
                onClick={() => {
                  applyCustomLocation(defaultLocation);
                  if (capturedData) {
                    reStampPhotoWithNewLocation(defaultLocation.name || defaultLocation.placeName, defaultLocation.address || defaultLocation.fullAddress, defaultLocation.latitude, defaultLocation.longitude);
                  }
                }}
                title="Use official park location"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.25)', borderColor: '#10b981', color: '#6ee7b7' }}
              >
                🌲 Park Location
              </button>
            )}
            <button 
              type="button" 
              className="btn-quick-chip"
              onClick={refreshLocation}
              disabled={locLoading}
              title="Refresh device GPS"
            >
              <Crosshair size={13} /> {locLoading ? '...' : 'Live GPS'}
            </button>
            <button 
              type="button" 
              className="btn-toolbar-search"
              onClick={() => {
                setShowSearch(!showSearch);
                setCustomPlaceInput(placeName);
                setCustomAddrInput(fullAddress);
              }}
            >
              <Search size={13} /> {showSearch ? 'Close' : 'Edit / Search'}
            </button>
          </div>
        </div>

        {/* Location Search & Direct Edit Drawer */}
        {showSearch && (
          <div className="camera-search-drawer">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <form onSubmit={async (e) => {
                await handleSearchSubmit(e);
                if (capturedData && searchQuery.trim()) {
                  reStampPhotoWithNewLocation(searchQuery.trim(), searchQuery.trim());
                }
              }} className="camera-search-form">
                <input 
                  type="text"
                  className="camera-search-input"
                  placeholder="Search any park, landmark or area (e.g. Cubbon Park, MG Road)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="btn-camera-search-submit" disabled={isSearching}>
                  {isSearching ? 'Locating...' : 'Search'}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Or type custom address:</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <input 
                  type="text" 
                  placeholder="Area, City (e.g. Coles Park, Bengaluru)" 
                  value={customPlaceInput} 
                  onChange={(e) => setCustomPlaceInput(e.target.value)}
                  style={{ padding: '0.4rem 0.6rem', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', borderRadius: '6px', fontSize: '0.8rem' }}
                />
                <input 
                  type="text" 
                  placeholder="Full Street Details" 
                  value={customAddrInput} 
                  onChange={(e) => setCustomAddrInput(e.target.value)}
                  style={{ padding: '0.4rem 0.6rem', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', borderRadius: '6px', fontSize: '0.8rem' }}
                />
              </div>
              <button 
                type="button" 
                onClick={() => {
                  if (customPlaceInput || customAddrInput) {
                    const chosenPlace = customPlaceInput || customAddrInput;
                    const chosenAddr = customAddrInput || customPlaceInput;
                    setPlaceName(chosenPlace);
                    setFullAddress(chosenAddr);
                    setShowSearch(false);
                    if (capturedData) {
                      reStampPhotoWithNewLocation(chosenPlace, chosenAddr);
                    }
                  }
                }}
                style={{ padding: '0.45rem', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Apply Custom Location on Photo
              </button>
            </div>
            {locError && (
              <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px' }}>
                {locError}
              </div>
            )}
          </div>
        )}

        <div className="live-camera-body">
          {cameraError ? (
            <div className="camera-error-container">
              <AlertTriangle size={48} color="#ef4444" />
              <h4>Camera Access Error</h4>
              <p>{cameraError}</p>
              <button className="btn-retry-camera" onClick={startCamera}>
                <RefreshCw size={16} /> Try Again
              </button>
            </div>
          ) : capturedData ? (
            <div className="live-camera-preview-wrap">
              <img src={capturedData.preview} alt="Verified Captured" className="live-camera-stamped-img" />
              <div className="verified-badge">
                <Check size={14} /> Live Watermark Applied
              </div>
            </div>
          ) : (
            <div className="live-camera-feed-wrap">
              <video ref={videoRef} playsInline autoPlay muted className="live-camera-video" />

              {/* Live Overlay HUD inside viewfinder */}
              <div className="live-camera-hud">
                <div className="hud-pill hud-tag">
                  <span className="hud-dot"></span> LIVE ON-SITE: {tag.toUpperCase()}
                </div>
                
                <div className="hud-pill hud-place" style={{ color: '#67e8f9', fontWeight: 600 }}>
                  <MapPin size={12} />
                  <span>{locLoading ? 'Locating...' : (placeName || 'Live GPS Active')}</span>
                </div>

                <div className="hud-pill hud-location">
                  <Navigation size={12} />
                  {location ? (
                    <span>{location.latitude.toFixed(5)}° N, {location.longitude.toFixed(5)}° E</span>
                  ) : (
                    <span>{locLoading ? 'Detecting...' : 'GPS Standby'}</span>
                  )}
                </div>

                <div className="hud-pill hud-time">
                  <Clock size={12} />
                  <span>{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="live-camera-footer">
          {capturedData ? (
            <div className="camera-action-group">
              <button className="btn-camera-retake" onClick={handleRetake}>
                <RefreshCw size={16} /> Retake
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setShowSearch(true);
                  setCustomPlaceInput(placeName);
                  setCustomAddrInput(fullAddress);
                }}
                style={{ padding: '0.65rem 1rem', background: '#334155', color: '#f8fafc', border: '1px solid #475569', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                ✏️ Edit Location Text
              </button>
              <button className="btn-camera-confirm" onClick={handleConfirm} disabled={processing}>
                <Check size={18} /> {processing ? 'Applying...' : 'Use This Photo'}
              </button>
            </div>
          ) : (
            <div className="camera-trigger-group">
              <button
                className="btn-camera-snap"
                onClick={handleTakeSnapshot}
                disabled={processing || !!cameraError}
                aria-label="Capture photo"
              >
                <div className="btn-camera-snap-inner"></div>
              </button>
              <span className="camera-snap-hint">Tap to capture with live GPS location & date-time</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


