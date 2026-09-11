const express = require('express');
const router = express.Router();
const {
  getEvents,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMyRegistrations,
  getAllRegistrations,
  getPaymentStats,
  getRegistrationReceipt
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ── Public Routes ─────────────────────────────────────────────
// Get all active events (public)
router.get('/', getEvents);

// Registration (free events)
router.post('/:id/register', registerForEvent);

// Payment flow
router.post('/:id/create-order', createRazorpayOrder);
router.post('/:id/verify-payment', verifyRazorpayPayment);

// Public user: get their own registrations (by email query param, no auth needed)
router.get('/registrations/my', getMyRegistrations);

// Public: view a specific receipt by registrationId
router.get('/registrations/:regId/receipt', getRegistrationReceipt);

// ── Admin Routes ───────────────────────────────────────────────
// Get all events including inactive
router.get('/all', protect, authorize('Admin', 'admin'), getAllEvents);

// Event CRUD
router.post('/', protect, authorize('Admin', 'admin'), createEvent);
router.put('/:id', protect, authorize('Admin', 'admin'), updateEvent);
router.delete('/:id', protect, authorize('Admin', 'admin'), deleteEvent);

// Admin: all registrations (with optional ?eventId=&paymentStatus= filters)
router.get('/registrations/all', protect, authorize('Admin', 'admin'), getAllRegistrations);

// Admin: payment statistics
router.get('/payments/stats', protect, authorize('Admin', 'admin'), getPaymentStats);

module.exports = router;
