const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Corporation = require('./models/Corporation');
  const District = require('./models/District');
  const Park = require('./models/Park');
  const Zone = require('./models/Zone');
  const Ward = require('./models/Ward');
  
  const dist = await District.findOne({ name: 'Bangalore Urban' });

  const corps = await Corporation.find({ districtId: dist._id });
  for (const c of corps) {
    const parkCount = await Park.countDocuments({ corporation: c._id });
    const wardCount = await Ward.countDocuments({ corporationId: c._id });
    console.log(`Corp: ${c.name} - Parks: ${parkCount}, Wards: ${wardCount}`);
  }

  process.exit(0);
});
