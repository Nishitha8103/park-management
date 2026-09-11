const mongoose = require('mongoose');
const Park = require('./models/Park');
require('dotenv').config();

async function addLocalPhotos() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/park_monitoring');
  
  const parks = await Park.find({});
  console.log(`Updating ${parks.length} parks with local generated park images...`);

  const bulkOps = [];
  
  const imageOptions = [
    '/parks/park1.png',
    '/parks/park3.png',
    '/parks/park5.png',
    '/parks/park6.png',
    '/parks/park8.png'
  ];

  for (const park of parks) {
    const numImages = Math.floor(Math.random() * 2) + 1; 
    const selectedImages = [];
    
    // Create a copy to splice from so we don't pick duplicates
    let pool = [...imageOptions];
    for (let i = 0; i < numImages; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      selectedImages.push(pool[idx]);
      pool.splice(idx, 1);
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: park._id },
        update: { $set: { images: selectedImages } }
      }
    });
  }

  if (bulkOps.length > 0) {
    await Park.bulkWrite(bulkOps);
    console.log(`Successfully added local generated photos to ${bulkOps.length} parks!`);
  }

  process.exit();
}

addLocalPhotos();
