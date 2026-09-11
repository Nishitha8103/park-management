const mongoose = require('mongoose');
const dotenv = require('dotenv');
const District = require('./models/District');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');

dotenv.config();

const cleanupCorps = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Cleanup...');

    const validNames = [
      'Bengaluru City Central',
      'Bengaluru City East',
      'Bengaluru City South',
      'Bengaluru City West',
      'Bengaluru City North'
    ];

    const blr = await District.findOne({ name: 'Bengaluru Urban' });
    if (!blr) {
      console.log('Bengaluru Urban not found');
      process.exit(1);
    }

    const allCorps = await Corporation.find({ districtId: blr._id });
    console.log(`Found ${allCorps.length} total corporations under Bengaluru Urban`);

    for (const corp of allCorps) {
      if (!validNames.includes(corp.name)) {
        console.log(`Deleting invalid corporation: ${corp.name} (${corp._id})`);
        
        // Let's see if we should map it to a valid one, or just delete it.
        // For simplicity, we will just delete the old legacy corporations.
        await Corporation.findByIdAndDelete(corp._id);
        
        // Also delete any old zones or wards pointing to this old corporation
        await Zone.deleteMany({ corporationId: corp._id });
        await Ward.deleteMany({ corporationId: corp._id });
      }
    }

    console.log('Cleanup Complete!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

cleanupCorps();
