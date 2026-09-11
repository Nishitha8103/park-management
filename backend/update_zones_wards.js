const mongoose = require('mongoose');
require('dotenv').config();
const Park = require('./models/Park');
const District = require('./models/District');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');

const zoneMappings = {
  'RR Nagar': ['nagarabhavi', 'rrn', 'rajarajeshwari', 'r r nagar', 'kengeri', 'nayandahalli', 'jnana bharathi', 'laggere', 'yeshwanthpur'],
  'West': ['rajajinagar', 'malleshwaram', 'mahalakshmi', 'gandhi nagar', 'chamarajapet', 'vijayanagar', 'govindaraja', 'basaveshwara'],
  'South': ['jayanagar', 'basavanagudi', 'jp nagar', 'b.t.m', 'btm layout', 'padmanabhanagar', 'chikpet', 'shanti nagar'],
  'East': ['indiranagar', 'shivajinagar', 'cv raman', 'c v raman', 'pulakeshinagar', 'sarvagnanagar', 'shantinagar', 'ulsoor', 'hal', 'kr puram'],
  'Bommanahalli': ['hsr layout', 'bommanahalli', 'begur', 'arakere', 'puttenahalli', 'singasandra', 'billekahalli'],
  'Mahadevapura': ['mahadevapura', 'whitefield', 'bellandur', 'marathahalli', 'kadugodi', 'vadeyapura', 'hoodi', 'garudacharpalya'],
  'Yelahanka': ['yelahanka', 'byatarayanapura', 'vidyaranyapura', 'dodda bommasandra', 'kuvempu'],
  'Dasarahalli': ['dasarahalli', 'peenya', 'bagalagunte', 't dasarahalli', 'shettihalli']
};

const zoneToCorpMapping = {
  'South': 'Bengaluru South City Corporation',
  'Bommanahalli': 'Bengaluru South City Corporation',
  'Yelahanka': 'Bengaluru North City Corporation',
  'Dasarahalli': 'Bengaluru North City Corporation',
  'East': 'Bengaluru East City Corporation',
  'Mahadevapura': 'Bengaluru East City Corporation',
  'West': 'Bengaluru West City Corporation',
  'RR Nagar': 'Bengaluru West City Corporation',
  'Central Zone': 'Bengaluru Central City Corporation'
};

const getInferredData = (parkName) => {
  const nameLower = parkName.toLowerCase();
  
  for (const [zone, keywords] of Object.entries(zoneMappings)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword)) {
        let wardName = keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (['rrn', 'rajarajeshwari', 'r r nagar', 'rr nagar'].includes(keyword)) {
          wardName = 'Rajarajeshwari Nagar';
        } else if (keyword === 'jnana bharathi') {
          wardName = 'Jnana Bharathi';
        }
        return { zoneName: zone, wardName: wardName };
      }
    }
  }
  return { zoneName: 'Central Zone', wardName: 'General Ward' };
};

async function updateParks() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const parks = await Park.find({}).populate('district');
    console.log(`Found ${parks.length} parks to process.`);

    const corpCache = {};
    const zoneCache = {};
    const wardCache = {};
    const bulkOps = [];
    let updatedCount = 0;

    for (const park of parks) {
      if (!park.district) continue;
      
      const parkName = park.name || '';
      const { zoneName, wardName } = getInferredData(parkName);
      const targetCorpName = zoneToCorpMapping[zoneName] || 'Bengaluru Central City Corporation';

      // Ensure Corp exists in cache
      let corp = corpCache[targetCorpName];
      if (!corp) {
        corp = await Corporation.findOne({ districtId: park.district._id, name: targetCorpName });
        if (!corp) {
           corp = await Corporation.create({
             districtId: park.district._id,
             name: targetCorpName,
             code: `B-${Math.floor(100+Math.random()*900)}`
           });
        }
        corpCache[targetCorpName] = corp;
      }

      const corpId = corp._id.toString();
      const zoneKey = `${corpId}-${zoneName}`;
      
      // Ensure Zone exists
      let zone = zoneCache[zoneKey];
      if (!zone) {
        zone = await Zone.findOne({ corporationId: corp._id, name: zoneName });
        if (!zone) {
          zone = await Zone.create({
            districtId: park.district._id,
            corporationId: corp._id,
            name: zoneName,
            code: `Z-${zoneName.substring(0, 3).toUpperCase()}-${Math.floor(100+Math.random()*900)}`
          });
        }
        zoneCache[zoneKey] = zone;
      }

      const zoneId = zone._id.toString();
      const wardKey = `${zoneId}-${wardName}`;

      // Ensure Ward exists
      let ward = wardCache[wardKey];
      if (!ward) {
        ward = await Ward.findOne({ zoneId: zone._id, name: wardName });
        if (!ward) {
          ward = await Ward.create({
            districtId: park.district._id,
            corporationId: corp._id,
            zoneId: zone._id,
            name: wardName,
            wardNumber: `${wardName.substring(0,3).toUpperCase()}-${Math.floor(10+Math.random()*90)}`
          });
        }
        wardCache[wardKey] = ward;
      }

      // Update park if corp, zone, or ward changed
      if (park.corporation?.toString() !== corp._id.toString() || park.zone?.toString() !== zone._id.toString() || park.ward?.toString() !== ward._id.toString()) {
        bulkOps.push({
          updateOne: {
            filter: { _id: park._id },
            update: { $set: { corporation: corp._id, zone: zone._id, ward: ward._id } }
          }
        });
        updatedCount++;
      }
    }

    if (bulkOps.length > 0) {
      console.log(`Executing bulk update for ${bulkOps.length} parks...`);
      await Park.bulkWrite(bulkOps);
    }

    console.log(`Finished updating ${updatedCount} parks successfully!`);
    
    // Cleanup any empty zones and wards
    const allZones = await Zone.find({});
    for (const z of allZones) {
       const cnt = await Park.countDocuments({ zone: z._id });
       if (cnt === 0) await Zone.deleteOne({ _id: z._id });
    }
    const allWards = await Ward.find({});
    for (const w of allWards) {
       const cnt = await Park.countDocuments({ ward: w._id });
       if (cnt === 0) await Ward.deleteOne({ _id: w._id });
    }
    
    console.log('Cleaned up unused Zones and Wards');
    process.exit(0);
  } catch (error) {
    console.error('Error updating parks:', error);
    process.exit(1);
  }
}

updateParks();
