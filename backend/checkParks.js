const mongoose = require('mongoose');
const Park = require('./models/Park');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/park_monitoring');
  const count = await Park.countDocuments();
  console.log('Total parks:', count);
  
  const dupes = await Park.aggregate([
    { $group: { _id: { name: "$name", ward: "$ward" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);
  
  console.log('Duplicates by name and ward:', dupes.length);
  
  const sample = await Park.findOne();
  console.log('Sample park:', sample ? sample.parkCode : 'none');
  
  process.exit();
}
check();
