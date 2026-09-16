import { useNavigate, Link } from 'react-router-dom';
import { LogIn, ArrowRight } from 'lucide-react';
import './Home.css';

// Exact custom icons matching Image 2
const ExploreParksIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 17v3M20 17v3M2 17h20M4 13h16" />
    <path d="M7 13V8a3 3 0 0 1 6 0v5" />
    <path d="M15 13V5a3 3 0 0 1 6 0v8" />
  </svg>
);

const ReportIssuesIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const AttendEventsIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="4" r="2" />
    <path d="M12 7v5" />
    <path d="M7 13l5 3 5-3" />
    <path d="M4 18c2-2 5-1 8-1s6-1 8 1" />
  </svg>
);

const BookStallIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l1.5-5h15L21 9" />
    <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    <path d="M4 14v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6" />
    <path d="M9 21v-4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" />
  </svg>
);

const Home = () => {
  const navigate = useNavigate();

  const handleCardClick = (e, path) => {
    e.preventDefault();
    const stored = localStorage.getItem('user');
    let loggedIn = false;
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u && (u.token || u.id || u._id)) {
          loggedIn = true;
        }
      } catch (err) {
        loggedIn = false;
      }
    }

    if (loggedIn) {
      navigate(path);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(path)}`);
    }
  };

  return (
    <div className="landing-dark-page">
      <div className="landing-dark-overlay"></div>

      <div className="landing-dark-container">
        {/* Exact Circular Emblem Logo */}
        <div className="landing-logo-box">
          <img src="/parks_logo_v3.png" alt="Parks Monitoring System Logo" className="landing-logo-img" />
          <div className="landing-logo-glow"></div>
        </div>

        {/* Title & Tagline matching Image 2 */}
        <div className="landing-title-group">
          <h1 className="landing-main-title">
            Parks Monitoring
            <br />
            <span className="landing-title-accent">System</span>
          </h1>
          <p className="landing-quote">“Explore. Enjoy. Empower.”</p>
          <p className="landing-subtitle">
            Discover your city’s parks, stay informed, report issues, join events and book stalls — all in one place!
          </p>
        </div>

        {/* 4 Feature Cards Grid matching Image 2 */}
        <div className="landing-feature-grid">
          {/* Card 1: Explore Parks */}
          <div onClick={(e) => handleCardClick(e, '/parks')} className="landing-card card-explore" style={{ cursor: 'pointer' }}>
            <div className="landing-card-icon icon-explore">
              <ExploreParksIcon size={22} />
            </div>
            <div className="landing-card-text">
              <h4>Explore Parks</h4>
              <p>View park details, facilities and amenities.</p>
            </div>
          </div>

          {/* Card 2: Report Issues */}
          <div onClick={(e) => handleCardClick(e, '/complaint')} className="landing-card card-report" style={{ cursor: 'pointer' }}>
            <div className="landing-card-icon icon-report">
              <ReportIssuesIcon size={22} />
            </div>
            <div className="landing-card-text">
              <h4>Report Issues</h4>
              <p>If you notice any problem in the park, raise a complaint instantly.</p>
            </div>
          </div>

          {/* Card 3: Attend Events */}
          <div onClick={(e) => handleCardClick(e, '/events')} className="landing-card card-events" style={{ cursor: 'pointer' }}>
            <div className="landing-card-icon icon-events">
              <AttendEventsIcon size={22} />
            </div>
            <div className="landing-card-text">
              <h4>Attend Events</h4>
              <p>Join yoga sessions and other park events by registering.</p>
            </div>
          </div>

          {/* Card 4: Book Stall */}
          <div onClick={(e) => handleCardClick(e, '/events')} className="landing-card card-stall" style={{ cursor: 'pointer' }}>
            <div className="landing-card-icon icon-stall">
              <BookStallIcon size={22} />
            </div>
            <div className="landing-card-text">
              <h4>Book Stall</h4>
              <p>Reserve a stall space in front of parks for your business.</p>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="landing-cta-area">
          <Link to="/login" className="landing-btn-signin">
            <LogIn size={20} className="btn-signin-icon" />
            <span>Sign in</span>
            <ArrowRight size={19} className="btn-signin-arrow" />
          </Link>

          <Link to="/register" className="landing-link-register">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;

