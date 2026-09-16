const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const {
  getProofTypesConfig,
  updateProofTypesConfig,
  createBooking,
  getBookings,
  getUserBookings,
  verifyIdentity,
  verifyAddress,
  requestMoreInfo,
  approveBooking,
  rejectBooking,
  createRazorpayOrder,
  payBooking
} = require('../controllers/stallBookingController');

// Configuration
router.get('/config/proof-types', getProofTypesConfig);
router.put('/config/proof-types', protect, authorize('Admin', 'SuperAdmin'), updateProofTypesConfig);

// Booking creation & list
router.post(
  '/',
  protect,
  upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'currentAddressProof', maxCount: 1 }
  ]),
  createBooking
);

router.get('/', protect, authorize('Admin', 'SuperAdmin'), getBookings);
router.get('/user/:userId', getUserBookings);

// Admin Multi-tier Verification Actions
router.put('/:id/verify-identity', protect, authorize('Admin', 'SuperAdmin'), verifyIdentity);
router.put('/:id/verify-address', protect, authorize('Admin', 'SuperAdmin'), verifyAddress);
router.put('/:id/request-info', protect, authorize('Admin', 'SuperAdmin'), requestMoreInfo);
router.put('/:id/approve', protect, authorize('Admin', 'SuperAdmin'), approveBooking);
router.put('/:id/reject', protect, authorize('Admin', 'SuperAdmin'), rejectBooking);

// Razorpay Payments
router.post('/:id/create-order', protect, createRazorpayOrder);
router.post('/:id/pay', protect, payBooking);

module.exports = router;
