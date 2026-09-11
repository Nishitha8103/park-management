const mongoose = require('mongoose');
const Park = require('./models/Park');
const fs = require('fs');
require('dotenv').config();

async function addPhotos() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/park_monitoring');
  
  const parks = await Park.find({});
  const parkImages = JSON.parse(fs.readFileSync('parkPhotos.json', 'utf-8'));
  
  console.log(`Updating ${parks.length} parks with ${parkImages.length} real Wikipedia park images...`);

  const bulkOps = [];
  
  for (const park of parks) {
    const numImages = Math.floor(Math.random() * 2) + 1; 
    const selectedImages = [];
    
    for (let i = 0; i < numImages; i++) {
      const randomImg = parkImages[Math.floor(Math.random() * parkImages.length)];
      if (!selectedImages.includes(randomImg)) {
        selectedImages.push(randomImg);
      }
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
    console.log(`Successfully added realistic Wikipedia park photos to ${bulkOps.length} parks!`);
  }

  process.exit();
}

addPhotos();
