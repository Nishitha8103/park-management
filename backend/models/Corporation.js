const mongoose = require('mongoose');

const corporationSchema = new mongoose.Schema({
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  description: { type: String },
  status: { 
    type: String, 
    default: 'Active',
    enum: ['Active', 'Inactive']
  }
}, { timestamps: true });

module.exports = mongoose.model('Corporation', corporationSchema);
