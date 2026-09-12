import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  QrCode, 
  FileText, 
  Search, 
  MessageSquare, 
  CheckCircle2, 
  Users, 
  Trees, 
  Megaphone, 
  ArrowRight, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  Compass, 
  Clock, 
  ChevronRight 
} from 'lucide-react';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await axios.get('/api/announcements');
        setAnnouncements(res.data);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };
    fetchAnnouncements();
  }, []);

  return (
    <div className="home-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container container">
          <div className="hero-badge animate-slide-up">
            <Sparkles size={16} className="hero-badge-icon" />
            <span>Civic Intelligence & Urban Park Management</span>
          </div>

          <h1 className="hero-main-title animate-slide-up">
            Smarter Parks, <span className="title-highlight">Better Living</span> & Greener Cities
          </h1>

          <p className="hero-description animate-slide-up">
            Discover nearby parks, report maintenance issues instantly, track resolutions in real time, and help transform city green spaces for everyone.
          </p>

          <div className="hero-cta-group animate-slide-up">
            <Link to="/parks" className="hero-btn primary-hero-btn">
              <Compass size={20} />
              <span>Explore Parks</span>
              <ArrowRight size={18} className="btn-arrow" />
            </Link>

            <Link to="/scan" className="hero-btn secondary-hero-btn">
              <QrCode size={20} />
              <span>Scan QR Code</span>
            </Link>

            <Link to="/login" className="hero-btn outline-hero-btn">
              <span>Account Login</span>
            </Link>
          </div>

          {/* Floating Feature Badges */}
          <div className="hero-feature-pills">
            <div className="feature-pill">
              <CheckCircle2 size={18} className="pill-icon success-icon" />
              <span>98% Issue Resolution</span>
            </div>
            <div className="feature-pill">
              <MapPin size={18} className="pill-icon location-icon" />
              <span>650+ Parks Monitored</span>
            </div>
            <div className="feature-pill">
              <Trees size={18} className="pill-icon tree-icon" />
              <span>Eco-Friendly Living</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-bg icon-green">
                <Trees size={28} />
              </div>
              <div className="stat-info">
                <h3 className="stat-number">650+</h3>
                <p className="stat-label">City Parks Monitored</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-bg icon-emerald">
                <CheckCircle2 size={28} />
              </div>
              <div className="stat-info">
                <h3 className="stat-number">98.4%</h3>
                <p className="stat-label">Resolution Rate</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-bg icon-blue">
                <Users size={28} />
              </div>
              <div className="stat-info">
                <h3 className="stat-number">15,000+</h3>
                <p className="stat-label">Active Citizens</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-bg icon-purple">
                <Activity size={28} />
              </div>
              <div className="stat-info">
                <h3 className="stat-number">24/7</h3>
                <p className="stat-label">Real-time Inspection</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <section className="announcements-section container">
          <div className="announcements-container">
            <div className="announcements-header">
              <div className="announcements-title-wrapper">
                <div className="announcement-badge-icon">
                  <Megaphone size={22} />
                </div>
                <div>
                  <h2 className="announcements-heading">Latest Announcements & Updates</h2>
                  <p className="announcements-subheading">Stay informed about park developments and municipal notices</p>
                </div>
              </div>
              <Link to="/announcements" className="view-all-link">
                View All <ChevronRight size={18} />
              </Link>
            </div>

            <div className="announcements-grid">
              {announcements.slice(0, 3).map((announcement) => (
                <div key={announcement._id} className="announcement-card">
                  <div className="announcement-card-header">
                    <span className="announcement-tag">Notice</span>
                    <span className="announcement-date">
                      <Clock size={14} />
                      {new Date(announcement.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="announcement-title">{announcement.title}</h3>
                  <p className="announcement-snippet">{announcement.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Interactive Services Section */}
      <section className="services-section">
        <div className="container">
          <div className="section-header">
            <span className="section-category-badge">Quick Citizen Services</span>
            <h2 className="section-main-title">What Would You Like To Do Today?</h2>
            <p className="section-main-subtitle">Choose an action below to interact with park services and city maintenance.</p>
          </div>

          <div className="services-grid">
            {/* Card 1 */}
            <div className="service-interactive-card card-green">
              <div className="card-top-bar">
                <div className="service-icon-box box-green">
                  <QrCode size={32} />
                </div>
                <span className="service-pill-tag tag-green">Instant Scan</span>
              </div>
              <h3 className="service-card-title">Scan QR Code</h3>
              <p className="service-card-desc">
                Found a QR code on a park bench, lamp post, or playground? Scan it directly to pinpoint location and report issues.
              </p>
              <Link to="/scan" className="service-action-btn btn-style-green">
                <span>Scan Now</span>
                <ArrowRight size={18} className="arrow-icon" />
              </Link>
            </div>

            {/* Card 2 */}
            <div className="service-interactive-card card-amber">
              <div className="card-top-bar">
                <div className="service-icon-box box-amber">
                  <FileText size={32} />
                </div>
                <span className="service-pill-tag tag-amber">Fast Response</span>
              </div>
              <h3 className="service-card-title">Submit Complaint</h3>
              <p className="service-card-desc">
                Report damaged benches, broken playground equipment, uncleaned trash, or faulty park lighting with photos.
              </p>
              <Link to="/complaint" className="service-action-btn btn-style-amber">
                <span>Submit Complaint</span>
                <ArrowRight size={18} className="arrow-icon" />
              </Link>
            </div>

            {/* Card 3 */}
            <div className="service-interactive-card card-blue">
              <div className="card-top-bar">
                <div className="service-icon-box box-blue">
                  <Search size={32} />
                </div>
                <span className="service-pill-tag tag-blue">Live Tracking</span>
              </div>
              <h3 className="service-card-title">Track Complaint Status</h3>
              <p className="service-card-desc">
                Already submitted a complaint? Enter your reference ticket number to view assigned official and resolution status.
              </p>
              <Link to="/track-complaint" className="service-action-btn btn-style-blue">
                <span>Track Status</span>
                <ArrowRight size={18} className="arrow-icon" />
              </Link>
            </div>

            {/* Card 4 */}
            <div className="service-interactive-card card-purple">
              <div className="card-top-bar">
                <div className="service-icon-box box-purple">
                  <MessageSquare size={32} />
                </div>
                <span className="service-pill-tag tag-purple">Community First</span>
              </div>
              <h3 className="service-card-title">Give Feedback</h3>
              <p className="service-card-desc">
                Have ideas for park improvements, tree planting drive, or event facilities? Share your valuable feedback with us.
              </p>
              <Link to="/feedback" className="service-action-btn btn-style-purple">
                <span>Share Feedback</span>
                <ArrowRight size={18} className="arrow-icon" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Workflow / How It Works */}
      <section className="workflow-section">
        <div className="container">
          <div className="section-header">
            <span className="section-category-badge">Simplified Process</span>
            <h2 className="section-main-title">How The Monitoring System Works</h2>
            <p className="section-main-subtitle">Four simple steps to ensure every park remains safe, clean, and vibrant.</p>
          </div>

          <div className="workflow-grid">
            <div className="workflow-step-card">
              <div className="workflow-step-badge">1</div>
              <div className="workflow-icon-wrapper">
                <QrCode size={26} />
              </div>
              <h4 className="workflow-title">Scan or Locate</h4>
              <p className="workflow-desc">Scan the park QR code or select a park from our interactive directory.</p>
            </div>

            <div className="workflow-connector">
              <ArrowRight size={24} />
            </div>

            <div className="workflow-step-card">
              <div className="workflow-step-badge">2</div>
              <div className="workflow-icon-wrapper">
                <FileText size={26} />
              </div>
              <h4 className="workflow-title">Lodge Details</h4>
              <p className="workflow-desc">Provide description and photo evidence of the issue directly through our web portal.</p>
            </div>

            <div className="workflow-connector">
              <ArrowRight size={24} />
            </div>

            <div className="workflow-step-card">
              <div className="workflow-step-badge">3</div>
              <div className="workflow-icon-wrapper">
                <ShieldCheck size={26} />
              </div>
              <h4 className="workflow-title">Official Inspection</h4>
              <p className="workflow-desc">The complaint is routed to the ward official and contractor for rapid resolution.</p>
            </div>

            <div className="workflow-connector">
              <ArrowRight size={24} />
            </div>

            <div className="workflow-step-card">
              <div className="workflow-step-badge">4</div>
              <div className="workflow-icon-wrapper">
                <CheckCircle2 size={26} />
              </div>
              <h4 className="workflow-title">Track & Resolve</h4>
              <p className="workflow-desc">Receive real-time notifications once maintenance is completed and verified.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights & Features Grid */}
      <section className="features-highlight-section container">
        <div className="features-banner-card">
          <div className="banner-content">
            <div className="banner-badge">
              <Trees size={18} />
              <span>Parks Ecosystem</span>
            </div>
            <h2 className="banner-title">Build a Greener & Healthier Community</h2>
            <p className="banner-desc">
              Our platform connects citizens, municipal corporations, government officials, and contractors in one unified ecosystem.
            </p>
            <div className="banner-actions">
              <Link to="/parks" className="banner-btn primary-banner-btn">
                <span>View All Parks</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="banner-btn secondary-banner-btn">
                <span>Join Community</span>
              </Link>
            </div>
          </div>
          <div className="banner-features-side">
            <div className="mini-feature-item">
              <ShieldCheck size={22} className="feature-item-icon text-green" />
              <div>
                <h5>Transparent Management</h5>
                <p>Track progress from report to verified fix with total transparency.</p>
              </div>
            </div>
            <div className="mini-feature-item">
              <Compass size={22} className="feature-item-icon text-amber" />
              <div>
                <h5>Interactive Park Explorer</h5>
                <p>Filter parks by Ward, Zone, Corporation, and District easily.</p>
              </div>
            </div>
            <div className="mini-feature-item">
              <Users size={22} className="feature-item-icon text-blue" />
              <div>
                <h5>Stall & Event Bookings</h5>
                <p>Book event spaces and stalls directly for community gatherings.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;

