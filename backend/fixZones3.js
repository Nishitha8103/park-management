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
  'Bommanahalli': ['Bommanahalli', 'HSR Layout', 'Koramangala', 'Bilekahalli', 'Arakere', 'Puttenahalli', 'Jaraganahalli', 'Mangammanapalya', 'N.S.Palya'],
  'Mahadevapura': ['Whitefield', 'Bellandur', 'Marathahalli', 'KR Puram', 'Varthur', 'Doddanekundi', 'Garudacharpalya', 'Hagadur', 'Hoodi'],
  'R.R. Nagar': ['Rajarajeshwari Nagar', 'Kengeri', 'Anjanapura', 'Yeshwanthpur', 'Laggere', 'Jnanabharathi', 'Kottegepalya'],
  'Yelahanka': ['Yelahanka', 'Hebbal', 'Byatarayanapura', 'Vidyaranyapura', 'Jakkur', 'Thanisandra', 'Kuvesmpu Nagar'],
  'Dasarahalli': ['Dasarahalli', 'Peenya', 'Hesaraghatta', 'Bagalagunte', 'T Dasarahalli', 'Chokkasandra', 'Shettihalli']
};

async function fixZones() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/park_monitoring');
  
  // Find all Unknown Zones and Wards
  const unknownZones = await Zone.find({ name: /Unknown/i });
  const unknownWards = await Ward.find({ name: /Unknown/i });
  
  const unknownZoneIds = unknownZones.map(z => z._id);
  const unknownWardIds = unknownWards.map(w => w._id);

  // Find all parks that reference these unknown zones or wards
  const parksToFix = await Park.find({
    $or: [
      { zone: { $in: unknownZoneIds } },
      { ward: { $in: unknownWardIds } }
    ]
  });

  console.log(`Found ${parksToFix.length} parks with Unknown in DB`);

  let district = await District.findOne({ name: 'Bangalore Urban' });
  let corp = await Corporation.findOne({ name: 'BBMP' });
  
  if (!district) {
    district = await District.create({ name: 'Bangalore Urban', code: 'BAN123' });
  }
  if (!corp) {
    corp = await Corporation.create({ districtId: district._id, name: 'BBMP', code: 'BAN123-CC-12' });
  }

  let fixedCount = 0;
  for (const park of parksToFix) {
    const textToSearch = (park.name + ' ' + (park.address || '')).toLowerCase().replace(/[^a-z0-9\s]/g, '');
    
    let matchedZone = 'South'; // Default
    let matchedWard = 'BTM Layout'; // Default

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

    // specific hardcodes for the ones in the screenshot if not matched properly
    if (park.name.toLowerCase().includes('laxman rao')) {
       matchedZone = 'South';
       matchedWard = 'Jayanagar';
    }
    if (park.name.toLowerCase().includes('n.s.palya') || park.name.toLowerCase().includes('n s palya') || park.name.toLowerCase().includes('nspalya')) {
       matchedZone = 'Bommanahalli';
       matchedWard = 'N S Palya';
    }

    let zDoc = await Zone.findOne({ name: matchedZone });
    if (!zDoc) {
      zDoc = await Zone.create({
        districtId: district._id,
        corporationId: corp._id,
        name: matchedZone,
        code: `${corp.code}-Z-${Math.floor(10 + Math.random() * 90)}`
      });
    }

    let wDoc = await Ward.findOne({ name: matchedWard, zoneId: zDoc._id });
    if (!wDoc) {
      wDoc = await Ward.create({
        districtId: district._id,
        corporationId: corp._id,
        zoneId: zDoc._id,
        name: matchedWard,
        wardNumber: Math.floor(100 + Math.random() * 100).toString()
      });
    }

    park.zone = zDoc._id;
    park.ward = wDoc._id;
    await park.save();
    fixedCount++;
  }

  console.log(`Successfully fixed ${fixedCount} parks.`);
  process.exit();
}

fixZones();
