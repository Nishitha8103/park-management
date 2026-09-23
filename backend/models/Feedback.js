const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  feedbackId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  userEmail: { type: String },
  userPhone: { type: String },
  park: { type: mongoose.Schema.Types.ObjectId, ref: 'Park' },
  parkName: { type: String, required: true },
  corporation: { type: String },
  zone: { type: String },
  ward: { type: String },
  overallRating: { type: Number, required: true, min: 1, max: 5 },
  cleanlinessRating: { type: Number, min: 1, max: 5, default: 4 },
  maintenanceRating: { type: Number, min: 1, max: 5, default: 4 },
  comments: { type: String },
  tags: [{ type: String }],
  status: { type: String, default: 'Submitted' },
  reviewed: { type: Boolean, default: false }
}, { timestamps: true });

feedbackSchema.index({ park: 1 });
feedbackSchema.index({ user: 1 });
feedbackSchema.index({ overallRating: 1 });
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
