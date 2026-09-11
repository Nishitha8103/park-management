require('dotenv').config();
const mongoose = require('mongoose');
const StallBooking = require('./models/StallBooking');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const bookings = await StallBooking.find({});
  let fixed = 0;
  for (let booking of bookings) {
    if (booking.documentUrl && booking.documentUrl.includes('/uploads/documents/')) {
      booking.documentUrl = booking.documentUrl.replace('/uploads/documents/', '/uploads/parks/');
      await booking.save();
      fixed++;
    }
  }
  console.log('Fixed', fixed, 'bookings');
  process.exit(0);
}).catch(console.error);
