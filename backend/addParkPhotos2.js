const mongoose = require('mongoose');
const Park = require('./models/Park');
require('dotenv').config();

async function addPhotos() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/park_monitoring');
  
  const parks = await Park.find({});
  console.log(`Updating ${parks.length} parks with new images...`);

  const bulkOps = [];
  let lockIndex = 1;
  
  for (const park of parks) {
    const numImages = Math.floor(Math.random() * 2) + 1; 
    const selectedImages = [];
    
    for (let i = 0; i < numImages; i++) {
      // Use loremflickr to guarantee pictures of parks and gardens
      // using the lock param to ensure a unique image for each one
      selectedImages.push(`https://loremflickr.com/800/600/park,garden?lock=${lockIndex}`);
      lockIndex++;
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
    console.log(`Successfully added different photos to ${bulkOps.length} parks!`);
  }

  process.exit();
}

addPhotos();
