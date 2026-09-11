const mongoose = require('mongoose');

const stallSlotSchema = new mongoose.Schema({
  park: { type: mongoose.Schema.Types.ObjectId, ref: 'Park', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // e.g., '09:00 AM'
  endTime: { type: String, required: true }, // e.g., '05:00 PM'
  location: { type: String, required: true }, // e.g., 'North Gate'
  price: { type: Number, required: true },
  totalSlots: { type: Number, default: 1 },
  availableSlots: { type: Number, default: 1 },
  isAvailable: { type: Boolean, default: true },
  paymentDeadlineDate: { type: Date },
  paymentDeadlineTime: { type: String, default: '23:59' },
  paymentWindowHours: { type: Number, default: 24 }
}, { timestamps: true });

module.exports = mongoose.model('StallSlot', stallSlotSchema);
