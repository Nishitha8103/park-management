require('dotenv').config();
const mongoose = require('mongoose');
const District = require('./models/District');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const Park = require('./models/Park');

const data = {
  district: "Bangalore Urban",
  corporation: "Bengaluru Central City Corporation",
  zone: "Zone-2 — Gandhinagar",
  wards: [
    {
      name: "Silver Jubilee Park Ward",
      number: "32",
      parks: [
        "Silver Jubile Park Part-1 & 2", "Silver Jubile Small Park"
      ]
    },
    {
      name: "Dharmaraya Swamy Temple Ward",
      number: "33",
      parks: []
    },
    {
      name: "Sunkenahalli",
      number: "42",
      parks: [
        "Tagoore Circle Park", "National College Flyover Park", "Basappa Layout Park", "Kohinoor Field Park", "Sunkenahalli Park"
      ]
    },
    {
      name: "Chamarajpet",
      number: "44",
      parks: [
        "Makkalakoota Park", "Azad Nagar Park"
      ]
    },
    {
      name: "K.R Market",
      number: "45",
      parks: [
        "Bhakshi Garden Park"
      ]
    },
    {
      name: "Cheluvadi Palya",
      number: "46",
      parks: [
        "Anjanappa Garden Park"
      ]
    },
    {
      name: "IPD Salappa Ward",
      number: "47",
      parks: []
    },
    {
      name: "Azad Nagar",
      number: "48",
      parks: [
        "Valmeekinagar Park", "Park Below Sirsi Flyover"
      ]
    },
    {
      name: "Kasturbha Nagar",
      number: "49",
      parks: []
    },
    {
      name: "JJR Nagara",
      number: "50",
      parks: [
        "JJ Nagar Park"
      ]
    },
    {
      name: "Binnypete",
      number: "54",
      parks: [
        "Ramasharma Park, Binnimil"
      ]
    },
    {
      name: "Cottonpete",
      number: "57",
      parks: []
    },
    {
      name: "Okalipuram",
      number: "63",
      parks: [
        "Arundathi Park", "Laxman Rao Park"
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
      corporation = await Corporation.create({ name: data.corporation, code: "BCCC-01", districtId: district._id });
      console.log("Created Corporation:", data.corporation);
    }

    // Get or Create Zone
    let zone = await Zone.findOne({ name: data.zone, corporationId: corporation._id });
    if (!zone) {
      zone = await Zone.create({ name: data.zone, code: "Z-03", districtId: district._id, corporationId: corporation._id });
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
