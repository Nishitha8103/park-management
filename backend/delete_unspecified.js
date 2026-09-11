require('dotenv').config();
const mongoose = require('mongoose');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const Park = require('./models/Park');

async function deleteUnspecified() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/park_management');
    console.log("Connected to MongoDB");

    const corp = await Corporation.findOne({ name: "Unspecified" });
    if (corp) {
      console.log(`Found Corporation: ${corp.name}`);
      
      const zones = await Zone.find({ corporationId: corp._id });
      for (const zone of zones) {
        console.log(` - Deleting zone: ${zone.name}`);
        const wards = await Ward.find({ zoneId: zone._id });
        for (const ward of wards) {
          const parksResult = await Park.deleteMany({ ward: ward._id });
          console.log(`   - Deleted ${parksResult.deletedCount} parks for ward ${ward.name}`);
          await Ward.findByIdAndDelete(ward._id);
        }
        await Zone.findByIdAndDelete(zone._id);
      }
      
      await Corporation.findByIdAndDelete(corp._id);
      console.log("Deleted 'Unspecified' corporation successfully.");
    } else {
      console.log("'Unspecified' corporation not found.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

deleteUnspecified();
