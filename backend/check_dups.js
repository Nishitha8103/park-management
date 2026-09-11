require('dotenv').config();
const mongoose = require('mongoose');
const District = require('./models/District');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');

async function checkDups() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/park_management');
  
  const dists = await District.find();
  console.log("Districts:", dists.map(d => `${d.name} (${d._id})`));
  
  const corps = await Corporation.find();
  console.log("Corporations:", corps.map(c => `${c.name} (${c._id})`));
  
  process.exit(0);
}
checkDups();
