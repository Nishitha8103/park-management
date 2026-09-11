const mongoose = require('mongoose');
const dotenv = require('dotenv');
const District = require('./models/District');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');

dotenv.config();

const seedLocations = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding...');

    // 1. Create Districts
    const distData = [
      { name: 'Bengaluru Urban', code: 'KA-BLR' },
      { name: 'Mysuru', code: 'KA-MYS' },
      { name: 'Hubballi-Dharwad', code: 'KA-HD' }
    ];
    const districts = {};
    for (const d of distData) {
      let doc = await District.findOneAndUpdate(
        { name: d.name }, 
        { code: d.code, name: d.name }, 
        { upsert: true, new: true }
      );
      districts[d.name] = doc;
    }

    const bengaluru = districts['Bengaluru Urban'];

    // 2. Create Corporations for Bengaluru
    const corporationsData = [
      { name: 'Bengaluru City Central', code: 'BBMP-C', districtId: bengaluru._id },
      { name: 'Bengaluru City East', code: 'BBMP-E', districtId: bengaluru._id },
      { name: 'Bengaluru City South', code: 'BBMP-S', districtId: bengaluru._id },
      { name: 'Bengaluru City West', code: 'BBMP-W', districtId: bengaluru._id },
      { name: 'Bengaluru City North', code: 'BBMP-N', districtId: bengaluru._id }
    ];

    const corps = {};
    for (const corpData of corporationsData) {
      let corp = await Corporation.findOneAndUpdate(
        { code: corpData.code },
        corpData,
        { upsert: true, new: true }
      );
      corps[corpData.name] = corp;
    }

    // 3. Create Zones
    const zonesData = [
      { name: 'CV Raman Nagar', code: 'Z-CVR', corpName: 'Bengaluru City Central' },
      { name: 'Gandhinagar', code: 'Z-GN', corpName: 'Bengaluru City Central' },
      { name: 'Mahadevapura', code: 'Z-MH', corpName: 'Bengaluru City East' },
      { name: 'KR Puram', code: 'Z-KRP', corpName: 'Bengaluru City East' },
      { name: 'Jayanagar', code: 'Z-JN', corpName: 'Bengaluru City South' },
      { name: 'Bommanahalli', code: 'Z-BM', corpName: 'Bengaluru City South' },
      { name: 'RR Nagar', code: 'Z-RRN', corpName: 'Bengaluru City West' },
      { name: 'Malleswaram', code: 'Z-ML', corpName: 'Bengaluru City West' },
      { name: 'Byatarayanapura', code: 'Z-BY', corpName: 'Bengaluru City North' },
      { name: 'Yelahanka', code: 'Z-YL', corpName: 'Bengaluru City North' }
    ];

    const zones = {};
    for (const zoneData of zonesData) {
      const corpId = corps[zoneData.corpName]._id;
      let zone = await Zone.findOneAndUpdate(
        { code: zoneData.code },
        { 
          name: zoneData.name, 
          code: zoneData.code,
          districtId: bengaluru._id,
          corporationId: corpId 
        },
        { upsert: true, new: true }
      );
      zones[zoneData.name] = zone;
    }

    // 4. Create Wards
    const wardsData = [
      { name: 'Domlur', wardNumber: '112', zoneName: 'CV Raman Nagar' },
      { name: 'Konena Agrahara', wardNumber: '113', zoneName: 'CV Raman Nagar' },
      { name: 'Gandhi Nagar', wardNumber: '94', zoneName: 'Gandhinagar' },
      { name: 'Subhash Nagar', wardNumber: '95', zoneName: 'Gandhinagar' },
      { name: 'Garudacharpalya', wardNumber: '82', zoneName: 'Mahadevapura' },
      { name: 'Kadugodi', wardNumber: '83', zoneName: 'Mahadevapura' },
      { name: 'Vijnanapura', wardNumber: '51', zoneName: 'KR Puram' },
      { name: 'KR Puram', wardNumber: '52', zoneName: 'KR Puram' },
      { name: 'Jayanagar East', wardNumber: '153', zoneName: 'Jayanagar' },
      { name: 'Vidyapeeta', wardNumber: '164', zoneName: 'Jayanagar' },
      { name: 'HSR Layout', wardNumber: '174', zoneName: 'Bommanahalli' },
      { name: 'Bommanahalli', wardNumber: '175', zoneName: 'Bommanahalli' },
      { name: 'Rajarajeshwari Nagar', wardNumber: '160', zoneName: 'RR Nagar' },
      { name: 'Jnanabharathi', wardNumber: '129', zoneName: 'RR Nagar' },
      { name: 'Malleswaram', wardNumber: '45', zoneName: 'Malleswaram' },
      { name: 'Kadu Malleshwar', wardNumber: '65', zoneName: 'Malleswaram' },
      { name: 'Thanisandra', wardNumber: '6', zoneName: 'Byatarayanapura' },
      { name: 'Byatarayanapura', wardNumber: '7', zoneName: 'Byatarayanapura' },
      { name: 'Kempegowda Ward', wardNumber: '1', zoneName: 'Yelahanka' },
      { name: 'Chowdeshwari', wardNumber: '2', zoneName: 'Yelahanka' }
    ];

    for (const wardData of wardsData) {
      const zoneId = zones[wardData.zoneName]._id;
      const corpId = corps[zonesData.find(z => z.name === wardData.zoneName).corpName]._id;
      
      await Ward.findOneAndUpdate(
        { wardNumber: wardData.wardNumber },
        { 
          name: wardData.name, 
          wardNumber: wardData.wardNumber,
          districtId: bengaluru._id,
          corporationId: corpId,
          zoneId: zoneId 
        },
        { upsert: true, new: true }
      );
    }

    console.log('Seeding Master Data Complete!');
    process.exit();
  } catch (error) {
    console.error('Error with Master Data Seeding', error);
    process.exit(1);
  }
};

seedLocations();
