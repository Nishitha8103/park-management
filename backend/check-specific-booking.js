const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const StallBooking = require('./models/StallBooking');

async function debugBooking() {
  await mongoose.connect(process.env.MONGO_URI);
  const bookings = await StallBooking.find().sort({ createdAt: -1 }).limit(5);
  console.log('--- Last 5 Stall Bookings ---');
  bookings.forEach(b => {
    console.log({
      id: b._id,
      applicantName: b.applicantName,
      photoUrl: b.photoUrl,
      documentUrl: b.documentUrl,
      createdAt: b.createdAt
    });
  });

  const uploadParksDir = path.join(__dirname, 'uploads/parks');
  const filesOnDisk = fs.readdirSync(uploadParksDir);
  console.log('--- Files in uploads/parks ---');
  console.log('Total files:', filesOnDisk.length);
  const matched = filesOnDisk.filter(f => f.includes('1790151852878'));
  console.log('Matched files for 1790151852878:', matched);

  process.exit(0);
}

debugBooking().catch(e => {
  console.error(e);
  process.exit(1);
});
