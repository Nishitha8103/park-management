import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Leaf, MessageSquareHeart, Star, Building, CheckCircle2, Tag } from 'lucide-react';
import './Feedback.css';

const Feedback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state || {};

  const [parkName, setParkName] = useState(navState.parkName || '');
  const [corporation, setCorporation] = useState(navState.corporation || '');
  const [zone, setZone] = useState(navState.zone || '');
  const [ward, setWard] = useState(navState.ward || '');
  const [overallRating, setOverallRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(4);
  const [maintenanceRating, setMaintenanceRating] = useState(5);
  const [comments, setComments] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const QUICK_TAGS = [
    "🧹 Clean & Well Maintained",
    "💡 Good Lighting",
    "🚰 Drinking Water Available",
    "🎠 Safe Children Play Equipment",
    "🌺 Beautiful Greenery",
    "🛡️ Helpful Security Staff"
  ];

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      const nextTags = selectedTags.filter(t => t !== tag);
      setSelectedTags(nextTags);
      updateCommentsWithTags(nextTags);
    } else {
      const nextTags = [...selectedTags, tag];
      setSelectedTags(nextTags);
      updateCommentsWithTags(nextTags);
    }
  };

  const updateCommentsWithTags = (tags) => {
    let manualText = comments;
    QUICK_TAGS.forEach(t => {
      manualText = manualText.replace(t + '. ', '').replace(t, '');
    });
    manualText = manualText.trim();
    const tagText = tags.join('. ');
    const combined = tagText ? (manualText ? `${tagText}. ${manualText}` : tagText) : manualText;
    setComments(combined.slice(0, 500));
  };

  const getRatingLabel = (val) => {
    switch (val) {
      case 5: return 'Excellent 🌟';
      case 4: return 'Very Good 👍';
      case 3: return 'Average 😐';
      case 2: return 'Needs Improvement 👎';
      case 1: return 'Poor 🔴';
      default: return '';
    }
  };

  const renderStars = (rating, setRating) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`star-btn ${star <= rating ? 'filled' : ''}`}
            title={`${star} Star`}
          >
            <Star
              size={22}
              fill={star <= rating ? "#fbbf24" : "none"}
              color={star <= rating ? "#f59e0b" : "#94a3b8"}
              strokeWidth={1.5}
            />
          </button>
        ))}
        <span className="rating-text-badge">{getRatingLabel(rating)}</span>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!parkName.trim()) {
      setErrorMsg('Park Name is required');
      return;
    }
    if (comments.trim() && comments.trim().length < 5) {
      setErrorMsg('If providing comments, they must be at least 5 characters');
      return;
    }

    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('user') || 'null');
    } catch (e) {}
    
    try {
      const payload = {
        parkName: parkName.trim(),
        corporation: corporation.trim(),
        zone: zone.trim(),
        ward: ward.trim(),
        overallRating,
        cleanlinessRating,
        maintenanceRating,
        comments: comments.trim() || 'No comments provided',
        tags: selectedTags,
        userName: user?.name || 'Public Citizen',
        userEmail: user?.email || '',
        userPhone: user?.phone || '',
        userId: user?._id || user?.id || null
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      const newFb = {
        id: data.feedback?.feedbackId || ('FB' + Math.floor(1000 + Math.random() * 9000)),
        date: new Date().toISOString().split('T')[0],
        parkName: parkName || 'General Feedback',
        zoneWard: `${zone || 'N/A'} • ${ward || 'N/A'}`,
        overallRating,
        cleanlinessRating,
        maintenanceRating,
        comments: comments || 'No comments provided',
        status: 'Sent to Admin'
      };
      
      const existing = JSON.parse(localStorage.getItem('my_feedbacks') || '[]');
      localStorage.setItem('my_feedbacks', JSON.stringify([newFb, ...existing]));
      window.dispatchEvent(new Event('feedbacks-updated'));
    } catch (err) {
      console.error("Error submitting feedback:", err);
    }
    
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="feedback-page-container">
        <div className="bg-shape bg-shape-1"></div>
        <div className="bg-shape bg-shape-2"></div>
        <div className="success-feedback-card">
          <div className="success-icon-wrap">
            <CheckCircle2 size={64} color="#10b981" />
          </div>
          <h2>Feedback Submitted Successfully!</h2>
          <p>Thank you for contributing! Your suggestions are sent directly to park administration officials to maintain clean, beautiful green spaces.</p>
          <div className="success-actions">
            <button className="btn-primary-action" onClick={() => navigate('/')}>
              Return to Home Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-page-container">
      {/* Background Orbs */}
      <div className="bg-shape bg-shape-1"></div>
      <div className="bg-shape bg-shape-2"></div>

      <div className="feedback-wrapper">
        
        {/* Header Banner */}
        <div className="feedback-compact-header">
          <div className="header-top-row">
            <button className="back-button" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} /> Back
            </button>
          </div>
          <div className="header-main-row">
            <h1>Give Your Feedback 🌿</h1>
            <p>Help improve cleanliness, greenery, and facilities in your community park.</p>
          </div>
        </div>

        {/* 2-Column Form Cards Grid */}
        <form className="feedback-grid-form" onSubmit={handleSubmit}>
          
          {/* Left Column Card: Details & Ratings */}
          <div className="feedback-card-panel">
            <div className="form-section-title">
              <Building size={18} color="#10b981" />
              <h3>1. Park Location & Details</h3>
            </div>

            <div className="form-row-compact">
              <div className="form-group">
                <label>Park Name *</label>
                <input
                  type="text"
                  value={parkName}
                  onChange={(e) => setParkName(e.target.value)}
                  placeholder="Enter park name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Corporation / Authority</label>
                <input
                  type="text"
                  value={corporation}
                  onChange={(e) => setCorporation(e.target.value)}
                  placeholder="e.g. BBMP / City Corp"
                />
              </div>
            </div>

            <div className="form-row-compact">
              <div className="form-group">
                <label>Zone</label>
                <input
                  type="text"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="Enter zone"
                />
              </div>

              <div className="form-group">
                <label>Ward</label>
                <input
                  type="text"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="Enter ward"
                />
              </div>
            </div>

            <div className="form-section-title" style={{ marginTop: '0.5rem' }}>
              <MessageSquareHeart size={18} color="#10b981" />
              <h3>2. Rate Your Experience</h3>
            </div>

            <div className="ratings-container">
              <div className="rating-card-compact">
                <label>Overall Experience</label>
                {renderStars(overallRating, setOverallRating)}
              </div>

              <div className="rating-card-compact">
                <label>Cleanliness & Hygiene</label>
                {renderStars(cleanlinessRating, setCleanlinessRating)}
              </div>

              <div className="rating-card-compact">
                <label>Maintenance & Greenery</label>
                {renderStars(maintenanceRating, setMaintenanceRating)}
              </div>
            </div>
          </div>

          {/* Right Column Card: Suggestions, Tags & Submit */}
          <div className="feedback-card-panel">
            <div className="form-section-title">
              <Leaf size={18} color="#10b981" />
              <h3>3. Suggestions & Feedback</h3>
            </div>

            <div className="quick-tags-section">
              <label className="tags-label">
                <Tag size={14} color="#10b981" /> Quick Highlights (Click to add)
              </label>
              <div className="tags-chips-wrapper">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-chip ${selectedTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Your Suggestions / Comments</label>
              <div className="textarea-container">
                <textarea
                  placeholder="Tell us what you loved or what needs improvement (e.g. lighting, benches, play equipment)..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  maxLength={500}
                  rows={4}
                ></textarea>
                <span className="char-count">{comments.length} / 500</span>
              </div>
            </div>

            <div className="assurance-banner">
              <Leaf size={18} color="#10b981" />
              <span>Your feedback will be reviewed by the concerned park authorities.</span>
            </div>

            {errorMsg && <div style={{ color: 'red', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 'bold', textAlign: 'center' }}>{errorMsg}</div>}

            <button type="submit" className="submit-btn-vibrant">
              <Send size={18} /> Submit Park Feedback ➔
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default Feedback;

