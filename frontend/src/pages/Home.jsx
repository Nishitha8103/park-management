import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trees, AlertTriangle, UserCheck, Store, LogIn, ArrowRight } from 'lucide-react';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-dark-page">
      <div className="landing-dark-overlay"></div>

      <div className="landing-dark-container">
        {/* Circular Logo with tech green styling */}
        <div className="landing-logo-box">
          <img src="/parks_logo_v2.png" alt="Parks Monitoring System Logo" className="landing-logo-img" />
          <div className="landing-logo-glow"></div>
        </div>

        {/* Title & Tagline */}
        <div className="landing-title-group">
          <h1 className="landing-main-title">
            Parks <span className="landing-title-accent">Monitoring</span>
            <br />
            <span className="landing-title-accent">System</span>
          </h1>
          <p className="landing-quote">“Explore. Enjoy. Empower.”</p>
          <p className="landing-subtitle">
            Discover your city’s parks, stay informed, report issues, join events and book stalls — all in one place!
          </p>
        </div>

        {/* 4 Glassmorphism Feature Cards Grid */}
        <div className="landing-feature-grid">
          {/* Card 1: Explore Parks */}
          <Link to="/parks" className="landing-card card-explore">
            <div className="landing-card-icon icon-explore">
              <Trees size={24} />
            </div>
            <div className="landing-card-text">
              <h4>Explore Parks</h4>
              <p>View park details, facilities and amenities.</p>
            </div>
          </Link>

          {/* Card 2: Report Issues */}
          <Link to="/complaint" className="landing-card card-report">
            <div className="landing-card-icon icon-report">
              <AlertTriangle size={24} />
            </div>
            <div className="landing-card-text">
              <h4>Report Issues</h4>
              <p>If you notice any problem in the park, raise a complaint instantly.</p>
            </div>
          </Link>

          {/* Card 3: Attend Events */}
          <Link to="/events" className="landing-card card-events">
            <div className="landing-card-icon icon-events">
              <UserCheck size={24} />
            </div>
            <div className="landing-card-text">
              <h4>Attend Events</h4>
              <p>Join yoga sessions and other park events by registering.</p>
            </div>
          </Link>

          {/* Card 4: Book Stall */}
          <Link to="/events" className="landing-card card-stall">
            <div className="landing-card-icon icon-stall">
              <Store size={24} />
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
            <ArrowRight size={18} className="btn-signin-arrow" />
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
