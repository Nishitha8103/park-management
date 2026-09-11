const mongoose = require('mongoose');
require('dotenv').config();
const District = require('./models/District');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const dist = await District.findOne({ name: /Bangalore Rural/i });
  console.log("District found:", dist);
  if (dist) {
    const corp = await Corporation.findOne({ districtId: dist._id });
    console.log("Corporation found:", corp);
    if (corp) {
      const zones = await Zone.find({ corporationId: corp._id });
      console.log("Zones count under corporation:", zones.length);
      console.log("Zones list:", zones);
    }
  }
  process.exit(0);
}
test();
