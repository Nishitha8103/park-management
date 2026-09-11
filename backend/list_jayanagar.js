require('dotenv').config();
const mongoose = require('mongoose');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const Park = require('./models/Park');

async function listJayanagarWards() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/park_management');
  
  // Find Zone-1 Jayanagar
  const zone = await Zone.findOne({ name: { $regex: /jayanagar/i } });
  if (!zone) {
    console.log("Jayanagar zone not found");
    process.exit(1);
  }
  
  console.log(`Zone: ${zone.name} (${zone._id})\n`);
  
  const wards = await Ward.find({ zoneId: zone._id }).sort({ name: 1 }).lean();
  console.log(`Total wards: ${wards.length}\n`);
  
  let grandTotal = 0;
  for (const ward of wards) {
    const parks = await Park.find({ ward: ward._id }).lean();
    grandTotal += parks.length;
    console.log(`Ward: "${ward.name}" -> ${parks.length} parks`);
    if (parks.length > 0) {
      parks.forEach(p => console.log(`    - ${p.name}`));
    }
  }
  
  console.log(`\nGrand total: ${grandTotal} parks across ${wards.length} wards`);
  process.exit(0);
}
listJayanagarWards();
