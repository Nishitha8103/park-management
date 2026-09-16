const Park = require('../models/Park');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Inspection Reminder Engine:
 * 1. Checks all parks with assigned Government Officials & Contractors
 * 2. Checks complaints marked for 'Inspection Pending' or with upcoming inspection dates
 * 3. Sends daily & scheduled inspection reminders to ensure inspections aren't missed
 */
const checkInspectionReminders = async () => {
  try {
    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];

    // 1. Check parks with assigned Government Officials & Contractors for daily/routine inspection
    const parks = await Park.find({ status: { $ne: 'Closed' } })
      .populate('governmentOfficial')
      .populate('contractor')
      .lean();

    for (const park of parks) {
      const parkName = park.name || 'Park';

      // Reminder for Government Official
      if (park.governmentOfficial) {
        const officialId = park.governmentOfficial._id ? park.governmentOfficial._id.toString() : park.governmentOfficial.toString();
        
        // Prevent sending duplicate daily reminder on the same calendar day
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const existingDailyNotif = await Notification.findOne({
          recipientUserId: officialId,
          type: 'Inspection Reminder',
          relatedEntityType: 'PARK',
          relatedEntityId: park._id.toString(),
          createdAt: { $gte: startOfDay }
        });

        if (!existingDailyNotif) {
          await Notification.create({
            recipientUserId: officialId,
            recipientRole: 'official',
            title: '🔔 Inspection Reminder',
            message: `Daily inspection for ${parkName} is due today.`,
            type: 'Inspection Reminder',
            category: 'Inspection',
            priority: 'NORMAL',
            relatedEntityType: 'PARK',
            relatedEntityId: park._id.toString(),
            actionRoute: `/gov-dashboard/inspections/new?parkId=${park._id}`
          });
        }
      }

      // Reminder for Contractor (assigned to park)
      if (park.contractor) {
        const contractorId = park.contractor._id ? park.contractor._id.toString() : park.contractor.toString();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const existingContractorNotif = await Notification.findOne({
          recipientUserId: contractorId,
          type: 'Inspection Reminder',
          relatedEntityType: 'PARK',
          relatedEntityId: park._id.toString(),
          createdAt: { $gte: startOfDay }
        });

        if (!existingContractorNotif) {
          await Notification.create({
            recipientUserId: contractorId,
            recipientRole: 'contractor',
            title: '🔔 Inspection Reminder',
            message: `Daily inspection for ${parkName} is due today.`,
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

    // 2. Check complaints with pending verification/inspection
    const pendingInspectionComplaints = await Complaint.find({
      status: { $in: ['Inspection Pending', 'Completed - Waiting for Admin Review'] }
    }).lean();

    for (const complaint of pendingInspectionComplaints) {
      if (complaint.assignedOfficial) {
        const officialId = complaint.assignedOfficial.toString();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const existingComplaintInspNotif = await Notification.findOne({
          recipientUserId: officialId,
          type: 'Inspection Reminder',
          relatedEntityType: 'COMPLAINT',
          relatedEntityId: complaint._id.toString(),
          createdAt: { $gte: startOfDay }
        });

        if (!existingComplaintInspNotif) {
          await Notification.create({
            recipientUserId: officialId,
            recipientRole: 'official',
            title: '🔔 Inspection Reminder',
            message: `Verification inspection for ${complaint.parkName || 'Park'} (Ticket #${complaint.complaintNumber}) is due today.`,
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
  } catch (err) {
    console.error('Error running Inspection Reminder cron job:', err);
  }
};

const initInspectionCron = () => {
  // Check every 2 hours
  setInterval(checkInspectionReminders, 2 * 60 * 60 * 1000);

  // Run once on startup after 8 seconds
  setTimeout(checkInspectionReminders, 8000);

  console.log('Inspection Reminder Cron Job Initialized');
};

module.exports = { initInspectionCron, checkInspectionReminders };
