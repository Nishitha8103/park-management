const mongoose = require('mongoose');

const parkSchema = new mongoose.Schema({
  district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  corporation: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporation', required: true },
  zone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true },
  ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
  name: { type: String, required: true },
  parkCode: { type: String, required: true },
  address: { type: String },
  latitude: { type: String },
  longitude: { type: String },
  area: { type: String },
  openedOn: { type: String },
  maintenance: { type: String },
  parkType: { type: String },
  
  // Numerical fields
  numberOfTrees: { type: Number, default: 0 },
  numberOfBenches: { type: Number, default: 0 },
  numberOfLights: { type: Number, default: 0 },
  numberOfDustbins: { type: Number, default: 0 },
  
  // Boolean Flags (Facilities)
  childrenPlayArea: { type: Boolean, default: false },
  walkingTrack: { type: Boolean, default: false },
  openGym: { type: Boolean, default: false },
  garden: { type: Boolean, default: false },
  lake: { type: Boolean, default: false },
  restrooms: { type: Boolean, default: false },
  parking: { type: Boolean, default: false },
  yogaSpace: { type: Boolean, default: false },
  drinkingWater: { type: Boolean, default: false },

  // Safety & Accessibility
  wheelchairAccessible: { type: Boolean, default: false },
  accessiblePathways: { type: Boolean, default: false },
  petFriendly: { type: Boolean, default: false },
  firstAid: { type: Boolean, default: false },
  cctv: { type: Boolean, default: false },
  strollerFriendly: { type: Boolean, default: false },
  emergencyAssistance: { type: Boolean, default: false },
  
  // Array fallback just in case old code needs it
  facilities: [{ type: String }],
  images: [{ type: String }],
  
  // Stall Management
  totalStallSlots: { type: Number, default: 0 },
  availableStallSlots: { type: Number, default: 0 },
  stallBookingAmount: { type: Number, default: 0 },
  
  // Assignment
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  governmentOfficial: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  description: { type: String },
  status: { 
    type: String, 
    default: 'Active',
    enum: ['Active', 'Under Maintenance', 'Closed']
  }
}, { timestamps: true });

parkSchema.index({ district: 1 });
parkSchema.index({ zone: 1 });
parkSchema.index({ ward: 1 });
parkSchema.index({ status: 1 });
parkSchema.index({ createdAt: -1 });

const Park = mongoose.model('Park', parkSchema);

module.exports = Park;
