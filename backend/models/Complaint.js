const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintNumber: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  userPhone: { type: String },
  park: { type: mongoose.Schema.Types.ObjectId, ref: 'Park' },

  parkName: { type: String },
  locationInPark: { type: String },
  district: { type: String },
  zone: { type: String },
  ward: { type: String },
  category: { type: String, required: true },
  complaintCategory: { type: String },
  requiredSkill: { type: String },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  description: { type: String, required: true },
  images: [{ type: String }],
  
  // Status workflow: New -> Assigned -> In Progress -> Completed - Waiting for Admin Review -> Returned by Admin -> Inspection Pending -> Inspection Approved -> Rework Required -> Reassigned to Contractor -> Reassignment Requested -> Escalated -> Closed
  status: {
    type: String,
    enum: [
      'New',
      'Assigned',
      'In Progress',
      'Completed - Waiting for Admin Review',
      'Returned by Admin',
      'Inspection Pending',
      'Inspection Approved',
      'Rework Required',
      'Reassigned to Contractor',
      'Reassignment Requested',
      'Escalated',
      'Rejected by Contractor',
      'Closed'
    ],
    default: 'New'
  },
  
  // Assignments
  assignedContractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor' },
  assignedPark: { type: mongoose.Schema.Types.ObjectId, ref: 'Park' },
  assignedWard: { type: String },
  assignedZone: { type: String },

  assignedOfficial: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Reassignment tracking
  reassignmentStatus: {
    type: String,
    enum: ['None', 'Reassignment Requested', 'Reassigned', 'Rejected', 'Escalated'],
    default: 'None'
  },
  reassignmentReason: { type: String },
  reassignmentExplanation: { type: String },
  reassignmentAttachment: { type: String },
  reassignmentRequestedAt: { type: Date },
  reassignmentRequesterId: { type: String },
  reassignmentRequesterRole: { type: String },

  // Complete Audit Trail / Assignment History
  assignmentHistory: [{
    historyId: { type: String },
    assignedToId: { type: String },
    assignedToName: { type: String },
    assignedToRole: { type: String, enum: ['contractor', 'government_official', 'official', 'Contractor', 'Government Official'] },
    assignedBy: { type: String, default: 'Admin' },
    assignedAt: { type: Date, default: Date.now },
    actionType: { 
      type: String, 
      enum: ['Initial Assignment', 'Direct Reassignment', 'Reassignment Requested', 'Reassignment Approved', 'Reassignment Rejected', 'Escalated', 'Work Started', 'Completed', 'Inspection Submitted'] 
    },
    reason: { type: String },
    explanation: { type: String },
    previousAssigneeId: { type: String },
    previousAssigneeName: { type: String },
    previousAssigneeRole: { type: String },
    previousDeadline: { type: Date },
    newDeadline: { type: Date },
    deadlineChangeReason: { type: String },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    statusAtTime: { type: String }
  }],

  // Contractor Resolution
  beforeImages: [{ type: String }],
  afterImages: [{ type: String }],
  afterImagesLocation: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  completionReport: { type: String }, // File path to PDF/document/image report
  contractorRemarks: { type: String },
  completionDate: { type: Date },

  // SLA fields
  slaDuration: { type: Number }, // in hours
  slaDeadline: { type: Date },
  slaStatus: { 
    type: String, 
    enum: ['On Time', 'Due Soon', 'Due Today', 'Overdue', 'Resolved Within SLA', 'Resolved After SLA', 'Not Applicable'], 
    default: 'On Time' 
  },
  assignedAt: { type: Date },
  resolvedAt: { type: Date },

  // Official Inspection
  inspectionDate: { type: Date },
  inspectionRemarks: { type: String },
  inspectionCondition: { type: String },
  inspectionImages: [{ type: String }],
  
  rejectionReason: { type: String }
}, { timestamps: true });

complaintSchema.index({ assignedContractor: 1 });
complaintSchema.index({ assignedOfficial: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ user: 1 });
complaintSchema.index({ park: 1 });
complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
