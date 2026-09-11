const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Contractor = require('../models/Contractor');
const Park = require('../models/Park');

// Helper function to update status based on dates
const getStatus = (ann) => {
  const now = new Date();
  if (ann.status === 'Draft') return 'Draft';
  if (ann.endDate && now > new Date(ann.endDate)) return 'Expired';
  if (ann.startDate && now < new Date(ann.startDate)) return 'Scheduled';
  return 'Active';
};

// Dispatch Notifications Logic
exports.dispatchNotifications = async (announcement) => {
  const notifications = [];
  const priority = announcement.priority === 'Urgent' ? 'URGENT' : (announcement.priority === 'Important' ? 'HIGH' : 'NORMAL');
  
  const baseNotification = {
    title: `📢 ${announcement.type} Announcement`,
    message: announcement.title,
    type: 'Announcement Created',
    category: 'Announcements',
    priority,
    relatedEntityType: 'ANNOUNCEMENT',
    relatedEntityId: announcement._id
  };

  try {
    if (announcement.targetType === 'ALL_CITIZENS') {
      notifications.push({ ...baseNotification, recipientUserId: 'CITIZEN_ALL', recipientRole: 'citizen' });
    } else if (announcement.targetType === 'ALL_CONTRACTORS') {
      notifications.push({ ...baseNotification, recipientUserId: 'CONTRACTOR_ALL', recipientRole: 'contractor' });
    } else if (announcement.targetType === 'ZONE') {
      // Users in zone
      const users = await User.find({ zone: announcement.targetId });
      users.forEach(u => notifications.push({ ...baseNotification, recipientUserId: u._id.toString(), recipientRole: 'citizen' }));
      // Contractors in zone
      const contractors = await Contractor.find({ zone: announcement.targetId });
      contractors.forEach(c => notifications.push({ ...baseNotification, recipientUserId: c._id.toString(), recipientRole: 'contractor' }));
    } else if (announcement.targetType === 'WARD') {
      // Users in ward
      const users = await User.find({ ward: announcement.targetId });
      users.forEach(u => notifications.push({ ...baseNotification, recipientUserId: u._id.toString(), recipientRole: 'citizen' }));
      // Contractors in ward
      const contractors = await Contractor.find({ ward: announcement.targetId });
      contractors.forEach(c => notifications.push({ ...baseNotification, recipientUserId: c._id.toString(), recipientRole: 'contractor' }));
    } else if (announcement.targetType === 'PARK') {
      const park = await Park.findById(announcement.targetId);
      if (park) {
        // Users in the same ward as the park (since users don't explicitly belong to a park)
        const users = await User.find({ ward: park.ward });
        users.forEach(u => notifications.push({ ...baseNotification, recipientUserId: u._id.toString(), recipientRole: 'citizen' }));
        // Contractors assigned to this park
        const contractors = await Contractor.find({ assignedParks: announcement.targetId });
        contractors.forEach(c => notifications.push({ ...baseNotification, recipientUserId: c._id.toString(), recipientRole: 'contractor' }));
      }
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error('Error dispatching notifications:', err);
  }
};


// Get all active announcements (for users / citizens)
exports.getAnnouncements = async (req, res) => {
  try {
    // We update statuses dynamically on fetch
    let announcements = await Announcement.find({ 
      status: { $in: ['Active', 'Scheduled'] }, // Might be scheduled but active time arrived
      isActive: true
    }).sort({ startDate: -1 });

    const now = new Date();
    announcements = announcements.filter(a => {
      const s = getStatus(a);
      if (s === 'Active') return true;
      return false;
    });

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements', error: error.message });
  }
};

// Get all announcements (for admin)
exports.getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().populate('targetId').sort({ date: -1, startDate: -1 });
    
    // Dynamically update status before sending
    const updated = announcements.map(a => {
      const currentStatus = getStatus(a);
      return { ...a.toObject(), status: currentStatus };
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all announcements', error: error.message });
  }
};

// Get active announcements for a specific park
exports.getParkAnnouncements = async (req, res) => {
  try {
    const { parkId } = req.params;
    let announcements = await Announcement.find({ 
      targetType: 'PARK', 
      targetId: parkId,
      isActive: true 
    }).sort({ startDate: -1 });

    const now = new Date();
    announcements = announcements.filter(a => getStatus(a) === 'Active');

    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching park announcements', error: error.message });
  }
};

// Create new announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, type, targetType, targetId, onModel, priority, startDate, endDate, status, isActive } = req.body;
    
    let initialStatus = status || 'Active';
    
    // Let's create the announcement
    const newAnnouncement = new Announcement({
      title,
      content,
      type: type || 'General',
      targetType: targetType || 'ALL_CITIZENS',
      targetId: targetId || null,
      onModel: onModel || 'Park',
      priority: priority || 'Normal',
      startDate: startDate || Date.now(),
      endDate: endDate || null,
      status: initialStatus,
      isActive: isActive !== undefined ? isActive : true
    });
    
    // Auto calculate status if not explicitly draft
    if (initialStatus !== 'Draft') {
      newAnnouncement.status = getStatus(newAnnouncement);
    }

    const saved = await newAnnouncement.save();

    // If it's instantly active, dispatch notifications immediately
    if (saved.status === 'Active' && saved.isActive) {
      await exports.dispatchNotifications(saved);
      saved.notified = true;
      await saved.save();
    }

    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error creating announcement', error: error.message });
  }
};

// Update announcement
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, targetType, targetId, priority, startDate, endDate, status, isActive } = req.body;
    
    const oldAnnouncement = await Announcement.findById(id);
    if (!oldAnnouncement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const updated = await Announcement.findByIdAndUpdate(
      id,
      { title, content, type, targetType, targetId, priority, startDate, endDate, status, isActive },
      { new: true }
    );
    
    if (updated.status !== 'Draft') {
       updated.status = getStatus(updated);
       await updated.save();
    }
    
    // Optional: Could dispatch notifications again if it was a draft becoming active.
    // We will let the user handle this manually or let the cron catch it if it becomes active later.

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating announcement', error: error.message });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Announcement.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting announcement', error: error.message });
  }
};
