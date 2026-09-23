const mongoose = require('mongoose');

const stallBookingSchema = new mongoose.Schema({
  park: { type: mongoose.Schema.Types.ObjectId, ref: 'Park', required: true },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: 'StallSlot', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The stall owner
  stallName: { type: String, required: true },
  productsType: { type: String, required: true },
  applicantName: { type: String, required: true },
  applicantPhone: { type: String, required: true },
  applicantEmail: { type: String, default: '' },
  amountPaid: { type: Number, required: true },
  
  // Photo & Documents
  photoUrl: { type: String }, // Applicant Photo
  documentUrl: { type: String }, // Identity/Aadhaar document copy if uploaded
  
  // Addresses
  nativeAddress: { type: String, default: '' }, // Native / Permanent Address (e.g. Udupi)
  currentAddress: { type: String, default: '' }, // Current Residential Address (e.g. Bengaluru)
  isAddressSameAsAadhaar: { type: Boolean, default: true }, // Yes/No
  differentAddressReason: { type: String, default: '' }, // Reason if No (staying in another city, working, studying, etc.)
  differentAddressOtherReason: { type: String, default: '' },
  
  // Current Address Proof
  currentAddressProofUrl: { type: String, default: '' }, // Uploaded proof doc path
  currentAddressProofType: { type: String, default: '' }, // Configured document type (Rental Agreement, etc.)

  // Multi-tier Verification Statuses
  identityVerificationStatus: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected', 'More Info Requested'],
    default: 'Pending'
  },
  addressVerificationStatus: {
    type: String,
    enum: ['Pending', 'Verified', 'Proof Submitted', 'Proof Missing/Invalid'],
    default: 'Pending'
  },
  
  // Overall Stall Booking Status
  status: { 
    type: String, 
    default: 'Pending Approval',
    enum: ['Pending Approval', 'Pending Payment', 'Confirmed', 'Rejected', 'Expired']
  },

  // Audit and Review Notes
  identityReviewedAt: { type: Date },
  addressReviewedAt: { type: Date },
  approvalDate: { type: Date },
  paymentExpiresAt: { type: Date },
  rejectionReason: { type: String },
  adminNotes: { type: String },
  requestInfoMessage: { type: String },
  bookingDate: { type: Date, default: Date.now }
}, { timestamps: true });

const StallBooking = mongoose.model('StallBooking', stallBookingSchema);

module.exports = StallBooking;
