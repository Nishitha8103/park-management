import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Map, Calendar, Settings, Package, ClipboardCheck, CheckCircle2, Navigation } from 'lucide-react';
import './GovParkDetails.css';

const GovParkDetails = () => {
  const { id } = useParams();

  // In a real app, you would fetch park details based on the ID.
  // For now, using mock data.
  const park = {
    id: id || '1',
    name: 'Cubbon Park',
    location: '111 - Shantala Nagar, East Zone',
    corporation: 'BBMP',
    status: 'Excellent',
    area: '300 Acres',
    opened: '1870',
    maintenance: 'Daily',
    facilities: 12,
    assets: 45,
    inspections: 128,
    img: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a5d?auto=format&fit=crop&q=80&w=1200'
  };

  return (
    <div className="gov-park-details-page">
      <div className="gov-page-header">
        <Link to="/gov-dashboard/parks" className="gov-back-link">
          <ChevronLeft size={16} /> Back to Assigned Parks
        </Link>
      </div>
      
      {/* Hero Section */}
      <div className="gov-park-hero-card">
        <div className="park-hero-image" style={{ backgroundImage: `url(${park.img})` }}></div>
        <div className="park-hero-content">
          <div className="park-hero-header flex-between">
            <div>
              <h1 className="park-hero-title">{park.name}</h1>
              <p className="park-hero-location"><Navigation size={14} className="mr-4" /> {park.location}</p>
            </div>
            <span className="gov-status-badge status-excellent">
              {park.status}
            </span>
          </div>
          
          <div className="park-hero-stats">
            <div className="hero-stat">
              <span className="stat-label">Corporation</span>
              <span className="stat-value">{park.corporation}</span>
            </div>
            <div className="hero-stat">
              <span className="stat-label">Area</span>
              <span className="stat-value">{park.area}</span>
            </div>
            <div className="hero-stat">
              <span className="stat-label">Established</span>
              <span className="stat-value">{park.opened}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="gov-park-grid">
        {/* Left Column: Quick Stats */}
        <div className="gov-card">
          <div className="gov-card-header">
            <h3 className="gov-card-title">Park Overview</h3>
          </div>
          <div className="gov-card-body p-24">
            <div className="gov-quick-stats">
              <div className="quick-stat-box">
                <div className="quick-stat-icon green-bg"><ClipboardCheck size={20} color="#16a34a" /></div>
                <div className="quick-stat-info">
                  <h4>{park.inspections}</h4>
                  <p>Total Inspections</p>
                </div>
              </div>
              <div className="quick-stat-box">
                <div className="quick-stat-icon blue-bg"><Package size={20} color="#3b82f6" /></div>
                <div className="quick-stat-info">
                  <h4>{park.assets}</h4>
                  <p>Tracked Assets</p>
                </div>
              </div>
              <div className="quick-stat-box">
                <div className="quick-stat-icon purple-bg"><Settings size={20} color="#8b5cf6" /></div>
                <div className="quick-stat-info">
                  <h4>{park.maintenance}</h4>
                  <p>Maintenance Freq.</p>
                </div>
              </div>
              <div className="quick-stat-box">
                <div className="quick-stat-icon teal-bg"><Map size={20} color="#14b8a6" /></div>
                <div className="quick-stat-info">
                  <h4>{park.facilities}</h4>
                  <p>Key Facilities</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Facilities & Action */}
        <div className="gov-card">
          <div className="gov-card-header">
            <h3 className="gov-card-title">Available Facilities</h3>
          </div>
          <div className="gov-card-body p-24">
            <div className="facilities-list-grid">
              <div className="facility-item">
                <CheckCircle2 size={18} className="facility-icon" />
                <span>Walking Track</span>
              </div>
              <div className="facility-item">
                <CheckCircle2 size={18} className="facility-icon" />
                <span>Playground Equipment</span>
              </div>
              <div className="facility-item">
                <CheckCircle2 size={18} className="facility-icon" />
                <span>Seating Benches</span>
              </div>
              <div className="facility-item">
                <CheckCircle2 size={18} className="facility-icon" />
                <span>Drinking Water</span>
              </div>
              <div className="facility-item">
                <CheckCircle2 size={18} className="facility-icon" />
                <span>LED Lighting</span>
              </div>
              <div className="facility-item">
                <CheckCircle2 size={18} className="facility-icon" />
                <span>Public Toilets</span>
              </div>
              <div className="facility-item">
                <CheckCircle2 size={18} className="facility-icon" />
                <span>Outdoor Gym</span>
              </div>
              <div className="facility-item">
                <CheckCircle2 size={18} className="facility-icon" />
                <span>Gazebo</span>
              </div>
            </div>

            <div className="mt-24 pt-24 border-top">
              <Link to="/gov-dashboard/inspections" className="btn-primary w-100 justify-center">
                <ClipboardCheck size={18} /> New Inspection Report
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovParkDetails;
