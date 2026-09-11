const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getDistricts, createDistrict, updateDistrict, deleteDistrict,
  getCorporations, createCorporation, updateCorporation, deleteCorporation,
  getZones, createZone, updateZone, deleteZone,
  getWards, createWard, updateWard, deleteWard
} = require('../controllers/masterDataController');

// All POST, PUT, DELETE operations require Admin access
const adminOnly = [protect, authorize('Admin')];

// --- Districts ---
router.route('/districts')
  .get(getDistricts)
  .post(adminOnly, createDistrict);
router.route('/districts/:id')
  .put(adminOnly, updateDistrict)
  .delete(adminOnly, deleteDistrict);

// --- Corporations ---
router.route('/corporations')
  .get(getCorporations)
  .post(adminOnly, createCorporation);
router.route('/corporations/:id')
  .put(adminOnly, updateCorporation)
  .delete(adminOnly, deleteCorporation);

// --- Zones ---
router.route('/zones')
  .get(getZones)
  .post(adminOnly, createZone);
router.route('/zones/:id')
  .put(adminOnly, updateZone)
  .delete(adminOnly, deleteZone);

// --- Wards ---
router.route('/wards')
  .get(getWards)
  .post(adminOnly, createWard);
router.route('/wards/:id')
  .put(adminOnly, updateWard)
  .delete(adminOnly, deleteWard);

module.exports = router;
