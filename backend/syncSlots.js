const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const StallSlot = require('./models/StallSlot');
const StallBooking = require('./models/StallBooking');

async function syncAllSlots() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const slots = await StallSlot.find();
  for (const slot of slots) {
    const activeBookingsCount = await StallBooking.countDocuments({
      slot: slot._id,
      status: { $in: ['Pending Approval', 'Pending Payment', 'Confirmed', 'Approved'] }
    });

    const total = slot.totalSlots || 1;
    const remaining = Math.max(0, total - activeBookingsCount);
    slot.availableSlots = remaining;
    slot.isAvailable = remaining > 0;
    await slot.save();

    console.log(`Slot ${slot._id} (${slot.location}): total=${total}, activeBookings=${activeBookingsCount} => availableSlots=${remaining}, isAvailable=${slot.isAvailable}`);
  }

  console.log('Slot synchronization complete.');
  process.exit(0);
}

syncAllSlots();
