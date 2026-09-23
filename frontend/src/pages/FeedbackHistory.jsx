import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Star } from 'lucide-react';
import './ComplaintHistory.css';

const FeedbackHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      let localFeedbacks = [];
      const stored = localStorage.getItem('my_feedbacks');
      if (stored) {
        try {
          localFeedbacks = JSON.parse(stored);
        } catch (e) {
          localFeedbacks = [];
        }
      }

      let user = null;
      try {
        user = JSON.parse(localStorage.getItem('user') || 'null');
      } catch (e) {}

      try {
        const queryParams = new URLSearchParams();
        if (user?._id || user?.id) queryParams.append('userId', user._id || user.id);
        if (user?.email) queryParams.append('email', user.email);

        const res = await fetch(`/api/feedback/my?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const formatted = data.map(item => ({
              id: item.feedbackId || item._id,
              date: item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
              parkName: item.parkName || 'Park Feedback',
              zoneWard: `${item.zone || 'N/A'} • ${item.ward || 'N/A'}`,
              overallRating: item.overallRating,
              cleanlinessRating: item.cleanlinessRating,
              maintenanceRating: item.maintenanceRating,
              comments: item.comments,
              status: item.status || 'Sent to Admin'
            }));
            setHistory(formatted);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote feedback, using local:", err);
      }

      if (localFeedbacks.length > 0) {
        setHistory(localFeedbacks);
      } else {
        const defaults = [
          { id: 'FB8201', date: '2026-07-10', parkName: 'Madhavan Park', zoneWard: 'South Zone • Ward 4', overallRating: 5, comments: 'Clean and peaceful environment.', status: 'Sent to Admin' },
          { id: 'FB5102', date: '2026-06-20', parkName: 'Central Park', zoneWard: 'Zone 1 • Ward 10', overallRating: 4, comments: 'Good maintenance.', status: 'Sent to Admin' }
        ];
        setHistory(defaults);
      }
    };

    loadHistory();
    window.addEventListener('feedbacks-updated', loadHistory);
    return () => window.removeEventListener('feedbacks-updated', loadHistory);
  }, []);

  const getStatusColor = (status) => {
    return '#10b981'; // Green for Sent to Admin
  };

  return (
    <div className="history-page">
      <div className="history-card">
        <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={24} color="#059669" />
              My Feedback Notifications ({history.length})
            </h2>
            <p>View all feedback submitted by you</p>
          </div>
        </div>
        
        <div className="history-list">
          {history.length === 0 ? (
            <div className="no-history">
              <p>You haven't submitted any feedback yet.</p>
            </div>
          ) : (
            history.map((fb) => (
              <div key={fb.id} className="history-item">
                <div className="history-item-header">
                  <div className="history-item-title-group">
                    <h3>{fb.parkName}</h3>
                  </div>
                  <span className="history-date">{fb.date}</span>
                </div>
                
                <div className="history-item-details">
                  <div className="detail-group">
                    <span className="detail-label">Feedback ID</span>
                    <span className="detail-value id-highlight">{fb.id}</span>
                  </div>
                  <div className="detail-group">
                    <span className="detail-label">Rating</span>
                    <span className="detail-value">{fb.overallRating} / 5</span>
                  </div>
                  <div className="detail-group">
                    <span className="detail-label">Comments</span>
                    <span className="detail-value">{fb.comments}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackHistory;
