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
  
  // Status workflow: New -> Assigned -> In Progress -> Completed - Waiting for Admin Review -> Returned by Admin -> Inspection Pending -> Inspection Approved -> Rework Required -> Reassigned to Contractor -> Closed
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
    enum: ['On Time', 'Due Soon', 'Overdue', 'Resolved Within SLA', 'Resolved After SLA', 'Not Applicable'], 
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

module.exports = mongoose.model('Complaint', complaintSchema);
