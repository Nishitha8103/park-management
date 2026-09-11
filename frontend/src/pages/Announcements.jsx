import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Megaphone, Calendar, Clock, AlertCircle } from 'lucide-react';
import './Announcements.css';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        // Public route to fetch active announcements
        const response = await axios.get('/api/announcements');
        setAnnouncements(response.data);
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const getTypeBadgeClass = (type) => {
    switch(type) {
      case 'Park Closure': return 'announcement-type-park-closure';
      case 'Maintenance': return 'announcement-type-maintenance';
      case 'Emergency': return 'announcement-type-emergency';
      case 'Event': return 'announcement-type-event';
      case 'Information': return 'announcement-type-information';
      default: return 'announcement-type-general';
    }
  };

  const getPriorityClass = (priority) => {
    if (priority === 'Urgent') return 'announcement-priority-urgent';
    if (priority === 'Important') return 'announcement-priority-important';
    return '';
  };

  if (loading) {
    return <div className="loading-state">Loading latest announcements...</div>;
  }

  return (
    <div className="announcements-container">
      <div className="announcements-header">
        <div className="header-title-group">
          <div className="header-icon-box">
            <Megaphone size={26} color="#059669" />
          </div>
          <div>
            <h1>Public Announcements</h1>
            <p>Stay updated with official notices, park closures, and public updates</p>
          </div>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="empty-state">
          <Megaphone size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
          <h3>No Announcements</h3>
          <p>There are currently no active announcements.</p>
        </div>
      ) : (
        <div className="announcements-grid">
          {announcements.map((announcement) => (
            <div 
              key={announcement._id} 
              className={`announcement-card ${getPriorityClass(announcement.priority)}`}
            >
              <div className="announcement-header">
                <h3 className="announcement-title">{announcement.title}</h3>
                <span className={`announcement-type-badge ${getTypeBadgeClass(announcement.type)}`}>
                  {announcement.type}
                </span>
              </div>
              
              <div className="announcement-content">
                {announcement.content}
              </div>

              <div className="announcement-footer">
                <div className="announcement-footer-row">
                  <Calendar size={16} />
                  <span>Posted: {new Date(announcement.date).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}</span>
                </div>
                {announcement.endDate && (
                  <div className="announcement-footer-row" style={{ color: '#ef4444' }}>
                    <AlertCircle size={16} />
                    <span>Valid until: {new Date(announcement.endDate).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcements;
