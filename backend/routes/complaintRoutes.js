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
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname || '').toLowerCase();
    if (!ext || ext === '.') {
      const mime = (file.mimetype || '').toLowerCase();
      if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
      else if (mime.includes('png')) ext = '.png';
      else if (mime.includes('webp')) ext = '.webp';
      else if (mime.includes('heic')) ext = '.heic';
      else if (mime.includes('heif')) ext = '.heif';
      else ext = '.jpg';
    }
    const cleanName = path.basename(file.originalname || 'complaint', ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}-${cleanName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const mime = (file.mimetype || '').toLowerCase();
  const origName = (file.originalname || '').toLowerCase();
  const isImageExt = /\.(jpe?g|png|webp|heic|heif|bmp|gif|avif)$/i.test(origName);
  const isPdfExt = /\.pdf$/i.test(origName);

  if (
    mime.startsWith('image/') || 
    mime === 'application/pdf' ||
    mime === 'application/octet-stream' ||
    isImageExt ||
    isPdfExt
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed for complaints'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit for high-res mobile photos
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
