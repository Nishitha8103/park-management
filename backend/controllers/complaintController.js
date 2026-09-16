const Complaint = require('../models/Complaint');
const Park = require('../models/Park');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper to resolve government official from an in-memory list of officials
const resolveOfficialFromList = (park, parkName, officials) => {
  if (!park || !officials || officials.length === 0) return null;

  if (park.governmentOfficial) {
    const goId = park.governmentOfficial.toString();
    const direct = officials.find(o => o._id.toString() === goId);
    if (direct) return direct;
  }

  const wardId = park.ward?._id ? park.ward._id.toString() : (park.ward ? park.ward.toString() : null);
  if (wardId) {
    const byWard = officials.find(o => o.ward && o.ward.toString() === wardId);
    if (byWard) return byWard;
  }

  const zoneId = park.zone?._id ? park.zone._id.toString() : (park.zone ? park.zone.toString() : null);
  if (zoneId) {
    const byZone = officials.find(o => o.zone && o.zone.toString() === zoneId);
    if (byZone) return byZone;
  }

  const districtId = park.district?._id ? park.district._id.toString() : (park.district ? park.district.toString() : null);
  if (districtId) {
    const byDistrict = officials.find(o => o.district && o.district.toString() === districtId);
    if (byDistrict) return byDistrict;
  }

  return null;
};

// Helper to resolve government official based on Park hierarchy:
const getResponsibleOfficial = async (park, parkName) => {
  let targetPark = park;
  if (!targetPark && parkName) {
    targetPark = await Park.findOne({ name: new RegExp(parkName, 'i') }).select('governmentOfficial ward zone district').lean();
  }
  if (!targetPark) return null;

  const officials = await User.find({
    role: { $in: ['official', 'government_official', 'Government Official'] }
  }).select('name email phone department district zone ward role').lean();

  return resolveOfficialFromList(targetPark, parkName, officials);
};

