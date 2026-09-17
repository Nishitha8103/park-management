const mongoose = require('mongoose');

const reassignmentRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true }, // e.g., REASSIGN-2026-001
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  taskComplaintNumber: { type: String, required: true },
  taskTitle: { type: String },
  park: { type: mongoose.Schema.Types.ObjectId, ref: 'Park' },
  parkName: { type: String },
  
  // Requester
  requesterId: { type: String, required: true },
  requesterName: { type: String, required: true },
  requesterRole: { 
    type: String, 
    enum: ['contractor', 'government_official', 'official', 'Contractor', 'Government Official'], 
    required: true 
  },

  // Current Assignee (at the time of request)
  currentAssigneeId: { type: String, required: true },
  currentAssigneeName: { type: String, required: true },
  currentAssigneeRole: { 
    type: String, 
    enum: ['contractor', 'government_official', 'official', 'Contractor', 'Government Official'], 
    required: true 
  },

  // Reason for inability to complete task
  reason: {
    type: String,
    enum: [
      'On Leave',
      'Not Available',
      'Emergency',
      'Already Assigned to an Urgent Task',
      'Already Assigned to Urgent Task',
      'Insufficient Manpower',
      'Equipment/Material Unavailable',
      'Outside My Responsibility',
      'Other'
    ],
    required: true
  },
  explanation: { type: String, default: '' },
  wantsReassignment: { type: Boolean, default: true },
  preferredReplacementContractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor' },
  preferredReplacementName: { type: String, default: '' },
  attachmentUrl: { type: String, default: null },

  // Request Status: Pending -> Approved | Rejected | Escalated | Cancelled
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Escalated', 'Cancelled'],
    default: 'Pending'
  },

  // Task parameters
  priority: { type: String, default: 'Medium' },
  deadline: { type: Date },
  previousDeadline: { type: Date },
  newDeadline: { type: Date },
  deadlineChangeReason: { type: String },

  // Admin Review
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedByName: { type: String },
  reviewedAt: { type: Date },
  adminRemarks: { type: String },

  // New Replacement Assignee (when approved)
  newAssigneeId: { type: String },
  newAssigneeName: { type: String },
  newAssigneeRole: { type: String },
  reassignedAt: { type: Date }
}, { timestamps: true });

reassignmentRequestSchema.index({ task: 1 });
reassignmentRequestSchema.index({ requesterId: 1 });
reassignmentRequestSchema.index({ status: 1 });
reassignmentRequestSchema.index({ createdAt: -1 });

const ReassignmentRequest = mongoose.model('ReassignmentRequest', reassignmentRequestSchema);

module.exports = ReassignmentRequest;
