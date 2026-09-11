const mongoose = require('mongoose');
const dotenv = require('dotenv');
const District = require('./models/District');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');

dotenv.config();

const seedMoreWards = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding All 225 Wards...');

    const blr = await District.findOne({ name: 'Bengaluru Urban' });
    if (!blr) {
      console.log('Bengaluru Urban not found');
      process.exit(1);
    }

    const zones = await Zone.find({ districtId: blr._id });
    console.log(`Found ${zones.length} zones`);

    if (zones.length === 0) {
      console.log('No zones found');
      process.exit(1);
    }

    // Clear existing wards for Bengaluru Urban to avoid duplicates/mess
    await Ward.deleteMany({ districtId: blr._id });
    console.log('Cleared existing wards for Bengaluru Urban');

    // Create 225 wards, distributed across the 10 zones
    // 225 / 10 = 22.5, so we'll put 22 in first 5 zones, and 23 in last 5 zones
    
    let wardNumber = 1;
    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i];
      const wardsCount = i < 5 ? 22 : 23; // 5 * 22 + 5 * 23 = 110 + 115 = 225
      
      const wardsToInsert = [];
      for (let j = 0; j < wardsCount; j++) {
        wardsToInsert.push({
          name: `BBMP Ward ${wardNumber}`,
          wardNumber: `${wardNumber}`,
          districtId: blr._id,
          corporationId: zone.corporationId,
          zoneId: zone._id,
          status: 'Active'
        });
        wardNumber++;
      }

      await Ward.insertMany(wardsToInsert);
      console.log(`Inserted ${wardsCount} wards into zone ${zone.name}`);
    }

    console.log('Successfully seeded all 225 wards!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedMoreWards();
