import { Link } from 'react-router-dom';
import { Trees, AlertTriangle, Store, LogIn, ArrowRight } from 'lucide-react';
import './Home.css';

// Custom SVG for Meditation / Yoga / Event icon matching Image 2
const YogaMeditationIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="4" r="2" />
    <path d="M12 8v5" />
    <path d="M8 12l4 3 4-3" />
    <path d="M4 17l4-2 4 4 4-4 4 2" />
    <path d="M7 21h10" />
  </svg>
);

const Home = () => {
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
          <Link to="/parks" className="landing-card card-explore">
            <div className="landing-card-icon icon-explore">
              <Trees size={22} />
            </div>
            <div className="landing-card-text">
              <h4>Explore Parks</h4>
              <p>View park details, facilities and amenities.</p>
            </div>
          </Link>

          {/* Card 2: Report Issues */}
          <Link to="/complaint" className="landing-card card-report">
            <div className="landing-card-icon icon-report">
              <AlertTriangle size={22} />
            </div>
            <div className="landing-card-text">
              <h4>Report Issues</h4>
              <p>If you notice any problem in the park, raise a complaint instantly.</p>
            </div>
          </Link>

          {/* Card 3: Attend Events */}
          <Link to="/events" className="landing-card card-events">
            <div className="landing-card-icon icon-events">
              <YogaMeditationIcon size={22} />
            </div>
            <div className="landing-card-text">
              <h4>Attend Events</h4>
              <p>Join yoga sessions and other park events by registering.</p>
            </div>
          </Link>

          {/* Card 4: Book Stall */}
          <Link to="/events" className="landing-card card-stall">
            <div className="landing-card-icon icon-stall">
              <Store size={22} />
            </div>
            <div className="landing-card-text">
              <h4>Book Stall</h4>
              <p>Reserve a stall space in front of parks for your business.</p>
            </div>
          </Link>
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
