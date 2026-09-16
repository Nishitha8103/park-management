const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  leaveId: { type: String, required: true, unique: true },
  applicantId: { type: String, required: true },
  applicantModel: { type: String, enum: ['Contractor', 'User'], required: true },
  applicantRole: { 
    type: String, 
    enum: ['contractor', 'Contractor', 'government_official', 'official', 'Government Official'], 
    required: true 
  },
  applicantName: { type: String, required: true },
  applicantEmail: { type: String },
  applicantPhone: { type: String },
  applicantDepartment: { type: String },
  
  leaveType: { 
    type: String, 
    enum: [
      'Casual Leave', 
      'Sick / Medical Leave', 
      'Earned / Annual Leave', 
      'Maternity / Paternity Leave', 
      'Compensatory Off', 
      'Emergency Leave', 
      'Loss of Pay / Unpaid Leave', 
      'Other'
    ], 
    default: 'Casual Leave',
    required: true
  },
  duration: { 
    type: String, 
    enum: ['Full Day', 'Half Day – Morning', 'Half Day – Afternoon'], 
    default: 'Full Day' 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  supportingDocument: { type: String, default: '' },
  supportingDocumentOriginalName: { type: String, default: '' },
  handoverNotes: { type: String, default: '' },
  
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], 
    default: 'Pending' 
  },
  
  adminRemarks: { type: String, default: '' },
  reviewedBy: { type: String },
  reviewedAt: { type: Date }
}, { timestamps: true });

leaveRequestSchema.index({ applicantId: 1, status: 1 });
leaveRequestSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
