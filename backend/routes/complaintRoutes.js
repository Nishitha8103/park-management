const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createComplaint, getComplaints, getComplaintById, updateComplaint, deleteComplaint } = require('../controllers/complaintController');

const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/complaints');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'))
});

const upload = multer({ 
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

router.post('/', upload.array('images', 5), createComplaint);
router.get('/', getComplaints);
router.get('/:id', getComplaintById);
router.put('/:id', upload.fields([
  { name: 'beforeImages', maxCount: 5 },
  { name: 'afterImages', maxCount: 5 },
  { name: 'completionReport', maxCount: 1 },
  { name: 'inspectionImages', maxCount: 5 }
]), updateComplaint);
router.delete('/:id', deleteComplaint);

module.exports = router;
