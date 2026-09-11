const mongoose = require('mongoose');
const Park = require('./models/Park');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
require('dotenv').config();

const zonesAndWards = {
  'South': ['Basavanagudi', 'Jayanagar', 'Padmanabhanagar', 'BTM Layout', 'Uttarahalli'],
  'East': ['Shivajinagar', 'CV Raman Nagar', 'Indiranagar', 'Ulsoor', 'Frazer Town'],
  'West': ['Malleswaram', 'Rajajinagar', 'Govindaraja Nagar', 'Vijayanagar', 'Basaveshwaranagar'],
  'Bommanahalli': ['Bommanahalli', 'HSR Layout', 'Koramangala', 'Bilekahalli', 'Arakere'],
  'Mahadevapura': ['Whitefield', 'Bellandur', 'Marathahalli', 'KR Puram', 'Varthur'],
  'R.R. Nagar': ['Rajarajeshwari Nagar', 'Kengeri', 'Anjanapura', 'Yeshwanthpur', 'Laggere'],
  'Yelahanka': ['Yelahanka', 'Hebbal', 'Byatarayanapura', 'Vidyaranyapura', 'Jakkur'],
  'Dasarahalli': ['Dasarahalli', 'Peenya', 'Hesaraghatta', 'Bagalagunte', 'T Dasarahalli']
};

async function fixZones() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/park_monitoring');
  
  const unknownZone = await Zone.findOne({ name: 'Unknown Zone' });
  if (!unknownZone) {
    console.log('No Unknown Zone found');
    process.exit();
  }

  const parksToFix = await Park.find({ zone: unknownZone._id });
  console.log(`Found ${parksToFix.length} parks with Unknown Zone`);

  let fixedCount = 0;
  for (const park of parksToFix) {
    const textToSearch = (park.name + ' ' + park.address).toLowerCase();
    
    let matchedZone = null;
    let matchedWard = null;

    for (const [z, wards] of Object.entries(zonesAndWards)) {
      for (const w of wards) {
        if (textToSearch.includes(w.toLowerCase())) {
          matchedZone = z;
          matchedWard = w;
          break;
        }
      }
      if (matchedZone) break;
    }

    if (matchedZone) {
      const zDoc = await Zone.findOne({ name: matchedZone });
      if (zDoc) {
        const wDoc = await Ward.findOne({ name: matchedWard, zoneId: zDoc._id });
        if (wDoc) {
          park.zone = zDoc._id;
          park.ward = wDoc._id;
          await park.save();
          fixedCount++;
        }
      }
    }
  }

  console.log(`Successfully fixed ${fixedCount} parks.`);
  process.exit();
}

fixZones();
