const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');
const Notification = require('./models/Notification');

async function runFastCleanup() {
  await connectDB();
  console.log('MongoDB Connected. Running Fast Cleanup...');

  const totalBefore = await Notification.countDocuments();
  console.log(`Total before: ${totalBefore}`);

  // Find all duplicates
  const duplicates = await Notification.aggregate([
    {
      $group: {
        _id: {
          recipientUserId: '$recipientUserId',
          title: '$title',
          message: '$message'
        },
        uniqueIds: { $addToSet: '$_id' }
      }
    }
  ]);

  const allIdsToDelete = [];
  for (const group of duplicates) {
    if (group.uniqueIds && group.uniqueIds.length > 1) {
      allIdsToDelete.push(...group.uniqueIds.slice(1));
    }
  }

  console.log(`Deleting ${allIdsToDelete.length} duplicate notification records in one batch...`);
  if (allIdsToDelete.length > 0) {
    const result = await Notification.deleteMany({ _id: { $in: allIdsToDelete } });
    console.log(`Deleted count: ${result.deletedCount}`);
  }

  const totalAfter = await Notification.countDocuments();
  console.log(`Total after cleanup: ${totalAfter}`);

  // Auto mark all read if there are unread spam
  await Notification.updateMany({ isRead: false }, { $set: { isRead: true } });
  console.log('Marked remaining old notifications as read.');

  process.exit(0);
}

runFastCleanup().catch(e => {
  console.error(e);
  process.exit(1);
});
