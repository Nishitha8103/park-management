const mongoose = require('mongoose');

const floraSchema = new mongoose.Schema({
  park: { type: mongoose.Schema.Types.ObjectId, ref: 'Park', required: true },
  species: { type: String, required: true },
  scientificName: { type: String },
  type: { 
    type: String, 
    required: true,
    enum: ['Tree', 'Shrub', 'Flower Bed', 'Lawn', 'Other']
  },
  status: { 
    type: String, 
    default: 'Healthy',
    enum: ['Healthy', 'Needs Attention', 'Diseased', 'Dead']
  },
  datePlanted: { type: Date },
  locationInPark: { type: String }, // e.g. "Near North Gate"
  notes: { type: String },
  images: [{ type: String }]
}, { timestamps: true });

const Flora = mongoose.model('Flora', floraSchema);

module.exports = Flora;
