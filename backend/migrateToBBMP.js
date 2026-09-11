const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Corporation = require('./models/Corporation');
  const District = require('./models/District');
  const Zone = require('./models/Zone');
  const Ward = require('./models/Ward');
  const Park = require('./models/Park');
  
  const dist = await District.findOne({ name: 'Bangalore Urban' });
  
  // Get BBMP
  let bbmp = await Corporation.findOne({ districtId: dist._id, name: 'BBMP (Bruhat Bengaluru Mahanagara Palike)' });
  if (!bbmp) {
    bbmp = await Corporation.findOne({ districtId: dist._id, name: 'BBMP' });
  }

  if (!bbmp) {
    console.log("BBMP not found!");
    process.exit(1);
  }
  
  // Find all other corps in Bangalore Urban
  const otherCorps = await Corporation.find({ districtId: dist._id, _id: { $ne: bbmp._id } });
  const otherCorpIds = otherCorps.map(c => c._id);
  
  console.log(`Migrating data from ${otherCorps.length} corporations to BBMP...`);
  
  // 1. Move all parks to BBMP
  const parksResult = await Park.updateMany(
    { corporation: { $in: otherCorpIds } },
    { $set: { corporation: bbmp._id } }
  );
  console.log(`Moved ${parksResult.modifiedCount} parks to BBMP.`);
  
  // 2. Move all wards to BBMP
  const wardsResult = await Ward.updateMany(
    { corporationId: { $in: otherCorpIds } },
    { $set: { corporationId: bbmp._id } }
  );
  console.log(`Moved ${wardsResult.modifiedCount} wards to BBMP.`);
  
  // 3. Move all zones to BBMP
  const zonesResult = await Zone.updateMany(
    { corporationId: { $in: otherCorpIds } },
    { $set: { corporationId: bbmp._id } }
  );
  console.log(`Moved ${zonesResult.modifiedCount} zones to BBMP.`);
  
  // 4. Delete the other corporations
  const deleteResult = await Corporation.deleteMany({ _id: { $in: otherCorpIds } });
  console.log(`Deleted ${deleteResult.deletedCount} old corporations.`);
  
  // Deduplicate zones in BBMP (Merge zones with same name in BBMP)
  const allBBMPZones = await Zone.find({ corporationId: bbmp._id });
  const zoneMap = new Map();
  
  for (const z of allBBMPZones) {
    const name = z.name.trim().toLowerCase();
    if (!zoneMap.has(name)) {
      zoneMap.set(name, z);
    } else {
      // Duplicate zone found!
      const targetZone = zoneMap.get(name);
      
      // Move wards to targetZone
      await Ward.updateMany({ zoneId: z._id }, { $set: { zoneId: targetZone._id } });
      
      // Move parks to targetZone
      await Park.updateMany({ zone: z._id }, { $set: { zone: targetZone._id } });
      
      // Delete duplicate zone
      await Zone.deleteOne({ _id: z._id });
      console.log(`Merged duplicate zone: ${z.name}`);
    }
  }
  
  // Rename BBMP to "BBMP" for simplicity if it has a long name
  bbmp.name = "BBMP";
  await bbmp.save();
  
  console.log("Migration completed successfully.");
  process.exit(0);
});
