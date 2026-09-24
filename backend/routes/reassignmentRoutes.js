const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/reassignments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, 'reassign-' + Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'))
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const { uploadToCloudinary } = require('../utils/cloudinary');
const {
  submitReassignmentRequest,
  getReassignmentRequests,
  getEligibleCandidates,
  approveReassignment,
  rejectReassignment,
  directReassign,
  escalateTask
} = require('../controllers/reassignmentController');

// Upload supporting attachment
router.post('/upload', upload.single('attachment'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const fileUrl = await uploadToCloudinary(req.file, 'reassignments');
  res.json({ success: true, fileUrl, filename: req.file.originalname });
});

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

