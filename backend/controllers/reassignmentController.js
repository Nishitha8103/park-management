const Complaint = require('../models/Complaint');
const Park = require('../models/Park');
const Contractor = require('../models/Contractor');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ReassignmentRequest = require('../models/ReassignmentRequest');

// Helper to generate Unique Reassignment Request ID
const generateRequestId = async () => {
  const year = new Date().getFullYear();
  const count = await ReassignmentRequest.countDocuments();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `REASSIGN-${year}-${String(count + 1).padStart(3, '0')}${randomSuffix}`;
};

// @desc    Submit a Task Reassignment Request (Contractor or Govt Official)
// @route   POST /api/reassignments/request
// @access  Authenticated (Contractor / Govt Official)
const submitReassignmentRequest = async (req, res) => {
  try {
    const {
      taskId,
      requesterId,
      requesterName,
      requesterRole, // 'contractor' | 'government_official' | 'official'
      reason,
      explanation,
      wantsReassignment,
      preferredReplacementContractor,
      preferredReplacementName,
      attachmentUrl
    } = req.body;

    if (!taskId || !requesterId || !reason) {
      return res.status(400).json({ message: 'Task ID, Requester ID, and Reason are required.' });
    }

    const task = await Complaint.findById(taskId).populate('park');
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Determine normalized requester role
    const isContractor = ['contractor', 'Contractor'].includes(requesterRole);
    const isOfficial = ['government_official', 'official', 'Government Official'].includes(requesterRole);

    if (!isContractor && !isOfficial) {
      return res.status(403).json({ message: 'Only assigned Contractors or Government Officials can request reassignment.' });
    }

    // Verify task assignment ownership
    if (isContractor) {
      const assignedContractorId = task.assignedContractor ? task.assignedContractor.toString() : '';
      if (assignedContractorId !== String(requesterId)) {
        return res.status(403).json({ message: 'You are not the currently assigned contractor for this task.' });
      }
    } else if (isOfficial) {
      const assignedOfficialId = task.assignedOfficial ? task.assignedOfficial.toString() : '';
      if (assignedOfficialId !== String(requesterId)) {
        return res.status(403).json({ message: 'You are not the currently assigned government official for this task.' });
      }
    }

    // Check if duplicate pending request exists
    const existingPending = await ReassignmentRequest.findOne({
      task: task._id,
      status: 'Pending'
    });

    if (existingPending || task.reassignmentStatus === 'Reassignment Requested') {
      return res.status(400).json({ 
        message: 'A reassignment request is already pending review for this task. You cannot submit multiple requests.',
        requestId: existingPending?.requestId
      });
    }

    const requestId = await generateRequestId();
    const taskTitle = task.category || 'Maintenance Task';
    const parkName = task.parkName || (task.park ? task.park.name : 'Park');

    // Create Reassignment Request Record
    const newRequest = new ReassignmentRequest({
      requestId,
      task: task._id,
      taskComplaintNumber: task.complaintNumber,
      taskTitle,
      park: task.park ? task.park._id : undefined,
      parkName,
      requesterId: String(requesterId),
      requesterName: requesterName || (isContractor ? 'Assigned Contractor' : 'Assigned Official'),
      requesterRole: isContractor ? 'contractor' : 'government_official',
      currentAssigneeId: String(requesterId),
      currentAssigneeName: requesterName || (isContractor ? 'Assigned Contractor' : 'Assigned Official'),
      currentAssigneeRole: isContractor ? 'contractor' : 'government_official',
      reason,
      explanation: explanation || '',
      wantsReassignment: wantsReassignment !== false,
      preferredReplacementContractor: preferredReplacementContractor || undefined,
      preferredReplacementName: preferredReplacementName || '',
      attachmentUrl: attachmentUrl || null,
      priority: task.priority || 'Medium',
      deadline: task.slaDeadline || null,
      previousDeadline: task.slaDeadline || null,
      status: 'Pending'
    });

    await newRequest.save();

    // Update Complaint Model
    task.reassignmentStatus = 'Reassignment Requested';
    task.reassignmentReason = reason;
    task.reassignmentExplanation = explanation || '';
    task.reassignmentAttachment = attachmentUrl || null;
    task.reassignmentRequestedAt = new Date();
    task.reassignmentRequesterId = String(requesterId);
    task.reassignmentRequesterRole = isContractor ? 'contractor' : 'government_official';
    task.status = 'Reassignment Requested';

    // Append Audit Trail History
    if (!task.assignmentHistory) task.assignmentHistory = [];
    task.assignmentHistory.push({
      historyId: 'HIST-' + Date.now(),
      assignedToId: String(requesterId),
      assignedToName: requesterName,
      assignedToRole: isContractor ? 'contractor' : 'government_official',
      assignedBy: 'System / Requester',
      assignedAt: new Date(),
      actionType: 'Reassignment Requested',
      reason,
      explanation: explanation || '',
      previousAssigneeId: String(requesterId),
      previousAssigneeName: requesterName,
      previousAssigneeRole: isContractor ? 'contractor' : 'government_official',
      previousDeadline: task.slaDeadline || null,
      statusAtTime: 'Reassignment Requested'
    });

    await task.save();

    // High Priority Notification to Administrator
    await Notification.create({
      recipientUserId: 'ADMIN_ALL',
      recipientRole: 'admin',
      title: '🚨 Task Reassignment Requested',
      message: `${requesterName || (isContractor ? 'Contractor' : 'Government Official')} has requested reassignment for "${taskTitle}" at ${parkName}. Reason: ${reason}.`,
      type: 'Reassignment Request',
      category: 'Reassignment',
      priority: 'URGENT',
      relatedEntityType: 'TASK',
      relatedEntityId: task._id.toString(),
      actionRoute: '/admin-dashboard/reassignments'
    });

    res.status(201).json({
      success: true,
      message: 'Reassignment request submitted successfully.',
      reassignmentRequest: newRequest,
      task
    });
  } catch (err) {
    console.error('Error in submitReassignmentRequest:', err);
    res.status(500).json({ message: 'Server error while submitting reassignment request.', error: err.message });
  }
};

