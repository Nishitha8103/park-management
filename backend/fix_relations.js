const mongoose = require('mongoose');
const dotenv = require('dotenv');
const District = require('./models/District');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');

dotenv.config();

const fixRelations = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Fix Relations...');

    // Find the correct Bengaluru Urban District
    const blr = await District.findOne({ name: 'Bengaluru Urban' });
    
    if (blr) {
      console.log('Correct Bengaluru Urban ID:', blr._id);
      
      // We know there are 5 corporations for Bengaluru, let's find them
      // They might be pointing to an old district ID.
      const corps = await Corporation.find({ name: { $regex: /Bengaluru/i } });
      console.log('Found Corporations:', corps.length);
      
      let oldDistrictId = null;
      if (corps.length > 0 && corps[0].districtId.toString() !== blr._id.toString()) {
        oldDistrictId = corps[0].districtId;
        console.log('Old District ID was:', oldDistrictId);
      }

      if (oldDistrictId) {
        // Update Corporations
        const cRes = await Corporation.updateMany(
          { districtId: oldDistrictId },
          { $set: { districtId: blr._id } }
        );
        console.log('Updated Corporations:', cRes.modifiedCount);

        // Update Zones
        const zRes = await Zone.updateMany(
          { districtId: oldDistrictId },
          { $set: { districtId: blr._id } }
        );
        console.log('Updated Zones:', zRes.modifiedCount);

        // Update Wards
        const wRes = await Ward.updateMany(
          { districtId: oldDistrictId },
          { $set: { districtId: blr._id } }
        );
        console.log('Updated Wards:', wRes.modifiedCount);
      } else {
        console.log('No mismatch found or corporations already point to the correct district.');
      }
    } else {
      console.log('Bengaluru Urban not found!');
    }

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

fixRelations();
