require('dotenv').config();
const mongoose = require('mongoose');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const Park = require('./models/Park');

async function deleteOldZones() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/park_management');
    console.log("Connected to MongoDB");

    const allZones = await Zone.find();
    let zonesToDelete = [];

    for (const zone of allZones) {
      if (!zone.name.startsWith("Zone-1") && !zone.name.startsWith("Zone-2")) {
        zonesToDelete.push(zone);
      }
    }

    console.log(`Found ${zonesToDelete.length} old zones to delete.`);

    for (const zone of zonesToDelete) {
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
    }

    console.log("Cleanup complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

deleteOldZones();
