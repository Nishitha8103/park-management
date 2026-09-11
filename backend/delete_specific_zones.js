require('dotenv').config();
const mongoose = require('mongoose');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const Park = require('./models/Park');

async function deleteSpecificZones() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/park_management');
    console.log("Connected to MongoDB");

    const zonesToDelete = [
      "Zone-1",
      "Zone-1 — CV Raman Nagar / Mayohall side"
    ];

    for (const zoneName of zonesToDelete) {
      const zone = await Zone.findOne({ name: zoneName });
      if (zone) {
        console.log(`Deleting zone: ${zone.name}`);
        
        // Delete associated wards
        const wards = await Ward.find({ zoneId: zone._id });
        for (const ward of wards) {
          // Delete parks associated with the ward
          const parksResult = await Park.deleteMany({ ward: ward._id });
          console.log(` - Deleted ${parksResult.deletedCount} parks for ward ${ward.name}`);
          
          await Ward.findByIdAndDelete(ward._id);
          console.log(` - Deleted ward: ${ward.name}`);
        }

        await Zone.findByIdAndDelete(zone._id);
        console.log(`Deleted zone: ${zone.name} successfully.`);
      } else {
        console.log(`Zone not found: ${zoneName}`);
      }
    }

    console.log("Cleanup complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

deleteSpecificZones();
