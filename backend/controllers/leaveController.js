const LeaveRequest = require('../models/LeaveRequest');
const Contractor = require('../models/Contractor');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');

// Generate unique Leave ID
const generateLeaveId = async () => {
  const count = await LeaveRequest.countDocuments();
  return 'LEV' + String(count + 1).padStart(4, '0') + '-' + Math.floor(100 + Math.random() * 900);
};

// Helper: sync current availability status based on approved active leaves
const syncUserAvailability = async (applicantId, applicantModel) => {
  const now = new Date();
  // Find any approved leave covering current date
  const activeLeave = await LeaveRequest.findOne({
    applicantId: String(applicantId),
    status: 'Approved',
    startDate: { $lte: now },
    endDate: { $gte: now }
  });

  const availabilityStatus = activeLeave ? 'On Leave' : 'Available';

  if (applicantModel === 'Contractor') {
    await Contractor.findByIdAndUpdate(applicantId, { availabilityStatus });
  } else {
    await User.findByIdAndUpdate(applicantId, { availabilityStatus });
  }

  return availabilityStatus;
};

// @desc    Apply for Leave (Contractor or Govt Official)
// @route   POST /api/leaves/apply
const applyLeave = async (req, res) => {
  try {
    const { 
      applicantId, 
      applicantModel, 
      applicantRole, 
      applicantName, 
      applicantEmail, 
      applicantPhone, 
      applicantDepartment, 
      leaveType,
      duration,
      startDate, 
      endDate, 
      reason,
      handoverNotes
    } = req.body;

    if (!applicantId || !applicantRole || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All required leave details (dates, reason) must be provided.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return res.status(400).json({ message: 'End date cannot be prior to start date.' });
    }

    // Check for overlapping active/pending leave requests
    const existing = await LeaveRequest.findOne({
      applicantId: String(applicantId),
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        { startDate: { $lte: end, $gte: start } },
        { endDate: { $lte: end, $gte: start } },
        { startDate: { $lte: start }, endDate: { $gte: end } }
      ]
    });

    if (existing) {
      return res.status(400).json({ 
        message: `An active or pending leave request already overlaps with these dates (Leave #${existing.leaveId}).` 
      });
    }

    const leaveId = await generateLeaveId();
    const modelType = applicantModel || (['contractor', 'Contractor'].includes(applicantRole) ? 'Contractor' : 'User');

    let documentPath = '';
    let documentOriginalName = '';
    if (req.file) {
      documentPath = `/uploads/leaves/${req.file.filename}`;
      documentOriginalName = req.file.originalname;
    } else if (req.body.supportingDocument) {
      documentPath = req.body.supportingDocument;
      documentOriginalName = req.body.supportingDocumentOriginalName || 'supporting-document';
    }

    const newLeave = new LeaveRequest({
      leaveId,
      applicantId: String(applicantId),
      applicantModel: modelType,
      applicantRole,
      applicantName: applicantName || 'Staff Member',
      applicantEmail: applicantEmail || '',
      applicantPhone: applicantPhone || '',
      applicantDepartment: applicantDepartment || '',
      leaveType: leaveType || 'Casual Leave',
      duration: duration || 'Full Day',
      startDate: start,
      endDate: end,
      reason: reason.trim(),
      supportingDocument: documentPath,
      supportingDocumentOriginalName: documentOriginalName,
      handoverNotes: (handoverNotes || '').trim(),
      status: 'Pending'
    });

    await newLeave.save();

    // High Priority Notification to Admin
    const durLabel = duration && duration !== 'Full Day' ? ` (${duration})` : '';
    const lTypeLabel = leaveType ? ` [${leaveType}]` : '';
    await Notification.create({
      recipientUserId: 'ADMIN_ALL',
      recipientRole: 'admin',
      title: '📅 New Leave Application Submitted',
      message: `${applicantName} (${applicantRole === 'contractor' ? 'Contractor' : 'Govt Official'}) applied for ${lTypeLabel || 'leave'} from ${start.toLocaleDateString('en-IN')} to ${end.toLocaleDateString('en-IN')}${durLabel}. Reason: ${reason}.`,
      type: 'Leave Application',
      category: 'Leave Management',
      priority: 'HIGH',
      relatedEntityType: 'LEAVE',
      relatedEntityId: newLeave._id.toString(),
      actionRoute: '/admin-dashboard/leaves'
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully. Awaiting Administrator approval.',
      leaveRequest: newLeave
    });
  } catch (err) {
    console.error('Error applying for leave:', err);
    res.status(500).json({ message: 'Failed to submit leave request.', error: err.message });
  }
};

