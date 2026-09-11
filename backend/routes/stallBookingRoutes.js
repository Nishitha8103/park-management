const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const {
  createBooking,
  getBookings,
  getUserBookings,
  approveBooking,
  rejectBooking,
  createRazorpayOrder,
  payBooking
} = require('../controllers/stallBookingController');

router.post('/', protect, upload.fields([{ name: 'document', maxCount: 1 }, { name: 'photo', maxCount: 1 }]), createBooking);
router.get('/', protect, authorize('Admin', 'SuperAdmin'), getBookings);
router.get('/user/:userId', protect, getUserBookings);
router.put('/:id/approve', protect, authorize('Admin', 'SuperAdmin'), approveBooking);
router.put('/:id/reject', protect, authorize('Admin', 'SuperAdmin'), rejectBooking);
router.post('/:id/create-order', protect, createRazorpayOrder);
router.post('/:id/pay', protect, payBooking);

module.exports = router;
