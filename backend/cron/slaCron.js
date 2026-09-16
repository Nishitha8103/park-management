const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');

const checkSlaStatus = async () => {
  try {
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    // Find active complaints that have an SLA deadline and are not yet resolved
    const activeComplaints = await Complaint.find({
      slaDeadline: { $exists: true, $ne: null },
      status: { $nin: ['Closed', 'Completed - Waiting for Admin Review', 'Inspection Pending', 'Inspection Approved', 'Resolved'] }
    });

    for (const complaint of activeComplaints) {
      let shouldSave = false;
      let newSlaStatus = complaint.slaStatus || 'On Time';
      
      const deadline = new Date(complaint.slaDeadline);
      const timeRemainingMs = deadline.getTime() - now.getTime();
      const hoursRemaining = timeRemainingMs / (1000 * 60 * 60);

      // 1. OVERDUE (Due date passed)
      if (timeRemainingMs < 0) {
        if (complaint.slaStatus !== 'Overdue') {
          newSlaStatus = 'Overdue';
          shouldSave = true;

          // Notify Contractor -> Task Overdue
          if (complaint.assignedContractor) {
            await Notification.create({
              recipientUserId: complaint.assignedContractor.toString(),
              recipientRole: 'contractor',
              title: '🚨 Task Overdue',
              message: `Complaint #${complaint.complaintNumber} (${complaint.parkName || 'Park'}) is overdue! The target resolution date has passed.`,
              type: 'Task Overdue',
              category: 'SLA',
              priority: 'URGENT',
              relatedEntityType: 'TASK',
              relatedEntityId: complaint._id.toString(),
              actionRoute: `/contractor/tasks`
            });
          }

          // Notify Official if assigned
          if (complaint.assignedOfficial) {
            await Notification.create({
              recipientUserId: complaint.assignedOfficial.toString(),
              recipientRole: 'official',
              title: '🚨 Task Overdue',
              message: `Maintenance task #${complaint.complaintNumber} (${complaint.parkName || 'Park'}) is overdue and requires attention.`,
              type: 'Task Overdue',
              category: 'SLA',
              priority: 'URGENT',
              relatedEntityType: 'COMPLAINT',
              relatedEntityId: complaint._id.toString(),
              actionRoute: `/gov-dashboard/complaints`
            });
          }
          
          // Notify Admin
          await Notification.create({
            recipientUserId: 'ADMIN_ALL',
            recipientRole: 'admin',
            title: '🚨 Task Overdue - SLA Breached',
            message: `Complaint #${complaint.complaintNumber} (${complaint.parkName || 'Park'}) assigned to contractor is overdue.`,
            type: 'Escalation',
            category: 'SLA',
            priority: 'URGENT',
            relatedEntityType: 'COMPLAINT',
            relatedEntityId: complaint._id.toString()
          });
        }
      } 
      // 2. DUE TODAY (Deadline is today)
      else if (deadline >= startOfToday && deadline <= endOfToday) {
        if (complaint.slaStatus !== 'Due Today' && complaint.slaStatus !== 'Overdue') {
          newSlaStatus = 'Due Today';
          shouldSave = true;

          // Check if already notified today
          const existingNotif = await Notification.findOne({
            type: 'Task Due Today',
            relatedEntityId: complaint._id.toString(),
            createdAt: { $gte: startOfToday }
          });

          if (!existingNotif) {
            // Notify Contractor -> Task Due Today
            if (complaint.assignedContractor) {
              await Notification.create({
                recipientUserId: complaint.assignedContractor.toString(),
                recipientRole: 'contractor',
                title: '⚠️ Task Due Today',
                message: `Maintenance task #${complaint.complaintNumber} for ${complaint.parkName || 'Park'} is due today.`,
                type: 'Task Due Today',
                category: 'SLA',
                priority: 'HIGH',
                relatedEntityType: 'TASK',
                relatedEntityId: complaint._id.toString(),
                actionRoute: `/contractor/tasks`
              });
            }

            // Notify Official if assigned
            if (complaint.assignedOfficial) {
              await Notification.create({
                recipientUserId: complaint.assignedOfficial.toString(),
                recipientRole: 'official',
                title: '⚠️ Task Due Today',
                message: `Task #${complaint.complaintNumber} at ${complaint.parkName || 'Park'} is scheduled for completion today.`,
                type: 'Task Due Today',
                category: 'SLA',
                priority: 'HIGH',
                relatedEntityType: 'COMPLAINT',
                relatedEntityId: complaint._id.toString(),
                actionRoute: `/gov-dashboard/complaints`
              });
            }
          }
        }
      } 
      // 3. DUE SOON (Approaching within 24-48 hours)
      else if (timeRemainingMs > 0 && hoursRemaining <= 48 && complaint.slaStatus !== 'Due Soon' && complaint.slaStatus !== 'Due Today' && complaint.slaStatus !== 'Overdue') {
        newSlaStatus = 'Due Soon';
        shouldSave = true;

        const existingNotif = await Notification.findOne({
          type: 'Task Due Soon',
          relatedEntityId: complaint._id.toString(),
          createdAt: { $gte: new Date(Date.now() - 24 * 3600 * 1000) }
        });

        if (!existingNotif) {
          // Notify Contractor -> Task Due Soon
          if (complaint.assignedContractor) {
            await Notification.create({
              recipientUserId: complaint.assignedContractor.toString(),
              recipientRole: 'contractor',
              title: '⏰ Task Due Soon',
              message: `Complaint #${complaint.complaintNumber} (${complaint.parkName || 'Park'}) deadline is approaching in ${Math.round(hoursRemaining)} hours.`,
              type: 'Task Due Soon',
              category: 'SLA',
              priority: 'HIGH',
              relatedEntityType: 'TASK',
              relatedEntityId: complaint._id.toString(),
              actionRoute: `/contractor/tasks`
            });
          }

          // Notify Official if assigned
          if (complaint.assignedOfficial) {
            await Notification.create({
              recipientUserId: complaint.assignedOfficial.toString(),
              recipientRole: 'official',
              title: '⏰ Task Due Soon',
              message: `Task #${complaint.complaintNumber} at ${complaint.parkName || 'Park'} is due soon (${Math.round(hoursRemaining)} hours remaining).`,
              type: 'Task Due Soon',
              category: 'SLA',
              priority: 'HIGH',
              relatedEntityType: 'COMPLAINT',
              relatedEntityId: complaint._id.toString(),
              actionRoute: `/gov-dashboard/complaints`
            });
          }
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
  // Check every 30 minutes
  setInterval(checkSlaStatus, 30 * 60 * 1000);
  
  // Run it once immediately on startup
  setTimeout(checkSlaStatus, 5000);
  
  console.log('SLA & Due Date Reminder Cron Job Initialized');
};

module.exports = { initSlaCron, checkSlaStatus };
