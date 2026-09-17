const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');
const Notification = require('./models/Notification');

async function cleanupDuplicateNotifications() {
  await connectDB();
  console.log('Connected to MongoDB. Starting notification deduplication cleanup...');

  const totalBefore = await Notification.countDocuments();
  console.log(`Total notifications in database before cleanup: ${totalBefore}`);

  // Find duplicates based on recipientUserId, message, and title
  const duplicates = await Notification.aggregate([
    {
      $group: {
        _id: {
          recipientUserId: '$recipientUserId',
          title: '$title',
          message: '$message'
        },
        uniqueIds: { $addToSet: '$_id' },
        count: { $sum: 1 }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    }
  ]);

  console.log(`Found ${duplicates.length} duplicate notification groups.`);

  let removedCount = 0;
  for (const group of duplicates) {
    const idsToDelete = group.uniqueIds.slice(1);
    if (idsToDelete.length > 0) {
      await Notification.deleteMany({ _id: { $in: idsToDelete } });
      removedCount += idsToDelete.length;
    }
  }

  const totalAfter = await Notification.countDocuments();
  console.log(`Cleanup complete! Removed ${removedCount} duplicates. Total notifications remaining: ${totalAfter}`);

  process.exit(0);
}

cleanupDuplicateNotifications().catch((err) => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
