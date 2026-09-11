require('dotenv').config();
const mongoose = require('mongoose');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const Park = require('./models/Park');
const Corporation = require('./models/Corporation');

async function checkByZone() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/park_management');
  
  const zones = await Zone.find().populate('corporationId').lean();
  for (const zone of zones) {
    const wards = await Ward.find({ zoneId: zone._id }).lean();
    let total = 0;
    for (const ward of wards) {
      const count = await Park.countDocuments({ ward: ward._id });
      total += count;
    }
    console.log(`${zone.corporationId?.name} > ${zone.name}: ${total} parks across ${wards.length} wards`);
  }
  
  process.exit(0);
}
checkByZone();
