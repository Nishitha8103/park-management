import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

export default function SplashScreen({ onFinish, duration = 3000 }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 500);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [duration, onFinish]);

  return (
    <div className={`splash-screen-overlay ${fadeOut ? 'splash-fade-out' : ''}`}>
      <div className="splash-content">
        <div className="splash-logo-wrapper">
          <img src="/parks_logo_v2.png" alt="Parks Logo" className="splash-logo-img" />
          <div className="splash-ring"></div>
        </div>

        <h1 className="splash-title">
          Parks <span className="splash-highlight">Monitoring System</span>
        </h1>
        <p className="splash-tagline">“Explore. Enjoy. Empower.”</p>

        <div className="splash-loader">
          <div className="splash-loader-bar"></div>
        </div>
      </div>
    </div>
  );
}