// @desc    Submit a new complaint
// @route   POST /api/complaints
const createComplaint = async (req, res) => {
  try {
    const { parkId, parkName, locationInPark, category, priority, description, userName, userPhone, district, zone, ward, userId } = req.body;

    const complaintNumber = 'CMP' + Math.floor(100000000 + Math.random() * 900000000);
    const images = req.files ? req.files.map(file => `/uploads/complaints/${file.filename}`) : [];

    let targetParkId = parkId;
    if (!targetParkId && parkName) {
      const foundPark = await Park.findOne({ name: new RegExp(parkName, 'i') });
      if (foundPark) targetParkId = foundPark._id;
    }

    const skillMap = {
      'Electrical': 'Electrical Maintenance',
      'Plumbing': 'Plumbing Maintenance',
      'Gardening / Horticulture': 'Gardening / Horticulture',
      'Cleaning / Sanitation': 'Cleaning / Sanitation',
      'Civil / Masonry': 'Civil / Masonry',
      'Carpentry': 'Carpentry',
      'Painting': 'Painting',
      'Playground Equipment': 'Playground Equipment Maintenance',
      'Water Supply / Drainage': 'Water Supply / Drainage',
      'Gate / Fencing': 'Gate / Fencing Maintenance',
      'General Maintenance': 'General Park Maintenance'
    };

    const requiredSkill = skillMap[category] || 'General Park Maintenance';

    const slaConfig = require('../config/slaConfig');
    const finalPriority = priority || 'Medium';
    const slaDuration = slaConfig.SLA_DURATIONS_HOURS[finalPriority] || 72;
    const slaDeadline = slaConfig.calculateSlaDeadline(new Date(), finalPriority);

    const complaint = new Complaint({
      complaintNumber,
      user: (req.user ? req.user._id : undefined) || (userId ? userId : undefined),
      userName,
      userPhone,
      park: targetParkId,
      parkName,
      locationInPark,
      district,
      zone,
      ward,
      category,
      complaintCategory: category,
      requiredSkill,
      priority: finalPriority,
      description,
      images,
      status: 'New',
      slaDuration,
      slaDeadline,
      slaStatus: 'On Time'
    });

    await complaint.save();

    // 1. Create Notification for Citizen if registered user
    const citizenUserId = (req.user ? req.user._id : undefined) || (userId ? userId : undefined);
    if (citizenUserId) {
      await Notification.create({
        recipientUserId: citizenUserId.toString(),
        recipientRole: 'citizen',
        title: '🔔 Complaint Submitted',
        message: `Your complaint for ${(category || 'maintenance').toLowerCase()} at ${parkName || 'the park'} has been submitted. Ticket #${complaintNumber}.`,
        type: 'Complaint Submitted',
        category: 'Complaint',
        priority: 'NORMAL',
        relatedEntityType: 'COMPLAINT',
        relatedEntityId: complaint._id.toString(),
        actionRoute: '/track-complaint'
      });
    }

    // 2. Create Notification for Admin
    await Notification.create({
      recipientUserId: 'ADMIN_ALL',
      recipientRole: 'admin',
      title: '🔔 New Complaint Submitted',
      message: `A new complaint (${complaintNumber}) has been submitted for ${parkName || 'Park'}.`,
      type: 'Complaint Submitted',
      category: 'Complaint',
      priority: 'NORMAL',
      relatedEntityType: 'COMPLAINT',
      relatedEntityId: complaint._id.toString(),
      actionRoute: '/admin-dashboard/complaints'
    });

    // 3. Trigger Maintenance Alert for responsible Contractor if park has assigned contractor
    if (targetParkId) {
      const parkDoc = await Park.findById(targetParkId).populate('contractor').populate('governmentOfficial');
      if (parkDoc) {
        if (parkDoc.contractor) {
          const contractorId = parkDoc.contractor._id ? parkDoc.contractor._id.toString() : parkDoc.contractor.toString();
          await Notification.create({
            recipientUserId: contractorId,
            recipientRole: 'contractor',
            title: '🔔 Maintenance Alert',
            message: `${category || 'Asset'} at ${parkName || parkDoc.name || 'Park'} requires repair. Ticket #${complaintNumber}.`,
            type: 'Maintenance Alert',
            category: 'Maintenance',
            priority: finalPriority === 'Urgent' || finalPriority === 'High' ? 'URGENT' : 'HIGH',
            relatedEntityType: 'TASK',
            relatedEntityId: complaint._id.toString(),
            actionRoute: '/contractor/tasks'
          });
        }
        if (parkDoc.governmentOfficial) {
          const officialId = parkDoc.governmentOfficial._id ? parkDoc.governmentOfficial._id.toString() : parkDoc.governmentOfficial.toString();
          await Notification.create({
            recipientUserId: officialId,
            recipientRole: 'official',
            title: '🔔 New Complaint Submitted',
            message: `New complaint (${complaintNumber}) submitted for ${parkName || parkDoc.name || 'Park'} (${category}).`,
            type: 'Complaint Submitted',
            category: 'Complaint',
            priority: 'NORMAL',
            relatedEntityType: 'COMPLAINT',
            relatedEntityId: complaint._id.toString(),
            actionRoute: '/gov-dashboard/complaints'
          });
        }
      }
    }

    res.status(201).json(complaint);
  } catch (error) {
    console.error('Error submitting complaint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get complaints (Filtered or all)
// @route   GET /api/complaints
const getComplaints = async (req, res) => {
  try {
    const { status, contractorId, officialId, complaintNumber, userPhone } = req.query;
    let query = {};

    if (status) query.status = status;
    if (contractorId) query.assignedContractor = contractorId;
    if (officialId) query.assignedOfficial = officialId;
    if (complaintNumber) query.complaintNumber = complaintNumber;
    if (userPhone) query.userPhone = userPhone;

    const complaints = await Complaint.find(query)
      .populate('park', 'name district corporation zone ward latitude longitude')
      .populate('assignedContractor', 'name email phone companyName')
      .populate('assignedOfficial', 'name email phone department')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    // Only resolve suggestedOfficial if needed (e.g., admin queries without specific contractor/user filter)
    if (!contractorId && !userPhone && !officialId && complaints.length > 0) {
      const officials = await User.find({
        role: { $in: ['official', 'government_official', 'Government Official'] }
      }).select('name email phone department district zone ward role').lean();

      for (let c of complaints) {
        c.suggestedOfficial = resolveOfficialFromList(c.park, c.parkName, officials);
      }
    }

    res.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single complaint by ID or number
// @route   GET /api/complaints/:id
const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    let complaint = null;

    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
      complaint = await Complaint.findById(id)
        .populate('park', 'name district corporation zone ward latitude longitude')
        .populate('assignedContractor', 'name email phone companyName')
        .populate('assignedOfficial', 'name email phone department')
        .populate('user', 'name email phone')
        .lean();
    }

    if (!complaint) {
      complaint = await Complaint.findOne({ complaintNumber: id })
        .populate('park', 'name district corporation zone ward latitude longitude')
        .populate('assignedContractor', 'name email phone companyName')
        .populate('assignedOfficial', 'name email phone department')
        .populate('user', 'name email phone')
        .lean();
    }

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const officials = await User.find({
      role: { $in: ['official', 'government_official', 'Government Official'] }
    }).select('name email phone department district zone ward role').lean();

    complaint.suggestedOfficial = resolveOfficialFromList(complaint.park, complaint.parkName, officials);

    res.json(complaint);
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update complaint status or workflow step
// @route   PUT /api/complaints/:id
const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Handle files if uploaded via multer
    if (req.files) {
      if (req.files.beforeImages) {
        updateData.beforeImages = req.files.beforeImages.map(f => `/uploads/complaints/${f.filename}`);
      }
      if (req.files.afterImages) {
        updateData.afterImages = req.files.afterImages.map(f => `/uploads/complaints/${f.filename}`);
      }
      if (req.files.completionReport) {
        updateData.completionReport = `/uploads/complaints/${req.files.completionReport[0].filename}`;
      }
      if (req.files.inspectionImages) {
        updateData.inspectionImages = req.files.inspectionImages.map(f => `/uploads/complaints/${f.filename}`);
      }
    }

    if (req.body.latitude && req.body.longitude) {
      updateData.afterImagesLocation = {
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude)
      };
    }

    let existingComplaint = await Complaint.findById(id).populate('park');
    if (!existingComplaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Prevent assignment if the Contractor is On Leave / Unavailable
    if (updateData.assignedContractor && String(updateData.assignedContractor) !== String(existingComplaint.assignedContractor || '')) {
      const Contractor = require('../models/Contractor');
      const targetContractor = await Contractor.findById(updateData.assignedContractor).lean();
      if (targetContractor && (targetContractor.availabilityStatus === 'On Leave' || targetContractor.availabilityStatus === 'Unavailable')) {
        return res.status(400).json({
          message: `Cannot assign task to ${targetContractor.name}. Contractor is currently On Leave or Unavailable.`
        });
      }
    }

    // Prevent assignment if Government Official is On Leave / Unavailable
    if (updateData.assignedOfficial && String(updateData.assignedOfficial) !== String(existingComplaint.assignedOfficial || '')) {
      const targetOfficial = await User.findById(updateData.assignedOfficial).lean();
      if (targetOfficial && (targetOfficial.availabilityStatus === 'On Leave' || targetOfficial.availabilityStatus === 'Unavailable')) {
        return res.status(400).json({
          message: `Cannot assign task to ${targetOfficial.name}. Government Official is currently On Leave or Unavailable.`
        });
      }
    }

    if (updateData.status === 'Assigned' && !existingComplaint.assignedAt) {
      updateData.assignedAt = new Date();
    }

    if (updateData.status === 'Completed - Waiting for Admin Review' && !existingComplaint.resolvedAt) {
      updateData.resolvedAt = new Date();
      if (existingComplaint.slaDeadline) {
        if (updateData.resolvedAt <= existingComplaint.slaDeadline) {
          updateData.slaStatus = 'Resolved Within SLA';
        } else {
          updateData.slaStatus = 'Resolved After SLA';
        }
      }
    }

    const complaint = await Complaint.findByIdAndUpdate(id, updateData, { new: true });

    // 1. Handle Contractor Assignment & Reassignment
    if (updateData.assignedContractor && String(updateData.assignedContractor) !== String(existingComplaint.assignedContractor || '')) {
      const newContractorId = updateData.assignedContractor.toString();
      const oldContractorId = existingComplaint.assignedContractor ? existingComplaint.assignedContractor.toString() : null;

      // If reassigning from an existing contractor
      if (oldContractorId && oldContractorId !== newContractorId) {
        await Notification.create({
          recipientUserId: oldContractorId,
          recipientRole: 'contractor',
          title: '🔄 Task Reassigned',
          message: `Complaint #${complaint.complaintNumber} (${complaint.parkName || 'Park'}) has been reassigned by Admin to another contractor.`,
          type: 'Task Reassigned',
          category: 'Assigned Tasks',
          priority: 'NORMAL',
          relatedEntityType: 'TASK',
          relatedEntityId: complaint._id.toString(),
          actionRoute: '/contractor/tasks'
        });

        await Notification.create({
          recipientUserId: newContractorId,
          recipientRole: 'contractor',
          title: '🔄 Task Reassigned to You',
          message: `Reassigned maintenance task: ${complaint.category || 'Maintenance'} at ${complaint.parkName || 'Park'}. Ticket #${complaint.complaintNumber}.`,
          type: 'New Task Assigned',
          category: 'Assigned Tasks',
          priority: 'HIGH',
          relatedEntityType: 'TASK',
          relatedEntityId: complaint._id.toString(),
          actionRoute: '/contractor/tasks'
        });
      } else {
        // First-time assignment
        await Notification.create({
          recipientUserId: newContractorId,
          recipientRole: 'contractor',
          title: '🔔 New Task Assigned',
          message: `New maintenance task assigned to you: ${complaint.category || 'Maintenance'} at ${complaint.parkName || 'Park'} (Ticket #${complaint.complaintNumber}).`,
          type: 'New Task Assigned',
          category: 'Assigned Tasks',
          priority: 'HIGH',
          relatedEntityType: 'TASK',
          relatedEntityId: complaint._id.toString(),
          actionRoute: '/contractor/tasks'
        });
      }

      // Also deliver Maintenance Alert
      await Notification.create({
        recipientUserId: newContractorId,
        recipientRole: 'contractor',
        title: '🔔 Maintenance Alert',
        message: `${complaint.category || 'Asset'} at ${complaint.parkName || 'Park'} requires repair. Ticket #${complaint.complaintNumber}.`,
        type: 'Maintenance Alert',
        category: 'Maintenance',
        priority: 'HIGH',
        relatedEntityType: 'TASK',
        relatedEntityId: complaint._id.toString(),
        actionRoute: '/contractor/tasks'
      });

      // Notify citizen that complaint is assigned
      if (complaint.user) {
        await Notification.create({
          recipientUserId: complaint.user.toString(),
          recipientRole: 'citizen',
          title: '🔔 Complaint Status Updated',
          message: `Your complaint #${complaint.complaintNumber} has been assigned to a maintenance contractor.`,
          type: 'Complaint Status Updated',
          category: 'Complaint',
          priority: 'NORMAL',
          relatedEntityType: 'COMPLAINT',
          relatedEntityId: complaint._id.toString(),
          actionRoute: '/track-complaint'
        });
      }
    }

    // 2. Auto trigger notifications on status transitions
    if (updateData.status && updateData.status !== existingComplaint.status) {
      const { status } = updateData;

      // Status -> In Progress (Contractor starts work)
      if (status === 'In Progress' || status === 'in-progress') {
        let citizenUserId = complaint.user;
        if (!citizenUserId && (complaint.userPhone || complaint.userName)) {
          const citizenUser = await User.findOne({
            role: { $in: ['Public', 'Public User', 'public_user', 'citizen'] },
            $or: [
              ...(complaint.userPhone ? [{ phone: complaint.userPhone }] : []),
              ...(complaint.userName ? [{ name: new RegExp(`^${complaint.userName.trim()}$`, 'i') }] : [])
            ]
          });
          if (citizenUser) citizenUserId = citizenUser._id;
        }

        if (citizenUserId) {
          await Notification.create({
            recipientUserId: citizenUserId.toString(),
            recipientRole: 'citizen',
            title: '🔔 Complaint Status Updated',
            message: 'Your complaint has been marked “In Progress.”',
            type: 'Complaint Status Updated',
            category: 'Complaint',
            priority: 'NORMAL',
            relatedEntityType: 'COMPLAINT',
            relatedEntityId: complaint._id.toString(),
            actionRoute: '/track-complaint'
          });
        }

        await Notification.create({
          recipientUserId: 'ADMIN_ALL',
          recipientRole: 'admin',
          title: '🔔 Work In Progress',
          message: `Contractor started work on Complaint #${complaint.complaintNumber} at ${complaint.parkName || 'Park'}.`,
          type: 'Work In Progress',
          category: 'Complaint',
          priority: 'NORMAL',
          relatedEntityType: 'COMPLAINT',
          relatedEntityId: complaint._id.toString(),
          actionRoute: '/admin-dashboard/complaints'
        });
      }
      // Status -> Completed - Waiting for Admin Review
      else if (status === 'Completed - Waiting for Admin Review') {
        if (complaint.user) {
          await Notification.create({
            recipientUserId: complaint.user.toString(),
            recipientRole: 'citizen',
            title: '🔔 Complaint Status Updated',
            message: `Work on your complaint #${complaint.complaintNumber} has been completed and is under verification.`,
            type: 'Complaint Status Updated',
            category: 'Complaint',
            priority: 'NORMAL',
            relatedEntityType: 'COMPLAINT',
            relatedEntityId: complaint._id.toString(),
            actionRoute: '/track-complaint'
          });
        }

        await Notification.create({
          recipientUserId: 'ADMIN_ALL',
          recipientRole: 'admin',
          title: '🔔 Verification Required',
          message: `Maintenance work for Complaint #${complaint.complaintNumber} is waiting for verification.`,
          type: 'Work Completed',
          category: 'Verification',
          priority: 'NORMAL',
          relatedEntityType: 'COMPLAINT',
          relatedEntityId: complaint._id.toString(),
          actionRoute: '/admin-dashboard/inspections'
        });

        if (complaint.assignedOfficial) {
          await Notification.create({
            recipientUserId: complaint.assignedOfficial.toString(),
            recipientRole: 'official',
            title: '🔔 Verification Required',
            message: `Contractor completed work for Complaint #${complaint.complaintNumber} at ${complaint.parkName || 'Park'}. Inspection verification required.`,
            type: 'Work Completed',
            category: 'Verification',
            priority: 'HIGH',
            relatedEntityType: 'COMPLAINT',
            relatedEntityId: complaint._id.toString(),
            actionRoute: `/gov-dashboard/verify-work/${complaint._id}`
          });
        }
      }
      // Status -> Resolved / Closed / Inspection Approved / Verified
      else if (['Inspection Approved', 'Verified', 'Closed', 'Resolved'].includes(status)) {
        let citizenUserId = complaint.user;
        if (!citizenUserId && (complaint.userPhone || complaint.userName)) {
          const lookupQuery = [];
          if (complaint.userPhone) lookupQuery.push({ phone: complaint.userPhone });
          if (complaint.userName) lookupQuery.push({ name: new RegExp(`^${complaint.userName.trim()}$`, 'i') });
          if (lookupQuery.length > 0) {
            const citizenUser = await User.findOne({
              role: { $in: ['Public', 'Public User', 'public_user', 'citizen'] },
              $or: lookupQuery
            });
            if (citizenUser) {
              citizenUserId = citizenUser._id;
              await Complaint.findByIdAndUpdate(complaint._id, { user: citizenUser._id });
            }
          }
        }

        if (citizenUserId) {
          await Notification.create({
            recipientUserId: citizenUserId.toString(),
            recipientRole: 'citizen',
            title: '✅ Complaint Resolved',
            message: 'Your complaint has been successfully resolved.',
            type: 'Complaint Resolved',
            category: 'Complaint',
            priority: 'NORMAL',
            relatedEntityType: 'COMPLAINT',
            relatedEntityId: complaint._id.toString(),
            actionRoute: '/track-complaint'
          });
          
          // Feedback reminder
          await Notification.create({
            recipientUserId: citizenUserId.toString(),
            recipientRole: 'citizen',
            title: '⭐ Feedback Requested',
            message: `Your reported ${(complaint.category || 'maintenance').toLowerCase()} issue was resolved. Please share your feedback!`,
            type: 'Feedback Reminder',
            category: 'Feedback',
            priority: 'LOW',
            relatedEntityType: 'COMPLAINT',
            relatedEntityId: complaint._id.toString(),
            actionRoute: '/feedback'
          });
        }

        if (complaint.assignedContractor && ['Verified', 'Inspection Approved', 'Resolved'].includes(status)) {
          await Notification.create({
            recipientUserId: complaint.assignedContractor.toString(),
            recipientRole: 'contractor',
            title: '🔔 Work Verified',
            message: `Your completed maintenance work for #${complaint.complaintNumber} has been verified and approved.`,
            type: 'Work Verified',
            category: 'Verification',
            priority: 'NORMAL',
            relatedEntityType: 'TASK',
            relatedEntityId: complaint._id.toString(),
            actionRoute: '/contractor/tasks'
          });
        }
      }
      // Status -> Rework Required / Returned by Admin
      else if (['Returned by Admin', 'Rework Required'].includes(status)) {
        if (complaint.assignedContractor) {
          await Notification.create({
            recipientUserId: complaint.assignedContractor.toString(),
            recipientRole: 'contractor',
            title: '🚨 Work Rejected - Rework Required',
            message: `Your submitted maintenance work for #${complaint.complaintNumber} requires rework. Reason: ${complaint.rejectionReason || 'Please check remarks.'}`,
            type: 'Rework Required',
            category: 'Verification',
            priority: 'HIGH',
            relatedEntityType: 'TASK',
            relatedEntityId: complaint._id.toString(),
            actionRoute: '/contractor/tasks'
          });
        }
        if (complaint.user) {
          await Notification.create({
            recipientUserId: complaint.user.toString(),
            recipientRole: 'citizen',
            title: '🔔 Complaint Status Updated',
            message: `Your complaint #${complaint.complaintNumber} is undergoing further maintenance rework.`,
            type: 'Complaint Status Updated',
            category: 'Complaint',
            priority: 'NORMAL',
            relatedEntityType: 'COMPLAINT',
            relatedEntityId: complaint._id.toString(),
            actionRoute: '/track-complaint'
          });
        }
      }
      // Status -> Rejected by Contractor
      else if (status === 'Rejected by Contractor') {
        await Notification.create({
          recipientUserId: 'ADMIN_ALL',
          recipientRole: 'admin',
          title: '🚨 Task Rejected by Contractor',
          message: `Contractor has rejected Complaint #${complaint.complaintNumber}. Reason: ${complaint.rejectionReason || 'No reason provided'}. Please reassign to another contractor.`,
          type: 'Task Rejected',
          category: 'Assigned Tasks',
          priority: 'HIGH',
          relatedEntityType: 'COMPLAINT',
          relatedEntityId: complaint._id.toString(),
          actionRoute: '/admin-dashboard/complaints'
        });
      }
      // Status -> Inspection Pending
      else if (status === 'Inspection Pending') {
        const officialId = updateData.assignedOfficial || complaint.assignedOfficial;
        if (officialId) {
          await Notification.create({
            recipientUserId: officialId.toString(),
            recipientRole: 'official',
            title: '🔔 Inspection Reminder',
            message: `Inspection for ${complaint.parkName || 'Park'} (${complaint.complaintNumber}) is due.`,
            type: 'Inspection Reminder',
            category: 'Inspection',
            priority: 'HIGH',
            relatedEntityType: 'COMPLAINT',
            relatedEntityId: complaint._id.toString(),
            actionRoute: `/gov-dashboard/verify-work/${complaint._id}`
          });
        }
      }
    }

    // Direct official assignment notification if status didn't change
    if (updateData.assignedOfficial && String(updateData.assignedOfficial) !== String(existingComplaint.assignedOfficial)) {
      const existingNotif = await Notification.findOne({
        recipientUserId: updateData.assignedOfficial.toString(),
        type: 'Inspection Assigned',
        relatedEntityId: complaint._id.toString()
      });
      if (!existingNotif) {
        await Notification.create({
          recipientUserId: updateData.assignedOfficial.toString(),
          recipientRole: 'official',
          title: 'New Inspection Assigned',
          message: `New inspection assigned for ${complaint.parkName || 'Park'} (${complaint.complaintNumber}).`,
          type: 'Inspection Assigned',
          category: 'Verification',
          priority: 'HIGH',
          relatedEntityType: 'COMPLAINT',
          relatedEntityId: complaint._id
        });
      }
    }

    res.json(complaint);
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a complaint
// @route   DELETE /api/complaints/:id
const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findByIdAndDelete(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint
};
