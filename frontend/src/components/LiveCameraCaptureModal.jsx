import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, MapPin, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { stampImageWithGeoAndTimestamp, reverseGeocode } from '../utils/imageStampUtil';
import './LiveCameraCaptureModal.css';

export default function LiveCameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  tag = 'Citizen Evidence'
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [location, setLocation] = useState(null);
  const [placeName, setPlaceName] = useState('');
  const [locLoading, setLocLoading] = useState(true);
  const [capturedData, setCapturedData] = useState(null); // { file, preview, location, timestamp }
  const [cameraError, setCameraError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live timer for modal display
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Request high accuracy GPS & resolve address name
  useEffect(() => {
    if (!isOpen) return;
    setLocLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLocation({
            latitude: lat,
            longitude: lon
          });
          setLocLoading(false);

          // Resolve place name
          const name = await reverseGeocode(lat, lon);
          if (name) setPlaceName(name);
        },
        (err) => {
          console.warn('Live location capture warning:', err);
          setLocLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocLoading(false);
    }
  }, [isOpen]);

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedData(null);
      setCameraError('');
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
      // Prefer environment (back) camera on mobile, fallback to user camera
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
      // Fallback try with basic constraints
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
      const rawFile = new File([blob], `live_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Apply watermark stamp with live location and timestamp
      const stamped = await stampImageWithGeoAndTimestamp(rawFile, {
        location: { ...location, placeName },
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

  const handleRetake = () => {
    if (capturedData && capturedData.preview) {
      URL.revokeObjectURL(capturedData.preview);
    }
    setCapturedData(null);
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
                {placeName && (
                  <div className="hud-pill hud-place" style={{ color: '#67e8f9', fontWeight: 600 }}>
                    <MapPin size={12} />
                    <span>{placeName}</span>
                  </div>
                )}
                <div className="hud-pill hud-location">
                  <MapPin size={12} />
                  {locLoading ? (
                    <span>Acquiring GPS Location...</span>
                  ) : location ? (
                    <span>{location.latitude.toFixed(5)}° N, {location.longitude.toFixed(5)}° E</span>
                  ) : (
                    <span>GPS Acquired on Snap</span>
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
              <button className="btn-camera-confirm" onClick={handleConfirm}>
                <Check size={18} /> Use This Photo
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
              <span className="camera-snap-hint">Tap to capture with live location & date-time</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
