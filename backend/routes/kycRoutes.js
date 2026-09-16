const express    = require('express');
const router     = express.Router();
const { submitKyc, getKycStatus, getAllKycRequests, reviewKyc } = require('../controllers/kycController');
const { protect } = require('../middleware/authMiddleware');
const kycUpload   = require('../middleware/kycUploadMiddleware');

// User routes (require login)
router.post(
  '/submit',
  protect,
  kycUpload.fields([{ name: 'aadhaarFront', maxCount: 1 }, { name: 'aadhaarBack', maxCount: 1 }]),
  submitKyc
);
router.get('/status', protect, getKycStatus);

// Admin routes (require login — add admin check if needed)
router.get('/all', protect, getAllKycRequests);
router.put('/review/:userId', protect, reviewKyc);

module.exports = router;
