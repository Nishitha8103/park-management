const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  emergencyId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  citizen: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  citizenName: { 
    type: String, 
    required: true 
  },
  citizenPhone: { 
    type: String, 
    required: true 
  },
  citizenEmail: { 
    type: String 
  },
  emergencyType: { 
    type: String, 
    required: true,
    enum: [
      'Medical Emergency',
      'Serious Injury',
      'Fracture / Broken Bone',
      'Unconscious / Fainted Person',
      'Severe Bleeding',
      'Accident',
      'Other Emergency'
    ],
    default: 'Medical Emergency'
  },
  park: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Park', 
    required: true 
  },
  parkName: { 
    type: String, 
    required: true 
  },
  district: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
  corporation: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporation' },
  zone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
  ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward' },
  
  // Live GPS Coordinates & Location
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String },
  landmarkDescription: { type: String },
  description: { type: String },

  // Emergency Lifecycle Status
  status: {
    type: String,
    enum: ['Emergency Reported', 'Acknowledged', 'Assistance in Progress', 'Resolved', 'Closed'],
    default: 'Emergency Reported'
  },
  priority: {
    type: String,
    enum: ['CRITICAL', 'URGENT', 'HIGH'],
    default: 'CRITICAL'
  },

  // Assigned Responders
  assignedSecurityStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedParkStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedOfficial: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedContractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor' },

  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedByName: { type: String },
  acknowledgedAt: { type: Date },

  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedByName: { type: String },
  resolvedAt: { type: Date },
  resolutionNotes: { type: String },

  closedAt: { type: Date },

  responseNotes: [
    {
      note: { type: String },
      authorName: { type: String },
      authorRole: { type: String },
      timestamp: { type: Date, default: Date.now }
    }
  ],

  statusHistory: [
    {
      status: { type: String },
      updatedBy: { type: String },
      timestamp: { type: Date, default: Date.now },
      notes: { type: String }
    }
  ]
}, { timestamps: true });

emergencySchema.index({ park: 1, status: 1 });
emergencySchema.index({ citizen: 1 });
emergencySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Emergency', emergencySchema);
