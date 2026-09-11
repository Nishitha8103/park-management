require('dotenv').config();
const mongoose = require('mongoose');
const Zone = require('./models/Zone');
const Corporation = require('./models/Corporation');

async function listZones() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/park_management');
  const zones = await Zone.find().populate('corporationId');
  for (const z of zones) {
    console.log(`Zone: ${z.name}, Corporation: ${z.corporationId ? z.corporationId.name : 'Unknown'}`);
  }
  process.exit(0);
}
listZones();
