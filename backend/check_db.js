const mongoose = require('mongoose');
const dotenv = require('dotenv');
const District = require('./models/District');
const Corporation = require('./models/Corporation');

dotenv.config();

const checkDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const blr = await District.findOne({ name: 'Bengaluru Urban' });
    console.log('Bengaluru Urban District:', blr);
    
    if (blr) {
      const corps = await Corporation.find({ districtId: blr._id });
      console.log(`Corporations for ${blr._id}:`, corps.length);
      console.log(corps.map(c => c.name));
    }
    
    const allCorps = await Corporation.find({});
    console.log('Total Corporations:', allCorps.length);
    if (allCorps.length > 0) {
      console.log('First corporation districtId:', allCorps[0].districtId);
    }
    
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
checkDb();
