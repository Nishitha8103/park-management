const mongoose = require('mongoose');
const Park = require('./models/Park');
require('dotenv').config();

const imageLinks = [
  'https://images.unsplash.com/photo-1548448079-b0a7b8b3a1d1?w=800',
  'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=800',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
  'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800',
  'https://images.unsplash.com/photo-1585320806297-9794b3e4aaae?w=800',
  'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=800',
  'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800',
  'https://images.unsplash.com/photo-1455218873509-8097305ee378?w=800',
  'https://images.unsplash.com/photo-1465433360938-e02f2b81cd4c?w=800',
  'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800',
  'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800',
  'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800',
  'https://images.unsplash.com/photo-1498429089284-41f8cf3ffd39?w=800',
  'https://images.unsplash.com/photo-1460533893735-45cea2212645?w=800',
  'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800',
  'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800',
  'https://images.unsplash.com/photo-1470071413645-b461da8039bd?w=800',
  'https://images.unsplash.com/photo-1505322022379-7c3353ee6291?w=800'
];

async function addPhotos() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/park_monitoring');
  
  const parks = await Park.find({});
  console.log(`Updating ${parks.length} parks with new images...`);

  const bulkOps = [];
  
  for (const park of parks) {
    // Pick 1 to 3 random images for variety
    const numImages = Math.floor(Math.random() * 3) + 1;
    const selectedImages = [];
    
    for (let i = 0; i < numImages; i++) {
      const randomImg = imageLinks[Math.floor(Math.random() * imageLinks.length)];
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
    console.log(`Successfully added different photos to ${bulkOps.length} parks!`);
  }

  process.exit();
}

addPhotos();
