const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');

// All routes are currently unprotected by auth middleware since we are relying on frontend roles/tokens,
// but they should be integrated with auth later. For now, they work identically to how they were structured in the implementation plan.

// GET /api/notifications?userId=123&role=admin
router.get('/', getNotifications);

// PUT /api/notifications/mark-all-read
router.put('/mark-all-read', markAllAsRead);

// PUT /api/notifications/:id/read
router.put('/:id/read', markAsRead);


module.exports = router;
