const mongoose = require('mongoose');
const Park = require('./models/Park');
const Zone = require('./models/Zone');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/park_monitoring');
  
  const unknownZone = await Zone.findOne({ name: 'Unknown Zone' });
  if (!unknownZone) {
    console.log('No Unknown Zone found');
  } else {
    const count = await Park.countDocuments({ zone: unknownZone._id });
    console.log('Parks with Unknown Zone:', count);
  }

  const totalParks = await Park.countDocuments();
  console.log('Total Parks:', totalParks);
  
  process.exit();
}
check();
