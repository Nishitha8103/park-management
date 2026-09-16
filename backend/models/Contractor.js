const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const contractorSchema = new mongoose.Schema({
  contractorId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  corporation: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporation', required: true },
  zone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true },
  ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
  park: { type: mongoose.Schema.Types.ObjectId, ref: 'Park' },
  assignedParks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Park' }],
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePhoto: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  availabilityStatus: { 
    type: String, 
    enum: ['Available', 'On Leave', 'Unavailable'], 
    default: 'Available' 
  },
  role: { type: String, default: 'contractor' },
  maintenanceSkills: [{ type: String }],
  resetPasswordOtp: { type: String, default: null },
  resetPasswordOtpExpires: { type: Date, default: null }
}, { timestamps: true });

// Match user entered password to hashed password in database
contractorSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
contractorSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const Contractor = mongoose.model('Contractor', contractorSchema);

module.exports = Contractor;
