const Notification = require('../models/Notification');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const EventRegistration = require('../models/EventRegistration');

// Get notifications for a user based on their ID and Role
const getNotifications = async (req, res) => {
  try {
    const { userId, role, phone } = req.query;

    if (!userId || !role) {
      return res.status(400).json({ message: 'User ID and Role are required' });
    }

    const isOfficial = ['official', 'government_official', 'Government Official'].includes(role);

    // Match any notification explicitly sent to this user ID, plus role-based broadcasts
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
            title: `New inspection assigned for ${complaint.parkName || 'Park'} (${complaint.complaintNumber || 'Ticket'}).`,
            message: `You have been assigned to inspect ${complaint.category || 'maintenance'} work at ${complaint.parkName || 'the park'}. Ticket #${complaint.complaintNumber || 'N/A'}.`,
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
      const officialNotifCount = await Notification.countDocuments({
        $or: [
          { recipientUserId: userId },
          { recipientUserId: userId, recipientRole: 'official' },
          { recipientUserId: userId, recipientRole: 'Government Official' }
        ]
      });

      if (officialNotifCount === 0) {
        const sampleNotifs = [
          {
            recipientUserId: userId,
            recipientRole: 'official',
            title: 'SLA Breached',
            message: 'Complaint CMP-2026-0012 has exceeded its SLA deadline and requires immediate attention.',
            category: 'SLA',
            type: 'SLA Breached',
            priority: 'Urgent',
            isRead: false,
            actionRoute: '/gov-dashboard/complaints',
            createdAt: new Date(Date.now() - 30 * 60 * 1000)
          },
          {
            recipientUserId: userId,
            recipientRole: 'official',
            title: 'Work Completed – Verification Required',
            message: 'The contractor has submitted completion proof for the assigned maintenance task at J.P. Nagar 5th Stage Park.',
            category: 'Contractor Work',
            type: 'Contractor Work',
            priority: 'Important',
            isRead: false,
            actionRoute: '/gov-dashboard/verify-work',
            createdAt: new Date(Date.now() - 2 * 3600 * 1000)
          },
          {
            recipientUserId: userId,
            recipientRole: 'official',
            title: 'Maruthi Layout Park Temporary Closure',
            message: 'Maruthi Layout Park will remain closed temporarily due to scheduled maintenance work.',
            category: 'Park Announcement',
            type: 'Park Announcement',
            priority: 'Important',
            isRead: false,
            actionRoute: '/announcements',
            createdAt: new Date(Date.now() - 5 * 3600 * 1000)
          },
          {
            recipientUserId: userId,
            recipientRole: 'official',
            title: 'Complaint Requires Review',
            message: 'A citizen complaint regarding damaged playground equipment requires your review.',
            category: 'Complaint',
            type: 'Complaint',
            priority: 'Important',
            isRead: false,
            actionRoute: '/gov-dashboard/complaints',
            createdAt: new Date(Date.now() - 12 * 3600 * 1000)
          },
          {
            recipientUserId: userId,
            recipientRole: 'official',
            title: 'Park Inspection Due',
            message: 'The scheduled inspection for J.P. Nagar 5th Stage Park is due today.',
            category: 'Park Monitoring',
            type: 'Park Monitoring',
            priority: 'Normal',
            isRead: true,
            actionRoute: '/gov-dashboard/parks',
            createdAt: new Date(Date.now() - 24 * 3600 * 1000)
          },
          {
            recipientUserId: userId,
            recipientRole: 'official',
            title: 'Inspection Assigned',
            message: 'A new park inspection has been assigned to you for J.P. Nagar 5th Stage Park.',
            category: 'Inspection',
            type: 'Inspection',
            priority: 'Normal',
            isRead: true,
            actionRoute: '/gov-dashboard/my-inspections',
            createdAt: new Date(Date.now() - 36 * 3600 * 1000)
          },
          {
            recipientUserId: userId,
            recipientRole: 'official',
            title: 'Rework Request Submitted',
            message: 'A maintenance task requires rework verification after the contractor resubmitted the completion report.',
            category: 'Contractor Work',
            type: 'Contractor Work',
            priority: 'Important',
            isRead: true,
            actionRoute: '/gov-dashboard/verify-work',
            createdAt: new Date(Date.now() - 48 * 3600 * 1000)
          },
          {
            recipientUserId: userId,
            recipientRole: 'official',
            title: 'SLA Deadline Approaching',
            message: 'The SLA deadline for complaint CMP-2026-0012 is approaching. Please review the complaint status.',
            category: 'SLA',
            type: 'SLA',
            priority: 'Important',
            isRead: true,
            actionRoute: '/gov-dashboard/complaints',
            createdAt: new Date(Date.now() - 60 * 3600 * 1000)
          },
          {
            recipientUserId: userId,
            recipientRole: 'official',
            title: 'Inspection Report Submitted',
            message: 'A new inspection report has been submitted and is ready for verification.',
            category: 'Report',
            type: 'Report',
            priority: 'Normal',
            isRead: true,
            actionRoute: '/gov-dashboard/analytics',
            createdAt: new Date(Date.now() - 72 * 3600 * 1000)
          },
          {
            recipientUserId: userId,
            recipientRole: 'official',
            title: 'New Event Scheduled',
            message: 'A new public event has been scheduled at an assigned park.',
            category: 'Event',
            type: 'Event',
            priority: 'Normal',
            isRead: true,
            actionRoute: '/events',
            createdAt: new Date(Date.now() - 84 * 3600 * 1000)
          }
        ];

        await Notification.insertMany(sampleNotifs);
      }
    }

    // ── 2. For citizens: auto-sync complaints & event registrations with distinct IDs ──
    if (role === 'citizen') {
      const citizenUser = await User.findById(userId).lean();
      const citizenPhone = (phone && phone !== 'undefined') ? phone : (citizenUser && citizenUser.phone);
      const citizenName = citizenUser ? citizenUser.name : '';
      const citizenEmail = citizenUser ? citizenUser.email : '';

      // A. Complaints auto-sync
      const resolvedStatuses = ['Closed', 'Verified', 'Inspection Approved', 'Resolved'];
      const complaintQuery = { $or: [] };
      if (citizenPhone) complaintQuery.$or.push({ userPhone: citizenPhone });
      if (citizenName) complaintQuery.$or.push({ userName: new RegExp(`^${citizenName.trim()}$`, 'i') });
      complaintQuery.$or.push({ user: userId });

      if (complaintQuery.$or.length > 0) {
        const userComplaints = await Complaint.find(complaintQuery).sort({ createdAt: -1 });

        for (const complaint of userComplaints) {
          const isResolved = resolvedStatuses.includes(complaint.status);
          const notifType = isResolved ? 'Complaint Resolved' : 'Complaint Submitted';
          const notifTitle = isResolved ? 'Complaint Resolved ✅' : 'Complaint Submitted 📝';

          const exists = await Notification.findOne({
            recipientUserId: userId,
            type: notifType,
            relatedEntityId: complaint._id.toString()
          });

          if (!exists) {
            await Notification.create({
              recipientUserId: userId,
              recipientRole: 'citizen',
              title: notifTitle,
              message: isResolved
                ? `Your reported ${(complaint.category || 'maintenance').toLowerCase()} issue at ${complaint.parkName || 'the park'} has been fixed. Ticket #${complaint.complaintNumber || 'N/A'}.`
                : `Your complaint for ${(complaint.category || 'park maintenance').toLowerCase()} at ${complaint.parkName || 'the park'} was submitted. Ticket #${complaint.complaintNumber || 'N/A'}.`,
              type: notifType,
              category: 'Complaint',
              priority: 'NORMAL',
              relatedEntityType: 'COMPLAINT',
              relatedEntityId: complaint._id.toString(),
              actionRoute: '/track-complaint',
              createdAt: complaint.updatedAt || complaint.createdAt || new Date()
            });
          } else if (isResolved && exists.message && !exists.message.includes('#')) {
            // Upgrade existing notification message to include unique ticket number & park name
            exists.message = `Your reported ${(complaint.category || 'maintenance').toLowerCase()} issue at ${complaint.parkName || 'the park'} has been fixed. Ticket #${complaint.complaintNumber || 'N/A'}.`;
            exists.category = 'Complaint';
            exists.actionRoute = '/track-complaint';
            await exists.save();
          }
        }
      }

      // B. Event registrations & payments auto-sync
      const regQuery = { $or: [] };
      if (userId) regQuery.$or.push({ userId: userId });
      if (citizenEmail) regQuery.$or.push({ email: new RegExp(`^${citizenEmail.trim()}$`, 'i') });

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