// @desc    Get all Reassignment Requests (Admin View / Filtered)
// @route   GET /api/reassignments
// @access  Admin / Authenticated
const getReassignmentRequests = async (req, res) => {
  try {
    const { status, role, taskId, requesterId } = req.query;
    let filter = {};

    if (status && status !== 'All') filter.status = status;
    if (role && role !== 'All') filter.requesterRole = role;
    if (taskId) filter.task = taskId;
    if (requesterId) filter.requesterId = requesterId;

    const requests = await ReassignmentRequest.find(filter)
      .populate({
        path: 'task',
        select: 'complaintNumber category priority slaDeadline status parkName locationInPark description images assignedContractor assignedOfficial'
      })
      .populate('park', 'name district zone ward')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    console.error('Error fetching reassignment requests:', err);
    res.status(500).json({ message: 'Failed to fetch reassignment requests.', error: err.message });
  }
};

// @desc    Get Eligible Candidates for a Task Reassignment (STRICT ROLE ISOLATION)
// @route   GET /api/reassignments/eligible-candidates/:taskId
// @access  Admin
const getEligibleCandidates = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Complaint.findById(taskId).populate('park');

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Determine target role:
    // If task has assignedContractor or was requested by contractor -> 'contractor'
    // If task has assignedOfficial or was requested by official -> 'government_official'
    let targetRole = 'contractor';
    if (task.reassignmentRequesterRole) {
      targetRole = ['contractor', 'Contractor'].includes(task.reassignmentRequesterRole) ? 'contractor' : 'government_official';
    } else if (task.assignedOfficial && !task.assignedContractor) {
      targetRole = 'government_official';
    }

    const taskZoneId = task.park?.zone ? String(task.park.zone._id || task.park.zone) : null;
    const taskWardId = task.park?.ward ? String(task.park.ward._id || task.park.ward) : null;

    if (targetRole === 'contractor') {
      // Query Contractors ONLY
      const contractors = await Contractor.find({ status: 'Active' })
        .populate('zone', 'name')
        .populate('ward', 'name')
        .populate('district', 'name')
        .lean();

      // Calculate active task workload for each contractor
      const currentAssigneeId = task.assignedContractor ? String(task.assignedContractor) : '';

      const candidatesWithWorkload = await Promise.all(
        contractors.map(async (c) => {
          const activeTaskCount = await Complaint.countDocuments({
            assignedContractor: c._id,
            status: { $in: ['Assigned', 'In Progress', 'Returned by Admin', 'Rework Required', 'Reassigned to Contractor'] }
          });

          const isCurrentAssignee = String(c._id) === currentAssigneeId;
          const isOnLeave = c.availabilityStatus === 'On Leave' || c.availabilityStatus === 'Unavailable';
          const contractorZoneId = c.zone?._id ? String(c.zone._id) : (c.zone ? String(c.zone) : null);
          const contractorWardId = c.ward?._id ? String(c.ward._id) : (c.ward ? String(c.ward) : null);

          const isZoneMatch = taskZoneId && contractorZoneId === taskZoneId;
          const isWardMatch = taskWardId && contractorWardId === taskWardId;

          let availability = 'Available';
          if (isCurrentAssignee) availability = 'Current Assignee';
          else if (isOnLeave) availability = 'On Leave (Unavailable)';
          else if (activeTaskCount > 6) availability = 'Heavy Workload';

          const isAvailable = !isCurrentAssignee && !isOnLeave;

          return {
            _id: c._id,
            name: c.name,
            companyName: c.name,
            email: c.email,
            phone: c.phone,
            role: 'Contractor',
            roleKey: 'contractor',
            zone: c.zone?.name || 'All Zones',
            ward: c.ward?.name || 'All Wards',
            district: c.district?.name || 'Bangalore',
            maintenanceSkills: c.maintenanceSkills || [],
            activeTasks: activeTaskCount,
            availabilityStatus: c.availabilityStatus || 'Available',
            isOnLeave,
            isCurrentAssignee,
            isZoneMatch,
            isWardMatch,
            availability,
            isAvailable
          };
        })
      );

      // Sort: Available first, Non-leave first, Zone/Ward matches first, then lowest workload
      candidatesWithWorkload.sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
        if (a.isCurrentAssignee !== b.isCurrentAssignee) return a.isCurrentAssignee ? 1 : -1;
        if (a.isWardMatch !== b.isWardMatch) return b.isWardMatch ? 1 : -1;
        if (a.isZoneMatch !== b.isZoneMatch) return b.isZoneMatch ? 1 : -1;
        return a.activeTasks - b.activeTasks;
      });

      return res.json({
        success: true,
        targetRole: 'Contractor',
        targetRoleKey: 'contractor',
        taskInfo: {
          id: task._id,
          complaintNumber: task.complaintNumber,
          category: task.category,
          parkName: task.parkName || task.park?.name,
          priority: task.priority,
          deadline: task.slaDeadline,
          currentAssigneeId,
          reassignmentReason: task.reassignmentReason
        },
        candidates: candidatesWithWorkload
      });
    } else {
      // Query Government Officials ONLY
      const officials = await User.find({
        role: { $in: ['official', 'government_official', 'Government Official'] }
      })
        .populate('zone', 'name')
        .populate('ward', 'name')
        .populate('district', 'name')
        .select('name email phone department zone ward district role profilePic availabilityStatus')
        .lean();

      const currentAssigneeId = task.assignedOfficial ? String(task.assignedOfficial) : '';

      const candidatesWithWorkload = await Promise.all(
        officials.map(async (off) => {
          const activeTaskCount = await Complaint.countDocuments({
            assignedOfficial: off._id,
            status: { $in: ['Assigned', 'In Progress', 'Inspection Pending', 'Rework Required'] }
          });

          const isCurrentAssignee = String(off._id) === currentAssigneeId;
          const isOnLeave = off.availabilityStatus === 'On Leave' || off.availabilityStatus === 'Unavailable';
          const offZoneId = off.zone?._id ? String(off.zone._id) : (off.zone ? String(off.zone) : null);
          const offWardId = off.ward?._id ? String(off.ward._id) : (off.ward ? String(off.ward) : null);

          const isZoneMatch = taskZoneId && offZoneId === taskZoneId;
          const isWardMatch = taskWardId && offWardId === taskWardId;

          let availability = 'Available';
          if (isCurrentAssignee) availability = 'Current Assignee';
          else if (isOnLeave) availability = 'On Leave (Unavailable)';
          else if (activeTaskCount > 5) availability = 'High Inspection Load';

          const isAvailable = !isCurrentAssignee && !isOnLeave;

          return {
            _id: off._id,
            name: off.name,
            department: off.department || 'Parks & Horticulture Department',
            email: off.email,
            phone: off.phone || 'N/A',
            role: 'Government Official',
            roleKey: 'government_official',
            zone: off.zone?.name || 'BBMP Central',
            ward: off.ward?.name || 'All Wards',
            district: off.district?.name || 'Bangalore Urban',
            activeTasks: activeTaskCount,
            availabilityStatus: off.availabilityStatus || 'Available',
            isOnLeave,
            isCurrentAssignee,
            isZoneMatch,
            isWardMatch,
            availability,
            isAvailable
          };
        })
      );

      candidatesWithWorkload.sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
        if (a.isCurrentAssignee !== b.isCurrentAssignee) return a.isCurrentAssignee ? 1 : -1;
        if (a.isWardMatch !== b.isWardMatch) return b.isWardMatch ? 1 : -1;
        if (a.isZoneMatch !== b.isZoneMatch) return b.isZoneMatch ? 1 : -1;
        return a.activeTasks - b.activeTasks;
      });

      return res.json({
        success: true,
        targetRole: 'Government Official',
        targetRoleKey: 'government_official',
        taskInfo: {
          id: task._id,
          complaintNumber: task.complaintNumber,
          category: task.category,
          parkName: task.parkName || task.park?.name,
          priority: task.priority,
          deadline: task.slaDeadline,
          currentAssigneeId,
          reassignmentReason: task.reassignmentReason
        },
        candidates: candidatesWithWorkload
      });
    }
  } catch (err) {
    console.error('Error fetching eligible candidates:', err);
    res.status(500).json({ message: 'Failed to fetch eligible candidates.', error: err.message });
  }
};

