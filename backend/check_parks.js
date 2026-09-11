require('dotenv').config();
const mongoose = require('mongoose');
const District = require('./models/District');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const Park = require('./models/Park');

async function checkParks() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/park_management');
  
  const totalParks = await Park.countDocuments();
  console.log(`Total parks: ${totalParks}`);

  // Count parks per corporation
  const corps = await Corporation.find().lean();
  for (const corp of corps) {
    const zones = await Zone.find({ corporationId: corp._id }).lean();
    let corpParkCount = 0;
    for (const zone of zones) {
      const wards = await Ward.find({ zoneId: zone._id }).lean();
      for (const ward of wards) {
        const count = await Park.countDocuments({ ward: ward._id });
        corpParkCount += count;
      }
    }
    console.log(`${corp.name}: ${corpParkCount} parks across ${zones.length} zones`);
  }

  // Parks with null zone or null ward
  const nullZone = await Park.countDocuments({ zone: null });
  const nullWard = await Park.countDocuments({ ward: null });
  console.log(`\nParks with null zone: ${nullZone}`);
  console.log(`Parks with null ward: ${nullWard}`);

  // Parks whose zone document no longer exists (orphaned)
  const allParks = await Park.find().lean();
  const allZoneIds = (await Zone.find().lean()).map(z => z._id.toString());
  const allWardIds = (await Ward.find().lean()).map(w => w._id.toString());

  const orphanedByZone = allParks.filter(p => p.zone && !allZoneIds.includes(p.zone.toString()));
  const orphanedByWard = allParks.filter(p => p.ward && !allWardIds.includes(p.ward.toString()));
  console.log(`Parks with deleted/invalid zone: ${orphanedByZone.length}`);
  console.log(`Parks with deleted/invalid ward: ${orphanedByWard.length}`);

  process.exit(0);
}
checkParks();
