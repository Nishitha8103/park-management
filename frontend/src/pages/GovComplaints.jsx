import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import './GovComplaints.css';

const GovComplaints = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const complaints = [
    { id: 'CMP2024001', park: 'Central Park', type: 'Broken Bench', priority: 'High', status: 'Inspection Pending' },
    { id: 'CMP2024002', park: 'Green Valley Park', type: 'Playground Repair', priority: 'Medium', status: 'In Progress' },
    { id: 'CMP2024003', park: 'City Garden Park', type: 'Lighting Issue', priority: 'High', status: 'Inspection Pending' },
    { id: 'CMP2024004', park: 'Riverside Park', type: 'Water Leakage', priority: 'Medium', status: 'Rework' },
    { id: 'CMP2024005', park: 'Lake View Park', type: 'Toilet Cleaning', priority: 'Low', status: 'Resolved' },
    { id: 'CMP2024006', park: 'Sunshine Park', type: 'Dustbin Issue', priority: 'Low', status: 'In Progress' },
  ];

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'High': return 'text-error font-semibold';
      case 'Medium': return 'text-warning font-semibold';
      case 'Low': return 'text-success font-semibold';
      default: return '';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Inspection Pending': return 'status-inspection-pending';
      case 'In Progress': return 'status-in-progress';
      case 'Resolved': return 'status-completed';
      case 'Rework': return 'status-rework';
      default: return '';
    }
  };

  return (
    <div className="complaints-monitoring-container">
      <h1 className="page-title mb-lg">Complaints Monitoring</h1>

      <div className="filters-container flex gap-md mb-md">
        <div className="status-filter-wrapper">
          <select 
            className="input-field select-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All Status">All Status</option>
            <option value="Inspection Pending">Inspection Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rework">Rework</option>
          </select>
        </div>

        <div className="search-box-wrapper flex-1" style={{ maxWidth: '400px', marginLeft: 'auto' }}>
          <Search size={20} className="search-icon text-secondary" />
          <input 
            type="text" 
            className="input-field search-input"
            placeholder="Search complaints..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card table-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Park Name</th>
                <th>Complaint Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((item, index) => (
                <tr key={index}>
                  <td className="font-semibold">{item.id}</td>
                  <td>{item.park}</td>
                  <td>{item.type}</td>
                  <td className={getPriorityClass(item.priority)}>{item.priority}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn-view-outline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="table-footer flex justify-between items-center">
          <p className="text-secondary" style={{fontSize: '0.9rem'}}>Showing 1 to 6 of 24 complaints</p>
          <div className="pagination flex gap-sm">
            <button className="page-btn"><ChevronLeft size={16} /></button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn">4</button>
            <button className="page-btn"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovComplaints;
