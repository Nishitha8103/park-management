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
  let bbmp = await Corporation.findOne({ districtId: dist._id, name: 'BBMP' });
  if (!bbmp) {
    bbmp = await Corporation.findOne({ districtId: dist._id });
  }

  const corpsData = [
    { name: 'Bengaluru South City Corporation', code: 'BSC' },
    { name: 'Bengaluru North City Corporation', code: 'BNC' },
    { name: 'Bengaluru West City Corporation', code: 'BWC' },
    { name: 'Bengaluru Central City Corporation', code: 'BCC' },
    { name: 'Bengaluru East City Corporation', code: 'BEC' }
  ];

  const corpsMap = {};
  for (const c of corpsData) {
    let corp = await Corporation.findOne({ districtId: dist._id, name: c.name });
    if (!corp) {
      corp = await Corporation.create({
        districtId: dist._id,
        name: c.name,
        code: c.code,
        description: c.name
      });
    }
    corpsMap[c.name] = corp;
  }

  // Define zone to corporation mapping
  const zoneToCorpMapping = {
    'South': 'Bengaluru South City Corporation',
    'Bommanahalli': 'Bengaluru South City Corporation',
    
    'North Zone': 'Bengaluru North City Corporation',
    'Yelahanka': 'Bengaluru North City Corporation',
    'Dasarahalli': 'Bengaluru North City Corporation',
    
    'East': 'Bengaluru East City Corporation',
    'Mahadevapura': 'Bengaluru East City Corporation',
    
    'West': 'Bengaluru West City Corporation',
    'R.R. Nagar': 'Bengaluru West City Corporation',
    'Rajarajeshwarinagar': 'Bengaluru West City Corporation',
    'RR Nagar': 'Bengaluru West City Corporation',
    
    'Central Zone': 'Bengaluru Central City Corporation'
  };

  const allZones = await Zone.find({ districtId: dist._id });

  for (const zone of allZones) {
    let targetCorpName = 'Bengaluru Central City Corporation'; // default fallback
    for (const [key, val] of Object.entries(zoneToCorpMapping)) {
      if (zone.name.toLowerCase().includes(key.toLowerCase())) {
        targetCorpName = val;
        break;
      }
    }
    
    const targetCorp = corpsMap[targetCorpName];
    
    // Move zone
    await Zone.updateOne({ _id: zone._id }, { $set: { corporationId: targetCorp._id } });
    
    // Move wards
    await Ward.updateMany({ zoneId: zone._id }, { $set: { corporationId: targetCorp._id } });
    
    // Move parks
    await Park.updateMany({ zone: zone._id }, { $set: { corporation: targetCorp._id } });
  }

  // Delete BBMP if it exists
  if (bbmp && !Object.values(corpsMap).some(c => c._id.toString() === bbmp._id.toString())) {
    await Corporation.deleteOne({ _id: bbmp._id });
  }

  console.log("Successfully split BBMP into the 5 proposed City Corporations and re-mapped all zones, wards, and parks.");
  process.exit(0);
});
