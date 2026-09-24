const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/parks');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let ext = path.extname(file.originalname || '').toLowerCase();
    if (!ext || ext === '.') {
      const mime = (file.mimetype || '').toLowerCase();
      if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
      else if (mime.includes('png')) ext = '.png';
      else if (mime.includes('webp')) ext = '.webp';
      else if (mime.includes('pdf')) ext = '.pdf';
      else if (mime.includes('heic')) ext = '.heic';
      else if (mime.includes('heif')) ext = '.heif';
      else ext = '.jpg';
    }
    cb(null, 'park-' + uniqueSuffix + ext);
  }
});

// File filter for images and documents (PDF, JPG, PNG, WEBP, HEIC/HEIF, etc.)
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
    cb(new Error('Only images (JPG, PNG, WEBP, HEIC) and PDF documents are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit for high-resolution mobile photos
});

module.exports = upload;
