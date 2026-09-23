const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function cleanNotifications() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Notification = require('../models/Notification');
    const filter = {
      $or: [
        { title: { $regex: 'Stall Booking Rejected', $options: 'i' } },
        { message: { $regex: 'stall booking.*rejected', $options: 'i' } },
        { title: { $regex: 'Stall Application Rejected', $options: 'i' } }
      ]
    };
    const count = await Notification.countDocuments(filter);
    console.log(`Found ${count} rejected stall registration notifications.`);
    const result = await Notification.deleteMany(filter);
    console.log(`Deleted ${result.deletedCount} notifications.`);
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning notifications:', err);
    process.exit(1);
  }
}

cleanNotifications();
