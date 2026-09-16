const express = require('express');
const router = express.Router();
const {
  submitReassignmentRequest,
  getReassignmentRequests,
  getEligibleCandidates,
  approveReassignment,
  rejectReassignment,
  directReassign,
  escalateTask
} = require('../controllers/reassignmentController');

// Submit reassignment request (Contractor / Govt Official)
router.post('/request', submitReassignmentRequest);

// Get list of reassignment requests (Admin / Overview)
router.get('/', getReassignmentRequests);

// Get eligible candidate list strictly role-filtered for a task
router.get('/eligible-candidates/:taskId', getEligibleCandidates);

// Admin Approve & Reassign
router.post('/approve', approveReassignment);

// Admin Reject Reassignment Request
router.post('/reject', rejectReassignment);

// Admin Direct Reassign
router.post('/direct', directReassign);

// Admin Escalate Task
router.post('/escalate', escalateTask);

module.exports = router;
