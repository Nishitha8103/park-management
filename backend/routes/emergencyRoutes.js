const express = require('express');
const router = express.Router();
const {
  createEmergency,
  getCitizenEmergencies,
  getOfficialEmergencies,
  getAdminEmergencies,
  getEmergencyById,
  updateEmergencyStatus,
  assignStaff
} = require('../controllers/emergencyController');

router.post('/', createEmergency);
router.get('/my', getCitizenEmergencies);
router.get('/official', getOfficialEmergencies);
router.get('/admin', getAdminEmergencies);
router.get('/:id', getEmergencyById);
router.put('/:id/status', updateEmergencyStatus);
router.put('/:id/assign-staff', assignStaff);

module.exports = router;
