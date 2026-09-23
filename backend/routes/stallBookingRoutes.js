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
  payBooking,
  deleteBooking,
  clearAllBookings
} = require('../controllers/stallBookingController');


// Configuration
router.get('/config/proof-types', getProofTypesConfig);
router.put('/config/proof-types', protect, authorize('Admin', 'admin', 'SuperAdmin'), updateProofTypesConfig);

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

router.get('/', protect, authorize('Admin', 'admin', 'SuperAdmin'), getBookings);
router.get('/user/:userId', getUserBookings);
router.delete('/', protect, authorize('Admin', 'admin', 'SuperAdmin'), clearAllBookings);
router.delete('/:id', protect, authorize('Admin', 'admin', 'SuperAdmin'), deleteBooking);

// Admin Multi-tier Verification Actions
router.put('/:id/verify-identity', protect, authorize('Admin', 'admin', 'SuperAdmin'), verifyIdentity);
router.put('/:id/verify-address', protect, authorize('Admin', 'admin', 'SuperAdmin'), verifyAddress);
router.put('/:id/request-info', protect, authorize('Admin', 'admin', 'SuperAdmin'), requestMoreInfo);
router.put('/:id/approve', protect, authorize('Admin', 'admin', 'SuperAdmin'), approveBooking);
router.put('/:id/reject', protect, authorize('Admin', 'admin', 'SuperAdmin'), rejectBooking);

// Razorpay Payments
router.post('/:id/create-order', protect, createRazorpayOrder);
router.post('/:id/pay', protect, payBooking);

module.exports = router;

