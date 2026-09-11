const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createComplaint, getComplaints, getComplaintById, updateComplaint, deleteComplaint } = require('../controllers/complaintController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/complaints/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

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
