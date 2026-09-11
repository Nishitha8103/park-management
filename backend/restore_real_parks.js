const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const Corporation = require('./models/Corporation');
const District = require('./models/District');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const Park = require('./models/Park');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // 1. Drop existing collections to start fresh
    await Promise.all([
      Park.deleteMany({}),
      Ward.deleteMany({}),
      Zone.deleteMany({}),
      Corporation.deleteMany({}),
      District.deleteMany({})
    ]);
    console.log('Cleared existing collections.');

    // 2. Read the JSON backup (handling utf16le with BOM)
    console.log('Reading test_parks_output.json...');
    const rawData = fs.readFileSync('test_parks_output.json', 'utf16le').replace(/^\uFEFF/, '');
    const parksData = JSON.parse(rawData);
    console.log(`Found ${parksData.length} parks in backup.`);

    const uniqueDistricts = new Map();
    const uniqueCorporations = new Map();
    const uniqueZones = new Map();
    const uniqueWards = new Map();

    const parksToInsert = [];

    // 3. Extract unique master data and prepare parks
    for (const park of parksData) {
      if (park.district && park.district._id) {
        uniqueDistricts.set(park.district._id, park.district);
      }
      if (park.corporation && park.corporation._id) {
        uniqueCorporations.set(park.corporation._id, park.corporation);
      }
      if (park.zone && park.zone._id) {
        uniqueZones.set(park.zone._id, park.zone);
      }
      if (park.ward && park.ward._id) {
        uniqueWards.set(park.ward._id, park.ward);
      }

      // Convert populated objects back to ObjectIds for the Park document
      const cleanPark = { ...park };
      if (cleanPark.district) cleanPark.district = cleanPark.district._id;
      if (cleanPark.corporation) cleanPark.corporation = cleanPark.corporation._id;
      if (cleanPark.zone) cleanPark.zone = cleanPark.zone._id;
      if (cleanPark.ward) cleanPark.ward = cleanPark.ward._id;

      // Handle _id correctly
      cleanPark._id = new mongoose.Types.ObjectId(park._id);
      
      parksToInsert.push(cleanPark);
    }

    // 4. Insert master data
    // MongoDB insertMany may throw if ids are duplicate, but we've uniquely mapped them
    if (uniqueDistricts.size > 0) {
      const dists = Array.from(uniqueDistricts.values()).map(d => ({ ...d, _id: new mongoose.Types.ObjectId(d._id) }));
      await District.insertMany(dists);
    }
    console.log(`Restored ${uniqueDistricts.size} Districts.`);

    if (uniqueCorporations.size > 0) {
      const corps = Array.from(uniqueCorporations.values()).map(c => ({ ...c, _id: new mongoose.Types.ObjectId(c._id) }));
      await Corporation.insertMany(corps);
    }
    console.log(`Restored ${uniqueCorporations.size} Corporations.`);

    if (uniqueZones.size > 0) {
      const zones = Array.from(uniqueZones.values()).map(z => ({ ...z, _id: new mongoose.Types.ObjectId(z._id) }));
      await Zone.insertMany(zones);
    }
    console.log(`Restored ${uniqueZones.size} Zones.`);

    if (uniqueWards.size > 0) {
      const wards = Array.from(uniqueWards.values()).map(w => ({ ...w, _id: new mongoose.Types.ObjectId(w._id) }));
      await Ward.insertMany(wards);
    }
    console.log(`Restored ${uniqueWards.size} Wards.`);

    // 5. Insert parks
    if (parksToInsert.length > 0) {
      // Process in batches to avoid large payload issues
      const batchSize = 100;
      for (let i = 0; i < parksToInsert.length; i += batchSize) {
        const batch = parksToInsert.slice(i, i + batchSize);
        await Park.insertMany(batch);
      }
      console.log(`Restored ${parksToInsert.length} Parks!`);
    }

    console.log('Restoration completely successful!');
    process.exit(0);

  } catch (err) {
    console.error('Error during restoration:', err);
    process.exit(1);
  }
};

run();
