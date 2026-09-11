const express = require('express');
const router = express.Router();
const {
  createMaterialRequest,
  getMyRequests,
  getAllRequests,
  reviewRequest,
  deleteRequest,
} = require('../controllers/materialRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Contractor routes
router.post('/', protect, authorize('Contractor', 'contractor'), createMaterialRequest);
router.get('/my', protect, authorize('Contractor', 'contractor'), getMyRequests);
router.delete('/:id', protect, authorize('Contractor', 'contractor'), deleteRequest);

// Admin routes
router.get('/', protect, authorize('Admin', 'admin'), getAllRequests);
router.put('/:id/review', protect, authorize('Admin', 'admin'), reviewRequest);

module.exports = router;
