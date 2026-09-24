const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    default: 'TBD'
  },
  image: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0
  },
  capacity: {
    type: Number,
    default: 0
  },
  parkName: {
    type: String,
    default: ''
  },
  parkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Park',
    default: null
  },
  startTime: {
    type: String,
    default: ''
  },
  endTime: {
    type: String,
    default: ''
  },
  endDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
