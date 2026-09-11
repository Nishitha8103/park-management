require('dotenv').config();
const mongoose = require('mongoose');
const Ward = require('./models/Ward');
const Park = require('./models/Park');

async function checkJPNagar() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/park_management');
  
  // Find all wards with "J.P" or "JP" in name
  const jpWards = await Ward.find({ name: { $regex: /j\.?p/i } }).lean();
  console.log(`Found ${jpWards.length} ward(s) matching J.P. Nagar:`);
  
  for (const ward of jpWards) {
    const parks = await Park.find({ ward: ward._id }).lean();
    console.log(`\nWard: "${ward.name}" (ID: ${ward._id})`);
    console.log(`  Zone: ${ward.zoneId}`);
    console.log(`  Parks count: ${parks.length}`);
    parks.forEach(p => console.log(`    - ${p.name}`));
  }

  // Also check: are there parks with "J.P" in their name that belong to OTHER wards?
  const jpParks = await Park.find({ name: { $regex: /j\.?p\.?\s*nagar/i } }).populate('ward', 'name').lean();
  console.log(`\n--- All parks with "J.P. Nagar" in name: ${jpParks.length} ---`);
  jpParks.forEach(p => console.log(`  "${p.name}" -> ward: "${p.ward?.name || 'unknown'}"`));

  // Check the admin parks page query - does it use a different ward ID?
  const allWards = await Ward.find().lean();
  const jpRelated = allWards.filter(w => w.name.toLowerCase().includes('j.p') || w.name.toLowerCase().includes('jp'));
  console.log(`\n--- All wards with JP in name: ---`);
  jpRelated.forEach(w => console.log(`  "${w.name}" (ID: ${w._id}, Zone: ${w.zoneId})`));

  process.exit(0);
}
checkJPNagar();
