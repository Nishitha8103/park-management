const mongoose = require('mongoose');
const Park = require('./models/Park');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/park_monitoring');
  const count = await Park.countDocuments();
  console.log('Total parks:', count);
  
  const dupesByName = await Park.aggregate([
    { $group: { _id: { name: "$name" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);
  
  console.log('Duplicates by name only:', dupesByName.length);

  const dupesByCode = await Park.aggregate([
    { $group: { _id: { code: "$parkCode" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);
  console.log('Duplicates by parkCode:', dupesByCode.length);
  
  process.exit();
}
check();
