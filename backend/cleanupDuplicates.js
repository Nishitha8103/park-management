const mongoose = require('mongoose');
const Park = require('./models/Park');
require('dotenv').config();

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/park_monitoring');
    console.log('Connected to DB');

    const duplicates = await Park.aggregate([
      { 
        $group: { 
          _id: { name: "$name", ward: "$ward" }, 
          count: { $sum: 1 }, 
          docs: { $push: "$_id" } 
        } 
      },
      { 
        $match: { 
          count: { $gt: 1 } 
        } 
      }
    ]);

    let deletedCount = 0;

    for (const dup of duplicates) {
      // Keep the first document, delete the rest
      const [keep, ...remove] = dup.docs;
      
      const res = await Park.deleteMany({ _id: { $in: remove } });
      deletedCount += res.deletedCount;
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} duplicate parks.`);

    const count = await Park.countDocuments();
    console.log('Total parks remaining:', count);

  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    process.exit();
  }
}

cleanup();
