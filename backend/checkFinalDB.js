const mongoose = require('mongoose');
const Park = require('./models/Park');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/park_monitoring');
  
  // Find any zones or wards with 'Unknown' in the name
  const unknownZones = await Zone.find({ name: /Unknown/i });
  const unknownWards = await Ward.find({ name: /Unknown/i });
  
  console.log('Unknown Zones:', unknownZones.map(z => z.name));
  console.log('Unknown Wards:', unknownWards.map(w => w.name));

  // Find parks with those zones or wards
  const unknownZoneIds = unknownZones.map(z => z._id);
  const unknownWardIds = unknownWards.map(w => w._id);

  const parksWithUnknown = await Park.find({
    $or: [
      { zone: { $in: unknownZoneIds } },
      { ward: { $in: unknownWardIds } }
    ]
  }).populate('zone').populate('ward').limit(5);

  console.log(`Found ${parksWithUnknown.length} parks with Unknown in DB`);
  
  parksWithUnknown.forEach(p => {
    console.log(`Park: ${p.name}`);
    console.log(` - Zone: ${p.zone ? p.zone.name : 'null'}`);
    console.log(` - Ward: ${p.ward ? p.ward.name : 'null'}`);
  });

  process.exit();
}
check();
