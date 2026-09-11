const Announcement = require('../models/Announcement');
const { dispatchNotifications } = require('../controllers/announcementController');

const checkAnnouncementsStatus = async () => {
  try {
    const now = new Date();
    
    // Find scheduled announcements where startDate <= now and hasn't been notified yet
    const pendingAnnouncements = await Announcement.find({
      status: 'Scheduled',
      startDate: { $lte: now },
      notified: false,
      isActive: true
    });

    for (const announcement of pendingAnnouncements) {
      // It's time to activate it
      announcement.status = 'Active';
      announcement.notified = true;
      await announcement.save();

      // Dispatch notifications
      await dispatchNotifications(announcement);
      console.log(`Cron: Activated scheduled announcement: ${announcement.title}`);
    }

    // Also auto-expire any active announcements that have passed their endDate
    const expiredAnnouncements = await Announcement.find({
      status: 'Active',
      endDate: { $lte: now, $ne: null }
    });

    for (const announcement of expiredAnnouncements) {
      announcement.status = 'Expired';
      await announcement.save();
      console.log(`Cron: Expired announcement: ${announcement.title}`);
    }

  } catch (err) {
    console.error('Error running Announcement check cron job:', err);
  }
};

const initAnnouncementCron = () => {
  // Check every 5 minutes
  setInterval(checkAnnouncementsStatus, 5 * 60 * 1000);
  
  // Run once immediately on startup
  setTimeout(checkAnnouncementsStatus, 10000); // Wait 10 seconds after startup to ensure DB connection
  
  console.log('Announcement Cron Job Initialized');
};

module.exports = { initAnnouncementCron };
