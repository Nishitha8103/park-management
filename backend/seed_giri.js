const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');
const Park = require('./models/Park');

const seedGiri = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // 1. Find Madhavan Park
    const park = await Park.findOne({ name: /Madhavan Park/i });
    if (!park) {
      console.log("Madhavan Park not found!");
      process.exit(1);
    }
    console.log("Found Park:", park.name, "Ward:", park.ward, "Zone:", park.zone, "District:", park.district);

    // 2. Delete existing official 'giri' if any
    await User.deleteMany({ username: 'giri' });

    // 3. Create Government Official 'giri'
    const newOfficial = new User({
      name: 'giri',
      email: 'giri@gmail.com',
      username: 'giri',
      password: 'giriPassword123', // Will be hashed by userSchema pre-save hook
      role: 'Government Official',
      phone: '9988776655',
      district: park.district,
      zone: park.zone,
      ward: park.ward
    });

    const savedOfficial = await newOfficial.save();
    console.log("Official 'giri' created with ID:", savedOfficial._id);

    // 4. Update Madhavan Park to assign this official
    park.governmentOfficial = savedOfficial._id;
    await park.save();
    console.log("Updated Madhavan Park with official 'giri'");

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedGiri();
