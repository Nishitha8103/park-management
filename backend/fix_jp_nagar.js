require('dotenv').config();
const mongoose = require('mongoose');
const Park = require('./models/Park');
const Ward = require('./models/Ward');

async function moveJPNagarParks() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/park_management');
  console.log("Connected to MongoDB");

  // Find the J.P Nagar ward
  const jpWard = await Ward.findOne({ name: 'J.P Nagar' });
  if (!jpWard) {
    console.log("J.P Nagar ward not found!");
    process.exit(1);
  }
  console.log(`Found J.P Nagar ward: ${jpWard._id}`);

  // Find all parks with "J.P. Nagar" or "JP Nagar" in name that are NOT in the J.P Nagar ward
  const jpParks = await Park.find({
    name: { $regex: /j\.?p\.?\s*nagar/i },
    ward: { $ne: jpWard._id }
  }).populate('ward', 'name').lean();

  console.log(`Found ${jpParks.length} J.P. Nagar parks in other wards:`);
  
  for (const park of jpParks) {
    console.log(`  Moving: "${park.name}" from ward "${park.ward?.name}" to "J.P Nagar"`);
    await Park.findByIdAndUpdate(park._id, { 
      ward: jpWard._id,
      zone: jpWard.zoneId,
      corporation: jpWard.corporationId
    });
  }

  // Verify final count
  const finalCount = await Park.countDocuments({ ward: jpWard._id });
  console.log(`\nJ.P Nagar ward now has ${finalCount} parks.`);
  
  process.exit(0);
}
moveJPNagarParks();
