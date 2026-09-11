const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema({
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  corporationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporation', required: true },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true },
  name: { type: String, required: true },
  wardNumber: { type: String, required: true },
  description: { type: String },
  status: { 
    type: String, 
    default: 'Active',
    enum: ['Active', 'Inactive']
  }
}, { timestamps: true });

module.exports = mongoose.model('Ward', wardSchema);
