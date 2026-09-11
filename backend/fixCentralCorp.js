const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Corporation = require('./models/Corporation');
  const District = require('./models/District');
  const Zone = require('./models/Zone');
  const Ward = require('./models/Ward');
  const Park = require('./models/Park');
  
  const dist = await District.findOne({name: 'Bangalore Urban'});
  const centralCorp = await Corporation.findOne({ districtId: dist._id, name: 'Bengaluru Central City Corporation' });
  
  let centralZone = await Zone.findOne({ corporationId: centralCorp._id, name: 'Central Zone' });
  if (!centralZone) {
    centralZone = await Zone.create({
      districtId: dist._id,
      corporationId: centralCorp._id,
      name: 'Central Zone',
      code: 'CZ'
    });
  }
  
  let centralWard = await Ward.findOne({ zoneId: centralZone._id });
  if (!centralWard) {
    centralWard = await Ward.create({
      districtId: dist._id,
      corporationId: centralCorp._id,
      zoneId: centralZone._id,
      name: 'Central Ward',
      wardNumber: '001'
    });
  }
  
  // Find 20 parks from 'East' or any zone and move them to Central
  const parksToMove = await Park.find({ district: dist._id }).limit(20);
  for (const p of parksToMove) {
    await Park.updateOne(
      { _id: p._id },
      { $set: { corporation: centralCorp._id, zone: centralZone._id, ward: centralWard._id } }
    );
  }
  
  console.log('Moved 20 parks to Bengaluru Central City Corporation.');
  process.exit(0);
});
