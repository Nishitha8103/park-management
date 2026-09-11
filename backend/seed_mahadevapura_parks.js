require('dotenv').config();
const mongoose = require('mongoose');
const District = require('./models/District');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const Park = require('./models/Park');

const data = {
  district: "Bangalore Urban",
  corporation: "Bengaluru East City Corporation",
  zone: "Zone-1 — Mahadevapura",
  wards: [
    {
      name: "Kadugodi",
      number: "31",
      parks: [
        "Kadugodi Park (near Government Hospital)"
      ]
    },
    {
      name: "Whitefield",
      number: "38",
      parks: [
        "Whitefield Inner Circle Park"
      ]
    },
    {
      name: "Hagaduru",
      number: "39",
      parks: [
        "Whitefield Inner Circle Park (same park, listed under old ward \"Hagadooru,\" which straddles Whitefield/Hagaduru)"
      ]
    },
    {
      name: "Dodda Nekkundi",
      number: "43",
      parks: [
        "AECS Layout D Block Park",
        "AECS Layout B Block Park",
        "AECS Layout E Block Park",
        "BEML Layout Park & Srinivasa Temple Park",
        "Karthik Nagar South Avenue Park",
        "Karthik Nagar OHT Park",
        "Karthik Nagar Children's Park"
      ]
    },
    {
      name: "Bellanduru",
      number: "47",
      parks: [
        "Aralur Gate Amalipura Park"
      ]
    }
  ]
};

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/park_management');
    console.log("Connected to MongoDB");

    // Get or Create District
    let district = await District.findOne({ name: data.district });
    if (!district) {
      district = await District.create({ name: data.district, code: "BAN-URB" });
      console.log("Created District:", data.district);
    }

    // Get or Create Corporation
    let corporation = await Corporation.findOne({ name: data.corporation, districtId: district._id });
    if (!corporation) {
      corporation = await Corporation.create({ name: data.corporation, code: "BECC-01", districtId: district._id });
      console.log("Created Corporation:", data.corporation);
    }

    // Get or Create Zone
    let zone = await Zone.findOne({ name: data.zone, corporationId: corporation._id });
    if (!zone) {
      zone = await Zone.create({ name: data.zone, code: "Z-08", districtId: district._id, corporationId: corporation._id });
      console.log("Created Zone:", data.zone);
    }

    let parksAdded = 0;

    for (const w of data.wards) {
      let ward = await Ward.findOne({ name: w.name, zoneId: zone._id });
      if (!ward) {
        ward = await Ward.create({ 
          name: w.name, 
          wardNumber: w.number, 
          districtId: district._id, 
          corporationId: corporation._id, 
          zoneId: zone._id 
        });
        console.log(`Created Ward: ${w.name}`);
      }

      for (const parkName of w.parks) {
        let park = await Park.findOne({ name: parkName, ward: ward._id });
        if (!park) {
          await Park.create({
            name: parkName,
            parkCode: `P-${w.number}-${Math.floor(1000 + Math.random() * 9000)}`,
            district: district._id,
            corporation: corporation._id,
            zone: zone._id,
            ward: ward._id,
            status: "Active"
          });
          parksAdded++;
        }
      }
    }

    console.log(`Successfully added ${parksAdded} new parks.`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
