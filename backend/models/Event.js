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
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
