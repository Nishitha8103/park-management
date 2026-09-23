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

// Helper to compute requested days count (supporting full day & half day)
const calculateRequestedDays = (startDate, endDate, duration) => {
  const sDate = new Date(startDate);
  const eDate = new Date(endDate);
  const diffTime = Math.abs(eDate - sDate);
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  if (duration === 'Half Day – Morning' || duration === 'Half Day – Afternoon') {
    return sDate.toDateString() === eDate.toDateString() ? 0.5 : (diffDays - 1 + 0.5);
  }
  return diffDays;
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

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    // Fetch active task details & leave balance calculations for each applicant
    const enrichedLeaves = await Promise.all(
      leaves.map(async (l) => {
        const isContractor = ['contractor', 'Contractor'].includes(l.applicantRole);
        const reqDays = calculateRequestedDays(l.startDate, l.endDate, l.duration);

        // Find all approved leaves for this applicant in the current calendar year (excluding this request if pending)
        const approvedLeaves = await LeaveRequest.find({
          applicantId: l.applicantId,
          _id: { $ne: l._id },
          status: 'Approved',
          startDate: { $gte: startOfYear, $lte: endOfYear }
        }).lean();

        const approvedLeaveUsed = approvedLeaves.reduce((acc, curr) => {
          return acc + calculateRequestedDays(curr.startDate, curr.endDate, curr.duration);
        }, 0);

        const annualAllowance = 12;
        const remainingLeave = Math.max(0, annualAllowance - approvedLeaveUsed);
        const paidLeaveDays = Math.min(reqDays, remainingLeave);
        const unpaidLeaveDays = Math.max(0, reqDays - paidLeaveDays);
        const balanceAfterApproval = Math.max(0, remainingLeave - reqDays);

        const dailyRate = 1000; // ₹1,000 / day standard deduction rate
        const salaryDeductionAmount = unpaidLeaveDays * dailyRate;
        const salaryDeductionStatus = unpaidLeaveDays === 0
          ? 'Not Applicable'
          : (l.status === 'Approved' ? 'Calculated' : 'Pending');

        // Fetch active tasks from Complaint collection
        let taskQuery = {};
        if (isContractor) {
          taskQuery = {
            assignedContractor: l.applicantId,
            status: { $in: ['Assigned', 'In Progress', 'Returned by Admin', 'Rework Required', 'Reassigned to Contractor', 'Inspection Pending', 'Inspection Under Review'] }
          };
        } else {
          taskQuery = {
            assignedOfficial: l.applicantId,
            status: { $in: ['Assigned', 'In Progress', 'Inspection Pending', 'Inspection Under Review'] }
          };
        }

        const activeTasks = await Complaint.find(taskQuery)
          .select('_id complaintNumber category priority status slaDeadline slaStatus parkName description createdAt')
          .sort({ priority: -1, createdAt: -1 })
          .lean();

        const now = new Date();
        const leaveStart = new Date(l.startDate);
        const leaveEnd = new Date(l.endDate);

        const totalActiveTasks = activeTasks.length;
        const pendingTasks = activeTasks.filter(t => ['Assigned', 'In Progress', 'Inspection Pending'].includes(t.status)).length;
        const overdueTasks = activeTasks.filter(t => t.slaStatus === 'Overdue' || (t.slaDeadline && new Date(t.slaDeadline) < now)).length;
        const tasksDueDuringLeave = activeTasks.filter(t => {
          if (!t.slaDeadline) return false;
          const deadline = new Date(t.slaDeadline);
          return deadline >= leaveStart && deadline <= leaveEnd;
        }).length;

        let taskReassignmentStatus = 'No Action Required';
        if (tasksDueDuringLeave > 0) {
          taskReassignmentStatus = `${tasksDueDuringLeave} Task(s) Due During Leave`;
        } else if (totalActiveTasks > 0) {
          taskReassignmentStatus = `${totalActiveTasks} Active Task(s)`;
        }

        return {
          ...l,
          annualAllowance,
          approvedLeaveUsed,
          remainingLeave,
          requestedDays: reqDays,
          paidLeaveDays,
          unpaidLeaveDays,
          balanceAfterApproval,
          salaryDeductionAmount: l.salaryDeductionAmount || salaryDeductionAmount,
          salaryDeductionStatus: l.salaryDeductionStatus && l.salaryDeductionStatus !== 'Not Applicable' ? l.salaryDeductionStatus : salaryDeductionStatus,
          // Task Metrics
          activeTaskCount: totalActiveTasks,
          totalActiveTasks,
          pendingTasksCount: pendingTasks,
          overdueTasksCount: overdueTasks,
          tasksDueDuringLeaveCount: tasksDueDuringLeave,
          taskReassignmentStatus,
          activeTaskList: activeTasks
        };
      })
    );

    res.json({
      success: true,
      leaves: enrichedLeaves
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

    if (leave.status === 'Approved') {
      return res.status(400).json({ message: 'This leave request has already been approved.' });
    }

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const approvedLeaves = await LeaveRequest.find({
      applicantId: leave.applicantId,
      _id: { $ne: leave._id },
      status: 'Approved',
      startDate: { $gte: startOfYear, $lte: endOfYear }
    }).lean();

    const approvedLeaveUsed = approvedLeaves.reduce((acc, curr) => {
      return acc + calculateRequestedDays(curr.startDate, curr.endDate, curr.duration);
    }, 0);

    const reqDays = calculateRequestedDays(leave.startDate, leave.endDate, leave.duration);
    const annualAllowance = 12;
    const remainingLeave = Math.max(0, annualAllowance - approvedLeaveUsed);
    const paidLeaveDays = Math.min(reqDays, remainingLeave);
    const unpaidLeaveDays = Math.max(0, reqDays - paidLeaveDays);
    const dailyRate = 1000;
    const salaryDeductionAmount = unpaidLeaveDays * dailyRate;

    leave.status = 'Approved';
    leave.requestedDays = reqDays;
    leave.paidLeaveDays = paidLeaveDays;
    leave.unpaidLeaveDays = unpaidLeaveDays;
    leave.salaryDeductionAmount = salaryDeductionAmount;
    leave.salaryDeductionStatus = unpaidLeaveDays > 0 ? 'Calculated' : 'Not Applicable';
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
      message: `Your leave application (${new Date(leave.startDate).toLocaleDateString('en-IN')} - ${new Date(leave.endDate).toLocaleDateString('en-IN')}) has been APPROVED by Admin.${unpaidLeaveDays > 0 ? ` Unpaid Leave Deduction: ₹${salaryDeductionAmount}.` : ''}`,
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
      message: `Your leave application (${new Date(leave.startDate).toLocaleDateString('en-IN')} - ${new Date(leave.endDate).toLocaleDateString('en-IN')}) was REJECTED. Remarks: ${leave.adminRemarks}`,
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

// @desc    Get Eligible Replacement Staff (Contractor -> Contractor only, Official -> Official only)
// @route   GET /api/leaves/replacement-staff
const getReplacementStaff = async (req, res) => {
  try {
    const { role, currentApplicantId } = req.query;
    if (!role) {
      return res.status(400).json({ message: 'role parameter is required.' });
    }

    const isContractor = ['contractor', 'Contractor'].includes(role);

    if (isContractor) {
      const contractors = await Contractor.find({
        _id: { $ne: currentApplicantId },
        status: 'Active',
        availabilityStatus: { $ne: 'On Leave' }
      }).select('_id name phone email companyName availabilityStatus').lean();

      res.json({ success: true, staff: contractors });
    } else {
      const officials = await User.find({
        _id: { $ne: currentApplicantId },
        role: { $in: ['government_official', 'official', 'Government Official'] },
        availabilityStatus: { $ne: 'On Leave' }
      }).select('_id name email phone department designation availabilityStatus').lean();

      res.json({ success: true, staff: officials });
    }
  } catch (err) {
    console.error('Error fetching replacement staff:', err);
    res.status(500).json({ message: 'Failed to fetch replacement staff list.', error: err.message });
  }
};

// @desc    Reassign Task from Staff on Leave to Available Staff
// @route   POST /api/leaves/reassign-task
const reassignLeaveTask = async (req, res) => {
  try {
    const { complaintId, newAssigneeId, reviewerName } = req.body;
    if (!complaintId || !newAssigneeId) {
      return res.status(400).json({ message: 'complaintId and newAssigneeId are required.' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: 'Task/Complaint record not found.' });
    }

    let targetName = 'Staff Member';
    let targetRole = 'contractor';

    if (complaint.assignedContractor) {
      const newContractor = await Contractor.findById(newAssigneeId);
      if (!newContractor) {
        return res.status(400).json({ message: 'Selected contractor does not exist or is inactive.' });
      }
      targetName = newContractor.name;
      targetRole = 'contractor';

      const prevId = complaint.assignedContractor;
      complaint.assignedContractor = newAssigneeId;
      complaint.status = 'Reassigned to Contractor';
      complaint.reassignmentStatus = 'Reassigned';

      complaint.assignmentHistory.push({
        historyId: 'HIST-' + Date.now(),
        assignedToId: newAssigneeId.toString(),
        assignedToName: targetName,
        assignedToRole: 'Contractor',
        assignedBy: reviewerName || 'Admin (Leave Management)',
        assignedAt: new Date(),
        actionType: 'Direct Reassignment',
        reason: 'Reassigned by Admin due to applicant leave',
        previousAssigneeId: prevId ? prevId.toString() : undefined,
        statusAtTime: complaint.status
      });

      // Notification to new Contractor
      await Notification.create({
        recipientUserId: newAssigneeId,
        recipientRole: 'contractor',
        title: '📋 Task Reassigned to You',
        message: `Complaint #${complaint.complaintNumber} has been reassigned to you by Admin due to leave cover.`,
        type: 'Task Assigned',
        category: 'Task Management',
        priority: 'HIGH',
        relatedEntityType: 'COMPLAINT',
        relatedEntityId: complaint._id.toString(),
        actionRoute: '/contractor/tasks'
      });
    } else if (complaint.assignedOfficial) {
      const newOfficial = await User.findById(newAssigneeId);
      if (!newOfficial) {
        return res.status(400).json({ message: 'Selected government official does not exist.' });
      }
      targetName = newOfficial.name;
      targetRole = 'government_official';

      const prevId = complaint.assignedOfficial;
      complaint.assignedOfficial = newAssigneeId;
      complaint.status = 'Assigned';
      complaint.reassignmentStatus = 'Reassigned';

      complaint.assignmentHistory.push({
        historyId: 'HIST-' + Date.now(),
        assignedToId: newAssigneeId.toString(),
        assignedToName: targetName,
        assignedToRole: 'Government Official',
        assignedBy: reviewerName || 'Admin (Leave Management)',
        assignedAt: new Date(),
        actionType: 'Direct Reassignment',
        reason: 'Reassigned by Admin due to applicant leave',
        previousAssigneeId: prevId ? prevId.toString() : undefined,
        statusAtTime: complaint.status
      });

      // Notification to new Official
      await Notification.create({
        recipientUserId: newAssigneeId,
        recipientRole: 'official',
        title: '📋 Task Reassigned to You',
        message: `Complaint #${complaint.complaintNumber} has been reassigned to you by Admin due to leave cover.`,
        type: 'Task Assigned',
        category: 'Task Management',
        priority: 'HIGH',
        relatedEntityType: 'COMPLAINT',
        relatedEntityId: complaint._id.toString(),
        actionRoute: '/gov-dashboard/inspections'
      });
    } else {
      return res.status(400).json({ message: 'This complaint has no current active assignment to reassign.' });
    }

    await complaint.save();

    res.json({
      success: true,
      message: `Task #${complaint.complaintNumber} successfully reassigned to ${targetName}.`,
      complaint
    });
  } catch (err) {
    console.error('Error reassigning leave task:', err);
    res.status(500).json({ message: 'Failed to reassign task.', error: err.message });
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
  getReplacementStaff,
  reassignLeaveTask,
  syncUserAvailability
};
