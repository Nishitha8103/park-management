const express = require('express');
const router = express.Router();
const {
  getContractors,
  getContractorById,
  createContractor,
  updateContractor,
  deleteContractor,
  loginContractor,
  getNextContractorId,
  updateContractorProfile,
  getMyProfile
} = require('../controllers/contractorController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public route for contractor login
router.post('/login', loginContractor);

// Protected Admin routes
router.get('/next-id', protect, authorize('Admin', 'admin'), getNextContractorId);

// Protected Contractor routes
router.get('/profile', protect, authorize('Contractor', 'contractor'), getMyProfile);
router.put('/profile', protect, authorize('Contractor', 'contractor'), upload.single('profilePhoto'), updateContractorProfile);

router.route('/')
  .get(protect, authorize('Admin', 'admin'), getContractors)
  .post(protect, authorize('Admin', 'admin'), upload.single('profilePhoto'), createContractor);

router.route('/:id')
  .get(protect, authorize('Admin', 'admin'), getContractorById)
  .put(protect, authorize('Admin', 'admin'), upload.single('profilePhoto'), updateContractor)
  .delete(protect, authorize('Admin', 'admin'), deleteContractor);

module.exports = router;
