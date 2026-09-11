const mongoose = require('mongoose');

const stallBookingSchema = new mongoose.Schema({
  park: { type: mongoose.Schema.Types.ObjectId, ref: 'Park', required: true },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: 'StallSlot', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The stall owner
  stallName: { type: String, required: true },
  productsType: { type: String, required: true },
  applicantName: { type: String, required: true },
  applicantPhone: { type: String, required: true },
  amountPaid: { type: Number, required: true },
  documentUrl: { type: String }, // For verification documents
  photoUrl: { type: String }, // For applicant photo
  status: { 
    type: String, 
    default: 'Pending Approval',
    enum: ['Pending Approval', 'Pending Payment', 'Confirmed', 'Rejected', 'Expired']
  },
  bookingDate: { type: Date, default: Date.now },
  approvalDate: { type: Date },
  paymentExpiresAt: { type: Date },
  rejectionReason: { type: String }
}, { timestamps: true });

const StallBooking = mongoose.model('StallBooking', stallBookingSchema);

module.exports = StallBooking;
