import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2 } from 'lucide-react';
import './InstallPrompt.css';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode
    const isRunningStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isRunningStandalone) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if user dismissed prompt in this session
    const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');

    // Handle standard beforeinstallprompt (Chrome, Edge, Android, Opera)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS Safari (which does not support beforeinstallprompt)
    if (isIosDevice && !isDismissed && !isRunningStandalone) {
      // Delay showing iOS prompt so user has seen the page first
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="pwa-install-banner animate-slide-up" role="dialog" aria-label="Install App">
      <div className="pwa-banner-content">
        <img src="/pwa-192x192.png" alt="ParkPulse Icon" className="pwa-app-icon" />
        <div className="pwa-text-group">
          <div className="pwa-title">Install ParkPulse App</div>
          <div className="pwa-subtitle">
            {isIOS 
              ? 'Install on your iPhone/iPad: tap Share below, then "Add to Home Screen"' 
              : 'Add to Home Screen for fast, offline-ready park monitoring'}
          </div>
        </div>
      </div>

      <div className="pwa-actions">
        {isIOS ? (
          <div className="pwa-ios-instructions">
            <Share2 size={16} className="inline-icon" />
            <span>Share &rarr; Add to Home Screen</span>
          </div>
        ) : (
          <button onClick={handleInstallClick} className="pwa-btn-install">
            <Download size={16} />
            <span>Install</span>
          </button>
        )}
        <button onClick={handleDismiss} className="pwa-btn-close" aria-label="Dismiss">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
