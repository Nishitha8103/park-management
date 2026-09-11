import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-section">
          <h3 className="footer-title">Parks Monitoring System</h3>
          <p className="footer-desc">
            A citizen friendly initiative to monitor, maintain and improve our parks for a better tomorrow.
          </p>
          <div className="social-links">
            <a href="#" className="social-icon" style={{backgroundColor: '#1877F2', color: 'white', fontWeight: 'bold'}}>FB</a>
            <a href="#" className="social-icon" style={{backgroundColor: '#1DA1F2', color: 'white', fontWeight: 'bold'}}>TW</a>
            <a href="#" className="social-icon" style={{background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: 'white', fontWeight: 'bold'}}>IG</a>
          </div>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/parks">Parks</Link></li>
            <li><Link to="/complaint">Track Complaint</Link></li>
            <li><Link to="/feedback">Feedback</Link></li>
            <li><Link to="/help">Help Center</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Support</h4>
          <ul className="footer-links">
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/guide">User Guide</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms & Conditions</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-subtitle">Contact Us</h4>
          <ul className="footer-contact">
            <li>📍 Municipal Corporation</li>
            <li>📞 123-456-7890</li>
            <li>✉️ support@parksms.com</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 Parks Monitoring System. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
