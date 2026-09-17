const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Contractor = require('../models/Contractor');
const Park = require('../models/Park');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const StallBooking = require('../models/StallBooking');
const Announcement = require('../models/Announcement');

// Get notifications for a user based on their ID and Role
const getNotifications = async (req, res) => {
  try {
    const { userId, role, phone } = req.query;

    if (!userId || !role) {
      return res.status(400).json({ message: 'User ID and Role are required' });
    }

    const isOfficial = ['official', 'government_official', 'Government Official'].includes(role);

    let citizenDoc = null;
    let citizenIds = [userId];
    if (role === 'citizen') {
      if (mongoose.Types.ObjectId.isValid(userId) && userId.length === 24) {
        citizenDoc = await User.findById(userId).lean();
      }
      if (!citizenDoc && phone) {
        citizenDoc = await User.findOne({ phone }).lean();
      }
      if (citizenDoc) {
        citizenIds.push(citizenDoc._id.toString());
        if (citizenDoc.phone) citizenIds.push(citizenDoc.phone);
        if (citizenDoc.email) citizenIds.push(citizenDoc.email);
      }
    }

    let contractorDoc = null;
    let contractorIds = [userId];

    if (role === 'contractor') {
      contractorDoc = await Contractor.findOne({
        $or: [
          ...(mongoose.Types.ObjectId.isValid(userId) && userId.length === 24 ? [{ _id: userId }] : []),
          { contractorId: userId },
          { email: userId },
          { username: userId }
        ]
      });

      if (contractorDoc) {
        contractorIds.push(contractorDoc._id.toString());
        if (contractorDoc.contractorId) contractorIds.push(contractorDoc.contractorId);
        if (contractorDoc.email) contractorIds.push(contractorDoc.email);
        if (contractorDoc.username) contractorIds.push(contractorDoc.username);
      }
    }

    // Match any notification explicitly sent to this user ID, plus role-based broadcasts
    const query = {
      $or: []
    };

    if (role === 'citizen') {
      query.$or.push({ recipientUserId: { $in: [...new Set(citizenIds)] } });
      query.$or.push({ recipientUserId: 'CITIZEN_ALL' });
    } else if (role === 'contractor') {
      query.$or.push({ recipientUserId: { $in: [...new Set(contractorIds)] } });
      query.$or.push({ recipientUserId: 'CONTRACTOR_ALL' });
    } else if (isOfficial) {
      query.$or.push({ recipientUserId: userId });
      query.$or.push({ recipientUserId: 'OFFICIAL_ALL' });
    } else if (role === 'admin') {
      query.$or.push({ recipientUserId: 'ADMIN_ALL' });
      query.$or.push({ recipientUserId: userId });
    } else {
      query.$or.push({ recipientUserId: userId });
    }

    // ── 1. For government officials: auto-create notifications for assigned inspections & default role notifications ──
    if (isOfficial) {
      const assignedComplaints = await Complaint.find({
        assignedOfficial: userId
      }).select('_id parkName complaintNumber priority updatedAt createdAt').sort({ updatedAt: -1 }).limit(10).lean();

      if (assignedComplaints.length > 0) {
        const cIds = assignedComplaints.map(c => c._id.toString());
        const existingNotifs = await Notification.find({
          recipientUserId: userId,
          type: 'Inspection Assigned',
          relatedEntityId: { $in: cIds }
        }).select('relatedEntityId').lean();
        
        const existingSet = new Set(existingNotifs.map(n => n.relatedEntityId));
        const newNotifs = [];

        for (const complaint of assignedComplaints) {
          if (!existingSet.has(complaint._id.toString())) {
            newNotifs.push({
              recipientUserId: userId,
              recipientRole: 'official',
              title: `🔔 New Task Assigned`,
              message: `New inspection assigned for ${complaint.parkName || 'Park'} (${complaint.complaintNumber || 'Ticket'}).`,
              type: 'Inspection Assigned',
              category: 'Inspection',
              priority: complaint.priority === 'Urgent' || complaint.priority === 'High' ? 'URGENT' : 'NORMAL',
              relatedEntityType: 'COMPLAINT',
              relatedEntityId: complaint._id.toString(),
              actionRoute: `/gov-dashboard/inspections/${complaint._id}`,
              createdAt: complaint.updatedAt || complaint.createdAt || new Date()
            });
          }
        }

        if (newNotifs.length > 0) {
          await Notification.insertMany(newNotifs, { ordered: false }).catch(() => {});
        }
      }

      // Check count of notifications for official
      const officialNotifCount = await Notification.countDocuments(query);

      if (officialNotifCount === 0) {
        const sampleNotifs = [
          {
            recipientUserId: userId,
            recipientRole: 'official',
            title: '🔔 Inspection Reminder',
            message: 'Daily inspection for J.P. Nagar 5th Stage Park is due today.',
            category: 'Inspection',
            type: 'Inspection Reminder',
            priority: 'NORMAL',
            isRead: false,
            actionRoute: '/gov-dashboard/my-inspections',
            createdAt: new Date(Date.now() - 30 * 60 * 1000)
          },
          {
            recipientUserId: userId,
            recipientRole: 'official',
            title: '🔔 Verification Required',
            message: 'The contractor has submitted completion proof for the assigned maintenance task at J.P. Nagar 5th Stage Park.',
            category: 'Verification',
            type: 'Work Completed',
            priority: 'HIGH',
            isRead: false,
            actionRoute: '/gov-dashboard/verify-work',
            createdAt: new Date(Date.now() - 2 * 3600 * 1000)
          },
          {
            recipientUserId: userId,
            recipientRole: 'official',
            title: '⏰ Task Due Soon',
            message: 'Maintenance task at Maruthi Layout Park is approaching SLA deadline in 24 hours.',
            category: 'SLA',
            type: 'Task Due Soon',
            priority: 'HIGH',
            isRead: false,
            actionRoute: '/gov-dashboard/complaints',
            createdAt: new Date(Date.now() - 5 * 3600 * 1000)
          }
        ];

        await Notification.insertMany(sampleNotifs, { ordered: false }).catch(() => {});
      }
    }

    // ── 2. For contractors: auto-sync assigned tasks, maintenance alerts, due dates, & inspection reminders ──
    if (role === 'contractor') {
      const contractorSearchIds = [...new Set(contractorIds)];
      const assignedTasks = await Complaint.find({
        $or: [
          { assignedContractor: { $in: contractorSearchIds.filter(id => mongoose.Types.ObjectId.isValid(id) && id.length === 24) } }
        ]
      }).select('_id category parkName complaintNumber priority createdAt assignedAt').sort({ createdAt: -1 }).limit(15).lean();

      if (assignedTasks.length > 0) {
        const taskIds = assignedTasks.map(t => t._id.toString());
        const existingContractorNotifs = await Notification.find({
          recipientUserId: { $in: contractorSearchIds },
          type: { $in: ['Maintenance Alert', 'Task Assigned', 'New Task Assigned'] },
          relatedEntityId: { $in: taskIds }
        }).select('type relatedEntityId').lean();

        const maintSet = new Set(existingContractorNotifs.filter(n => n.type === 'Maintenance Alert').map(n => n.relatedEntityId));
        const assignSet = new Set(existingContractorNotifs.filter(n => n.type !== 'Maintenance Alert').map(n => n.relatedEntityId));
        const newContractorNotifs = [];

        for (const task of assignedTasks) {
          const taskIdStr = task._id.toString();
          if (!maintSet.has(taskIdStr)) {
            newContractorNotifs.push({
              recipientUserId: userId,
              recipientRole: 'contractor',
              title: '🔔 Maintenance Alert',
              message: `${task.category || 'Asset'} at ${task.parkName || 'Park'} requires repair. Ticket #${task.complaintNumber || 'N/A'}.`,
              type: 'Maintenance Alert',
              category: 'Maintenance',
              priority: task.priority === 'Urgent' || task.priority === 'High' ? 'URGENT' : 'HIGH',
              relatedEntityType: 'TASK',
              relatedEntityId: taskIdStr,
              actionRoute: '/contractor/tasks',
              createdAt: task.createdAt || new Date()
            });
          }

          if (!assignSet.has(taskIdStr)) {
            newContractorNotifs.push({
              recipientUserId: userId,
              recipientRole: 'contractor',
              title: '🔔 New Task Assigned',
              message: `New maintenance task assigned to you: ${task.category || 'Maintenance'} at ${task.parkName || 'Park'} (Ticket #${task.complaintNumber || 'N/A'}).`,
              type: 'New Task Assigned',
              category: 'Assigned Tasks',
              priority: 'HIGH',
              relatedEntityType: 'TASK',
              relatedEntityId: taskIdStr,
              actionRoute: '/contractor/tasks',
              createdAt: task.assignedAt || task.createdAt || new Date()
            });
          }
        }

        if (newContractorNotifs.length > 0) {
          await Notification.insertMany(newContractorNotifs, { ordered: false }).catch(() => {});
        }
      }

      // Check count of notifications for contractor
      const contractorNotifCount = await Notification.countDocuments(query);
      if (contractorNotifCount === 0) {
        const contractorSamples = [
          {
            recipientUserId: userId,
            recipientRole: 'contractor',
            title: '🔔 Maintenance Alert',
            message: 'Playground equipment at JP Park requires repair.',
            category: 'Maintenance',
            type: 'Maintenance Alert',
            priority: 'HIGH',
            isRead: false,
            actionRoute: '/contractor/tasks',
            createdAt: new Date(Date.now() - 20 * 60 * 1000)
          },
          {
            recipientUserId: userId,
            recipientRole: 'contractor',
            title: '🔔 Inspection Reminder',
            message: 'Daily inspection for JP Park is due today.',
            category: 'Inspection',
            type: 'Inspection Reminder',
            priority: 'NORMAL',
            isRead: false,
            actionRoute: '/contractor/tasks',
            createdAt: new Date(Date.now() - 2 * 3600 * 1000)
          },
          {
            recipientUserId: userId,
            recipientRole: 'contractor',
            title: '🔔 New Task Assigned',
            message: 'Admin assigned a new pathway lighting repair task to you.',
            category: 'Assigned Tasks',
            type: 'New Task Assigned',
            priority: 'HIGH',
            isRead: false,
            actionRoute: '/contractor/tasks',
            createdAt: new Date(Date.now() - 5 * 3600 * 1000)
          }
        ];
        await Notification.insertMany(contractorSamples, { ordered: false }).catch(() => {});
      }
    }

    // ── 3. For citizens: auto-sync complaints & status updates (In Progress, Resolved, Assigned) ──
    if (role === 'citizen') {
      const isObjectId = mongoose.Types.ObjectId.isValid(userId) && userId.length === 24;
      const citizenUser = citizenDoc || (isObjectId ? await User.findById(userId).lean() : null);
      const citizenPhone = (phone && phone !== 'undefined') ? phone : (citizenUser && citizenUser.phone);
      const citizenName = citizenUser ? citizenUser.name : '';
      const citizenEmail = citizenUser ? citizenUser.email : '';

      // Complaints auto-sync
      const resolvedStatuses = ['Closed', 'Verified', 'Inspection Approved', 'Resolved'];
      const complaintQuery = { $or: [] };
      if (citizenPhone) complaintQuery.$or.push({ userPhone: citizenPhone });
      if (citizenName) complaintQuery.$or.push({ userName: new RegExp(`^${citizenName.trim()}$`, 'i') });
      if (isObjectId) complaintQuery.$or.push({ user: userId });

      if (complaintQuery.$or.length > 0) {
        const userComplaints = await Complaint.find(complaintQuery).select('_id status category parkName complaintNumber createdAt updatedAt').sort({ createdAt: -1 }).limit(15).lean();

        if (userComplaints.length > 0) {
          const complaintIds = userComplaints.map(c => c._id.toString());
          const existingCitizenNotifs = await Notification.find({
            recipientUserId: { $in: [...new Set(citizenIds)] },
            relatedEntityId: { $in: complaintIds }
          }).select('type relatedEntityId').lean();

          const existingTypeMap = new Set(existingCitizenNotifs.map(n => `${n.relatedEntityId}_${n.type}`));
          const newCitizenNotifs = [];

          for (const complaint of userComplaints) {
            const complaintIdStr = complaint._id.toString();
            const isResolved = resolvedStatuses.includes(complaint.status);
            const isInProgress = complaint.status === 'In Progress' || complaint.status === 'in-progress';

            // A. Initial Submission
            if (!existingTypeMap.has(`${complaintIdStr}_Complaint Submitted`)) {
              newCitizenNotifs.push({
                recipientUserId: userId,
                recipientRole: 'citizen',
                title: '🔔 Complaint Submitted',
                message: `Your complaint for ${(complaint.category || 'park maintenance').toLowerCase()} at ${complaint.parkName || 'the park'} was submitted. Ticket #${complaint.complaintNumber || 'N/A'}.`,
                type: 'Complaint Submitted',
                category: 'Complaint',
                priority: 'NORMAL',
                relatedEntityType: 'COMPLAINT',
                relatedEntityId: complaintIdStr,
                actionRoute: '/track-complaint',
                createdAt: complaint.createdAt || new Date()
              });
            }

            // B. In Progress Status Update
            if ((isInProgress || isResolved) && !existingTypeMap.has(`${complaintIdStr}_Complaint Status Updated`)) {
              newCitizenNotifs.push({
                recipientUserId: userId,
                recipientRole: 'citizen',
                title: '🔔 Complaint Status Updated',
                message: 'Your complaint has been marked “In Progress.”',
                type: 'Complaint Status Updated',
                category: 'Complaint',
                priority: 'NORMAL',
                relatedEntityType: 'COMPLAINT',
                relatedEntityId: complaintIdStr,
                actionRoute: '/track-complaint',
                createdAt: complaint.updatedAt || new Date()
              });
            }

            // C. Resolved Status Update
            if (isResolved && !existingTypeMap.has(`${complaintIdStr}_Complaint Resolved`)) {
              newCitizenNotifs.push({
                recipientUserId: userId,
                recipientRole: 'citizen',
                title: '✅ Complaint Resolved',
                message: 'Your complaint has been successfully resolved.',
                type: 'Complaint Resolved',
                category: 'Complaint',
                priority: 'NORMAL',
                relatedEntityType: 'COMPLAINT',
                relatedEntityId: complaintIdStr,
                actionRoute: '/track-complaint',
                createdAt: complaint.updatedAt || new Date()
              });
            }
          }

          if (newCitizenNotifs.length > 0) {
            await Notification.insertMany(newCitizenNotifs, { ordered: false }).catch(() => {});
          }
        }
      }

      // Check citizen broadcasts count
      const citizenNotifCount = await Notification.countDocuments({
        $or: [
          { recipientUserId: userId },
          { recipientUserId: 'CITIZEN_ALL' }
        ]
      });

      if (citizenNotifCount === 0) {
        const publicBroadcasts = [
          {
            recipientUserId: 'CITIZEN_ALL',
            recipientRole: 'citizen',
            title: 'Welcome to Parks Monitoring System 🌳',
            message: 'Discover your city’s parks, report maintenance issues in real-time, join yoga/events, and track complaints anytime.',
            category: 'Park Announcement',
            type: 'Announcement',
            priority: 'NORMAL',
            isRead: false,
            actionRoute: '/parks',
            createdAt: new Date()
          },
          {
            recipientUserId: 'CITIZEN_ALL',
            recipientRole: 'citizen',
            title: '🔔 Complaint Status Tracking Enabled',
            message: 'You will receive real-time notifications whenever your submitted complaints are Assigned, In Progress, or Resolved.',
            category: 'Complaint',
            type: 'Complaint Status Updated',
            priority: 'NORMAL',
            isRead: false,
            actionRoute: '/track-complaint',
            createdAt: new Date(Date.now() - 60 * 60 * 1000)
          }
        ];
        await Notification.insertMany(publicBroadcasts, { ordered: false }).catch(() => {});
      }
    }

    if (role === 'citizen') {
      query.title = { $not: /emergency|sos/i };
      query.category = { $not: /emergency|sos/i };
      query.type = { $not: /emergency|sos/i };
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).limit(100).lean(),
      Notification.countDocuments({ ...query, isRead: false })
    ]);

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Mark a specific notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Mark all notifications for a user as read
const markAllAsRead = async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({ message: 'User ID and Role are required' });
    }

    const isOfficial = ['official', 'government_official', 'Government Official'].includes(role);

    const query = {
      $or: [
        { recipientUserId: userId },
      ]
    };

    if (role === 'citizen') {
      query.$or.push({ recipientUserId: 'CITIZEN_ALL' });
    }

    if (isOfficial) {
      query.$or.push({ recipientUserId: userId, recipientRole: 'official' });
      query.$or.push({ recipientUserId: userId, recipientRole: 'Government Official' });
      query.$or.push({ recipientUserId: userId, recipientRole: 'government_official' });
    }

    if (role === 'admin') {
      query.$or.push({ recipientUserId: 'ADMIN_ALL', recipientRole: 'admin' });
      query.$or.push({ recipientUserId: 'CITIZEN_ALL' });
    }

    if (role === 'contractor') {
      query.$or.push({ recipientUserId: 'CONTRACTOR_ALL', recipientRole: 'contractor' });
    }

    await Notification.updateMany(
      { ...query, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
