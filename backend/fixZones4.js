const mongoose = require('mongoose');
const Park = require('./models/Park');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const District = require('./models/District');
const Corporation = require('./models/Corporation');
require('dotenv').config();

const zonesAndWards = {
  'South': ['Basavanagudi', 'Jayanagar', 'Padmanabhanagar', 'BTM Layout', 'Uttarahalli', 'Lakkasandra', 'N S Palya', 'S.G. Palya', 'Mico Layout', 'Laxman Rao', 'Koramangala'],
  'East': ['Shivajinagar', 'CV Raman Nagar', 'Indiranagar', 'Ulsoor', 'Frazer Town', 'Banaswadi', 'HBR Layout', 'Kalyan Nagar'],
  'West': ['Malleswaram', 'Rajajinagar', 'Govindaraja Nagar', 'Vijayanagar', 'Basaveshwaranagar', 'Mathikere', 'Yeshwanthpur'],
  'Bommanahalli': ['Bommanahalli', 'HSR Layout', 'Koramangala', 'Bilekahalli', 'Arakere', 'Puttenahalli', 'Jaraganahalli', 'Mangammanapalya', 'N.S.Palya', 'N S Palya'],
  'Mahadevapura': ['Whitefield', 'Bellandur', 'Marathahalli', 'KR Puram', 'Varthur', 'Doddanekundi', 'Garudacharpalya', 'Hagadur', 'Hoodi'],
  'R.R. Nagar': ['Rajarajeshwari Nagar', 'Kengeri', 'Anjanapura', 'Yeshwanthpur', 'Laggere', 'Jnanabharathi', 'Kottegepalya'],
  'Yelahanka': ['Yelahanka', 'Hebbal', 'Byatarayanapura', 'Vidyaranyapura', 'Jakkur', 'Thanisandra', 'Kuvesmpu Nagar'],
  'Dasarahalli': ['Dasarahalli', 'Peenya', 'Hesaraghatta', 'Bagalagunte', 'T Dasarahalli', 'Chokkasandra', 'Shettihalli']
};

async function fixZones() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/park_monitoring');
  
  const unknownZones = await Zone.find({ name: /Unknown/i });
  const unknownWards = await Ward.find({ name: /Unknown/i });
  
  const unknownZoneIds = unknownZones.map(z => z._id);
  const unknownWardIds = unknownWards.map(w => w._id);

  const parksToFix = await Park.find({
    $or: [
      { zone: { $in: unknownZoneIds } },
      { ward: { $in: unknownWardIds } }
    ]
  }).lean();

  if (parksToFix.length === 0) {
    console.log('No parks need fixing!');
    process.exit();
  }
  console.log(`Found ${parksToFix.length} parks with Unknown in DB`);

  let district = await District.findOne({ name: 'Bangalore Urban' });
  let corp = await Corporation.findOne({ name: 'BBMP' });

  // Cache zones and wards to avoid repeated DB calls
  const cachedZones = await Zone.find().lean();
  const cachedWards = await Ward.find().lean();

  const getZoneId = async (name) => {
    let z = cachedZones.find(x => x.name === name);
    if (!z) {
      z = await Zone.create({
        districtId: district._id,
        corporationId: corp._id,
        name: name,
        code: `${corp.code}-Z-${Math.floor(10 + Math.random() * 90)}`
      });
      cachedZones.push(z);
    }
    return z._id;
  };

  const getWardId = async (name, zId) => {
    let w = cachedWards.find(x => x.name === name && x.zoneId.toString() === zId.toString());
    if (!w) {
      w = await Ward.create({
        districtId: district._id,
        corporationId: corp._id,
        zoneId: zId,
        name: name,
        wardNumber: Math.floor(100 + Math.random() * 100).toString()
      });
      cachedWards.push(w);
    }
    return w._id;
  };

  const bulkOps = [];

  for (const park of parksToFix) {
    const textToSearch = (park.name + ' ' + (park.address || '')).toLowerCase().replace(/[^a-z0-9\s]/g, '');
    
    let matchedZone = 'South'; 
    let matchedWard = 'BTM Layout'; 

    for (const [z, wards] of Object.entries(zonesAndWards)) {
      for (const w of wards) {
        const wSanitized = w.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        if (textToSearch.includes(wSanitized) || textToSearch.includes(wSanitized.replace(/\s+/g, ''))) {
          matchedZone = z;
          matchedWard = w;
          break;
        }
      }
      if (matchedZone !== 'South' || textToSearch.includes('btm layout')) break;
    }

    if (park.name.toLowerCase().includes('laxman rao')) {
       matchedZone = 'South';
       matchedWard = 'Jayanagar';
    }
    if (park.name.toLowerCase().includes('n.s.palya') || park.name.toLowerCase().includes('n s palya') || park.name.toLowerCase().includes('nspalya')) {
       matchedZone = 'Bommanahalli';
       matchedWard = 'N S Palya';
    }

    const zId = await getZoneId(matchedZone);
    const wId = await getWardId(matchedWard, zId);

    bulkOps.push({
      updateOne: {
        filter: { _id: park._id },
        update: { $set: { zone: zId, ward: wId } }
      }
    });
  }

  if (bulkOps.length > 0) {
    await Park.bulkWrite(bulkOps);
  }

  console.log(`Successfully fixed ${bulkOps.length} parks in bulk.`);
  process.exit();
}

fixZones();
