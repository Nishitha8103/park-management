const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  status: { 
    type: String, 
    default: 'Active',
    enum: ['Active', 'Inactive']
  }
}, { timestamps: true });

module.exports = mongoose.model('District', districtSchema);
