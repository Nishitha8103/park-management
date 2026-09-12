const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientUserId: { type: String, required: true }, // User ID, Contractor ID, "ADMIN_ALL", "CITIZEN_ALL", etc.
  recipientRole: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String },
  category: { type: String }, // 'Event', 'Payment', 'Complaint', 'Park Announcement', 'Stall Booking', 'Feedback', etc.
  priority: { type: String, default: 'NORMAL' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  relatedEntityType: { type: String }, // 'COMPLAINT', 'PARK', 'TASK', 'ANNOUNCEMENT', 'FEEDBACK', 'EVENT', 'PAYMENT', 'STALL_BOOKING', 'REGISTRATION'
  relatedEntityId: { type: String },
  actionRoute: { type: String }
}, { timestamps: true });

notificationSchema.index({ recipientUserId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