// @desc    Approve & Reassign Task (STRICT BACKEND ROLE ENFORCEMENT)
// @route   POST /api/reassignments/approve
// @access  Admin
const approveReassignment = async (req, res) => {
  try {
    const {
      requestId,
      taskId,
      newAssigneeId,
      adminId,
      adminName,
      adminRemarks,
      newDeadline, // Optional deadline adjustment
      deadlineChangeReason
    } = req.body;

    if (!taskId || !newAssigneeId) {
      return res.status(400).json({ message: 'Task ID and New Assignee ID are required.' });
    }

    const task = await Complaint.findById(taskId).populate('park');
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    let reassignmentReq = null;
    if (requestId) {
      reassignmentReq = await ReassignmentRequest.findOne({
        $or: [{ _id: requestId }, { requestId: requestId }]
      });
    } else {
      reassignmentReq = await ReassignmentRequest.findOne({
        task: task._id,
        status: 'Pending'
      });
    }

    // Determine current task assignee role
    let currentRole = 'contractor';
    let previousAssigneeId = task.assignedContractor ? String(task.assignedContractor) : '';
    let previousAssigneeName = 'Previous Contractor';

    if (reassignmentReq && reassignmentReq.requesterRole) {
      currentRole = ['contractor', 'Contractor'].includes(reassignmentReq.requesterRole) ? 'contractor' : 'government_official';
      previousAssigneeId = reassignmentReq.currentAssigneeId;
      previousAssigneeName = reassignmentReq.currentAssigneeName;
    } else if (task.assignedOfficial && !task.assignedContractor) {
      currentRole = 'government_official';
      previousAssigneeId = String(task.assignedOfficial);
      previousAssigneeName = 'Previous Official';
    }

    // ==========================================
    // 🔒 STRICT BACKEND SECURITY ROLE VALIDATION
    // ==========================================
    let verifiedNewAssignee = null;
    let newAssigneeName = '';
    let newAssigneeRole = '';

    if (currentRole === 'contractor') {
      // 1. Verify candidate is strictly in Contractor database
      const contractorDoc = await Contractor.findById(newAssigneeId);
      if (!contractorDoc) {
        // Cross-role attempt or invalid ID
        return res.status(403).json({
          message: 'Security Violation: A Contractor task can only be reassigned to another Contractor.'
        });
      }
      verifiedNewAssignee = contractorDoc;
      newAssigneeName = contractorDoc.name;
      newAssigneeRole = 'contractor';
    } else if (currentRole === 'government_official') {
      // 2. Verify candidate is strictly a Government Official User
      const userDoc = await User.findById(newAssigneeId);
      if (!userDoc || !['official', 'government_official', 'Government Official'].includes(userDoc.role)) {
        return res.status(403).json({
          message: 'Security Violation: A Government Official task can only be reassigned to another Government Official.'
        });
      }
      verifiedNewAssignee = userDoc;
      newAssigneeName = userDoc.name;
      newAssigneeRole = 'government_official';
    }

    // Preserve SLA deadline unless explicitly updated by Admin
    const previousDeadline = task.slaDeadline;
    let finalDeadline = task.slaDeadline;
    let deadlineModified = false;

    if (newDeadline) {
      const parsedNewDeadline = new Date(newDeadline);
      if (!isNaN(parsedNewDeadline.getTime())) {
        finalDeadline = parsedNewDeadline;
        deadlineModified = true;
      }
    }

    // Update Complaint Document
    if (currentRole === 'contractor') {
      task.assignedContractor = verifiedNewAssignee._id;
      task.status = 'Reassigned to Contractor';
    } else {
      task.assignedOfficial = verifiedNewAssignee._id;
      task.status = 'Assigned';
    }

    task.reassignmentStatus = 'Reassigned';
    task.slaDeadline = finalDeadline;
    task.assignedAt = new Date();

    // Push to Assignment History
    if (!task.assignmentHistory) task.assignmentHistory = [];
    task.assignmentHistory.push({
      historyId: 'HIST-' + Date.now(),
      assignedToId: String(verifiedNewAssignee._id),
      assignedToName: newAssigneeName,
      assignedToRole: newAssigneeRole,
      assignedBy: adminName || 'Administrator',
      assignedAt: new Date(),
      actionType: 'Reassignment Approved',
      reason: reassignmentReq?.reason || 'Reassignment Approved by Admin',
      explanation: adminRemarks || reassignmentReq?.explanation || '',
      previousAssigneeId,
      previousAssigneeName,
      previousAssigneeRole: currentRole,
      previousDeadline,
      newDeadline: deadlineModified ? finalDeadline : undefined,
      deadlineChangeReason: deadlineModified ? (deadlineChangeReason || 'Deadline adjusted by Admin upon reassignment.') : undefined,
      reviewedBy: adminName || 'Administrator',
      reviewedAt: new Date(),
      statusAtTime: task.status
    });

    await task.save();

    // Update Reassignment Request Record (if exists)
    if (reassignmentReq) {
      reassignmentReq.status = 'Approved';
      reassignmentReq.reviewedByName = adminName || 'Administrator';
      reassignmentReq.reviewedAt = new Date();
      reassignmentReq.adminRemarks = adminRemarks || '';
      reassignmentReq.newAssigneeId = String(verifiedNewAssignee._id);
      reassignmentReq.newAssigneeName = newAssigneeName;
      reassignmentReq.newAssigneeRole = newAssigneeRole;
      reassignmentReq.reassignedAt = new Date();
      if (deadlineModified) {
        reassignmentReq.newDeadline = finalDeadline;
        reassignmentReq.deadlineChangeReason = deadlineChangeReason;
      }
      await reassignmentReq.save();
    }

    const taskTitle = task.category || 'Maintenance Task';
    const parkName = task.parkName || (task.park ? task.park.name : 'Park');
    const deadlineStr = finalDeadline ? new Date(finalDeadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'As Scheduled';

    // 1. Notification to New Assignee
    await Notification.create({
      recipientUserId: String(verifiedNewAssignee._id),
      recipientRole: newAssigneeRole === 'contractor' ? 'contractor' : 'official',
      title: '🔄 Task Reassigned to You',
      message: `You have been assigned ${taskTitle} at ${parkName}. Priority: ${task.priority || 'Medium'}. Target Deadline: ${deadlineStr}.`,
      type: 'New Task Assigned',
      category: 'Assigned Tasks',
      priority: 'HIGH',
      relatedEntityType: 'TASK',
      relatedEntityId: task._id.toString(),
      actionRoute: newAssigneeRole === 'contractor' ? `/contractor/tasks/${task.complaintNumber}` : `/gov-dashboard/inspections/${task._id}`
    });

    // 2. Notification to Original Assignee (Approved)
    if (previousAssigneeId) {
      await Notification.create({
        recipientUserId: previousAssigneeId,
        recipientRole: currentRole === 'contractor' ? 'contractor' : 'official',
        title: '✅ Reassignment Request Approved',
        message: `Your reassignment request for "${taskTitle}" at ${parkName} has been approved by Administrator.`,
        type: 'Reassignment Status',
        category: 'Reassignment',
        priority: 'NORMAL',
        relatedEntityType: 'TASK',
        relatedEntityId: task._id.toString(),
        actionRoute: currentRole === 'contractor' ? '/contractor/tasks' : '/gov-dashboard/my-inspections'
      });
    }

    res.json({
      success: true,
      message: `Task successfully reassigned to ${newAssigneeName}.`,
      task,
      reassignmentRequest: reassignmentReq
    });
  } catch (err) {
    console.error('Error approving reassignment:', err);
    res.status(500).json({ message: 'Server error while approving reassignment.', error: err.message });
  }
};

// @desc    Reject Reassignment Request (Admin)
// @route   POST /api/reassignments/reject
// @access  Admin
const rejectReassignment = async (req, res) => {
  try {
    const { requestId, taskId, adminId, adminName, adminRemarks } = req.body;

    if (!requestId && !taskId) {
      return res.status(400).json({ message: 'Request ID or Task ID is required.' });
    }

    let request = null;
    if (requestId) {
      request = await ReassignmentRequest.findOne({
        $or: [{ _id: requestId }, { requestId }]
      });
    } else {
      request = await ReassignmentRequest.findOne({ task: taskId, status: 'Pending' });
    }

    if (!request) {
      return res.status(404).json({ message: 'Pending reassignment request not found.' });
    }

    const task = await Complaint.findById(request.task).populate('park');
    if (!task) {
      return res.status(404).json({ message: 'Associated task not found.' });
    }

    // Update Request Record
    request.status = 'Rejected';
    request.reviewedByName = adminName || 'Administrator';
    request.reviewedAt = new Date();
    request.adminRemarks = adminRemarks || 'Reassignment request was declined by Administrator.';
    await request.save();

    // Reset task reassignment status, return to normal assigned state
    task.reassignmentStatus = 'Rejected';
    if (task.status === 'Reassignment Requested') {
      task.status = 'Assigned';
    }

    // Push to Assignment History
    if (!task.assignmentHistory) task.assignmentHistory = [];
    task.assignmentHistory.push({
      historyId: 'HIST-' + Date.now(),
      assignedToId: request.currentAssigneeId,
      assignedToName: request.currentAssigneeName,
      assignedToRole: request.currentAssigneeRole,
      assignedBy: adminName || 'Administrator',
      assignedAt: new Date(),
      actionType: 'Reassignment Rejected',
      reason: request.reason,
      explanation: adminRemarks || 'Reassignment request was rejected by Administrator.',
      reviewedBy: adminName || 'Administrator',
      reviewedAt: new Date(),
      statusAtTime: task.status
    });

    await task.save();

    const taskTitle = task.category || 'Maintenance Task';
    const parkName = task.parkName || (task.park ? task.park.name : 'Park');

    // Notification to Original Assignee (Rejected)
    await Notification.create({
      recipientUserId: request.currentAssigneeId,
      recipientRole: request.currentAssigneeRole === 'contractor' ? 'contractor' : 'official',
      title: '❌ Reassignment Request Rejected',
      message: `Your reassignment request for "${taskTitle}" at ${parkName} has been rejected. The task remains assigned to you. Note: ${adminRemarks || 'Please coordinate with admin.'}`,
      type: 'Reassignment Status',
      category: 'Reassignment',
      priority: 'HIGH',
      relatedEntityType: 'TASK',
      relatedEntityId: task._id.toString(),
      actionRoute: request.currentAssigneeRole === 'contractor' ? `/contractor/tasks/${task.complaintNumber}` : `/gov-dashboard/inspections/${task._id}`
    });

    res.json({
      success: true,
      message: 'Reassignment request rejected. Task remains assigned to current assignee.',
      task,
      request
    });
  } catch (err) {
    console.error('Error rejecting reassignment:', err);
    res.status(500).json({ message: 'Server error while rejecting reassignment.', error: err.message });
  }
};

// @desc    Admin Direct Reassignment (STRICT ROLE ISOLATION)
// @route   POST /api/reassignments/direct
// @access  Admin
const directReassign = async (req, res) => {
  try {
    const {
      taskId,
      newAssigneeId,
      adminId,
      adminName,
      reason,
      explanation,
      newDeadline,
      deadlineChangeReason
    } = req.body;

    if (!taskId || !newAssigneeId) {
      return res.status(400).json({ message: 'Task ID and New Assignee ID are required.' });
    }

    const task = await Complaint.findById(taskId).populate('park');
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    // Determine current task role
    let currentRole = 'contractor';
    let previousAssigneeId = '';
    let previousAssigneeName = 'Previous Assignee';

    if (task.assignedContractor) {
      currentRole = 'contractor';
      previousAssigneeId = String(task.assignedContractor);
      const prevC = await Contractor.findById(task.assignedContractor);
      if (prevC) previousAssigneeName = prevC.name;
    } else if (task.assignedOfficial) {
      currentRole = 'government_official';
      previousAssigneeId = String(task.assignedOfficial);
      const prevO = await User.findById(task.assignedOfficial);
      if (prevO) previousAssigneeName = prevO.name;
    }

    // Role verification
    let verifiedNewAssignee = null;
    let newAssigneeName = '';
    let newAssigneeRole = '';

    if (currentRole === 'contractor') {
      const contractorDoc = await Contractor.findById(newAssigneeId);
      if (!contractorDoc) {
        return res.status(403).json({
          message: 'Security Violation: A Contractor task can only be reassigned to another Contractor.'
        });
      }
      verifiedNewAssignee = contractorDoc;
      newAssigneeName = contractorDoc.name;
      newAssigneeRole = 'contractor';
      task.assignedContractor = contractorDoc._id;
      task.status = 'Reassigned to Contractor';
    } else {
      const userDoc = await User.findById(newAssigneeId);
      if (!userDoc || !['official', 'government_official', 'Government Official'].includes(userDoc.role)) {
        return res.status(403).json({
          message: 'Security Violation: A Government Official task can only be reassigned to another Government Official.'
        });
      }
      verifiedNewAssignee = userDoc;
      newAssigneeName = userDoc.name;
      newAssigneeRole = 'government_official';
      task.assignedOfficial = userDoc._id;
      task.status = 'Assigned';
    }

    // Deadline handling
    const previousDeadline = task.slaDeadline;
    let finalDeadline = task.slaDeadline;
    let deadlineModified = false;

    if (newDeadline) {
      const parsed = new Date(newDeadline);
      if (!isNaN(parsed.getTime())) {
        finalDeadline = parsed;
        deadlineModified = true;
      }
    }

    task.slaDeadline = finalDeadline;
    task.reassignmentStatus = 'Reassigned';
    task.assignedAt = new Date();

    // Add to Audit History
    if (!task.assignmentHistory) task.assignmentHistory = [];
    task.assignmentHistory.push({
      historyId: 'HIST-' + Date.now(),
      assignedToId: String(verifiedNewAssignee._id),
      assignedToName: newAssigneeName,
      assignedToRole: newAssigneeRole,
      assignedBy: adminName || 'Administrator',
      assignedAt: new Date(),
      actionType: 'Direct Reassignment',
      reason: reason || 'Direct Reassignment by Admin',
      explanation: explanation || '',
      previousAssigneeId,
      previousAssigneeName,
      previousAssigneeRole: currentRole,
      previousDeadline,
      newDeadline: deadlineModified ? finalDeadline : undefined,
      deadlineChangeReason: deadlineModified ? (deadlineChangeReason || 'Deadline changed by Admin.') : undefined,
      reviewedBy: adminName || 'Administrator',
      reviewedAt: new Date(),
      statusAtTime: task.status
    });

    await task.save();

    const taskTitle = task.category || 'Maintenance Task';
    const parkName = task.parkName || (task.park ? task.park.name : 'Park');
    const deadlineStr = finalDeadline ? new Date(finalDeadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'As Scheduled';

    // Notification to new assignee
    await Notification.create({
      recipientUserId: String(verifiedNewAssignee._id),
      recipientRole: newAssigneeRole === 'contractor' ? 'contractor' : 'official',
      title: '🔄 Task Reassigned to You',
      message: `You have been directly assigned ${taskTitle} at ${parkName}. Priority: ${task.priority || 'Medium'}. Target Deadline: ${deadlineStr}.`,
      type: 'New Task Assigned',
      category: 'Assigned Tasks',
      priority: 'HIGH',
      relatedEntityType: 'TASK',
      relatedEntityId: task._id.toString(),
      actionRoute: newAssigneeRole === 'contractor' ? `/contractor/tasks/${task.complaintNumber}` : `/gov-dashboard/inspections/${task._id}`
    });

    // Notification to previous assignee
    if (previousAssigneeId && previousAssigneeId !== String(verifiedNewAssignee._id)) {
      await Notification.create({
        recipientUserId: previousAssigneeId,
        recipientRole: currentRole === 'contractor' ? 'contractor' : 'official',
        title: '🔄 Task Reassigned by Admin',
        message: `Task "${taskTitle}" at ${parkName} has been reassigned to another ${currentRole === 'contractor' ? 'contractor' : 'government official'}.`,
        type: 'Task Reassigned',
        category: 'Assigned Tasks',
        priority: 'NORMAL',
        relatedEntityType: 'TASK',
        relatedEntityId: task._id.toString(),
        actionRoute: currentRole === 'contractor' ? '/contractor/tasks' : '/gov-dashboard/my-inspections'
      });
    }

    res.json({
      success: true,
      message: `Task successfully reassigned to ${newAssigneeName}.`,
      task
    });
  } catch (err) {
    console.error('Error in directReassign:', err);
    res.status(500).json({ message: 'Server error during direct reassignment.', error: err.message });
  }
};

// @desc    Escalate Task (When no suitable replacement is available)
// @route   POST /api/reassignments/escalate
// @access  Admin
const escalateTask = async (req, res) => {
  try {
    const { taskId, adminName, adminRemarks } = req.body;
    const task = await Complaint.findById(taskId).populate('park');

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    task.status = 'Escalated';
    task.reassignmentStatus = 'Escalated';

    if (!task.assignmentHistory) task.assignmentHistory = [];
    task.assignmentHistory.push({
      historyId: 'HIST-' + Date.now(),
      assignedToId: task.assignedContractor ? String(task.assignedContractor) : (task.assignedOfficial ? String(task.assignedOfficial) : ''),
      assignedToRole: task.assignedContractor ? 'contractor' : 'government_official',
      assignedBy: adminName || 'Administrator',
      assignedAt: new Date(),
      actionType: 'Escalated',
      reason: 'No suitable replacement available / Administrative Escalation',
      explanation: adminRemarks || 'Task escalated for managerial review.',
      statusAtTime: 'Escalated'
    });

    await task.save();

    // High Priority Notification
    await Notification.create({
      recipientUserId: 'ADMIN_ALL',
      recipientRole: 'admin',
      title: '⚠️ Task Escalated',
      message: `Task "${task.category || 'Maintenance'}" at ${task.parkName || 'Park'} has been escalated. No suitable assignee available.`,
      type: 'Task Escalated',
      category: 'Reassignment',
      priority: 'URGENT',
      relatedEntityType: 'TASK',
      relatedEntityId: task._id.toString(),
      actionRoute: '/admin-dashboard/reassignments'
    });

    res.json({
      success: true,
      message: 'Task status updated to Escalated.',
      task
    });
  } catch (err) {
    console.error('Error escalating task:', err);
    res.status(500).json({ message: 'Server error while escalating task.', error: err.message });
  }
};

module.exports = {
  submitReassignmentRequest,
  getReassignmentRequests,
  getEligibleCandidates,
  approveReassignment,
  rejectReassignment,
  directReassign,
  escalateTask
};
