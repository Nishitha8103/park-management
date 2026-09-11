const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['General', 'Park Closure', 'Maintenance', 'Emergency', 'Event', 'Information'],
    default: 'General'
  },
  targetType: {
    type: String,
    enum: ['ALL_CITIZENS', 'ALL_CONTRACTORS', 'ALL_GOVERNMENT', 'CORPORATION', 'ZONE', 'WARD', 'PARK'],
    default: 'ALL_CITIZENS'
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'onModel',
    default: null
  },
  onModel: {
    type: String,
    enum: ['Corporation', 'Zone', 'Ward', 'Park'],
    default: 'Park'
  },
  priority: {
    type: String,
    enum: ['Normal', 'Important', 'Urgent'],
    default: 'Normal'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Draft', 'Scheduled', 'Active', 'Expired'],
    default: 'Active'
  },
  notified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
