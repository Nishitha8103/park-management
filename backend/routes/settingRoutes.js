const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { protect, authorize } = require('../middleware/authMiddleware');

// Default system configuration values tailored specifically to this project's models
const DEFAULT_SETTINGS = {
  branding: {
    projectName: 'Parks Monitoring System',
    slogan: '“Explore. Enjoy. Empower.”',
    description: 'Discover your city’s parks, stay informed, report issues, join events and book stalls — all in one place!',
    logoUrl: '/parks_logo_v3.png'
  },
  leavePolicy: {
    annualAllowance: 12,
    dailyDeductionRate: 1000
  },
  slaThresholds: {
    urgentHours: 4,
    highHours: 24,
    mediumHours: 48,
    lowHours: 72
  },
  publicModule: {
    allowPublicComplaints: true,
    allowCitizenRegistration: true,
    allowStallBookings: true,
    allowEventRegistrations: true
  },
  stallPolicies: {
    requireProofOfAddress: true,
    maxBookingDays: 7,
    advanceBookingWindowDays: 30,
    cancellationWindowHours: 48,
    securityDepositAmount: 500,
    stallOpeningTime: '06:00',
    stallClosingTime: '21:00'
  },
  eventPolicies: {
    maxTicketsPerUser: 5,
    cancellationWindowHours: 24,
    autoGenerateQrPass: true
  },
  contractorModule: {
    maxConcurrentTasks: 5,
    requireBeforeAfterPhotos: true,
    allowTaskReassignmentRequests: true,
    requireMaterialApproval: true
  },
  officialModule: {
    maxConcurrentInspections: 10,
    allowInspectionReassignment: true,
    mandatoryInspectionRemarks: true,
    allowLeaveSelfApplication: true
  },
  notifications: {
    highPriorityGrievances: true,
    stallBookingAlerts: true,
    contractorRequestAlerts: true
  }
};

// @desc    Get all system settings
// @route   GET /api/settings
router.get('/', async (req, res) => {
  try {
    const settings = await Setting.find({});
    const settingsMap = { ...DEFAULT_SETTINGS };

    settings.forEach(s => {
      if (s.key && s.value !== undefined) {
        settingsMap[s.key] = s.value;
      }
    });

    res.json({ success: true, settings: settingsMap });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @desc    Update a specific system setting category
// @route   PUT /api/settings/:key
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    const updated = await Setting.findOneAndUpdate(
      { key },
      { value, description: description || `System setting for ${key}` },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: `Setting '${key}' updated successfully.`, setting: updated });
  } catch (error) {
    console.error(`Error updating setting ${req.params.key}:`, error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
