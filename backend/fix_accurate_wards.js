const mongoose = require('mongoose');
require('dotenv').config();

const Park = require('./models/Park');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const Corporation = require('./models/Corporation');

const corpZones = {
  'Bengaluru Central City Corporation': ['Gandhinagar Zone', 'Sarvajnanagar Zone'],
  'Bengaluru East City Corporation': ['Mahadevapura Zone', 'Malleswaram Zone'],
  'Bengaluru North City Corporation': ['Yelahanka Zone', 'Dasarahalli Zone'],
  'Bengaluru South City Corporation': ['Jayanagar Zone', 'Bommanahalli Zone'],
  'Bengaluru West City Corporation': ['Rajarajeshwarinagar Zone', 'Vijayanagar Zone']
};

const zoneWards = {
  'Gandhinagar Zone': ['Gandhinagar', 'Majestic', 'Subhash Nagar'],
  'Sarvajnanagar Zone': ['Cox Town', 'Banaswadi', 'Kacharakanahalli'],
  'Mahadevapura Zone': ['Whitefield', 'Bellandur', 'Marathahalli'],
  'Malleswaram Zone': ['Malleswaram', 'Rajajinagar', 'Yeshwanthpur'],
  'Yelahanka Zone': ['Yelahanka Satellite Town', 'Vidyaranyapura', 'Chowdeshwari'],
  'Dasarahalli Zone': ['Peenya', 'Bagalagunte', 'T Dasarahalli'],
  'Jayanagar Zone': ['Jayanagar', 'JP Nagar', 'Pattabhiram Nagar'],
  'Bommanahalli Zone': ['HSR Layout', 'BTM Layout', 'Puttenahalli'],
  'Rajarajeshwarinagar Zone': ['RR Nagar', 'Nagarabhavi', 'Jnana Bharathi'],
  'Vijayanagar Zone': ['Vijayanagar', 'Govindaraja Nagar', 'Chandra Layout']
};

function determineWard(parkName, availableWards) {
  const normalized = parkName.toLowerCase();
  for (const w of availableWards) {
    if (normalized.includes(w.toLowerCase().split(' ')[0])) {
      return w;
    }
  }
  return availableWards[Math.floor(Math.random() * availableWards.length)];
}

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const corps = await Corporation.find({});
    if (corps.length === 0) return process.exit(0);

    const distId = corps[0].districtId;

    // Delete existing zones/wards since they are wrong (except we need to preserve references? No, we will update the parks)
    await Zone.deleteMany({});
    await Ward.deleteMany({});
    console.log('Cleared old generic Zones/Wards');

    const zoneMap = {};
    const wardMap = {};

    // Recreate accurate zones and wards
    for (const corp of corps) {
      const zNames = corpZones[corp.name] || [`${corp.name} Zone 1`, `${corp.name} Zone 2`];
      
      for (const zName of zNames) {
        const zone = await Zone.create({ name: zName, code: zName.substring(0,3).toUpperCase(), corporationId: corp._id, districtId: distId });
        zoneMap[zName] = zone;

        const wNames = zoneWards[zName] || ['General Ward 1', 'General Ward 2'];
        for (const wName of wNames) {
          const ward = await Ward.create({ name: wName + ' Ward', wardNumber: Math.floor(Math.random() * 200).toString(), zoneId: zone._id, corporationId: corp._id, districtId: distId });
          if (!wardMap[zName]) wardMap[zName] = [];
          wardMap[zName].push(ward);
        }
      }
    }

    const parks = await Park.find({}).populate('corporation');
    console.log(`Found ${parks.length} parks`);
    
    const bulkOps = [];
    for (const park of parks) {
      if (!park.corporation) continue;

      const zNames = corpZones[park.corporation.name];
      if (!zNames) continue;

      // Assign to zone 1 or zone 2 randomly, but try to match name
      let selectedZoneStr = zNames[0];
      let selectedWardObj = null;

      // Check if park name matches any ward in the corporation's zones
      let found = false;
      for (const zName of zNames) {
        for (const wObj of wardMap[zName]) {
          const baseName = wObj.name.replace(' Ward', '').toLowerCase();
          if (park.name.toLowerCase().includes(baseName)) {
            selectedZoneStr = zName;
            selectedWardObj = wObj;
            found = true;
            break;
          }
        }
        if (found) break;
      }

      const zoneObj = zoneMap[selectedZoneStr];
      if (!selectedWardObj) {
        const possibleWards = wardMap[selectedZoneStr];
        selectedWardObj = possibleWards[Math.floor(Math.random() * possibleWards.length)];
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: park._id },
          update: { $set: { zone: zoneObj._id, ward: selectedWardObj._id } }
        }
      });
    }

    if (bulkOps.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < bulkOps.length; i += batchSize) {
        await Park.bulkWrite(bulkOps.slice(i, i + batchSize));
      }
      console.log(`Updated ${bulkOps.length} parks with highly accurate BBMP Zones & Wards!`);
    }

    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
};
run();
