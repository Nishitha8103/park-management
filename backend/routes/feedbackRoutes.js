const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// Public or Authenticated submit
router.post('/', feedbackController.createFeedback);

// Get User's Own Feedback
router.get('/my', feedbackController.getMyFeedback);

// Admin Get All Feedback & Analytics
router.get('/all', feedbackController.getAllFeedback);
router.get('/stats', feedbackController.getFeedbackStats);

// Delete Feedback
router.delete('/:id', feedbackController.deleteFeedback);

module.exports = router;
