const MaterialRequest = require('../models/MaterialRequest');
const Contractor = require('../models/Contractor');

// @desc   Contractor submits a material request
// @route  POST /api/material-requests
// @access Contractor
const createMaterialRequest = async (req, res) => {
  try {
    const { materialName, quantity, unit, priority, reason, park, parkName } = req.body;

    if (!materialName || !quantity || !reason) {
      return res.status(400).json({ message: 'Material name, quantity and reason are required.' });
    }

    const contractor = await Contractor.findById(req.user.id);
    if (!contractor) return res.status(404).json({ message: 'Contractor not found' });

    const request = await MaterialRequest.create({
      contractor: contractor._id,
      contractorName: contractor.name,
      park: park || undefined,
      parkName: parkName || '',
      materialName,
      quantity,
      unit: unit || 'units',
      priority: priority || 'Medium',
      reason,
    });

    res.status(201).json({ message: 'Material request submitted successfully', request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc   Contractor gets their own requests
// @route  GET /api/material-requests/my
// @access Contractor
const getMyRequests = async (req, res) => {
  try {
    const requests = await MaterialRequest.find({ contractor: req.user.id })
      .sort({ createdAt: -1 })
      .populate('park', 'name');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc   Admin gets all material requests
// @route  GET /api/material-requests
// @access Admin
const getAllRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.status = status;

    const requests = await MaterialRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('park', 'name')
      .populate('contractor', 'name email');

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc   Admin approves or rejects a request
// @route  PUT /api/material-requests/:id/review
// @access Admin
const reviewRequest = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Approved or Rejected' });
    }

    const request = await MaterialRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = status;
    request.adminNotes = adminNotes || '';
    request.reviewedAt = new Date();
    request.reviewedBy = req.user?.name || 'Admin';

    await request.save();
    res.json({ message: `Request ${status.toLowerCase()} successfully`, request });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc   Contractor deletes a pending request
// @route  DELETE /api/material-requests/:id
// @access Contractor
const deleteRequest = async (req, res) => {
  try {
    const request = await MaterialRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.contractor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending requests can be deleted' });
    }
    await request.deleteOne();
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createMaterialRequest,
  getMyRequests,
  getAllRequests,
  reviewRequest,
  deleteRequest,
};
