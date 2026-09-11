const Complaint = require('../models/Complaint');
const Park = require('../models/Park');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper to resolve government official based on Park hierarchy:
// District -> Corporation -> Zone -> Ward -> Park -> Assigned Government Official
const getResponsibleOfficial = async (park, parkName) => {
  let targetPark = park;
  if (!targetPark && parkName) {
    targetPark = await Park.findOne({ name: new RegExp(parkName, 'i') });
  }
  if (!targetPark) return null;
  
  // 1. Direct assignment on Park
  if (targetPark.governmentOfficial) {
    const official = await User.findById(targetPark.governmentOfficial);
    if (official) return official;
  }

  // 2. Ward level match
  if (targetPark.ward) {
    const official = await User.findOne({
      role: { $in: ['official', 'government_official', 'Government Official'] },
      ward: targetPark.ward
    });
    if (official) return official;
  }

  // 3. Zone level match
  if (targetPark.zone) {
    const official = await User.findOne({
      role: { $in: ['official', 'government_official', 'Government Official'] },
      zone: targetPark.zone
    });
    if (official) return official;
  }

  // 4. District level match
  if (targetPark.district) {
    const official = await User.findOne({
      role: { $in: ['official', 'government_official', 'Government Official'] },
      district: targetPark.district
    });
    if (official) return official;
  }

  return null;
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

    // Create Notification for Admin
    await Notification.create({
      recipientUserId: 'ADMIN_ALL',
      recipientRole: 'admin',
      title: 'New Complaint Submitted',
      message: `A new complaint (${complaintNumber}) has been submitted for ${parkName || 'Park'}.`,
      type: 'Complaint Submitted',
      category: 'Complaints',
      priority: 'NORMAL',
      relatedEntityType: 'COMPLAINT',
      relatedEntityId: complaint._id
    });

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
      .populate({
        path: 'park',
        populate: [
          { path: 'district' },
          { path: 'corporation' },
          { path: 'zone' },
          { path: 'ward' }
        ]
      })
      .populate('assignedContractor', 'name email phone companyName')
      .populate('assignedOfficial', 'name email phone department')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    const complaintsObj = [];
    for (let c of complaints) {
      const cObj = c.toObject();
      cObj.suggestedOfficial = await getResponsibleOfficial(c.park, c.parkName);
      complaintsObj.push(cObj);
    }

    res.json(complaintsObj);
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

    // Check if id is a valid MongoDB ObjectId
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(id)) {
      complaint = await Complaint.findById(id)
        .populate({
          path: 'park',
          populate: [
            { path: 'district' },
            { path: 'corporation' },
            { path: 'zone' },
            { path: 'ward' }
          ]
        })
        .populate('assignedContractor')
        .populate('assignedOfficial')
        .populate('user', 'name email phone');
    }

    if (!complaint) {
      complaint = await Complaint.findOne({ complaintNumber: id })
        .populate({
          path: 'park',
          populate: [
            { path: 'district' },
            { path: 'corporation' },
            { path: 'zone' },
            { path: 'ward' }
          ]
        })
        .populate('assignedContractor')
        .populate('assignedOfficial')
        .populate('user', 'name email phone');
    }

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const complaintObj = complaint.toObject();
    complaintObj.suggestedOfficial = await getResponsibleOfficial(complaint.park, complaint.parkName);

    res.json(complaintObj);
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

    // Auto trigger notification on status transition
    if (updateData.status && updateData.status !== existingComplaint.status) {
      const { status } = updateData;

      if (status === 'Assigned') {
        if (updateData.assignedContractor || existingComplaint.assignedContractor) {
          const cid = updateData.assignedContractor || existingComplaint.assignedContractor;
          await Notification.create({
            recipientUserId: cid.toString(),
            recipientRole: 'contractor',
            title: 'New Maintenance Task',
            message: `New maintenance task assigned to you for Complaint #${complaint.complaintNumber}.`,
            type: 'Task Assigned',
            category: 'Assigned Tasks',
            priority: 'HIGH',
            relatedEntityType: 'TASK',
            relatedEntityId: complaint._id
          });
        }
        if (complaint.user) {
          await Notification.create({
            recipientUserId: complaint.user.toString(),
            recipientRole: 'citizen',
            title: 'Complaint Assigned',
            message: `Your complaint #${complaint.complaintNumber} has been assigned to a maintenance contractor.`,
            type: 'Complaint Assigned',
            category: 'My Complaints',
            priority: 'NORMAL',
            relatedEntityType: 'COMPLAINT',
            relatedEntityId: complaint._id
          });
        }
      } else if (status === 'Completed - Waiting for Admin Review') {
        await Notification.create({
          recipientUserId: 'ADMIN_ALL',
          recipientRole: 'admin',
          title: 'Verification Required',
          message: `Maintenance work for Complaint #${complaint.complaintNumber} is waiting for verification.`,
          type: 'Work Completed',
          category: 'Verification',
          priority: 'NORMAL',
          relatedEntityType: 'COMPLAINT',
          relatedEntityId: complaint._id
        });
      } else if (['Inspection Approved', 'Verified', 'Closed', 'Resolved'].includes(status)) {
        // Resolve the citizen user ID - look up by phone/name if complaint.user is missing
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
              // Also fix the complaint record for the future
              await Complaint.findByIdAndUpdate(complaint._id, { user: citizenUser._id });
            }
          }
        }

        if (citizenUserId) {
          await Notification.create({
            recipientUserId: citizenUserId.toString(),
            recipientRole: 'citizen',
            title: 'Complaint Resolved ✅',
            message: `Your reported ${complaint.category.toLowerCase()} issue has been fixed.`,
            type: 'Complaint Resolved',
            category: 'My Complaints',
            priority: 'NORMAL',
            relatedEntityType: 'COMPLAINT',
            relatedEntityId: complaint._id
          });
          
          // Feedback reminder
          await Notification.create({
            recipientUserId: citizenUserId.toString(),
            recipientRole: 'citizen',
            title: 'Feedback Requested',
            message: `Your reported ${complaint.category.toLowerCase()} issue was resolved. Please share your feedback!`,
            type: 'Feedback Reminder',
            category: 'Feedback',
            priority: 'LOW',
            relatedEntityType: 'COMPLAINT',
            relatedEntityId: complaint._id
          });
        }
        if (complaint.assignedContractor && ['Verified', 'Inspection Approved'].includes(status)) {
          await Notification.create({
            recipientUserId: complaint.assignedContractor.toString(),
            recipientRole: 'contractor',
            title: 'Work Verified',
            message: `Your completed maintenance work for #${complaint.complaintNumber} has been verified by Admin.`,
            type: 'Work Verified',
            category: 'Verification',
            priority: 'NORMAL',
            relatedEntityType: 'TASK',
            relatedEntityId: complaint._id
          });
        }
      } else if (['Returned by Admin', 'Rework Required'].includes(status)) {
        if (complaint.assignedContractor) {
          await Notification.create({
            recipientUserId: complaint.assignedContractor.toString(),
            recipientRole: 'contractor',
            title: 'Work Rejected - Rework Required',
            message: `Your submitted maintenance work for #${complaint.complaintNumber} requires rework. Please review admin remarks.`,
            type: 'Rework Required',
            category: 'Verification',
            priority: 'HIGH',
            relatedEntityType: 'TASK',
            relatedEntityId: complaint._id
          });
        }
      } else if (status === 'Inspection Pending') {
        const officialId = updateData.assignedOfficial || complaint.assignedOfficial;
        if (officialId) {
          await Notification.create({
            recipientUserId: officialId.toString(),
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
