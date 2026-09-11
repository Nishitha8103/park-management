const mongoose = require('mongoose');
const xlsx = require('xlsx');
const dotenv = require('dotenv');
dotenv.config();

const Corporation = require('./models/Corporation');
const District = require('./models/District');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const Park = require('./models/Park');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const dist = await District.findOne({ name: /Bangalore Urban/i });
  const corps = await Corporation.find({ districtId: dist._id });
  const corpMap = {};
  corps.forEach(c => corpMap[c.name] = c);

  const corpMapping = {
    'Bengaluru Central City Corporation': ['Central', 'Shivajinagar', 'Gandhinagar'],
    'Bengaluru East City Corporation': ['East', 'Mahadevapura', 'C.V. Raman Nagar'],
    'Bengaluru North City Corporation': ['Yelahanka', 'Dasarahalli', 'Hebbal'],
    'Bengaluru South City Corporation': ['South', 'Bommanahalli', 'Jayanagar', 'Basavanagudi'],
    'Bengaluru West City Corporation': ['West', 'R.R. Nagar', 'Rajarajeshwari Nagar', 'Chandra Layout', 'Vijayanagar']
  };

  const getCorpForPark = (zoneName, wardName) => {
    for (const [corpName, keywords] of Object.entries(corpMapping)) {
      if (keywords.some(k => zoneName.includes(k) || wardName.includes(k))) {
        return corpMap[corpName];
      }
    }
    return corpMap['Bengaluru Central City Corporation'];
  };

  const importFile = async (filename) => {
    console.log(`Importing ${filename}...`);
    const wb = xlsx.readFile(filename);
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    console.log(`Found ${rows.length} rows in ${filename}.`);

    const zones = await Zone.find({ districtId: dist._id });
    const wards = await Ward.find({ districtId: dist._id });
    
    const zoneMap = {};
    zones.forEach(z => zoneMap[`${z.name}-${z.corporationId}`] = z);
    const wardMap = {};
    wards.forEach(w => wardMap[`${w.name}-${w.zoneId}`] = w);

    const bulkOps = [];
    
    for (const row of rows) {
      const zName = row.Zone || 'Unknown Zone';
      const wName = row.Ward || row['Ward '] || 'Unknown Ward';
      const targetCorp = getCorpForPark(zName, wName);

      const zKey = `${zName}-${targetCorp._id}`;
      let zone = zoneMap[zKey];
      if (!zone) {
        zone = await Zone.create({ name: zName, code: zName.substring(0,3).toUpperCase(), corporationId: targetCorp._id, districtId: dist._id });
        zoneMap[zKey] = zone;
      }

      const wKey = `${wName}-${zone._id}`;
      let ward = wardMap[wKey];
      if (!ward) {
        ward = await Ward.create({ name: wName, wardNumber: wName.toString(), zoneId: zone._id, corporationId: targetCorp._id, districtId: dist._id });
        wardMap[wKey] = ward;
      }

      bulkOps.push({
        updateOne: {
          filter: { name: row['Park Name'] || row.Name || 'Unnamed' },
          update: {
            $set: {
              district: dist._id,
              corporation: targetCorp._id,
              zone: zone._id,
              ward: ward._id,
              parkCode: row['Park Code'] || `P-${Math.floor(Math.random()*900000)}`,
              address: row.Address || '',
              area: row.Area || '',
              parkType: row['Park Type'] || '',
              description: row.Description || 'Auto imported park',
              numberOfTrees: row.Trees || 0,
              numberOfBenches: row.Benches || 0,
              numberOfLights: row.Lights || 0,
              numberOfDustbins: row.Dustbins || 0
            }
          },
          upsert: true
        }
      });
    }

    if (bulkOps.length > 0) {
       await Park.bulkWrite(bulkOps);
    }
    console.log(`Imported ${bulkOps.length} parks from ${filename}`);
  };

  try {
    await importFile('dummy.xlsx');
  } catch(e) { console.error('Error dummy.xlsx:', e.message); }
  
  try {
    await importFile('BBMP_Parks_List.xlsx');
  } catch(e) { console.error('Error BBMP_Parks_List.xlsx:', e.message); }

  console.log('Done mapping missing parks!');
  process.exit(0);
};

run().catch(console.error);
