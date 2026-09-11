require('dotenv').config();
const mongoose = require('mongoose');
const Park = require('./models/Park');

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/park_management');
  const parks = await Park.find().populate('district').populate('corporation').populate('zone').populate('ward').lean();
  console.log(`Total parks: ${parks.length}`);
  const missingZone = parks.filter(p => !p.zone);
  console.log(`Parks missing zone: ${missingZone.length}`);
  const missingWard = parks.filter(p => !p.ward);
  console.log(`Parks missing ward: ${missingWard.length}`);
  process.exit(0);
}
test();
