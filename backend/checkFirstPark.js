const mongoose = require('mongoose');
const Park = require('./models/Park');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/park_monitoring');
  
  const park = await Park.findOne().populate('zone').populate('ward');
  console.log('Park Name:', park.name);
  console.log('Zone:', park.zone ? park.zone.name : 'null');
  console.log('Ward:', park.ward ? park.ward.name : 'null');

  const zoneCount = await Zone.countDocuments();
  const wardCount = await Ward.countDocuments();
  console.log('Total Zones in DB:', zoneCount);
  console.log('Total Wards in DB:', wardCount);
  
  process.exit();
}
check();