// @desc    Get My Leave Requests (Contractor or Official)
// @route   GET /api/leaves/my
const getMyLeaves = async (req, res) => {
  try {
    const { applicantId } = req.query;
    if (!applicantId) {
      return res.status(400).json({ message: 'applicantId query param is required.' });
    }

    const leaves = await LeaveRequest.find({ applicantId: String(applicantId) })
      .sort({ createdAt: -1 })
      .lean();

    res.json(leaves);
  } catch (err) {
    console.error('Error getting my leaves:', err);
    res.status(500).json({ message: 'Failed to load leave records.', error: err.message });
  }
};

// @desc    Get All Leave Requests (Admin View)
// @route   GET /api/leaves
const getAllLeaves = async (req, res) => {
  try {
    const { status, role } = req.query;
    let query = {};
    if (status && status !== 'All') query.status = status;
    if (role && role !== 'All') {
      if (role.toLowerCase() === 'contractor') {
        query.applicantRole = { $in: ['contractor', 'Contractor'] };
      } else if (role.toLowerCase() === 'official') {
        query.applicantRole = { $in: ['official', 'government_official', 'Government Official'] };
      }
    }

    const leaves = await LeaveRequest.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Fetch active task count for each applicant on leave
    const leavesWithTaskCounts = await Promise.all(
      leaves.map(async (l) => {
        let taskCount = 0;
        const isContractor = ['contractor', 'Contractor'].includes(l.applicantRole);
        if (isContractor) {
          taskCount = await Complaint.countDocuments({
            assignedContractor: l.applicantId,
            status: { $in: ['Assigned', 'In Progress', 'Returned by Admin', 'Rework Required', 'Reassigned to Contractor'] }
          });
        } else {
          taskCount = await Complaint.countDocuments({
            assignedOfficial: l.applicantId,
            status: { $in: ['Assigned', 'In Progress', 'Inspection Pending', 'Inspection Under Review'] }
          });
        }
        return {
          ...l,
          activeTaskCount: taskCount
        };
      })
    );

    res.json({
      success: true,
      leaves: leavesWithTaskCounts
    });
  } catch (err) {
    console.error('Error fetching all leaves:', err);
    res.status(500).json({ message: 'Failed to fetch leave requests.', error: err.message });
  }
};

// @desc    Admin Approve Leave Request
// @route   POST /api/leaves/approve
const approveLeave = async (req, res) => {
  try {
    const { leaveId, adminRemarks, reviewerName } = req.body;
    if (!leaveId) {
      return res.status(400).json({ message: 'leaveId is required.' });
    }

    const leave = await LeaveRequest.findOne({ $or: [{ _id: leaveId }, { leaveId }] });
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    leave.status = 'Approved';
    leave.adminRemarks = adminRemarks || 'Approved by Administrator';
    leave.reviewedBy = reviewerName || 'Administrator';
    leave.reviewedAt = new Date();
    await leave.save();

    // Update applicant availability
    const isContractor = ['contractor', 'Contractor'].includes(leave.applicantRole);
    if (isContractor) {
      await Contractor.findByIdAndUpdate(leave.applicantId, { availabilityStatus: 'On Leave' });
    } else {
      await User.findByIdAndUpdate(leave.applicantId, { availabilityStatus: 'On Leave' });
    }

    // Notify Applicant
    await Notification.create({
      recipientUserId: leave.applicantId,
      recipientRole: isContractor ? 'contractor' : 'official',
      title: '✅ Leave Request Approved',
      message: `Your leave application (${leave.startDate.toLocaleDateString('en-IN')} - ${leave.endDate.toLocaleDateString('en-IN')}) has been APPROVED by Admin.`,
      type: 'Leave Approved',
      category: 'Leave Management',
      priority: 'HIGH',
      relatedEntityType: 'LEAVE',
      relatedEntityId: leave._id.toString(),
      actionRoute: isContractor ? '/contractor/profile' : '/gov-dashboard/profile'
    });

    res.json({
      success: true,
      message: `Leave #${leave.leaveId} approved. ${leave.applicantName} is now marked 'On Leave'.`,
      leave
    });
  } catch (err) {
    console.error('Error approving leave:', err);
    res.status(500).json({ message: 'Failed to approve leave request.', error: err.message });
  }
};

