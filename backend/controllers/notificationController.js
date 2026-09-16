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
      query.$or.push({ recipientUserId: 'all' });
      query.$or.push({ recipientRole: 'citizen' });
      query.$or.push({ recipientRole: 'all' });
    } else if (role === 'contractor') {
      query.$or.push({ recipientUserId: { $in: [...new Set(contractorIds)] } });
      query.$or.push({ recipientUserId: 'CONTRACTOR_ALL' });
      query.$or.push({ recipientUserId: 'all' });
      query.$or.push({ recipientRole: 'contractor' });
    } else if (isOfficial) {
      query.$or.push({ recipientUserId: userId });
      query.$or.push({ recipientRole: 'official' });
      query.$or.push({ recipientRole: 'Government Official' });
      query.$or.push({ recipientRole: 'government_official' });
    } else if (role === 'admin') {
      query.$or.push({ recipientUserId: 'ADMIN_ALL' });
      query.$or.push({ recipientUserId: 'CITIZEN_ALL' });
      query.$or.push({ recipientRole: 'admin' });
      query.$or.push({ recipientUserId: userId });
    } else {
      query.$or.push({ recipientUserId: userId });
    }

    // ── 1. For government officials: auto-create notifications for assigned inspections & default role notifications ──
    if (isOfficial) {
      const assignedComplaints = await Complaint.find({
        assignedOfficial: userId
      }).sort({ updatedAt: -1 });

      for (const complaint of assignedComplaints) {
        const exists = await Notification.findOne({
          recipientUserId: userId,
          type: 'Inspection Assigned',
          relatedEntityId: complaint._id.toString()
        });

        if (!exists) {
          await Notification.create({
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

        await Notification.insertMany(sampleNotifs);
      }
    }

    // ── 2. For contractors: auto-sync assigned tasks, maintenance alerts, due dates, & inspection reminders ──
    if (role === 'contractor') {
      const contractorSearchIds = [...new Set(contractorIds)];
      const assignedTasks = await Complaint.find({
        $or: [
          { assignedContractor: { $in: contractorSearchIds.filter(id => mongoose.Types.ObjectId.isValid(id) && id.length === 24) } }
        ]
      }).sort({ createdAt: -1 });

      for (const task of assignedTasks) {
        const taskIdStr = task._id.toString();

        // Check if Maintenance Alert exists
        const existsMaintenanceAlert = await Notification.findOne({
          recipientUserId: { $in: contractorSearchIds },
          type: 'Maintenance Alert',
          relatedEntityId: taskIdStr
        });

        if (!existsMaintenanceAlert) {
          await Notification.create({
            recipientUserId: userId,
            recipientRole: 'contractor',
            title: '🔔 Maintenance Alert',
            message: `${task.category || 'Asset'} at ${task.parkName || 'Park'} requires repair. Ticket #${task.complaintNumber}.`,
            type: 'Maintenance Alert',
            category: 'Maintenance',
            priority: task.priority === 'Urgent' || task.priority === 'High' ? 'URGENT' : 'HIGH',
            relatedEntityType: 'TASK',
            relatedEntityId: taskIdStr,
            actionRoute: '/contractor/tasks',
            createdAt: task.createdAt || new Date()
          });
        }

        // Check if New Task Assigned exists
        const existsTaskAssigned = await Notification.findOne({
          recipientUserId: { $in: contractorSearchIds },
          type: { $in: ['Task Assigned', 'New Task Assigned'] },
          relatedEntityId: taskIdStr
        });

        if (!existsTaskAssigned) {
          await Notification.create({
            recipientUserId: userId,
            recipientRole: 'contractor',
            title: '🔔 New Task Assigned',
            message: `New maintenance task assigned to you: ${task.category || 'Maintenance'} at ${task.parkName || 'Park'} (Ticket #${task.complaintNumber}).`,
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

      // Check daily inspection reminder for assigned parks
      if (contractorDoc && contractorDoc.assignedParks && contractorDoc.assignedParks.length > 0) {
        const assignedParksList = await Park.find({ _id: { $in: contractorDoc.assignedParks } }).select('name').lean();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        for (const park of assignedParksList) {
          const existsInsp = await Notification.findOne({
            recipientUserId: { $in: contractorSearchIds },
            type: 'Inspection Reminder',
            relatedEntityId: park._id.toString(),
            createdAt: { $gte: startOfDay }
          });

          if (!existsInsp) {
            await Notification.create({
              recipientUserId: userId,
              recipientRole: 'contractor',
              title: '🔔 Inspection Reminder',
              message: `Daily inspection for ${park.name} is due today.`,
              type: 'Inspection Reminder',
              category: 'Inspection',
              priority: 'NORMAL',
              relatedEntityType: 'PARK',
              relatedEntityId: park._id.toString(),
              actionRoute: '/contractor/tasks'
            });
          }
        }
      }

      // If contractor still has 0 notifications, add sample maintenance alerts & inspection reminders
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
        await Notification.insertMany(contractorSamples);
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
        const userComplaints = await Complaint.find(complaintQuery).sort({ createdAt: -1 });

        for (const complaint of userComplaints) {
          const complaintIdStr = complaint._id.toString();
          const isResolved = resolvedStatuses.includes(complaint.status);
          const isInProgress = complaint.status === 'In Progress' || complaint.status === 'in-progress';
          const isAssigned = complaint.status === 'Assigned';

          // A. Initial Submission
          const existsSubmit = await Notification.findOne({
            recipientUserId: { $in: [...new Set(citizenIds)] },
            type: 'Complaint Submitted',
            relatedEntityId: complaintIdStr
          });

          if (!existsSubmit) {
            await Notification.create({
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
          if (isInProgress || isResolved) {
            const existsInProgress = await Notification.findOne({
              recipientUserId: { $in: [...new Set(citizenIds)] },
              message: /In Progress/i,
              relatedEntityId: complaintIdStr
            });

            if (!existsInProgress) {
              await Notification.create({
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
          }

          // C. Resolved Status Update
          if (isResolved) {
            const existsResolved = await Notification.findOne({
              recipientUserId: { $in: [...new Set(citizenIds)] },
              type: 'Complaint Resolved',
              relatedEntityId: complaintIdStr
            });

            if (!existsResolved) {
              await Notification.create({
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
        }
      }

      // B. Event registrations & payments auto-sync
      const regQuery = { $or: [] };
      if (isObjectId) regQuery.$or.push({ userId: userId });
      if (citizenEmail) regQuery.$or.push({ email: new RegExp(`^${citizenEmail.trim()}$`, 'i') });
      if (citizenPhone) regQuery.$or.push({ phone: citizenPhone });

      if (regQuery.$or.length > 0) {
        const userRegs = await EventRegistration.find(regQuery).populate('event').sort({ createdAt: -1 });

        for (const reg of userRegs) {
          const eventTitle = reg.event?.title || reg.eventSnapshot?.title || 'Event';
          const parkName = reg.event?.parkName || reg.event?.location || reg.eventSnapshot?.parkName || 'Park';
          const regIdStr = reg.registrationId || `REG-2026-${reg._id.toString().slice(-5).toUpperCase()}`;

          // Event Registration Confirmed notification
          const existsRegNotif = await Notification.findOne({
            recipientUserId: userId,
            type: 'Event Registration Confirmed',
            relatedEntityId: reg._id.toString()
          });

          if (!existsRegNotif) {
            await Notification.create({
              recipientUserId: userId,
              recipientRole: 'citizen',
              title: 'Event Registration Confirmed 🎟️',
              message: `Your registration for "${eventTitle}" at ${parkName} has been confirmed successfully. Registration ID: ${regIdStr}`,
              type: 'Event Registration Confirmed',
              category: 'Event',
              priority: 'NORMAL',
              relatedEntityType: 'EVENT',
              relatedEntityId: reg._id.toString(),
              actionRoute: '/my-registrations',
              createdAt: reg.createdAt || new Date()
            });
          }

          // Payment Successful notification if paid
          if (reg.totalAmount > 0 && reg.paymentStatus === 'Successful') {
            const existsPayNotif = await Notification.findOne({
              recipientUserId: userId,
              type: 'Payment Successful',
              relatedEntityId: reg._id.toString()
            });

            if (!existsPayNotif) {
              await Notification.create({
                recipientUserId: userId,
                recipientRole: 'citizen',
                title: 'Payment Successful 💳',
                message: `Your payment of ₹${reg.totalAmount} for the ${eventTitle} event was successful. Transaction ID: ${reg.razorpayPaymentId || 'TXN-' + regIdStr}`,
                type: 'Payment Successful',
                category: 'Payment',
                priority: 'NORMAL',
                relatedEntityType: 'PAYMENT',
                relatedEntityId: reg._id.toString(),
                actionRoute: '/my-registrations',
                createdAt: reg.paymentDate || reg.createdAt || new Date()
              });
            }
          }
        }
      }

      // If no notifications exist yet for citizen, ensure essential park broadcasts exist
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
        await Notification.insertMany(publicBroadcasts);
      }
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(100);

    // Normalize category & actionRoute for any legacy database records
    for (const notif of notifications) {
      const titleLower = (notif.title || '').toLowerCase();
      if (
        titleLower.includes('event') ||
        titleLower.includes('registration confirmed')
      ) {
        if (notif.category !== 'Event' || notif.actionRoute !== '/my-registrations') {
          notif.category = 'Event';
          notif.actionRoute = '/my-registrations';
          await notif.save().catch(() => {});
        }
      } else if (titleLower.includes('payment')) {
        if (notif.category !== 'Payment' || notif.actionRoute !== '/my-registrations') {
          notif.category = 'Payment';
          notif.actionRoute = '/my-registrations';
          await notif.save().catch(() => {});
        }
      }
    }

    const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

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
