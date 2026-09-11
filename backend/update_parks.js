require('dotenv').config();
const mongoose = require('mongoose');
require('./models/District');
require('./models/Corporation');
require('./models/Zone');
require('./models/Ward');
require('./models/User');
const Park = require('./models/Park');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    return Park.updateMany(
      { $or: [{ latitude: { $exists: false } }, { latitude: null }, { latitude: '' } ] },
      { $set: { latitude: '12.9716', longitude: '77.5946' } }
    );
  })
  .then(res => {
    console.log('Updated Parks:', res);
    mongoose.disconnect();
  })
  .catch(e => {
    console.error(e);
    mongoose.disconnect();
  });
