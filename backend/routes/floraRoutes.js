const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getFlora,
  addFlora,
  updateFlora,
  getPlantingStaff,
  createPlantingStaff,
  getMyTasks,
  getAllTasks,
  createTask,
  updateTaskStatus
} = require('../controllers/floraController');

// Flora inventory routes
router.route('/')
  .get(protect, getFlora)
  .post(protect, addFlora);

router.route('/:id')
  .put(protect, updateFlora);

// Staff management routes (Admin)
router.route('/staff')
  .get(protect, getPlantingStaff)
  .post(protect, createPlantingStaff);

// Task routes
router.route('/tasks/my-tasks')
  .get(protect, getMyTasks);

router.route('/tasks/all')
  .get(protect, getAllTasks);

router.route('/tasks')
  .post(protect, createTask);

router.route('/tasks/:id/status')
  .patch(protect, updateTaskStatus);

module.exports = router;
