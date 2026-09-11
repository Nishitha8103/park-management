const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  // Core references
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Participant info
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  age: { type: Number },
  gender: { type: String },
  emergencyContactName: { type: String },
  emergencyContactPhone: { type: String },
  emergencyContactRelation: { type: String },
  declarationAccepted: { type: Boolean, default: true },
  numberOfAttendees: { type: Number, default: 1, min: 1 },

  // Unique identifiers (generated on confirmed payment)
  registrationId: { type: String, unique: true, sparse: true },
  receiptNumber: { type: String, unique: true, sparse: true },

  // Payment details
  totalAmount: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Successful', 'Failed'],
    default: 'Pending'
  },
  registrationStatus: {
    type: String,
    enum: ['Pending Payment', 'Confirmed', 'Completed'],
    default: 'Pending Payment'
  },
  paymentDate: { type: Date },
  paymentGateway: { type: String, default: 'Razorpay' },
  paymentReceiverType: {
    type: String,
    default: 'Authorized Corporation/Government Account'
  },

  // Razorpay fields
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },

  // Snapshot of event details at time of registration (for receipts)
  eventSnapshot: {
    title: String,
    parkName: String,
    eventDate: Date,
    location: String,
    price: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
