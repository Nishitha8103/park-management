const mongoose = require('mongoose');
require('dotenv').config();

const Park = require('./models/Park');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const Corporation = require('./models/Corporation');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const corps = await Corporation.find({});
    console.log(`Found ${corps.length} corporations`);
    if (corps.length === 0) return process.exit(0);

    const distId = corps[0].districtId;

    // Remove old unknowns
    await Zone.deleteMany({ name: 'Unknown Zone' });
    await Ward.deleteMany({ name: 'Unknown Ward' });
    console.log('Deleted Unknown Zone/Ward');

    const bulkOps = [];
    const parks = await Park.find({}).populate('corporation');
    console.log(`Found ${parks.length} parks`);

    for (const corp of corps) {
      const corpParks = parks.filter(p => p.corporation && p.corporation._id.toString() === corp._id.toString());
      if (corpParks.length === 0) continue;

      let zoneStr = corp.name.replace('City Corporation', 'Zone').trim();
      let wardStr = corp.name.replace('City Corporation', 'Ward').trim();

      let zone = await Zone.create({ name: zoneStr, code: zoneStr.substring(0,3).toUpperCase(), corporationId: corp._id, districtId: distId });
      let ward = await Ward.create({ name: wardStr, wardNumber: Math.floor(Math.random() * 200).toString(), zoneId: zone._id, corporationId: corp._id, districtId: distId });

      for (const park of corpParks) {
        bulkOps.push({
          updateOne: {
            filter: { _id: park._id },
            update: { $set: { zone: zone._id, ward: ward._id } }
          }
        });
      }
    }

    if (bulkOps.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < bulkOps.length; i += batchSize) {
        await Park.bulkWrite(bulkOps.slice(i, i + batchSize));
      }
      console.log(`Updated ${bulkOps.length} parks`);
    }

    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
};
run();