// @desc    Admin Reject Leave Request
// @route   POST /api/leaves/reject
const rejectLeave = async (req, res) => {
  try {
    const { leaveId, adminRemarks, reviewerName } = req.body;
    if (!leaveId) {
      return res.status(400).json({ message: 'leaveId is required.' });
    }

    const leave = await LeaveRequest.findOne({ $or: [{ _id: leaveId }, { leaveId }] });
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    leave.status = 'Rejected';
    leave.adminRemarks = adminRemarks || 'Declined due to operational requirements.';
    leave.reviewedBy = reviewerName || 'Administrator';
    leave.reviewedAt = new Date();
    await leave.save();

    // Re-sync availability (in case no other approved leaves exist)
    await syncUserAvailability(leave.applicantId, leave.applicantModel);

    const isContractor = ['contractor', 'Contractor'].includes(leave.applicantRole);
    // Notify Applicant
    await Notification.create({
      recipientUserId: leave.applicantId,
      recipientRole: isContractor ? 'contractor' : 'official',
      title: '❌ Leave Request Rejected',
      message: `Your leave application (${leave.startDate.toLocaleDateString('en-IN')} - ${leave.endDate.toLocaleDateString('en-IN')}) was REJECTED. Remarks: ${leave.adminRemarks}`,
      type: 'Leave Rejected',
      category: 'Leave Management',
      priority: 'HIGH',
      relatedEntityType: 'LEAVE',
      relatedEntityId: leave._id.toString(),
      actionRoute: isContractor ? '/contractor/profile' : '/gov-dashboard/profile'
    });

    res.json({
      success: true,
      message: `Leave #${leave.leaveId} rejected.`,
      leave
    });
  } catch (err) {
    console.error('Error rejecting leave:', err);
    res.status(500).json({ message: 'Failed to reject leave request.', error: err.message });
  }
};

// @desc    Cancel Leave Request (by Applicant)
// @route   POST /api/leaves/cancel
const cancelLeave = async (req, res) => {
  try {
    const { leaveId, applicantId } = req.body;
    const leave = await LeaveRequest.findOne({ $or: [{ _id: leaveId }, { leaveId }] });
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    if (String(leave.applicantId) !== String(applicantId)) {
      return res.status(403).json({ message: 'Unauthorized to cancel this leave request.' });
    }

    leave.status = 'Cancelled';
    await leave.save();

    // Re-sync availability
    await syncUserAvailability(leave.applicantId, leave.applicantModel);

    res.json({
      success: true,
      message: 'Leave request cancelled successfully.',
      leave
    });
  } catch (err) {
    console.error('Error cancelling leave:', err);
    res.status(500).json({ message: 'Failed to cancel leave request.', error: err.message });
  }
};

// @desc    Get Current Active Staff On Leave (Admin Summary)
// @route   GET /api/leaves/active-on-leave
const getActiveStaffOnLeave = async (req, res) => {
  try {
    const now = new Date();
    const activeLeaves = await LeaveRequest.find({
      status: 'Approved',
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).sort({ endDate: 1 }).lean();

    res.json({
      success: true,
      count: activeLeaves.length,
      activeLeaves
    });
  } catch (err) {
    console.error('Error fetching active leaves:', err);
    res.status(500).json({ message: 'Failed to fetch active staff on leave.', error: err.message });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getActiveStaffOnLeave,
  syncUserAvailability
};
