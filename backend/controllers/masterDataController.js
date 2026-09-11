const District = require('../models/District');
const Corporation = require('../models/Corporation');
const Zone = require('../models/Zone');
const Ward = require('../models/Ward');
const Park = require('../models/Park');

// --- Districts ---
exports.getDistricts = async (req, res) => {
  try {
    let filter = {};
    if (req.query.hasParks === 'true') {
      const distinctDistrictIds = await Park.distinct('district');
      filter._id = { $in: distinctDistrictIds };
    }
    const districts = await District.find(filter);
    res.json(districts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createDistrict = async (req, res) => {
  try {
    const district = await District.create(req.body);
    res.status(201).json(district);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateDistrict = async (req, res) => {
  try {
    const district = await District.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(district);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteDistrict = async (req, res) => {
  try {
    await District.findByIdAndDelete(req.params.id);
    res.json({ message: 'District removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Corporations ---
exports.getCorporations = async (req, res) => {
  try {
    const filter = req.query.districtId ? { districtId: req.query.districtId } : {};
    if (req.query.hasParks === 'true') {
      const parkFilter = req.query.districtId ? { district: req.query.districtId } : {};
      const distinctCorpIds = await Park.find(parkFilter).distinct('corporation');
      filter._id = { $in: distinctCorpIds };
    }
    const corporations = await Corporation.find(filter).populate('districtId');
    res.json(corporations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCorporation = async (req, res) => {
  try {
    const corp = await Corporation.create(req.body);
    res.status(201).json(corp);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCorporation = async (req, res) => {
  try {
    const corp = await Corporation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(corp);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCorporation = async (req, res) => {
  try {
    await Corporation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Corporation removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Zones ---
exports.getZones = async (req, res) => {
  try {
    const filter = req.query.corporationId ? { corporationId: req.query.corporationId } : {};
    if (req.query.hasParks === 'true') {
      const parkFilter = req.query.corporationId ? { corporation: req.query.corporationId } : {};
      const distinctZoneIds = await Park.find(parkFilter).distinct('zone');
      filter._id = { $in: distinctZoneIds };
    }
    const zones = await Zone.find(filter).populate('corporationId').populate('districtId');
    res.json(zones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createZone = async (req, res) => {
  try {
    const zone = await Zone.create(req.body);
    res.status(201).json(zone);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(zone);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteZone = async (req, res) => {
  try {
    await Zone.findByIdAndDelete(req.params.id);
    res.json({ message: 'Zone removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Wards ---
exports.getWards = async (req, res) => {
  try {
    const filter = req.query.zoneId ? { zoneId: req.query.zoneId } : {};
    if (req.query.hasParks === 'true') {
      const parkFilter = req.query.zoneId ? { zone: req.query.zoneId } : {};
      const distinctWardIds = await Park.find(parkFilter).distinct('ward');
      filter._id = { $in: distinctWardIds };
    }
    const wards = await Ward.find(filter)
      .populate('zoneId')
      .populate('corporationId')
      .populate('districtId');
    res.json(wards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createWard = async (req, res) => {
  try {
    const ward = await Ward.create(req.body);
    res.status(201).json(ward);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateWard = async (req, res) => {
  try {
    const ward = await Ward.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(ward);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteWard = async (req, res) => {
  try {
    await Ward.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ward removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
