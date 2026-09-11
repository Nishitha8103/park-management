const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');

const checkSlaStatus = async () => {
  try {
    const now = new Date();
    
    // Find complaints that are not resolved and have an SLA deadline
    const activeComplaints = await Complaint.find({
      slaDeadline: { $exists: true, $ne: null },
      status: { $nin: ['Closed', 'Completed - Waiting for Admin Review', 'Inspection Pending', 'Inspection Approved', 'Returned by Admin'] }
    });

    for (const complaint of activeComplaints) {
      let shouldSave = false;
      let newSlaStatus = complaint.slaStatus || 'On Time';
      
      const timeRemainingMs = complaint.slaDeadline.getTime() - now.getTime();
      const hoursRemaining = timeRemainingMs / (1000 * 60 * 60);

      if (timeRemainingMs < 0 && complaint.slaStatus !== 'Overdue') {
        newSlaStatus = 'Overdue';
        shouldSave = true;

        // Notify Contractor
        if (complaint.assignedContractor) {
          await Notification.create({
            recipientUserId: complaint.assignedContractor.toString(),
            recipientRole: 'contractor',
            title: '🚨 SLA Breached',
            message: `Complaint #${complaint.complaintNumber} (${complaint.parkName}) is overdue! The resolution deadline has been exceeded.`,
            type: 'SLA Alert',
            category: 'SLA',
            priority: 'URGENT',
            relatedEntityType: 'TASK',
            relatedEntityId: complaint._id
          });
        }
        
        // Notify Admin
        await Notification.create({
          recipientUserId: 'ADMIN_ALL',
          recipientRole: 'admin',
          title: '🚨 Escalation: SLA Breached',
          message: `Complaint #${complaint.complaintNumber} assigned to a contractor is now overdue.`,
          type: 'Escalation',
          category: 'SLA',
          priority: 'URGENT',
          relatedEntityType: 'COMPLAINT',
          relatedEntityId: complaint._id
        });

      } else if (timeRemainingMs > 0 && hoursRemaining <= 24 && complaint.slaStatus !== 'Due Soon' && complaint.slaStatus !== 'Overdue') {
        newSlaStatus = 'Due Soon';
        shouldSave = true;

        // Notify Contractor
        if (complaint.assignedContractor) {
          await Notification.create({
            recipientUserId: complaint.assignedContractor.toString(),
            recipientRole: 'contractor',
            title: '⚠️ SLA Reminder',
            message: `Complaint #${complaint.complaintNumber} (${complaint.parkName}) is due within 24 hours.`,
            type: 'SLA Alert',
            category: 'SLA',
            priority: 'HIGH',
            relatedEntityType: 'TASK',
            relatedEntityId: complaint._id
          });
        }
      }

      if (shouldSave) {
        complaint.slaStatus = newSlaStatus;
        await complaint.save();
      }
    }
  } catch (err) {
    console.error('Error running SLA check cron job:', err);
  }
};

const initSlaCron = () => {
  // Check every hour (3600000 ms) or you can set it lower for testing
  setInterval(checkSlaStatus, 1000 * 60 * 60);
  
  // Run it once immediately on startup
  setTimeout(checkSlaStatus, 5000);
  
  console.log('SLA Cron Job Initialized');
};

module.exports = { initSlaCron };
