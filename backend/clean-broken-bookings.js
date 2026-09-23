const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const StallBooking = require('./models/StallBooking');
const StallSlot = require('./models/StallSlot');

async function cleanAndReset() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const allBookings = await StallBooking.find({});
  console.log('Total stall bookings before cleanup:', allBookings.length);

  // Delete all old corrupted stall bookings where files were not saved physically
  const invalidIds = [
    '6ab36edef28693eccbdaa533',
    '6ab36b8458fbd5b198ab1f65',
    '6ab367e758fbd5b198ab1f64',
    '6ab36653e9144461e2dd3189'
  ];
  const res = await StallBooking.deleteMany({ _id: { $in: invalidIds } });
  console.log('Deleted legacy broken bookings count:', res.deletedCount);

  // Ensure all slots are available for fresh booking
  await StallSlot.updateMany({}, { $set: { isAvailable: true } });
  console.log('Reset stall slots to isAvailable: true');

  const remaining = await StallBooking.find({});
  console.log('Remaining stall bookings in DB:', remaining.length);

  process.exit(0);
}

cleanAndReset().catch(e => {
  console.error('Error during cleanup:', e);
  process.exit(1);
});
