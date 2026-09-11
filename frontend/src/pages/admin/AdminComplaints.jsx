import { useState, useEffect } from 'react';
import { Search, MapPin, UserCheck, ShieldCheck, CheckCircle, AlertCircle, X, Phone, Mail, Building, FileText, Calendar, Image, MessageSquare, Trash2, HardHat, User } from 'lucide-react';
import axios from 'axios';
import { getSlaStatusAndRemaining, getPriorityColor } from '../../utils/slaUtils';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [slaFilter, setSlaFilter] = useState('');

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [reportComplaint, setReportComplaint] = useState(null);
  const [inspectionComplaint, setInspectionComplaint] = useState(null);
  const [inspectionOfficialId, setInspectionOfficialId] = useState('');
  const [assigningInspection, setAssigningInspection] = useState(false);
  const [assignContractorId, setAssignContractorId] = useState('');
  const [assignOfficialId, setAssignOfficialId] = useState('');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [showReturnInput, setShowReturnInput] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem('adminUser'))?.token;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [complaintsRes, contractorsRes, usersRes] = await Promise.all([
        axios.get('/api/complaints'),
        axios.get('/api/contractors', { headers }).catch(() => ({ data: [] })),
        axios.get('/api/auth/users?role=official', { headers }).catch(() => ({ data: [] }))
      ]);

      setComplaints(complaintsRes.data || []);
      setContractors(contractorsRes.data || []);
      setOfficials(usersRes.data || []);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignContractorDirect = async (complaintId, contractorId) => {
    if (!contractorId) return alert('Please select a contractor');
    try {
      const newStatus = ['Returned by Admin', 'Rework Required'].includes(selectedComplaint?.status) 
        ? 'Reassigned to Contractor' 
        : 'Assigned';

      await axios.put(`/api/complaints/${complaintId}`, {
        assignedContractor: contractorId,
        status: newStatus
      });
      alert('Contractor assigned successfully!');
      setSelectedComplaint(null);
      fetchData();
    } catch (error) {
      console.error('Error assigning contractor:', error);
    }
  };

  const handleAssignOfficialDirect = async (complaintId, officialId) => {
    if (!officialId) return alert('Please select an official');
    try {
      await axios.put(`/api/complaints/${complaintId}`, {
        assignedOfficial: officialId,
        status: 'Inspection Pending'
      });
      alert('Government Official assigned for inspection!');
      setSelectedComplaint(null);
      fetchData();
    } catch (error) {
      console.error('Error assigning official:', error);
    }
  };

  const handleCloseComplaint = async (complaintId) => {
    try {
      await axios.put(`/api/complaints/${complaintId}`, {
        status: 'Closed'
      });
      alert('Complaint closed successfully!');
      fetchData();
    } catch (error) {
      console.error('Error closing complaint:', error);
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (!window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) return;
    try {
      await axios.delete(`/api/complaints/${complaintId}`);
      alert('Complaint deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting complaint:', error);
      alert('Failed to delete complaint.');
    }
  };

  const handleReturnToContractor = async (complaintId, remarks) => {
    if (!remarks || !remarks.trim()) return alert('Please enter remarks for returning the task.');
    try {
      await axios.put(`/api/complaints/${complaintId}`, {
        status: 'Returned by Admin',
        rejectionReason: remarks
      });
      alert('Task returned to contractor with remarks.');
      setReportComplaint(null);
      setShowReturnInput(false);
      setReturnRemarks('');
      fetchData();
    } catch (error) {
      console.error('Error returning task:', error);
      alert('Failed to return task. Please try again.');
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.complaintNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.parkName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || c.status === statusFilter;
    const matchesSla = !slaFilter || c.slaStatus === slaFilter;
    return matchesSearch && matchesStatus && matchesSla;
  });

  return (
    <div className="admin-panel" style={{ padding: '1rem' }}>
      <div className="admin-panel-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ color: '#0f2d52', margin: 0, fontWeight: 700 }}>Complaint Management & Assignment</h2>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Review citizen complaints, assign contractors and government inspectors</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#fff', padding: '1rem', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
          <Search size={18} color="#64748b" style={{ marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search Complaint #, Park, or Category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff' }}
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Inspection Pending">Inspection Pending</option>
          <option value="Verified">Verified</option>
          <option value="Rejected">Rejected</option>
          <option value="Closed">Closed</option>
        </select>

        <select
          value={slaFilter}
          onChange={e => setSlaFilter(e.target.value)}
          style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff' }}
        >
          <option value="">All SLA Statuses</option>
          <option value="On Time">On Time</option>
          <option value="Due Soon">Due Soon</option>
          <option value="Overdue">Overdue</option>
          <option value="Resolved Within SLA">Resolved Within SLA</option>
          <option value="Resolved After SLA">Resolved After SLA</option>
        </select>
      </div>

      {/* Complaints Table */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading complaints...</div>
        ) : filteredComplaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No complaints found matching criteria.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '10px' }}>Complaint #</th>
                  <th style={{ padding: '10px' }}>Park Name</th>
                  <th style={{ padding: '10px' }}>District</th>
                  <th style={{ padding: '10px' }}>Zone</th>
                  <th style={{ padding: '10px' }}>Ward</th>
                  <th style={{ padding: '10px' }}>Category</th>
                  <th style={{ padding: '10px' }}>Priority</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }}>SLA Status</th>
                  <th style={{ padding: '10px' }}>Assigned Contractor</th>
                  <th style={{ padding: '10px' }}>Report</th>
                  <th style={{ padding: '10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map(c => {
                  const districtName = c.park?.district?.name || c.district || 'Bangalore Urban';
                  const zoneName = c.park?.zone?.name || c.zone || 'South Zone';
                  const wardName = c.park?.ward?.name || c.ward || 'Bangalore Urban Ward 4';

                  return (
                    <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 600, color: '#2563eb' }}>{c.complaintNumber}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 600, color: '#0f172a' }}>{c.parkName || c.park?.name || 'Madhavan Park'}</td>
                      <td style={{ padding: '12px 10px', color: '#475569' }}>{districtName}</td>
                      <td style={{ padding: '12px 10px', color: '#475569' }}>{zoneName}</td>
                      <td style={{ padding: '12px 10px', color: '#475569' }}>{wardName}</td>
                      <td style={{ padding: '12px 10px' }}>{c.category}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                          background: `${getPriorityColor(c.priority)}20`,
                          color: getPriorityColor(c.priority)
                        }}>
                          {c.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                          background:
                            c.status === 'New' ? '#fef9c3' :
                              c.status === 'Completed - Waiting for Admin Review' ? '#ffedd5' :
                                c.status === 'Inspection Approved' || c.status === 'Verified' ? '#dcfce7' :
                                  ['Rework Required', 'Returned by Admin'].includes(c.status) ? '#fee2e2' :
                                    ['Assigned', 'In Progress'].includes(c.status) ? '#e0f2fe' : '#f1f5f9',
                          color:
                            c.status === 'New' ? '#ca8a04' :
                              c.status === 'Completed - Waiting for Admin Review' ? '#d97706' :
                                c.status === 'Inspection Approved' || c.status === 'Verified' ? '#15803d' :
                                  ['Rework Required', 'Returned by Admin'].includes(c.status) ? '#ef4444' :
                                    ['Assigned', 'In Progress'].includes(c.status) ? '#0284c7' : '#475569'
                        }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {(() => {
                          const slaInfo = getSlaStatusAndRemaining(c);
                          if (slaInfo.status === 'Not Applicable') return <span style={{ color: '#94a3b8' }}>N/A</span>;
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{
                                padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                                background: `${slaInfo.colorCode}20`, color: slaInfo.colorCode, width: 'fit-content'
                              }}>
                                {slaInfo.icon} {slaInfo.status}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{slaInfo.text}</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {c.assignedContractor?.name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {['Completed', 'Completed - Waiting for Admin Review', 'Returned by Admin', 'Inspection Pending', 'Inspection Approved', 'Rework Required', 'Reassigned to Contractor', 'Closed'].includes(c.status) && c.contractorRemarks ? (
                          <button
                            onClick={() => setReportComplaint(c)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '5px',
                              background: 'linear-gradient(135deg, #059669, #16a34a)',
                              color: '#fff', border: 'none', padding: '5px 12px',
                              borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem',
                              fontWeight: 700, whiteSpace: 'nowrap',
                              boxShadow: '0 1px 4px rgba(5,150,105,0.3)'
                            }}
                          >
                            <FileText size={13} /> View Report
                          </button>
                        ) : ['Completed', 'Inspection Pending', 'Verified', 'Closed'].includes(c.status) ? (
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>No report yet</span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              setSelectedComplaint(c);
                              setAssignContractorId(c.assignedContractor?._id || '');
                              setAssignOfficialId(c.assignedOfficial?._id || '');
                            }}
                            style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                          >
                            Manage / Assign Contractor
                          </button>
                          {['Completed', 'Completed - Waiting for Admin Review'].includes(c.status) && (
                            <button
                              onClick={() => {
                                setInspectionComplaint(c);
                                setInspectionOfficialId(c.assignedOfficial?._id || '');
                              }}
                              style={{
                                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                color: '#fff', border: 'none', padding: '6px 14px',
                                borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem',
                                fontWeight: 600, whiteSpace: 'nowrap',
                                boxShadow: '0 2px 6px rgba(124,58,237,0.3)'
                              }}
                            >
                              Assign Inspection
                            </button>
                          )}
                          {['Verified', 'Inspection Approved'].includes(c.status) && (
                            <button
                              onClick={() => handleCloseComplaint(c._id)}
                              style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                              Close Complaint
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal with Contractor List Cards & Details */}
      {selectedComplaint && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

            {/* Modal Header */}
            <div style={{ background: '#0f2d52', color: '#fff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Assign Contractor - Complaint #{selectedComplaint.complaintNumber}
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#93c5fd', marginTop: '2px', display: 'block' }}>
                  Park: {selectedComplaint.parkName || selectedComplaint.park?.name || 'General Park'}
                </span>
              </div>
              <button onClick={() => setSelectedComplaint(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {/* Complaint Overview Card */}
              <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div><strong>Category:</strong> {selectedComplaint.category}</div>
                  <div><strong>Priority:</strong> <span style={{ color: selectedComplaint.priority === 'Urgent' ? '#ef4444' : '#2563eb', fontWeight: 700 }}>{selectedComplaint.priority}</span></div>
                  <div><strong>Current Status:</strong> <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>{selectedComplaint.status}</span></div>
                </div>
                <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.875rem', color: '#475569' }}><strong>Description:</strong> {selectedComplaint.description}</p>
              </div>

              <h4 style={{ margin: '0 0 1rem 0', color: '#0f2d52', fontSize: '1rem', fontWeight: 700 }}>
                Select Available Contractor for Assignment:
              </h4>

              {(() => {
                const recommendedContractors = contractors.filter(c => {
                  const hasSkill = selectedComplaint.requiredSkill ? (c.maintenanceSkills || []).includes(selectedComplaint.requiredSkill) : true;
                  
                  // Safely extract IDs as strings
                  const complaintParkId = String(selectedComplaint.park?._id || selectedComplaint.park || '');
                  const complaintWardId = String(selectedComplaint.park?.ward?._id || selectedComplaint.park?.ward || selectedComplaint.ward || '');
                  const complaintZoneId = String(selectedComplaint.park?.zone?._id || selectedComplaint.park?.zone || selectedComplaint.zone || '');

                  const contractorParks = (c.assignedParks || []).map(p => String(p._id || p));
                  if (c.park) contractorParks.push(String(c.park._id || c.park));
                  
                  const contractorWardId = String(c.ward?._id || c.ward || '');
                  const contractorZoneId = String(c.zone?._id || c.zone || '');

                  const matchesLocation = (complaintParkId && complaintParkId !== 'undefined' && contractorParks.includes(complaintParkId)) ||
                                          (contractorWardId && contractorWardId !== 'undefined' && complaintWardId && contractorWardId === complaintWardId) ||
                                          (contractorZoneId && contractorZoneId !== 'undefined' && complaintZoneId && contractorZoneId === complaintZoneId);

                  // Always show the currently assigned contractor even if they don't match perfectly
                  const isAssigned = (selectedComplaint.assignedContractor?._id || selectedComplaint.assignedContractor) === c._id;

                  return (hasSkill && matchesLocation) || isAssigned;
                });

                if (recommendedContractors.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', background: '#f1f5f9', borderRadius: '8px' }}>
                      No recommended contractors found for the required skill ({selectedComplaint.requiredSkill || 'General'}) in this location.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {recommendedContractors.map(c => {
                      const isAssigned = (selectedComplaint.assignedContractor?._id || selectedComplaint.assignedContractor) === c._id;

                      return (
                        <div
                          key={c._id}
                          style={{
                            background: isAssigned ? '#f0fdf4' : '#fff',
                            border: isAssigned ? '2px solid #16a34a' : '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: '250px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <h5 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>{c.name}</h5>
                              <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                {c.contractorId || 'CON-ID'}
                              </span>
                              {isAssigned && (
                                <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                                  Currently Assigned
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px', fontSize: '0.825rem', color: '#64748b', marginTop: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Mail size={14} /> {c.email}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={14} /> {c.phone}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Building size={14} /> {c.zone?.name ? `Zone: ${c.zone.name}` : c.address || 'Registered Contractor'}
                              </div>
                            </div>
                          </div>

                          <div>
                            <button
                              onClick={() => handleAssignContractorDirect(selectedComplaint._id, c._id)}
                              style={{
                                background: isAssigned ? '#16a34a' : '#2563eb',
                                color: '#fff',
                                border: 'none',
                                padding: '0.6rem 1.25rem',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.875rem'
                              }}
                            >
                              <CheckCircle size={16} />
                              {isAssigned ? 'Re-Assign Task' : 'Assign Task'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedComplaint(null)}
                style={{ background: '#64748b', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Report Modal */}
      {reportComplaint && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1100, padding: '1rem'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '1050px',
            maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 60px -12px rgba(0,0,0,0.35)'
          }}>

            {/* Report Modal Header */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', padding: '1.5rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '8px' }}>
                    <FileText size={20} color="#38bdf8" />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Completion & Inspection Report</h3>
                </div>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>
                  <span style={{ color: '#e2e8f0' }}>#{reportComplaint.complaintNumber}</span> &nbsp;·&nbsp; {reportComplaint.parkName || reportComplaint.park?.name || 'Park'}
                </span>
              </div>
              <button onClick={() => setReportComplaint(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', color: '#94a3b8', cursor: 'pointer', padding: '6px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}>
                <X size={20} />
              </button>
            </div>

            {/* Report Modal Body */}
            <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
              
              {/* Summary Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { label: 'Complaint Type', value: reportComplaint.category || '—' },
                  { label: 'Filed By', value: reportComplaint.user?.name || reportComplaint.userName || '—' },
                  { label: 'Priority', value: reportComplaint.priority || '—' },
                  { label: 'Phone', value: reportComplaint.user?.phone || reportComplaint.userPhone || '—' },
                  { label: 'Completion Date', value: reportComplaint.completionDate ? new Date(reportComplaint.completionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
                    <div style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* 2-Column Layout: Contractor (left) | Official Verification (right) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                
                {/* Left Column: Contractor Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '8px', borderRadius: '10px', color: '#fff', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}>
                      <HardHat size={20} />
                    </div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#065f46' }}>Contractor Details</h4>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                    {/* Assigned To card */}
                    <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #bbf7d0', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.05)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#10b981' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Assigned To</div>
                          <div style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>{reportComplaint.assignedContractor?.name || '—'}</div>
                        </div>
                        {reportComplaint.assignedContractor?.email && <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, textAlign: 'right' }}>{reportComplaint.assignedContractor.email}</div>}
                      </div>
                    </div>

                    {/* Date row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #bbf7d0', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.05)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#34d399' }}></div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Assigned Date</div>
                        <div style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>{reportComplaint.assignedDate ? new Date(reportComplaint.assignedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : (reportComplaint.createdAt ? new Date(reportComplaint.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—')}</div>
                      </div>

                      <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #bbf7d0', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.05)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#6ee7b7' }}></div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Completion Date</div>
                        <div style={{ fontSize: '1rem', color: '#059669', fontWeight: 800 }}>{reportComplaint.completionDate ? new Date(reportComplaint.completionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Contractor Remarks */}
                  <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '1.25rem 1.5rem', boxShadow: '0 4px 6px -1px rgba(21, 128, 61, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#16a34a' }}>
                      <div style={{ background: '#dcfce7', padding: '4px', borderRadius: '6px' }}>
                        <MessageSquare size={16} />
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remarks</span>
                    </div>
                    <p style={{ margin: 0, color: '#166534', fontSize: '0.95rem', lineHeight: '1.7', fontWeight: 500 }}>
                      {reportComplaint.contractorRemarks || 'No remarks submitted.'}
                    </p>
                  </div>

                  {/* Contractor Images */}
                  {reportComplaint.afterImages && reportComplaint.afterImages.length > 0 && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#059669' }}>
                        <div style={{ background: '#d1fae5', padding: '6px', borderRadius: '8px' }}>
                          <Image size={18} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed Works</span>
                        <span style={{ fontSize: '0.75rem', background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, marginLeft: '4px' }}>{reportComplaint.afterImages.length}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                        {reportComplaint.afterImages.map((img, i) => (
                          <a key={i} href={`${img}`} target="_blank" rel="noreferrer"
                            style={{ display: 'block', borderRadius: '12px', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', transition: 'transform 0.2s', position: 'relative' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)' }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                          >
                            <img src={`${img}`} alt={`After ${i + 1}`} style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Government Verification & Images */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingLeft: '2rem', borderLeft: '1px dashed #cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', padding: '8px', borderRadius: '10px', color: '#fff', boxShadow: '0 4px 6px -1px rgba(109, 40, 217, 0.3)' }}>
                      <ShieldCheck size={20} />
                    </div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Official Verification</h4>
                  </div>
                  
                  {(reportComplaint.inspectionRemarks || (reportComplaint.inspectionImages && reportComplaint.inspectionImages.length > 0)) ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #ede9fe', boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.05)', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#8b5cf6' }}></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Inspected By</div>
                              <div style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>{reportComplaint.assignedOfficial?.name || '—'}</div>
                            </div>
                            {reportComplaint.assignedOfficial?.email && <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, textAlign: 'right' }}>{reportComplaint.assignedOfficial.email}</div>}
                          </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #ede9fe', boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.05)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#a78bfa' }}></div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Date</div>
                            <div style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>{reportComplaint.inspectionDate ? new Date(reportComplaint.inspectionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</div>
                          </div>
                          
                          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #ede9fe', boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.05)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#c4b5fd' }}></div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Rating</div>
                            <div style={{ fontSize: '1rem', color: '#7c3aed', fontWeight: 800 }}>{reportComplaint.inspectionCondition || '—'}</div>
                          </div>
                        </div>
                      </div>

                      {reportComplaint.inspectionRemarks && (
                        <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)', border: '1px solid #ddd6fe', borderRadius: '14px', padding: '1.25rem 1.5rem', boxShadow: '0 4px 6px -1px rgba(109, 40, 217, 0.05)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#7c3aed' }}>
                            <div style={{ background: '#ede9fe', padding: '4px', borderRadius: '6px' }}>
                              <MessageSquare size={16} />
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remarks</span>
                          </div>
                          <p style={{ margin: 0, color: '#4c1d95', fontSize: '0.95rem', lineHeight: '1.7', fontWeight: 500 }}>
                            {reportComplaint.inspectionRemarks}
                          </p>
                        </div>
                      )}

                      {reportComplaint.inspectionImages && reportComplaint.inspectionImages.length > 0 ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#7c3aed' }}>
                            <div style={{ background: '#ede9fe', padding: '6px', borderRadius: '8px' }}>
                              <Image size={18} />
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inspection Images</span>
                            <span style={{ fontSize: '0.75rem', background: '#8b5cf6', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, marginLeft: '4px' }}>{reportComplaint.inspectionImages.length}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                            {reportComplaint.inspectionImages.map((img, i) => (
                              <a key={i} href={`${img}`} target="_blank" rel="noreferrer"
                                style={{ display: 'block', borderRadius: '12px', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', transition: 'transform 0.2s', position: 'relative' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)' }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                              >
                                <img src={`${img}`} alt={`Inspection ${i + 1}`} style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#94a3b8' }}>
                          <Image size={20} style={{ opacity: 0.5 }} />
                          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>No inspection images uploaded.</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                      <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500, margin: 0 }}>Pending Government Verification</p>
                    </div>
                  )}
                </div>
              </div>

              {/* No images fallback */}
              {(!reportComplaint.beforeImages || reportComplaint.beforeImages.length === 0) &&
                (!reportComplaint.afterImages || reportComplaint.afterImages.length === 0) &&
                (!reportComplaint.inspectionImages || reportComplaint.inspectionImages.length === 0) && (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: '#ffffff', borderRadius: '10px', color: '#94a3b8', border: '1px dashed #cbd5e1', marginTop: '1.5rem' }}>
                    <Image size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>No before/after/inspection images submitted with this report.</p>
                  </div>
                )}
            </div>

            {/* Return Remarks Form inside Modal */}
            {showReturnInput && (
              <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px', color: '#0f172a' }}>
                  Reason for Returning Report
                </label>
                <textarea
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  placeholder="Provide detailed feedback on what needs to be fixed..."
                  style={{
                    width: '100%', minHeight: '100px', border: '1px solid #cbd5e1', borderRadius: '8px',
                    padding: '8px', fontSize: '0.9rem', resize: 'none', outline: 'none'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowReturnInput(false);
                      setReturnRemarks('');
                    }}
                    style={{ background: '#e2e8f0', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReturnToContractor(reportComplaint._id, returnRemarks)}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Submit Return
                  </button>
                </div>
              </div>
            )}

            {/* Report Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {['Completed', 'Completed - Waiting for Admin Review'].includes(reportComplaint.status) && !showReturnInput && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => {
                        setInspectionComplaint(reportComplaint);
                        setInspectionOfficialId(reportComplaint.assignedOfficial?._id || reportComplaint.assignedOfficial || '');
                        setReportComplaint(null);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                        color: '#fff', border: 'none', padding: '0.6rem 1.5rem',
                        borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
                      }}
                    >
                      Assign Inspection
                    </button>
                    <button
                      onClick={() => setShowReturnInput(true)}
                      style={{
                        background: '#ef4444',
                        color: '#fff', border: 'none', padding: '0.6rem 1.5rem',
                        borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
                      }}
                    >
                      Return to Contractor
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setReportComplaint(null);
                  setShowReturnInput(false);
                  setReturnRemarks('');
                }}
                style={{ background: '#64748b', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Inspection Modal ──────────────────────── */}
      {inspectionComplaint && (() => {
        const suggestedOfficial = inspectionComplaint.suggestedOfficial;
        const displayOfficials = suggestedOfficial ? [suggestedOfficial] : [];
        const isFiltered = !!suggestedOfficial;

        // Auto select suggested official
        if (suggestedOfficial && inspectionOfficialId !== suggestedOfficial._id) {
          setInspectionOfficialId(suggestedOfficial._id);
        }

        return (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)',
            backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1050, padding: '1rem'
          }}>
            <div style={{
              background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '820px',
              maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              boxShadow: '0 25px 60px -12px rgba(0,0,0,0.35)'
            }}>

              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, #4c1d95, #7c3aed)', color: '#fff', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <UserCheck size={18} />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Assign Inspection — Government Official</h3>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: '#ddd6fe' }}>
                    Complaint #{inspectionComplaint.complaintNumber} &nbsp;·&nbsp; {inspectionComplaint.parkName || inspectionComplaint.park?.name}
                  </span>
                </div>
                <button onClick={() => setInspectionComplaint(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
                  <X size={22} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>

                {/* Complaint summary */}
                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div><span style={{ color: '#64748b', fontWeight: 600 }}>Park:</span> <strong>{inspectionComplaint.parkName || inspectionComplaint.park?.name || '—'}</strong></div>
                  <div><span style={{ color: '#64748b', fontWeight: 600 }}>Zone:</span> {inspectionComplaint.park?.zone?.name || inspectionComplaint.zone || '—'}</div>
                  <div><span style={{ color: '#64748b', fontWeight: 600 }}>Ward:</span> {inspectionComplaint.park?.ward?.name || inspectionComplaint.ward || '—'}</div>
                  <div><span style={{ color: '#64748b', fontWeight: 600 }}>Category:</span> {inspectionComplaint.category}</div>
                  <div><span style={{ color: '#64748b', fontWeight: 600 }}>Contractor:</span> {inspectionComplaint.assignedContractor?.name || '—'}</div>
                </div>

                {/* Filter notice */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', padding: '0.6rem 0.875rem', background: isFiltered ? '#ede9fe' : '#fee2e2', borderRadius: '8px', border: `1px solid ${isFiltered ? '#c4b5fd' : '#fca5a5'}` }}>
                  <ShieldCheck size={15} color={isFiltered ? '#7c3aed' : '#ef4444'} />
                  <span style={{ fontSize: '0.82rem', color: isFiltered ? '#6d28d9' : '#b91c1c', fontWeight: 600 }}>
                    {isFiltered
                      ? 'Responsible Government Official identified automatically via hierarchy.'
                      : 'No official is assigned to this Park, Ward, Zone, or District level. Please configure an official.'}
                  </span>
                </div>

                {/* Officials cards */}
                {displayOfficials.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', background: '#fee2e2', borderRadius: '8px', color: '#b91c1c', fontWeight: 600 }}>
                    No responsible Government Official was identified for this park based on the hierarchy (Park &rarr; Ward &rarr; Zone &rarr; District). Please configure a responsible official first.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {displayOfficials.map(o => {
                      const isCurrentlyAssigned = inspectionComplaint.assignedOfficial &&
                        String(o._id) === String(inspectionComplaint.assignedOfficial?._id || inspectionComplaint.assignedOfficial);
                      const isSelected = inspectionOfficialId === o._id;
                      return (
                        <div
                          key={o._id}
                          onClick={() => setInspectionOfficialId(o._id)}
                          style={{
                            border: isSelected ? '2px solid #7c3aed' : isCurrentlyAssigned ? '2px solid #16a34a' : '1px solid #e2e8f0',
                            borderRadius: '10px', padding: '0.875rem 1.25rem',
                            background: isSelected ? '#faf5ff' : isCurrentlyAssigned ? '#f0fdf4' : '#fff',
                            cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
                            transition: 'border-color 0.15s, background 0.15s'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                              <div style={{
                                width: '38px', height: '38px', borderRadius: '50%',
                                background: isSelected ? '#7c3aed' : '#e0e7ff',
                                color: isSelected ? '#fff' : '#4338ca',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '1rem', flexShrink: 0
                              }}>
                                {o.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{o.name}</div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{o.email}</div>
                              </div>
                              {isCurrentlyAssigned && (
                                <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>Currently Assigned</span>
                              )}
                              {isSelected && !isCurrentlyAssigned && (
                                <span style={{ fontSize: '0.72rem', background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>✓ Selected</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748b', marginLeft: '48px' }}>
                              {o.phone && <span>📞 {o.phone}</span>}
                              {o.zone?.name && <span style={{ color: '#7c3aed', fontWeight: 600 }}>Zone: {o.zone.name}</span>}
                              {o.ward?.name && <span style={{ color: '#059669', fontWeight: 600 }}>Ward: {o.ward.name}</span>}
                              {!o.zone && !o.ward && o.department && <span>Dept: {o.department}</span>}
                            </div>
                          </div>
                          <div style={{
                            width: '22px', height: '22px', borderRadius: '50%',
                            border: `2px solid ${isSelected ? '#7c3aed' : '#e2e8f0'}`,
                            background: isSelected ? '#7c3aed' : '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            {isSelected && <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#fff' }} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#faf5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {inspectionOfficialId ? '1 official selected — ready to assign' : 'Click on an official card to select'}
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setInspectionComplaint(null)}
                    style={{ background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.6rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!inspectionOfficialId || assigningInspection}
                    onClick={async () => {
                      if (!inspectionOfficialId) return;
                      setAssigningInspection(true);
                      try {
                        await axios.put(`/api/complaints/${inspectionComplaint._id}`, {
                          assignedOfficial: inspectionOfficialId,
                          status: 'Inspection Pending'
                        });
                        alert('Inspector assigned successfully! Status set to Inspection Pending.');
                        setInspectionComplaint(null);
                        fetchData();
                      } catch (err) {
                        console.error(err);
                        alert('Failed to assign inspector. Please try again.');
                      } finally {
                        setAssigningInspection(false);
                      }
                    }}
                    style={{
                      background: !inspectionOfficialId ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                      color: '#fff', border: 'none', padding: '0.6rem 1.5rem',
                      borderRadius: '8px', cursor: !inspectionOfficialId ? 'not-allowed' : 'pointer',
                      fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <UserCheck size={16} />
                    {assigningInspection ? 'Assigning...' : 'Confirm & Assign Inspector'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminComplaints;
