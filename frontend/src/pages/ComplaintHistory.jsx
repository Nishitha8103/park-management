import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText } from 'lucide-react';
import './ComplaintHistory.css';

const ComplaintHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      let backendComplaints = null;
      const userStr = localStorage.getItem('user');
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.phone) {
            const res = await fetch(`/api/complaints?userPhone=${user.phone}`);
            if (res.ok) {
              const data = await res.json();
              backendComplaints = data.map(c => ({
                id: c.complaintNumber,
                date: new Date(c.createdAt).toISOString().split('T')[0],
                park: c.parkName || (c.park ? c.park.name : 'Unknown Park'),
                category: c.category,
                title: c.description,
                status: c.status
              }));
            }
          }
        } catch (error) {
          console.error("Failed to fetch backend complaints:", error);
        }
      }

      if (backendComplaints && backendComplaints.length > 0) {
        setHistory(backendComplaints);
        localStorage.setItem('my_complaints', JSON.stringify(backendComplaints));
      } else {
        const stored = localStorage.getItem('my_complaints');
        if (stored) {
          try {
            setHistory(JSON.parse(stored));
          } catch (e) {
            setHistory([]);
          }
        } else {
          const defaults = [
            { id: 'CMP392862255', date: '2026-07-04', park: 'Central Park', category: 'Cleanliness', title: 'Trash not collected', status: 'Submitted' },
            { id: 'CMP123456789', date: '2026-07-01', park: 'Green Valley Park', category: 'Broken Facility', title: 'Swing set broken', status: 'Under Review' },
            { id: 'CMP987654321', date: '2026-06-15', park: 'Central Park', category: 'Lighting', title: 'Path lights out', status: 'Resolved' }
          ];
          localStorage.setItem('my_complaints', JSON.stringify(defaults));
          setHistory(defaults);
        }
      }
    };

    loadHistory();
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Submitted': return '#3b82f6';
      case 'Under Review': return '#f59e0b';
      case 'Resolved': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="history-page">
      <div className="history-card">
        <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={24} color="#059669" />
              My Complaints Notifications ({history.length})
            </h2>
            <p>View all complaints submitted by you and track their status</p>
          </div>
        </div>
        
        <div className="history-list">
          {history.length === 0 ? (
            <div className="no-history">
              <p>You haven't submitted any complaints yet.</p>
            </div>
          ) : (
            history.map((complaint) => (
              <div key={complaint.id} className="history-item">
                <div className="history-item-header">
                  <div className="history-item-title-group">
                    <h3>{complaint.title}</h3>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: `${getStatusColor(complaint.status)}15`, color: getStatusColor(complaint.status) }}
                    >
                      {complaint.status}
                    </span>
                  </div>
                  <span className="history-date">{complaint.date}</span>
                </div>
                
                <div className="history-item-details">
                  <div className="detail-group">
                    <span className="detail-label">Complaint ID</span>
                    <span className="detail-value id-highlight">{complaint.id}</span>
                  </div>
                  <div className="detail-group">
                    <span className="detail-label">Park</span>
                    <span className="detail-value">{complaint.park}</span>
                  </div>
                  <div className="detail-group">
                    <span className="detail-label">Category</span>
                    <span className="detail-value">{complaint.category}</span>
                  </div>
                </div>
                
                <div className="history-item-actions">
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate('/track-complaint', { state: { id: complaint.id } })}
                  >
                    <Search size={16} style={{ marginRight: '6px' }} />
                    Track Status
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintHistory;
