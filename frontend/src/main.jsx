import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Globally silence and disable any Web Audio / AudioContext / Speech instances
if (typeof window !== 'undefined') {
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch (e) {}

  const DummyAudioContext = function () {
    return {
      state: 'closed',
      currentTime: 0,
      destination: {},
      resume: () => Promise.resolve(),
      suspend: () => Promise.resolve(),
      close: () => Promise.resolve(),
      createOscillator: () => ({
        type: 'sine',
        frequency: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
        connect: () => {},
        disconnect: () => {},
        start: () => {},
        stop: () => {},
        onended: null
      }),
      createGain: () => ({
        gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {},
        disconnect: () => {}
      })
    };
  };

  try {
    window.AudioContext = DummyAudioContext;
    window.webkitAudioContext = DummyAudioContext;
  } catch (e) {}
}

// In production on Vercel or separate hosts, use VITE_API_URL if provided
const rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = rawApiUrl.replace(/\/+$/, '');

if (API_BASE) {
  axios.defaults.baseURL = API_BASE;

  // Intercept all native fetch calls pointing to /api or /uploads globally
  const originalFetch = window.fetch;
  window.fetch = function (resource, init) {
    if (typeof resource === 'string') {
      if (resource.startsWith('/api') || resource.startsWith('/uploads')) {
        resource = API_BASE + resource;
      }
    } else if (resource && typeof resource === 'object' && resource.url) {
      try {
        const url = new URL(resource.url, window.location.origin);
        if (url.pathname.startsWith('/api') || url.pathname.startsWith('/uploads')) {
          resource = new Request(API_BASE + url.pathname + url.search, resource);
        }
      } catch (e) {}
    }
    return originalFetch.call(this, resource, init);
  };
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '34086326240-3qts553oauok0kic9ltft1bi7qjca0es.apps.googleusercontent.com'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
