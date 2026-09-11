const mongoose = require('mongoose');
require('dotenv').config();
const District = require('./models/District');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Districts:", await District.find({}, 'name code'));
  console.log("Corporations count:", await Corporation.countDocuments());
  console.log("Zones count:", await Zone.countDocuments());
  console.log("Zones list:", await Zone.find({}, 'name code').limit(10));
  console.log("Wards count:", await Ward.countDocuments());
  process.exit(0);
}
test();
