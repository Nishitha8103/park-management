const mongoose = require('mongoose');
const dotenv = require('dotenv');
const District = require('./models/District');

dotenv.config();

const fixDistrict = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Fix...');

    // Find all districts to see what we have
    const districts = await District.find({});
    console.log('Districts:', districts.map(d => d.name));

    // Delete 'Bangalore Urban'
    const result = await District.deleteOne({ name: 'Bangalore Urban' });
    console.log('Deleted Bangalore Urban:', result);

    process.exit();
  } catch (error) {
    console.error('Error', error);
    process.exit(1);
  }
};

fixDistrict();
