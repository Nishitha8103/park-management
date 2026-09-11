import { useState } from 'react';
import { Download, Calendar, Filter } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area,
  ComposedChart, Line
} from 'recharts';
import './GovAnalytics.css';

const GovAnalytics = () => {
  const [timeRange, setTimeRange] = useState('This Month');

  // Dummy Data for Charts
  const inspectionsByPark = [
    { name: 'Cubbon', expected: 20, completed: 18 },
    { name: 'Lalbagh', expected: 25, completed: 22 },
    { name: 'JP Park', expected: 15, completed: 15 },
    { name: 'Indira G.', expected: 10, completed: 8 },
    { name: 'Bugle Rock', expected: 12, completed: 12 },
    { name: 'Sankey', expected: 14, completed: 10 },
  ];

  const complaintsOverTime = [
    { week: 'Week 1', complaints: 45, resolved: 30 },
    { week: 'Week 2', complaints: 38, resolved: 35 },
    { week: 'Week 3', complaints: 52, resolved: 40 },
    { week: 'Week 4', complaints: 30, resolved: 35 },
  ];

  const contractorPerformance = [
    { name: 'Green Scapes Ltd', tasks: 45, onTime: 42, rating: 4.8 },
    { name: 'Nature Works Co', tasks: 38, onTime: 30, rating: 4.2 },
    { name: 'Eco Maintainers', tasks: 52, onTime: 48, rating: 4.6 },
    { name: 'City Builders', tasks: 25, onTime: 20, rating: 3.9 },
    { name: 'Aqua Gardens', tasks: 30, onTime: 28, rating: 4.5 },
  ];

  return (
    <div className="gov-analytics-page">
      <div className="gov-page-header flex-between">
        <div>
          <h1 className="gov-page-title">Analytics & Reports</h1>
          <p className="gov-page-subtitle">Detailed insights into park maintenance and contractor performance.</p>
        </div>
        <button className="btn-export">
          <Download size={18} /> Export Report
        </button>
      </div>

      <div className="analytics-toolbar">
        <div className="toolbar-filters">
          <div className="filter-group">
            <Calendar size={18} />
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="Last 3 Months">Last 3 Months</option>
              <option value="This Year">This Year</option>
            </select>
          </div>
          <div className="filter-group">
            <Filter size={18} />
            <select>
              <option value="All Zones">All Zones</option>
              <option value="East">East Zone</option>
              <option value="West">West Zone</option>
              <option value="South">South Zone</option>
              <option value="North">North Zone</option>
            </select>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Chart 1 */}
        <div className="gov-card">
          <div className="gov-card-header">
            <h3 className="gov-card-title">Inspections vs Expected (By Park)</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inspectionsByPark} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="expected" name="Expected" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="completed" name="Completed" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="gov-card">
          <div className="gov-card-header">
            <h3 className="gov-card-title">Complaint Resolution Trend</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={complaintsOverTime} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="complaints" name="New Complaints" stroke="#ef4444" fillOpacity={1} fill="url(#colorComplaints)" strokeWidth={2} />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#3b82f6" fillOpacity={1} fill="url(#colorResolved)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Contractor Performance Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <h3 className="gov-card-title">Top Contractor Performance</h3>
        </div>
        <div className="gov-table-responsive">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Contractor Name</th>
                <th>Total Tasks Assigned</th>
                <th>Tasks Completed On Time</th>
                <th>Completion Rate</th>
                <th>Quality Rating</th>
              </tr>
            </thead>
            <tbody>
              {contractorPerformance.map((c, index) => {
                const completionRate = Math.round((c.onTime / c.tasks) * 100);
                return (
                  <tr key={index}>
                    <td className="fw-600 color-secondary">{c.name}</td>
                    <td>{c.tasks}</td>
                    <td>{c.onTime}</td>
                    <td>
                      <div className="progress-cell">
                        <span>{completionRate}%</span>
                        <div className="small-progress-bg">
                          <div 
                            className={`small-progress-fill ${completionRate >= 90 ? 'bg-success' : completionRate >= 75 ? 'bg-warning' : 'bg-danger'}`} 
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="rating-cell">
                        <span className="rating-score">{c.rating}</span>
                        <span className="rating-max">/ 5.0</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GovAnalytics;
