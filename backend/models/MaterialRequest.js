const mongoose = require('mongoose');

const materialRequestSchema = new mongoose.Schema({
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true },
  contractorName: { type: String },
  park: { type: mongoose.Schema.Types.ObjectId, ref: 'Park' },
  parkName: { type: String },
  materialName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'units' },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  adminNotes: { type: String, default: '' },
  reviewedBy: { type: String },
  reviewedAt: { type: Date }
}, { timestamps: true });

const MaterialRequest = mongoose.model('MaterialRequest', materialRequestSchema);
module.exports = MaterialRequest;
