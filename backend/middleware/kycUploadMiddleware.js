const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Ensure kyc uploads directory exists
const kycDir = path.join(__dirname, '../uploads/kyc');
if (!fs.existsSync(kycDir)) {
  fs.mkdirSync(kycDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, kycDir),
  filename: (req, file, cb) => {
    const userId = req.user?._id || 'unknown';
    const side   = file.fieldname === 'aadhaarFront' ? 'front' : 'back';
    const suffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `kyc-${userId}-${side}-${suffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for KYC documents'), false);
  }
};

const kycUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = kycUpload;
