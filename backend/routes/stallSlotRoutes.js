const express = require('express');
const router = express.Router();
const {
  createStallSlot,
  getSlotsByPark,
  getAllAvailableSlots,
  deleteStallSlot
} = require('../controllers/stallSlotController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route to get slots for a park
router.get('/park/:parkId', getSlotsByPark);

// Public route to get available slots
router.get('/available', getAllAvailableSlots);

// Admin only routes
router.post('/', protect, authorize('Admin'), createStallSlot);
router.delete('/:id', protect, authorize('Admin'), deleteStallSlot);

module.exports = router;
