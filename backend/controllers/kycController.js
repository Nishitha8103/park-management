const path = require('path');
const fs   = require('fs');
const User = require('../models/User');

// ----------------------------------------------------------------
// POST /api/kyc/submit
// Multipart form: aadhaarNumber, files: aadhaarFront, aadhaarBack
// User submits their Aadhaar card images for admin review
// ----------------------------------------------------------------
exports.submitKyc = async (req, res) => {
  try {
    const userId = req.user._id;
    const { aadhaarNumber } = req.body;

    if (!aadhaarNumber || aadhaarNumber.replace(/\s/g, '').length !== 12) {
      // Clean up uploaded files if validation fails
      if (req.files) {
        Object.values(req.files).flat().forEach(f => {
          try { fs.unlinkSync(f.path); } catch (_) {}
        });
      }
      return res.status(400).json({ success: false, message: 'Please provide a valid 12-digit Aadhaar number.' });
    }

    const frontFile = req.files?.aadhaarFront?.[0];
    const backFile  = req.files?.aadhaarBack?.[0];

    if (!frontFile || !backFile) {
      return res.status(400).json({ success: false, message: 'Both Aadhaar front and back images are required.' });
    }

    // Check current status — don't allow re-submission if already verified
    const existing = await User.findById(userId).select('aadhaarKycStatus');
    if (existing?.aadhaarKycStatus === 'verified') {
      return res.status(400).json({ success: false, message: 'Your KYC is already verified.' });
    }

    // Mask Aadhaar: store only last 4 digits
    const clean  = aadhaarNumber.replace(/\s/g, '');
    const masked = `XXXX-XXXX-${clean.slice(-4)}`;

    // Store relative URL paths served by /uploads
    const frontPath = `/uploads/kyc/${path.basename(frontFile.path)}`;
    const backPath  = `/uploads/kyc/${path.basename(backFile.path)}`;

    await User.findByIdAndUpdate(userId, {
      aadhaarNumber: masked,
      aadhaarFrontImage: frontPath,
      aadhaarBackImage:  backPath,
      aadhaarKycStatus:  'pending',
      aadhaarKycRejectionReason: null,
      aadhaarKycReviewedAt: null,
    });

    return res.status(200).json({
      success: true,
      message: 'KYC documents submitted successfully. Awaiting admin review.',
    });
  } catch (err) {
    console.error('KYC Submit Error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error while submitting KYC.' });
  }
};

// ----------------------------------------------------------------
// GET /api/kyc/status
// Returns current KYC status for the logged-in user
// ----------------------------------------------------------------
exports.getKycStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'aadhaarKycStatus aadhaarNumber aadhaarFrontImage aadhaarBackImage aadhaarKycRejectionReason aadhaarKycReviewedAt'
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.status(200).json({
      success: true,
      kycStatus:       user.aadhaarKycStatus,
      aadhaarNumber:   user.aadhaarNumber,
      frontImage:      user.aadhaarFrontImage,
      backImage:       user.aadhaarBackImage,
      rejectionReason: user.aadhaarKycRejectionReason,
      reviewedAt:      user.aadhaarKycReviewedAt,
    });
  } catch (err) {
    console.error('KYC Status Error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ----------------------------------------------------------------
// GET /api/kyc/all  (Admin only)
// Returns all users with KYC submissions (pending / verified / rejected)
// ----------------------------------------------------------------
exports.getAllKycRequests = async (req, res) => {
  try {
    const users = await User.find({
      aadhaarKycStatus: { $in: ['pending', 'verified', 'rejected'] }
    }).select('name email role aadhaarKycStatus aadhaarNumber aadhaarFrontImage aadhaarBackImage aadhaarKycRejectionReason aadhaarKycReviewedAt createdAt');

    return res.status(200).json({ success: true, requests: users });
  } catch (err) {
    console.error('KYC All Error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ----------------------------------------------------------------
// PUT /api/kyc/review/:userId  (Admin only)
// Body: { action: 'approve' | 'reject', reason?: string }
// ----------------------------------------------------------------
exports.reviewKyc = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, reason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be "approve" or "reject".' });
    }

    const update = {
      aadhaarKycStatus: action === 'approve' ? 'verified' : 'rejected',
      aadhaarKycReviewedAt: new Date(),
      aadhaarKycRejectionReason: action === 'reject' ? (reason || 'Documents not acceptable') : null,
    };

    const user = await User.findByIdAndUpdate(userId, update, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.status(200).json({
      success: true,
      message: `KYC ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
    });
  } catch (err) {
    console.error('KYC Review Error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
