const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');

const District = require('./models/District');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const Park = require('./models/Park');

const newParks = [
  {
    districtName: "Bangalore Urban",
    corporationName: "Bengaluru North City Corporation",
    zoneName: "Zone-1 — Yelahanka",
    wardName: "J.P. Park",
    parkName: "Jayaprakash Narayana Park (JP Park)",
    parkCode: "FAM-JP-001",
    address: "JP Park, Mathikere, Bengaluru"
  },
  {
    districtName: "Bangalore Urban",
    corporationName: "Bengaluru West City Corporation",
    zoneName: "Zone-2 — Rajajinagara / Malleshwaram",
    wardName: "Basavanagudi",
    parkName: "Bugle Rock Park",
    parkCode: "FAM-BR-001",
    address: "Bugle Rock Park, Basavanagudi, Bengaluru"
  },
  {
    districtName: "Bangalore Urban",
    corporationName: "Bengaluru Central City Corporation",
    zoneName: "Zone-2 — Gandhinagar",
    wardName: "Gandhinagar",
    parkName: "Freedom Park",
    parkCode: "FAM-FP-001",
    address: "Freedom Park, Gandhi Nagar, Bengaluru"
  },
  {
    districtName: "Bangalore Urban",
    corporationName: "Bengaluru West City Corporation",
    zoneName: "Zone-2 — Rajajinagara / Malleshwaram",
    wardName: "Basavanagudi",
    parkName: "Sir M.N. Krishna Rao Park",
    parkCode: "FAM-MK-001",
    address: "M.N. Krishna Rao Park, Basavanagudi, Bengaluru"
  },
  {
    districtName: "Bangalore Urban",
    corporationName: "Bengaluru Central City Corporation",
    zoneName: "Zone-2 — Gandhinagar",
    wardName: "Gandhinagar",
    parkName: "Nehru Park",
    parkCode: "FAM-NP-001",
    address: "Nehru Park, Gandhi Nagar, Bengaluru"
  },
  {
    districtName: "Bangalore Urban",
    corporationName: "Bengaluru Central City Corporation",
    zoneName: "Zone-2 — Gandhinagar",
    wardName: "Pulakeshinagar",
    parkName: "Coles Park (Freedom Fighters Park)",
    parkCode: "FAM-CP-001",
    address: "Coles Park, Henns Road, Bengaluru"
  }
];

const slugify = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const addParks = async () => {
  try {
    await connectDB();
    console.log("Connected to DB...");

    for (const data of newParks) {
      console.log(`Processing ${data.parkName}...`);
      
      let district = await District.findOne({ name: data.districtName });
      if (!district) {
        district = await District.create({ name: data.districtName, code: slugify(data.districtName) });
      }

      let corporation = await Corporation.findOne({ name: data.corporationName, districtId: district._id });
      if (!corporation) {
        corporation = await Corporation.create({ 
          name: data.corporationName, 
          districtId: district._id,
          code: slugify(data.corporationName)
        });
      }

      let zone = await Zone.findOne({ name: data.zoneName, corporationId: corporation._id });
      if (!zone) {
        zone = await Zone.create({ 
          name: data.zoneName, 
          districtId: district._id,
          corporationId: corporation._id,
          code: slugify(data.zoneName)
        });
      }

      let ward = await Ward.findOne({ name: data.wardName, zoneId: zone._id });
      if (!ward) {
        ward = await Ward.create({ 
          name: data.wardName, 
          districtId: district._id,
          corporationId: corporation._id,
          zoneId: zone._id, 
          wardNumber: "UNKNOWN" 
        });
      }

      let park = await Park.findOne({ parkCode: data.parkCode });
      if (park) {
        console.log(`Park ${data.parkCode} already exists, skipping...`);
        continue;
      }

      await Park.create({
        name: data.parkName,
        parkCode: data.parkCode,
        address: data.address,
        district: district._id,
        corporation: corporation._id,
        zone: zone._id,
        ward: ward._id,
        status: 'Active'
      });
      console.log(`Added ${data.parkName} successfully!`);
    }

    console.log("All parks added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error adding parks:", error);
    process.exit(1);
  }
};

addParks();
