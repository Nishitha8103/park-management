import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AlertOctagon, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  Filter, 
  Download, 
  Printer, 
  Eye, 
  RefreshCw, 
  Search, 
  Activity, 
  ExternalLink,
  Users,
  AlertTriangle,
  X
} from 'lucide-react';
import './AdminEmergencyMonitoring.css';

export default function AdminEmergencyMonitoring() {
  const [emergencies, setEmergencies] = useState([]);
  const [stats, setStats] = useState({
    totalCount: 0,
    activeCount: 0,
    newCount: 0,
    inProgressCount: 0,
    resolvedTodayCount: 0,
    avgResponseTimeMinutes: 0
  });
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [parkFilter, setParkFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected for Modal
  const [selectedEmergency, setSelectedEmergency] = useState(null);

  const fetchAdminEmergencies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (parkFilter !== 'All') params.append('parkId', parkFilter);
      if (typeFilter !== 'All') params.append('emergencyType', typeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await axios.get(`/api/emergencies/admin?${params.toString()}`);
      if (res.data) {
        setEmergencies(res.data.emergencies || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load admin emergencies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchParksList = async () => {
      try {
        const res = await axios.get('/api/parks');
        if (Array.isArray(res.data)) setParks(res.data);
      } catch (e) {}
    };
    fetchParksList();
  }, []);

  useEffect(() => {
    fetchAdminEmergencies();
  }, [statusFilter, parkFilter, typeFilter, startDate, endDate]);

  const handleExportCSV = () => {
    if (emergencies.length === 0) {
      alert('No emergency records to export.');
      return;
    }

    const headers = ['Emergency ID', 'Emergency Type', 'Citizen Name', 'Citizen Phone', 'Park Name', 'District', 'Latitude', 'Longitude', 'Landmark', 'Status', 'Reported Time', 'Assigned Security'];
    const rows = emergencies.map(e => [
      e.emergencyId,
      e.emergencyType,
      e.citizenName,
      e.citizenPhone,
      e.parkName || e.park?.name,
      e.district?.name || e.district || '',
      e.latitude,
      e.longitude,
      `"${(e.landmarkDescription || e.address || '').replace(/"/g, '""')}"`,
      e.status,
      new Date(e.createdAt).toLocaleString('en-IN'),
      `"${(e.assignedSecurityStaff || []).map(s => s.name || s).join(', ')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BBMP_Emergency_SOS_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEmergencies = emergencies.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.emergencyId?.toLowerCase().includes(q) ||
      e.citizenName?.toLowerCase().includes(q) ||
      e.citizenPhone?.includes(q) ||
      e.parkName?.toLowerCase().includes(q) ||
      e.emergencyType?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-emerg-page">
      
      {/* Page Title & Controls */}
      <div className="admin-emerg-header">
        <div>
          <h2>🚨 Emergency Assistance & SOS Monitoring</h2>
          <p>Real-time oversight of all citizen emergency alerts, assigned park security responders, and response times.</p>
        </div>

        <div className="admin-header-actions">
          <button className="btn-action-outline" onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </button>
          <button className="btn-action-outline" onClick={() => window.print()}>
            <Printer size={15} /> Print Report
          </button>
          <button className="btn-action-primary" onClick={fetchAdminEmergencies}>
            <RefreshCw size={15} className={loading ? 'spinning' : ''} /> Refresh Data
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card total">
          <div className="kpi-icon-box"><AlertOctagon size={22} /></div>
          <div>
            <span className="kpi-number">{stats.totalCount}</span>
            <span className="kpi-label">Total SOS Incidents</span>
          </div>
        </div>

        <div className="admin-kpi-card new-alert">
          <div className="kpi-icon-box"><ShieldAlert size={22} /></div>
          <div>
            <span className="kpi-number">{stats.newCount}</span>
            <span className="kpi-label">New / Unacknowledged</span>
          </div>
        </div>

        <div className="admin-kpi-card in-progress">
          <div className="kpi-icon-box"><Activity size={22} /></div>
          <div>
            <span className="kpi-number">{stats.inProgressCount}</span>
            <span className="kpi-label">Assistance In Progress</span>
          </div>
        </div>

        <div className="admin-kpi-card resolved">
          <div className="kpi-icon-box"><CheckCircle2 size={22} /></div>
          <div>
            <span className="kpi-number">{stats.resolvedTodayCount}</span>
            <span className="kpi-label">Resolved Today</span>
          </div>
        </div>

        <div className="admin-kpi-card response-time">
          <div className="kpi-icon-box"><Clock size={22} /></div>
          <div>
            <span className="kpi-number">{stats.avgResponseTimeMinutes} min</span>
            <span className="kpi-label">Avg Response Time</span>
          </div>
        </div>
      </div>

      {/* Multi-Criteria Filters Bar */}
      <div className="admin-filters-card">
        <div className="filter-item search">
          <label>Search</label>
          <div className="search-wrap">
            <Search size={15} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Search Ticket, Citizen, Phone, Park..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-item">
          <label>Emergency Type</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="All">All Emergency Types</option>
            <option value="Medical Emergency">Medical Emergency</option>
            <option value="Unconscious / Fainted Person">Unconscious / Fainted Person</option>
            <option value="Serious Injury">Serious Injury</option>
            <option value="Fracture / Broken Bone">Fracture / Broken Bone</option>
            <option value="Severe Bleeding">Severe Bleeding</option>
            <option value="Accident">Accident</option>
            <option value="Other Emergency">Other Emergency</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Emergency Reported">Emergency Reported (New)</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Assistance in Progress">Assistance in Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Park Location</label>
          <select value={parkFilter} onChange={(e) => setParkFilter(e.target.value)}>
            <option value="All">All Parks</option>
            {parks.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div className="filter-item">
          <label>End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* Emergencies Table */}
      <div className="admin-table-card">
        {loading ? (
          <div className="admin-loading-state">
            <RefreshCw size={24} className="spinning" />
            <p>Loading emergency incidents data...</p>
          </div>
        ) : filteredEmergencies.length === 0 ? (
          <div className="admin-empty-state">
            <ShieldCheck size={40} color="#10b981" />
            <h3>No Emergency Incidents Found</h3>
            <p>No incidents match the chosen filters and search criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-emerg-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Emergency Type</th>
                  <th>Citizen & Contact</th>
                  <th>Park & Exact Spot</th>
                  <th>Live Coordinates</th>
                  <th>Assigned Security</th>
                  <th>Status</th>
                  <th>Reported At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmergencies.map((em) => {
                  const isNew = em.status === 'Emergency Reported';
                  return (
                    <tr key={em._id} className={isNew ? 'row-critical' : ''}>
                      <td className="cell-id">
                        <strong>{em.emergencyId}</strong>
                      </td>
                      <td className="cell-type">
                        <span className="type-badge-red">{em.emergencyType}</span>
                      </td>
                      <td className="cell-citizen">
                        <div className="citizen-name">{em.citizenName}</div>
                        <a href={`tel:${em.citizenPhone}`} className="citizen-phone">
                          <Phone size={11} /> {em.citizenPhone}
                        </a>
                      </td>
                      <td className="cell-park">
                        <div className="park-name">{em.parkName || em.park?.name}</div>
                        <span className="park-spot">{em.landmarkDescription || em.address}</span>
                      </td>
                      <td className="cell-coords">
                        <a 
                          href={`https://www.google.com/maps?q=${em.latitude},${em.longitude}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="coords-link"
                        >
                          <MapPin size={12} /> {em.latitude.toFixed(4)}°, {em.longitude.toFixed(4)}°
                        </a>
                      </td>
                      <td className="cell-staff">
                        {em.assignedSecurityStaff && em.assignedSecurityStaff.length > 0 ? (
                          <span className="staff-pill">{em.assignedSecurityStaff.map(s => s.name || s).join(', ')}</span>
                        ) : (
                          <span className="staff-none">On-Site Patrol Alerted</span>
                        )}
                      </td>
                      <td className="cell-status">
                        <span className={`status-tag ${em.status.replace(/\s+/g, '-').toLowerCase()}`}>
                          {em.status}
                        </span>
                      </td>
                      <td className="cell-time">
                        {new Date(em.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="cell-actions">
                        <button 
                          className="btn-view-emerg" 
                          onClick={() => setSelectedEmergency(em)}
                          title="View Emergency Details"
                        >
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEmergency && (
        <div className="emerg-modal-overlay" onClick={() => setSelectedEmergency(null)}>
          <div className="emerg-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="emerg-modal-header">
              <div>
                <span className="modal-ticket">{selectedEmergency.emergencyId}</span>
                <h3>Emergency Incident Details</h3>
              </div>
              <button className="btn-close-modal" onClick={() => setSelectedEmergency(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="emerg-modal-body">
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span className="lbl">Emergency Type:</span>
                  <strong className="text-red font-bold">{selectedEmergency.emergencyType}</strong>
                </div>
                <div className="modal-info-item">
                  <span className="lbl">Current Status:</span>
                  <strong className={`status-tag ${selectedEmergency.status.replace(/\s+/g, '-').toLowerCase()}`}>
                    {selectedEmergency.status}
                  </strong>
                </div>
                <div className="modal-info-item">
                  <span className="lbl">Park:</span>
                  <strong>{selectedEmergency.parkName || selectedEmergency.park?.name}</strong>
                </div>
                <div className="modal-info-item">
                  <span className="lbl">Reported At:</span>
                  <span>{new Date(selectedEmergency.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <div className="modal-info-item col-span-2">
                  <span className="lbl">Live Location & Landmark:</span>
                  <span>{selectedEmergency.landmarkDescription || selectedEmergency.address} ({selectedEmergency.latitude}°, {selectedEmergency.longitude}°)</span>
                </div>
                <div className="modal-info-item">
                  <span className="lbl">Citizen Caller:</span>
                  <span>{selectedEmergency.citizenName} ({selectedEmergency.citizenPhone})</span>
                </div>
                <div className="modal-info-item">
                  <span className="lbl">Assigned Security Staff:</span>
                  <span>
                    {selectedEmergency.assignedSecurityStaff && selectedEmergency.assignedSecurityStaff.length > 0
                      ? selectedEmergency.assignedSecurityStaff.map(s => s.name || s).join(', ')
                      : 'Park On-Site Patrol Team'}
                  </span>
                </div>
              </div>

              {selectedEmergency.resolutionNotes && (
                <div className="modal-resolution-box">
                  <strong>Resolution Notes:</strong>
                  <p>{selectedEmergency.resolutionNotes}</p>
                </div>
              )}

              {/* Status History */}
              <div className="modal-history-section">
                <h4>Response History & Timeline</h4>
                <div className="history-list">
                  {selectedEmergency.statusHistory?.map((h, i) => (
                    <div key={i} className="history-entry">
                      <span className="entry-time">{new Date(h.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      <div className="entry-body">
                        <strong>{h.status}</strong> — <span>{h.updatedBy}</span>
                        {h.notes && <p>{h.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="emerg-modal-footer">
              <a 
                href={`tel:${selectedEmergency.citizenPhone}`} 
                className="btn-modal-call"
              >
                <Phone size={14} /> Call Citizen ({selectedEmergency.citizenPhone})
              </a>
              <button className="btn-modal-close" onClick={() => setSelectedEmergency(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
