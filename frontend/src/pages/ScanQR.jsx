import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './ScanQR.css';

const ScanQR = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [parkCode, setParkCode] = useState('');

  useEffect(() => {
    if (scanResult) return;

    let isMounted = true;
    let scanner = null;

    // Delay initialization slightly to bypass React Strict Mode's double-mount.
    // The first mount's timeout will be cancelled before it fires.
    const timer = setTimeout(() => {
      if (!isMounted) return;

      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          // use a responsive box that takes 80% of the shortest edge
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdgePercentage = 0.8; 
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
            return { width: qrboxSize, height: qrboxSize };
          },
          aspectRatio: 1.0
        },
        false
      );

      scanner.render(
        (decodedText) => {
          setScanResult(decodedText);
          setParkCode(decodedText);
          if (scanner) {
            scanner.clear().catch(console.error);
          }
        },
        (error) => {
          // Ignore scanning errors
        }
      );
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scanner) {
        try {
          scanner.clear().catch(() => {});
        } catch (e) {
          // Ignore synchronous cleanup errors
        }
      }
    };
  }, [scanResult]);

  const handleManualSubmit = () => {
    if (parkCode) {
      setScanResult(parkCode);
      // navigate(`/parks/${parkCode}`);
    }
  };

  return (
    <div className="scan-page">
      <div className="scan-card">
        <div className="scan-header">
          <h2>Scan Park QR Code</h2>
          <p>Scan the QR code available in the park</p>
        </div>

        <div className="scanner-container">
          {scanResult ? (
            <div className="scan-success">
              <h3 className="text-success">QR Code Scanned Successfully!</h3>
              <p>Park Code: <strong>{scanResult}</strong></p>
              <button 
                className="btn btn-primary mt-4" 
                onClick={() => setScanResult(null)}
              >
                Scan Another
              </button>
            </div>
          ) : (
            <div id="qr-reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', border: 'none', borderRadius: 'var(--radius-md)' }}></div>
          )}
        </div>

        <div className="scan-divider">
          <span>OR</span>
        </div>

        <div className="manual-entry">
          <label className="input-label text-center">Enter Park Code</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Enter park code" 
            value={parkCode}
            onChange={(e) => setParkCode(e.target.value)}
          />
          <button className="btn btn-primary w-full mt-4" onClick={handleManualSubmit}>Continue</button>
        </div>
      </div>
    </div>
  );
};

export default ScanQR;
