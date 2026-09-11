const express = require('express');
const router = express.Router();
const { 
  getAnnouncements, 
  getAllAnnouncements,
  getParkAnnouncements,
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement 
} = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route to get active announcements
router.get('/', getAnnouncements);
router.get('/park/:parkId', getParkAnnouncements);

// Admin routes
router.get('/all', protect, authorize('Admin', 'admin'), getAllAnnouncements);
router.post('/', protect, authorize('Admin', 'admin'), createAnnouncement);
router.put('/:id', protect, authorize('Admin', 'admin'), updateAnnouncement);
router.delete('/:id', protect, authorize('Admin', 'admin'), deleteAnnouncement);

module.exports = router;
