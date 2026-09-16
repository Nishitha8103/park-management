const mongoose = require('mongoose');
const Emergency = require('../models/Emergency');
const Park = require('../models/Park');
const User = require('../models/User');
const Contractor = require('../models/Contractor');
const Notification = require('../models/Notification');

// Generate unique Emergency SOS ID
const generateEmergencyId = async () => {
  const year = new Date().getFullYear();
  const count = await Emergency.countDocuments();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SOS-${year}-${String(count + 1).padStart(3, '0')}${randomSuffix}`;
};

// @desc    Submit Emergency SOS Request
// @route   POST /api/emergencies
// @access  Public / Authenticated
const createEmergency = async (req, res) => {
  try {
    const {
      citizenId,
      citizenName,
      citizenPhone,
      citizenEmail,
      emergencyType,
      parkId,
      latitude,
      longitude,
      address,
      landmarkDescription,
      description
    } = req.body;

    if (!citizenName || !citizenPhone || !emergencyType || !parkId) {
      return res.status(400).json({ message: 'Citizen Name, Phone, Emergency Type, and Park are required.' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'GPS coordinates (latitude & longitude) are required for emergency response.' });
    }

    // 1. Fetch Park details & Assigned Personnel
    const park = await Park.findById(parkId)
      .populate('governmentOfficial')
      .populate('contractor')
      .populate('securityStaff')
      .populate('parkStaff');

    if (!park) {
      return res.status(404).json({ message: 'Selected park not found.' });
    }

    // Find security staff assigned to this park (from park fields or User search)
    let assignedSecurityStaffIds = [];
    if (park.securityStaff && park.securityStaff.length > 0) {
      assignedSecurityStaffIds = park.securityStaff.map(s => s._id || s);
    }

    // Also look for Users with role 'Security' or 'Park Security' or 'Park Staff' or 'Planting Staff' assigned to this park
    const securityUsers = await User.find({
      role: { $in: ['Security', 'Park Security', 'Park Staff', 'Planting Staff'] },
      assignedParks: park._id
    }).select('_id name phone role email');

    for (const secUser of securityUsers) {
      if (!assignedSecurityStaffIds.some(id => String(id) === String(secUser._id))) {
        assignedSecurityStaffIds.push(secUser._id);
      }
    }

    const assignedOfficialId = park.governmentOfficial?._id || park.governmentOfficial || null;
    let assignedContractorId = park.contractor?._id || park.contractor || null;

    // Look up all Contractors and Gardeners assigned to this park
    const assignedContractors = await Contractor.find({
      $or: [
        { _id: assignedContractorId },
        { assignedParks: park._id },
        { park: park._id }
      ]
    }).select('_id name phone email maintenanceSkills');

    if (!assignedContractorId && assignedContractors.length > 0) {
      assignedContractorId = assignedContractors[0]._id;
    }

    // 2. Generate unique SOS ID
    const emergencyId = await generateEmergencyId();

    // 3. Create Emergency Record
    const emergency = new Emergency({
      emergencyId,
      citizen: citizenId && mongoose.Types.ObjectId.isValid(citizenId) ? citizenId : null,
      citizenName,
      citizenPhone,
      citizenEmail: citizenEmail || '',
      emergencyType: emergencyType || 'Medical Emergency',
      park: park._id,
      parkName: park.name,
      district: park.district,
      corporation: park.corporation,
      zone: park.zone,
      ward: park.ward,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address || park.address || 'Park Premises',
      landmarkDescription: landmarkDescription || '',
      description: description || '',
      status: 'Emergency Reported',
      priority: 'CRITICAL',
      assignedSecurityStaff: assignedSecurityStaffIds,
      assignedOfficial: assignedOfficialId,
      assignedContractor: assignedContractorId,
      statusHistory: [
        {
          status: 'Emergency Reported',
          updatedBy: `${citizenName} (Citizen)`,
          timestamp: new Date(),
          notes: `SOS triggered for ${emergencyType} at ${park.name}.`
        }
      ]
    });

    await emergency.save();

    // 4. Send High-Priority Notifications with Alert Sound flag
    const timeFormatted = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const locationString = landmarkDescription ? `${landmarkDescription} (${address || park.name})` : (address || `${park.name} Premises`);

    // A. Notify Assigned Park Gardener / Contractors directly
    for (const c of assignedContractors) {
      const isGardener = c.maintenanceSkills?.some(s => s.toLowerCase().includes('gardener') || s.toLowerCase().includes('gardening'));
      const roleTitle = isGardener ? 'PARK GARDENER' : 'PARK CONTRACTOR / STAFF';

      await Notification.create({
        recipientUserId: String(c._id),
        recipientRole: 'contractor',
        title: `🚨 SOS EMERGENCY: ${emergencyType.toUpperCase()}`,
        message: `EMERGENCY ALERT [${roleTitle}]: ${emergencyType} reported by ${citizenName} (Ph: ${citizenPhone}) at ${park.name}. Live Location: ${locationString}. Immediate assistance required on-site!`,
        category: 'SOS Emergency',
        type: 'SOS Medical Emergency',
        priority: 'URGENT',
        relatedEntityType: 'EMERGENCY',
        relatedEntityId: emergency._id.toString(),
        actionRoute: `/contractor-dashboard`,
        isRead: false
      });
    }

    // B. Notify Assigned Park Security / Staff
    for (const staffId of assignedSecurityStaffIds) {
      await Notification.create({
        recipientUserId: String(staffId),
        recipientRole: 'staff',
        title: `🚨 SOS EMERGENCY: ${emergencyType.toUpperCase()}`,
        message: `EMERGENCY ALERT: ${emergencyType} reported by ${citizenName} (Ph: ${citizenPhone}) at ${park.name}. Location: ${locationString}. Immediate assistance required!`,
        category: 'SOS Emergency',
        type: 'SOS Medical Emergency',
        priority: 'URGENT',
        relatedEntityType: 'EMERGENCY',
        relatedEntityId: emergency._id.toString(),
        actionRoute: `/gov-dashboard/emergencies`,
        isRead: false
      });
    }

    // Also broadcast to general staff for this park
    await Notification.create({
      recipientUserId: `PARK_STAFF_${park._id}`,
      recipientRole: 'staff',
      title: `🚨 SOS EMERGENCY: ${emergencyType.toUpperCase()}`,
      message: `EMERGENCY at ${park.name}: ${emergencyType} reported by ${citizenName} (${citizenPhone}). Location: ${locationString}.`,
      category: 'SOS Emergency',
      type: 'SOS Medical Emergency',
      priority: 'URGENT',
      relatedEntityType: 'EMERGENCY',
      relatedEntityId: emergency._id.toString(),
      actionRoute: `/gov-dashboard/emergencies`,
      isRead: false
    });

    // C. Notify Assigned Government Official
    if (assignedOfficialId) {
      await Notification.create({
        recipientUserId: String(assignedOfficialId),
        recipientRole: 'official',
        title: `🚨 SOS EMERGENCY: ${emergencyType.toUpperCase()}`,
        message: `High Priority: ${emergencyType} reported at ${park.name} by ${citizenName} (Ph: ${citizenPhone}). Live Location: ${locationString}.`,
        category: 'SOS Emergency',
        type: 'SOS Medical Emergency',
        priority: 'URGENT',
        relatedEntityType: 'EMERGENCY',
        relatedEntityId: emergency._id.toString(),
        actionRoute: `/gov-dashboard/emergencies`,
        isRead: false
      });
    }

    // D. Notify Administrators for Emergency Monitoring
    await Notification.create({
      recipientUserId: 'ADMIN_ALL',
      recipientRole: 'admin',
      title: `🚨 CRITICAL SOS: ${emergencyType} at ${park.name}`,
      message: `Citizen ${citizenName} (Ph: ${citizenPhone}) raised an Emergency SOS for ${emergencyType} at ${park.name} [Ticket: ${emergencyId}].`,
      category: 'SOS Emergency',
      type: 'SOS Medical Emergency',
      priority: 'URGENT',
      relatedEntityType: 'EMERGENCY',
      relatedEntityId: emergency._id.toString(),
      actionRoute: `/admin-dashboard/emergencies`,
      isRead: false
    });

    // D. Notification to Citizen (Confirmation)
    if (citizenId && mongoose.Types.ObjectId.isValid(citizenId)) {
      await Notification.create({
        recipientUserId: String(citizenId),
        recipientRole: 'citizen',
        title: `🚨 Emergency SOS Sent (${emergencyId})`,
        message: `Your Emergency SOS for "${emergencyType}" at ${park.name} has been broadcast to the on-site park security staff and government officials. Help is being coordinated.`,
        category: 'SOS Emergency',
        type: 'SOS Sent',
        priority: 'URGENT',
        relatedEntityType: 'EMERGENCY',
        relatedEntityId: emergency._id.toString(),
        actionRoute: `/emergency-history`,
        isRead: false
      });
    }

    res.status(201).json({
      success: true,
      message: 'Emergency SOS broadcasted successfully to on-site park security staff and officials.',
      emergency: {
        _id: emergency._id,
        emergencyId: emergency.emergencyId,
        emergencyType: emergency.emergencyType,
        parkName: emergency.parkName,
        latitude: emergency.latitude,
        longitude: emergency.longitude,
        address: emergency.address,
        landmarkDescription: emergency.landmarkDescription,
        citizenName: emergency.citizenName,
        citizenPhone: emergency.citizenPhone,
        status: emergency.status,
        reportedAt: emergency.createdAt,
        assignedStaffCount: assignedSecurityStaffIds.length
      }
    });

  } catch (error) {
    console.error('Error in createEmergency:', error);
    res.status(500).json({ message: 'Failed to process Emergency SOS request.', error: error.message });
  }
};

// @desc    Get emergencies for citizen (their own SOS requests)
// @route   GET /api/emergencies/my
// @access  Public / Authenticated
const getCitizenEmergencies = async (req, res) => {
  try {
    const { userId, phone } = req.query;

    const query = { $or: [] };
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.$or.push({ citizen: userId });
    }
    if (phone) {
      query.$or.push({ citizenPhone: phone });
    }

    if (query.$or.length === 0) {
      return res.json({ emergencies: [] });
    }

    const emergencies = await Emergency.find(query)
      .populate('park', 'name address parkCode facilities phone')
      .populate('assignedOfficial', 'name phone email')
      .populate('assignedSecurityStaff', 'name phone role')
      .sort({ createdAt: -1 });

    res.json({ emergencies });
  } catch (error) {
    console.error('Error fetching citizen emergencies:', error);
    res.status(500).json({ message: 'Server error fetching emergencies' });
  }
};

// @desc    Get emergencies for Government Officials
// @route   GET /api/emergencies/official
// @access  Official
const getOfficialEmergencies = async (req, res) => {
  try {
    const { officialId, status, parkId, priority } = req.query;

    let query = {};
    if (officialId && mongoose.Types.ObjectId.isValid(officialId)) {
      // Find parks assigned to this official
      const officialParks = await Park.find({ governmentOfficial: officialId }).select('_id');
      const parkIds = officialParks.map(p => p._id);
      query.$or = [
        { assignedOfficial: officialId },
        { park: { $in: parkIds } }
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }
    if (parkId && parkId !== 'All') {
      query.park = parkId;
    }
    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    const emergencies = await Emergency.find(query)
      .populate('park', 'name address district zone ward phone')
      .populate('assignedOfficial', 'name phone email')
      .populate('assignedSecurityStaff', 'name phone role')
      .populate('citizen', 'name phone email')
      .sort({ createdAt: -1 });

    const activeCount = await Emergency.countDocuments({ ...query, status: { $in: ['Emergency Reported', 'Acknowledged', 'Assistance in Progress'] } });
    const resolvedCount = await Emergency.countDocuments({ ...query, status: 'Resolved' });

    res.json({ emergencies, activeCount, resolvedCount });
  } catch (error) {
    console.error('Error fetching official emergencies:', error);
    res.status(500).json({ message: 'Server error fetching emergencies' });
  }
};

// @desc    Get all emergencies for Admin Monitoring with KPIs & Filters
// @route   GET /api/emergencies/admin
// @access  Admin
const getAdminEmergencies = async (req, res) => {
  try {
    const { status, parkId, zoneId, wardId, emergencyType, startDate, endDate, priority } = req.query;

    let query = {};

    if (status && status !== 'All') query.status = status;
    if (parkId && parkId !== 'All') query.park = parkId;
    if (zoneId && zoneId !== 'All') query.zone = zoneId;
    if (wardId && wardId !== 'All') query.ward = wardId;
    if (emergencyType && emergencyType !== 'All') query.emergencyType = emergencyType;
    if (priority && priority !== 'All') query.priority = priority;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const emergencies = await Emergency.find(query)
      .populate('park', 'name address district zone ward')
      .populate('assignedOfficial', 'name phone email')
      .populate('assignedSecurityStaff', 'name phone role')
      .populate('citizen', 'name phone email')
      .sort({ createdAt: -1 });

    // Calculate KPI Stats
    const totalCount = await Emergency.countDocuments({});
    const activeCount = await Emergency.countDocuments({ status: { $in: ['Emergency Reported', 'Acknowledged', 'Assistance in Progress'] } });
    const newCount = await Emergency.countDocuments({ status: 'Emergency Reported' });
    const inProgressCount = await Emergency.countDocuments({ status: 'Assistance in Progress' });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const resolvedTodayCount = await Emergency.countDocuments({ status: { $in: ['Resolved', 'Closed'] }, updatedAt: { $gte: startOfToday } });

    // Average response time (reported -> acknowledged) in minutes
    const acknowledgedEmergencies = await Emergency.find({ acknowledgedAt: { $exists: true } }).select('createdAt acknowledgedAt');
    let avgResponseTimeMinutes = 0;
    if (acknowledgedEmergencies.length > 0) {
      const totalMinutes = acknowledgedEmergencies.reduce((acc, curr) => {
        const diff = (new Date(curr.acknowledgedAt) - new Date(curr.createdAt)) / (1000 * 60);
        return acc + (diff > 0 ? diff : 0);
      }, 0);
      avgResponseTimeMinutes = Math.round(totalMinutes / acknowledgedEmergencies.length);
    }

    res.json({
      emergencies,
      stats: {
        totalCount,
        activeCount,
        newCount,
        inProgressCount,
        resolvedTodayCount,
        avgResponseTimeMinutes
      }
    });
  } catch (error) {
    console.error('Error fetching admin emergencies:', error);
    res.status(500).json({ message: 'Server error fetching admin emergencies' });
  }
};

// @desc    Get single emergency by ID
// @route   GET /api/emergencies/:id
// @access  Authenticated
const getEmergencyById = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id)
      .populate('park')
      .populate('assignedOfficial', 'name phone email')
      .populate('assignedSecurityStaff', 'name phone role')
      .populate('assignedContractor', 'name phone email')
      .populate('citizen', 'name phone email');

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency record not found' });
    }

    res.json(emergency);
  } catch (error) {
    console.error('Error fetching emergency by id:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update Emergency Status & Log Response Notes
// @route   PUT /api/emergencies/:id/status
// @access  Official / Staff / Admin
const updateEmergencyStatus = async (req, res) => {
  try {
    const { status, note, updatedByName, updatedByRole, updatedById, resolutionNotes } = req.body;

    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency record not found' });
    }

    const previousStatus = emergency.status;
    emergency.status = status;

    if (status === 'Acknowledged' && !emergency.acknowledgedAt) {
      emergency.acknowledgedAt = new Date();
      emergency.acknowledgedByName = updatedByName || 'Assigned Staff';
      if (updatedById && mongoose.Types.ObjectId.isValid(updatedById)) {
        emergency.acknowledgedBy = updatedById;
      }
    }

    if (status === 'Assistance in Progress') {
      emergency.inProgressAt = new Date();
    }

    if ((status === 'Resolved' || status === 'Closed') && !emergency.resolvedAt) {
      emergency.resolvedAt = new Date();
      emergency.resolvedByName = updatedByName || 'Staff';
      if (resolutionNotes) emergency.resolutionNotes = resolutionNotes;
      if (updatedById && mongoose.Types.ObjectId.isValid(updatedById)) {
        emergency.resolvedBy = updatedById;
      }
    }

    if (status === 'Closed') {
      emergency.closedAt = new Date();
    }

    if (note && note.trim()) {
      emergency.responseNotes.push({
        note: note.trim(),
        authorName: updatedByName || 'Authorized Responder',
        authorRole: updatedByRole || 'Staff',
        timestamp: new Date()
      });
    }

    emergency.statusHistory.push({
      status,
      updatedBy: `${updatedByName || 'Authorized User'} (${updatedByRole || 'Staff'})`,
      timestamp: new Date(),
      notes: note || `Status updated from ${previousStatus} to ${status}.`
    });

    await emergency.save();

    // Send update notification to Citizen
    if (emergency.citizen) {
      let notifTitle = `🔔 Emergency Status Updated: ${status}`;
      let notifMsg = `Your emergency request (${emergency.emergencyId}) at ${emergency.parkName} status is now "${status}".`;

      if (status === 'Acknowledged') {
        notifTitle = `✅ Emergency Acknowledged (${emergency.emergencyId})`;
        notifMsg = `Park security and staff have acknowledged your SOS emergency at ${emergency.parkName}. Assistance is on the way!`;
      } else if (status === 'Assistance in Progress') {
        notifTitle = `🏃 Assistance in Progress (${emergency.emergencyId})`;
        notifMsg = `Park responders are currently providing assistance on-site for your emergency at ${emergency.parkName}.`;
      } else if (status === 'Resolved') {
        notifTitle = `✅ Emergency Resolved (${emergency.emergencyId})`;
        notifMsg = `Your emergency request (${emergency.emergencyId}) at ${emergency.parkName} has been marked as Resolved. Stay safe!`;
      }

      await Notification.create({
        recipientUserId: String(emergency.citizen),
        recipientRole: 'citizen',
        title: notifTitle,
        message: notifMsg,
        category: 'SOS Emergency',
        type: `SOS ${status}`,
        priority: 'URGENT',
        relatedEntityType: 'EMERGENCY',
        relatedEntityId: emergency._id.toString(),
        actionRoute: `/emergency-history`,
        isRead: false
      });
    }

    res.json({
      success: true,
      message: `Emergency status updated to ${status}.`,
      emergency
    });

  } catch (error) {
    console.error('Error updating emergency status:', error);
    res.status(500).json({ message: 'Server error updating emergency status' });
  }
};

// @desc    Assign or Reassign Security Staff / Responders
// @route   PUT /api/emergencies/:id/assign-staff
// @access  Official / Admin
const assignStaff = async (req, res) => {
  try {
    const { staffIds, note, assignedByName } = req.body;

    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency record not found' });
    }

    if (Array.isArray(staffIds)) {
      emergency.assignedSecurityStaff = staffIds;
    }

    emergency.statusHistory.push({
      status: emergency.status,
      updatedBy: assignedByName || 'Admin/Official',
      timestamp: new Date(),
      notes: note || `Security staff re-assigned for emergency response.`
    });

    await emergency.save();

    // Notify newly assigned staff
    for (const sId of staffIds) {
      await Notification.create({
        recipientUserId: String(sId),
        recipientRole: 'staff',
        title: `🚨 EMERGENCY ASSIGNED: ${emergency.emergencyType}`,
        message: `You have been directly assigned to respond to an emergency SOS at ${emergency.parkName} (Citizen: ${emergency.citizenName}, Ph: ${emergency.citizenPhone}). Location: ${emergency.landmarkDescription || emergency.address}.`,
        category: 'SOS Emergency',
        type: 'SOS Staff Assigned',
        priority: 'URGENT',
        relatedEntityType: 'EMERGENCY',
        relatedEntityId: emergency._id.toString(),
        actionRoute: `/gov-dashboard/emergencies`,
        isRead: false
      });
    }

    res.json({ success: true, message: 'Staff assigned successfully.', emergency });
  } catch (error) {
    console.error('Error assigning staff:', error);
    res.status(500).json({ message: 'Server error assigning staff' });
  }
};

module.exports = {
  createEmergency,
  getCitizenEmergencies,
  getOfficialEmergencies,
  getAdminEmergencies,
  getEmergencyById,
  updateEmergencyStatus,
  assignStaff
};
