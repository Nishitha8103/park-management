const express = require('express');
const router = express.Router();
const { getParks, getParkById, createPark, bulkUploadParks, bulkDeleteParks, updatePark, deletePark, exportParksToExcel } = require('../controllers/parkController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const multer = require('multer');

// Configure memory storage for Excel parsing
const excelStorage = multer.memoryStorage();
const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'text/csv' ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls') ||
      file.originalname.endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) or CSV files are allowed'), false);
    }
  }
});

// Route to get all parks and create a new park (max 5 images)
router.route('/')
  .get(getParks)
  .post(protect, authorize('Admin'), upload.array('images', 5), createPark);

// Bulk upload route
router.post('/bulk-upload', protect, authorize('Admin'), uploadExcel.single('excelFile'), bulkUploadParks);

// Bulk delete route
router.post('/bulk-delete', protect, authorize('Admin'), bulkDeleteParks);

// Export parks to Excel
router.get('/export', protect, authorize('Admin'), exportParksToExcel);

// Route to get, update or delete a specific park
router.route('/:id')
  .get(getParkById)
  .put(protect, authorize('Admin'), upload.array('images', 5), updatePark)
  .delete(protect, authorize('Admin'), deletePark);

module.exports = router;
