const mongoose = require('mongoose');
const dotenv = require('dotenv');
const District = require('./models/District');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');

dotenv.config();

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB. Running Master Data seed...');

    // 1. Upsert District
    const district = await District.findOneAndUpdate(
      { code: 'BLR-U' },
      { name: 'Bengaluru Urban', description: 'Bengaluru Urban District', status: 'Active' },
      { upsert: true, new: true }
    );
    console.log('Upserted District:', district.name);

    // 2. Upsert 5 Corporations
    const corpsData = [
      { code: 'BBMP', name: 'Bruhat Bengaluru Mahanagara Palike', description: 'Municipal Corporation' },
      { code: 'BDA', name: 'Bangalore Development Authority', description: 'Development Authority' },
      { code: 'BMRDA', name: 'Bangalore Metropolitan Region Development Authority', description: 'Regional Authority' },
      { code: 'BWSSB', name: 'Bangalore Water Supply and Sewerage Board', description: 'Water Board' },
      { code: 'BESCOM', name: 'Bangalore Electricity Supply Company', description: 'Electricity Board' }
    ];

    const corpsMap = {};
    for (const data of corpsData) {
      const corp = await Corporation.findOneAndUpdate(
        { code: data.code, districtId: district._id },
        { name: data.name, description: data.description, status: 'Active' },
        { upsert: true, new: true }
      );
      corpsMap[data.code] = corp;
    }
    console.log('Upserted 5 Corporations.');

    // 3. Upsert Zones for Corporations
    const bbmpZonesData = [
      { code: 'EAST', name: 'East Zone' },
      { code: 'WEST', name: 'West Zone' },
      { code: 'SOUTH', name: 'South Zone' },
      { code: 'NORTH', name: 'North Zone' },
      { code: 'RRNAGAR', name: 'Rajarajeshwari Nagar' },
      { code: 'DASARAHALLI', name: 'Dasarahalli' },
      { code: 'YELAHANKA', name: 'Yelahanka' },
      { code: 'BOMMANAHALLI', name: 'Bommanahalli' },
      { code: 'MAHADEVAPURA', name: 'Mahadevapura' }
    ];

    const bbmpZonesMap = {};
    for (const zData of bbmpZonesData) {
      const zone = await Zone.findOneAndUpdate(
        { code: `BBMP-${zData.code}`, corporationId: corpsMap['BBMP']._id, districtId: district._id },
        { name: zData.name, status: 'Active' },
        { upsert: true, new: true }
      );
      bbmpZonesMap[zData.code] = zone;
    }

    // Give one zone to other corporations just for completeness
    const otherZonesData = [
      { corp: 'BDA', code: 'BDA-CENTRAL', name: 'BDA Central Zone' },
      { corp: 'BMRDA', code: 'BMRDA-REGIONAL', name: 'BMRDA Regional Zone' },
      { corp: 'BWSSB', code: 'BWSSB-HQ', name: 'BWSSB Headquarters' },
      { corp: 'BESCOM', code: 'BESCOM-EAST', name: 'BESCOM East Circle' }
    ];
    for (const zData of otherZonesData) {
      await Zone.findOneAndUpdate(
        { code: zData.code, corporationId: corpsMap[zData.corp]._id, districtId: district._id },
        { name: zData.name, status: 'Active' },
        { upsert: true, new: true }
      );
    }
    console.log('Upserted Zones for all Corporations.');

    // 4. Insert all Ward records (e.g. BBMP has 243 wards)
    // We will distribute 243 wards evenly across the 9 BBMP zones
    const zoneKeys = Object.keys(bbmpZonesMap);
    let wardsProcessed = 0;
    
    // Process in batches for performance
    const wardPromises = [];
    for (let i = 1; i <= 243; i++) {
      const zoneKey = zoneKeys[i % zoneKeys.length];
      const zone = bbmpZonesMap[zoneKey];
      
      const wardPromise = Ward.findOneAndUpdate(
        { wardNumber: i.toString(), zoneId: zone._id, corporationId: corpsMap['BBMP']._id, districtId: district._id },
        { name: `Ward ${i}`, description: `BBMP Ward Number ${i}`, status: 'Active' },
        { upsert: true, new: true }
      );
      wardPromises.push(wardPromise);
    }
    
    await Promise.all(wardPromises);
    console.log(`Upserted 243 Wards for BBMP.`);

    console.log('Master Data seeding completed successfully! Duplicate execution is safe.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding DB:', error);
    process.exit(1);
  }
};

seedDB();
