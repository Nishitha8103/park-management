const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['Admin', 'Contractor', 'Government Official', 'Public', 'public_user', 'official', 'government_official', 'Planting Staff', 'Park Staff', 'Security', 'Park Security']
  },
  assignedParks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Park' }],
  phone: { type: String },
  address: { type: String, default: '' },
  department: { type: String },
  zone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
  ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward' },
  district: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
  googleId: { type: String, default: null },
  profilePic: { type: String, default: null },
  availabilityStatus: { 
    type: String, 
    enum: ['Available', 'On Leave', 'Unavailable'], 
    default: 'Available' 
  },
  resetPasswordOtp: { type: String, default: null },
  resetPasswordOtpExpires: { type: Date, default: null },
  // KYC fields (document upload based)
  aadhaarNumber: { type: String, default: null },        // 12-digit Aadhaar (stored masked)
  aadhaarKycStatus: {
    type: String,
    enum: ['not_started', 'pending', 'verified', 'rejected'],
    default: 'not_started'
  },
  aadhaarFrontImage: { type: String, default: null },    // path to Aadhaar front photo
  aadhaarBackImage:  { type: String, default: null },    // path to Aadhaar back photo
  aadhaarKycRejectionReason: { type: String, default: null }, // admin rejection note
  aadhaarKycReviewedAt: { type: Date, default: null }    // when admin acted
}, { timestamps: true });

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

module.exports = User;
