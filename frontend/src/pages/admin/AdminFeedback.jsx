import { useState, useEffect } from 'react';
import { 
  Star, 
  Search, 
  Trash2, 
  Sparkles, 
  Building, 
  MapPin, 
  User, 
  Calendar, 
  Filter, 
  ThumbsUp, 
  MessageSquare,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import './AdminFeedback.css';

const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    averageOverall: 0,
    averageCleanliness: 0,
    averageMaintenance: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [parkFilter, setParkFilter] = useState('');

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const [fbRes, statsRes] = await Promise.all([
        axios.get('/api/feedback/all'),
        axios.get('/api/feedback/stats').catch(() => ({ data: null }))
      ]);

      setFeedbacks(fbRes.data || []);
      if (statsRes && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await axios.delete(`/api/feedback/${id}`);
      setFeedbacks(prev => prev.filter(f => f._id !== id));
      fetchFeedbacks();
    } catch (err) {
      console.error('Failed to delete feedback:', err);
      alert('Failed to delete feedback');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="admin-fb-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= rating ? "#f59e0b" : "#e2e8f0"}
            color={star <= rating ? "#f59e0b" : "#cbd5e1"}
          />
        ))}
      </div>
    );
  };

  const filteredFeedbacks = feedbacks.filter(fb => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (fb.feedbackId && fb.feedbackId.toLowerCase().includes(term)) ||
      (fb.parkName && fb.parkName.toLowerCase().includes(term)) ||
      (fb.userName && fb.userName.toLowerCase().includes(term)) ||
      (fb.comments && fb.comments.toLowerCase().includes(term)) ||
      (fb.zone && fb.zone.toLowerCase().includes(term)) ||
      (fb.ward && fb.ward.toLowerCase().includes(term));

    const matchesRating = ratingFilter ? Number(fb.overallRating) === Number(ratingFilter) : true;
    const matchesPark = parkFilter ? fb.parkName?.toLowerCase().includes(parkFilter.toLowerCase()) : true;

    return matchesSearch && matchesRating && matchesPark;
  });

  const uniqueParks = Array.from(new Set(feedbacks.map(f => f.parkName).filter(Boolean)));

  return (
    <div className="admin-feedback-page">
      {/* Header */}
      <div className="admin-fb-header">
        <div>
          <div className="admin-fb-badge">
            <Sparkles size={14} /> Citizen Experience & Ratings
          </div>
          <h1>Public Feedback & Reviews</h1>
          <p>Monitor citizen reviews, satisfaction scores, and feedback for all community parks.</p>
        </div>
        <button className="admin-fb-refresh-btn" onClick={fetchFeedbacks} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Refresh
        </button>
      </div>

      {/* Analytics KPI Row */}
      <div className="admin-fb-stats-grid">
        <div className="admin-fb-stat-card primary">
          <div className="stat-icon-wrapper">
            <MessageSquare size={24} />
          </div>
          <div className="stat-data">
            <span className="stat-num">{stats.total || feedbacks.length}</span>
            <span className="stat-title">Total Submissions</span>
          </div>
        </div>

        <div className="admin-fb-stat-card rating-highlight">
          <div className="stat-icon-wrapper star-gold">
            <Star size={24} />
          </div>
          <div className="stat-data">
            <div className="rating-flex">
              <span className="stat-num">{stats.averageOverall || '0.0'}</span>
              <span className="stat-scale">/ 5.0</span>
            </div>
            <span className="stat-title">Overall Satisfaction</span>
          </div>
        </div>

        <div className="admin-fb-stat-card success">
          <div className="stat-icon-wrapper">
            <Sparkles size={24} />
          </div>
          <div className="stat-data">
            <div className="rating-flex">
              <span className="stat-num">{stats.averageCleanliness || '0.0'}</span>
              <span className="stat-scale">/ 5.0</span>
            </div>
            <span className="stat-title">Cleanliness Score</span>
          </div>
        </div>

        <div className="admin-fb-stat-card info">
          <div className="stat-icon-wrapper">
            <ThumbsUp size={24} />
          </div>
          <div className="stat-data">
            <div className="rating-flex">
              <span className="stat-num">{stats.averageMaintenance || '0.0'}</span>
              <span className="stat-scale">/ 5.0</span>
            </div>
            <span className="stat-title">Maintenance Score</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-fb-controls">
        <div className="admin-fb-search">
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="Search by ID, citizen name, park, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="admin-fb-filters">
          <select value={parkFilter} onChange={(e) => setParkFilter(e.target.value)}>
            <option value="">All Parks</option>
            {uniqueParks.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
            <option value="">All Ratings</option>
            <option value="5">5 Stars ⭐⭐⭐⭐⭐</option>
            <option value="4">4 Stars ⭐⭐⭐⭐</option>
            <option value="3">3 Stars ⭐⭐⭐</option>
            <option value="2">2 Stars ⭐⭐</option>
            <option value="1">1 Star ⭐</option>
          </select>
        </div>
      </div>

      {/* Feedback Feed / Table */}
      <div className="admin-fb-content-card">
        {loading ? (
          <div className="admin-fb-empty">
            <RefreshCw size={32} className="spinning" color="#10b981" />
            <p>Loading public feedback entries...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="admin-fb-empty">
            <MessageSquare size={48} color="#94a3b8" />
            <h3>No Feedback Found</h3>
            <p>No public feedback matching your selected filters or search terms.</p>
          </div>
        ) : (
          <div className="admin-fb-table-wrap">
            <table className="admin-fb-table">
              <thead>
                <tr>
                  <th>Feedback ID</th>
                  <th>Park & Location</th>
                  <th>Citizen Details</th>
                  <th>Overall Rating</th>
                  <th>Criteria Scores</th>
                  <th>Feedback / Highlights</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.map((fb) => (
                  <tr key={fb._id || fb.feedbackId}>
                    <td>
                      <span className="admin-fb-id-pill">
                        {fb.feedbackId || 'FB-' + fb._id?.slice(-4)}
                      </span>
                    </td>
                    <td>
                      <div className="admin-fb-park-cell">
                        <strong>{fb.parkName}</strong>
                        <span>
                          <MapPin size={12} /> {fb.zone || 'Zone N/A'} • {fb.ward || 'Ward N/A'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-fb-user-cell">
                        <div className="admin-fb-avatar">
                          <User size={14} />
                        </div>
                        <div>
                          <strong>{fb.userName || fb.user?.name || 'Public Citizen'}</strong>
                          <span>{fb.userEmail || fb.user?.email || fb.userPhone || 'Verified Citizen'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-fb-rating-badge">
                        {renderStars(fb.overallRating || 5)}
                        <span className="rating-val">{fb.overallRating || 5}.0</span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-fb-breakdown">
                        <span title="Cleanliness Rating" className="metric-chip clean">
                          🧹 Clean: {fb.cleanlinessRating || 4}★
                        </span>
                        <span title="Maintenance Rating" className="metric-chip maint">
                          🌿 Maint: {fb.maintenanceRating || 5}★
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-fb-comment-box">
                        <p className="admin-fb-comment-text">"{fb.comments || 'No written comment'}"</p>
                        {fb.tags && fb.tags.length > 0 && (
                          <div className="admin-fb-tag-row">
                            {fb.tags.map((t, idx) => (
                              <span key={idx} className="admin-fb-tag-pill">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="admin-fb-date">
                        <Calendar size={13} /> {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-fb-delete-btn"
                        onClick={() => handleDelete(fb._id)}
                        title="Delete Feedback"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeedback;
