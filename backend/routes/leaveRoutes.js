const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getActiveStaffOnLeave,
  getReplacementStaff,
  reassignLeaveTask
} = require('../controllers/leaveController');

const upload = require('../middleware/leaveUploadMiddleware');

// Applicant routes
router.post('/apply', upload.single('supportingDocument'), applyLeave);
router.get('/my', getMyLeaves);
router.post('/cancel', cancelLeave);

// Admin routes
router.get('/', getAllLeaves);
router.get('/active-on-leave', getActiveStaffOnLeave);
router.get('/replacement-staff', getReplacementStaff);
router.post('/reassign-task', reassignLeaveTask);
router.post('/approve', approveLeave);
router.post('/reject', rejectLeave);

module.exports = router;
