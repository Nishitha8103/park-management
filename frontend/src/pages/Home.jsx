import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { QrCode, FileText, Search, MessageSquare, CheckCircle, Users, TreeDeciduous, Megaphone } from 'lucide-react';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const [announcements, setAnnouncements] = useState([]);
  
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
      <section className="hero">
        <div className="container hero-content animate-slide-up" style={{ textAlign: 'center', margin: '0 auto' }}>
          <h1 className="hero-title">Beautiful Parks, Better City</h1>
          <p className="hero-subtitle">
            Help us maintain and improve our city parks. Discover nearby parks, report issues, and track resolutions all in one place.
          </p>
          <div className="hero-actions" style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '1rem 4rem', fontSize: '1.25rem', borderRadius: '8px' }}>Login</Link>
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <section className="announcements section container" style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '2rem', marginTop: '-3rem', position: 'relative', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem' }}>
            <Megaphone size={28} className="text-primary" style={{ color: '#4f46e5' }} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Latest Updates</h2>
          </div>
          <div className="announcements-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {announcements.map(announcement => (
              <div key={announcement._id} className="announcement-card" style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderLeft: '4px solid #4f46e5', borderRadius: '0 8px 8px 0' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#0f172a' }}>{announcement.title}</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.75rem' }}>
                  {new Date(announcement.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>{announcement.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Services Section */}
      <section className="services section container animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <h2 className="section-title text-gradient" style={{ textAlign: 'center', display: 'block', width: '100%', margin: '0 auto 2rem auto' }}>What would you like to do?</h2>
        <div className="services-grid">
          <div className="service-card glass-panel">
            <div className="icon-wrapper text-success"><QrCode size={40} /></div>
            <h3>Scan QR Code</h3>
            <p>Scan the QR code in the park to report an issue quickly.</p>
            <Link to="/scan" className="service-link text-success">Scan Now &rarr;</Link>
          </div>
          
          <div className="service-card glass-panel">
            <div className="icon-wrapper text-warning"><FileText size={40} /></div>
            <h3>Submit Complaint</h3>
            <p>Submit a complaint about any issue in the park.</p>
            <Link to="/complaint" className="service-link text-success">Submit Now &rarr;</Link>
          </div>
          
          <div className="service-card glass-panel">
            <div className="icon-wrapper" style={{color: '#3b82f6'}}><Search size={40} /></div>
            <h3>Track Complaint Status</h3>
            <p>Track the status of your submitted complaint.</p>
            <Link to="/track-complaint" className="service-link" style={{color: '#3b82f6'}}>Track Now &rarr;</Link>
          </div>
          
          <div className="service-card glass-panel">
            <div className="icon-wrapper" style={{color: '#8b5cf6'}}><MessageSquare size={40} /></div>
            <h3>Give Feedback</h3>
            <p>Share your feedback and help us improve.</p>
            <Link to="/feedback" className="service-link" style={{color: '#8b5cf6'}}>Feedback Now &rarr;</Link>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="how-it-works section container">
        <h2 className="section-title" style={{ textAlign: 'center', display: 'block', width: '100%', margin: '0 auto 2rem auto' }}>How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Scan QR Code</h4>
            <p>Scan the QR code available in the park.</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>Submit Complaint</h4>
            <p>Fill in the details and submit your complaint.</p>
          </div>
          <div className="step">
            <div className="step-number" style={{backgroundColor: '#3b82f6'}}>3</div>
            <h4>Authority Reviews</h4>
            <p>Our team reviews and takes necessary action.</p>
          </div>
          <div className="step">
            <div className="step-number" style={{backgroundColor: '#3b82f6'}}>4</div>
            <h4>Track Resolution</h4>
            <p>Track the status and get notified on resolution.</p>
          </div>
        </div>
      </section>



      <Footer />
    </div>
  );
};

export default Home;
