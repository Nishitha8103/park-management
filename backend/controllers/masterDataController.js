const District = require('../models/District');
const Corporation = require('../models/Corporation');
const Zone = require('../models/Zone');
const Ward = require('../models/Ward');
const Park = require('../models/Park');

const masterCache = new Map();
const MASTER_TTL = 300 * 1000; // 5 minutes

const getCached = (key) => {
  const item = masterCache.get(key);
  if (item && (Date.now() - item.time < MASTER_TTL)) return item.data;
  return null;
};
const setCached = (key, data) => {
  masterCache.set(key, { time: Date.now(), data });
};
const clearMasterCache = () => masterCache.clear();

// --- Districts ---
exports.getDistricts = async (req, res) => {
  try {
    const key = 'districts_' + JSON.stringify(req.query);
    const cached = getCached(key);
    if (cached) return res.json(cached);

    let filter = {};
    if (req.query.hasParks === 'true') {
      const distinctDistrictIds = await Park.distinct('district');
      filter._id = { $in: distinctDistrictIds };
    }
    const districts = await District.find(filter).lean();
    setCached(key, districts);
    res.json(districts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createDistrict = async (req, res) => {
  try {
    const district = await District.create(req.body);
    clearMasterCache();
    res.status(201).json(district);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateDistrict = async (req, res) => {
  try {
    const district = await District.findByIdAndUpdate(req.params.id, req.body, { new: true });
    clearMasterCache();
    res.json(district);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteDistrict = async (req, res) => {
  try {
    await District.findByIdAndDelete(req.params.id);
    clearMasterCache();
    res.json({ message: 'District removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Corporations ---
exports.getCorporations = async (req, res) => {
  try {
    const key = 'corporations_' + JSON.stringify(req.query);
    const cached = getCached(key);
    if (cached) return res.json(cached);

    const filter = req.query.districtId ? { districtId: req.query.districtId } : {};
    if (req.query.hasParks === 'true') {
      const parkFilter = req.query.districtId ? { district: req.query.districtId } : {};
      const distinctCorpIds = await Park.find(parkFilter).distinct('corporation');
      filter._id = { $in: distinctCorpIds };
    }
    const corporations = await Corporation.find(filter).populate('districtId').lean();
    setCached(key, corporations);
    res.json(corporations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCorporation = async (req, res) => {
  try {
    const corp = await Corporation.create(req.body);
    clearMasterCache();
    res.status(201).json(corp);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCorporation = async (req, res) => {
  try {
    const corp = await Corporation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    clearMasterCache();
    res.json(corp);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCorporation = async (req, res) => {
  try {
    await Corporation.findByIdAndDelete(req.params.id);
    clearMasterCache();
    res.json({ message: 'Corporation removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Zones ---
exports.getZones = async (req, res) => {
  try {
    const key = 'zones_' + JSON.stringify(req.query);
    const cached = getCached(key);
    if (cached) return res.json(cached);

    const filter = req.query.corporationId ? { corporationId: req.query.corporationId } : {};
    if (req.query.hasParks === 'true') {
      const parkFilter = req.query.corporationId ? { corporation: req.query.corporationId } : {};
      const distinctZoneIds = await Park.find(parkFilter).distinct('zone');
      filter._id = { $in: distinctZoneIds };
    }
    const zones = await Zone.find(filter).populate('corporationId').populate('districtId').lean();
    setCached(key, zones);
    res.json(zones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createZone = async (req, res) => {
  try {
    const zone = await Zone.create(req.body);
    clearMasterCache();
    res.status(201).json(zone);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    clearMasterCache();
    res.json(zone);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteZone = async (req, res) => {
  try {
    await Zone.findByIdAndDelete(req.params.id);
    clearMasterCache();
    res.json({ message: 'Zone removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Wards ---
exports.getWards = async (req, res) => {
  try {
    const key = 'wards_' + JSON.stringify(req.query);
    const cached = getCached(key);
    if (cached) return res.json(cached);

    const filter = req.query.zoneId ? { zoneId: req.query.zoneId } : {};
    if (req.query.hasParks === 'true') {
      const parkFilter = req.query.zoneId ? { zone: req.query.zoneId } : {};
      const distinctWardIds = await Park.find(parkFilter).distinct('ward');
      filter._id = { $in: distinctWardIds };
    }
    const wards = await Ward.find(filter)
      .populate('zoneId')
      .populate('corporationId')
      .populate('districtId')
      .lean();
    setCached(key, wards);
    res.json(wards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createWard = async (req, res) => {
  try {
    const ward = await Ward.create(req.body);
    clearMasterCache();
    res.status(201).json(ward);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateWard = async (req, res) => {
  try {
    const ward = await Ward.findByIdAndUpdate(req.params.id, req.body, { new: true });
    clearMasterCache();
    res.json(ward);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteWard = async (req, res) => {
  try {
    await Ward.findByIdAndDelete(req.params.id);
    clearMasterCache();
    res.json({ message: 'Ward removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
