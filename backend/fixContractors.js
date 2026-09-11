const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  require('./models/Corporation');
  require('./models/Zone');
  require('./models/Ward');
  require('./models/Park');
  const Contractor = require('./models/Contractor');
  const Zone = mongoose.model('Zone');
  const Ward = mongoose.model('Ward');
  const Corporation = mongoose.model('Corporation');
  
  const contractors = await Contractor.find();
  
  // Get a default valid set
  const defaultCorp = await Corporation.findOne({ name: 'Bengaluru South City Corporation' });
  const defaultZone = await Zone.findOne({ corporationId: defaultCorp._id });
  const defaultWard = await Ward.findOne({ zoneId: defaultZone._id });
  
  let fixedCount = 0;
  
  for (let c of contractors) {
     let needsUpdate = false;
     let updateData = {};
     
     // Check if zone exists
     let currentZone = null;
     if (c.zone) {
       currentZone = await Zone.findById(c.zone);
     }
     
     if (currentZone) {
       // Zone exists, so update corporation to match the zone's corporation
       if (c.corporation?.toString() !== currentZone.corporationId.toString()) {
          updateData.corporation = currentZone.corporationId;
          needsUpdate = true;
       }
       // Also check if ward exists and belongs to this zone
       if (c.ward) {
         const currentWard = await Ward.findById(c.ward);
         if (!currentWard || currentWard.zoneId.toString() !== currentZone._id.toString()) {
           const validWard = await Ward.findOne({ zoneId: currentZone._id });
           updateData.ward = validWard ? validWard._id : defaultWard._id;
           needsUpdate = true;
         }
       } else {
         const validWard = await Ward.findOne({ zoneId: currentZone._id });
         updateData.ward = validWard ? validWard._id : defaultWard._id;
         needsUpdate = true;
       }
     } else {
       // Zone doesn't exist (it was a deleted duplicate)
       updateData.corporation = defaultCorp._id;
       updateData.zone = defaultZone._id;
       updateData.ward = defaultWard._id;
       needsUpdate = true;
     }
     
     if (needsUpdate) {
        await Contractor.updateOne({ _id: c._id }, { $set: updateData });
        fixedCount++;
     }
  }
  
  console.log(`Fixed ${fixedCount} contractors with orphaned references.`);
  process.exit(0);
});
