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
  zone: "Zone-2 — K.R. Puram",
  wards: [
    {
      name: "Horamavu",
      number: "2",
      parks: [
        "Horamavu Ward Office Park",
        "Ambedkar Statue Park"
      ]
    },
    {
      name: "Kalkere",
      number: "6",
      parks: [
        "Kalkere Park (near bus stop)"
      ]
    },
    {
      name: "Bhattarahalli",
      number: "9",
      parks: [
        "Bhattarahalli Lake Park",
        "Bhattarahalli Park (near Garden City College)",
        "Park near Vengayyana Kere"
      ]
    },
    {
      name: "Devasandra",
      number: "12",
      parks: [
        "K.R. Puram Hanging Bridge Median Park",
        "Mini Vidhana Soudha Park"
      ]
    },
    {
      name: "K.R Pura",
      number: "14",
      parks: [
        "K.R. Puram Kacheri Awarana Park",
        "K.R. Puram Ganesha Temple Park",
        "K.R. Puram Office Premises Park",
        "Road Median Park (Opp. K.R. Puram Market)"
      ]
    },
    {
      name: "Ramamurthy Nagara",
      number: "15",
      parks: [
        "Ramamurthy Nagar Kalkere Park"
      ]
    },
    {
      name: "Vijinapura",
      number: "17",
      parks: [
        "East of NGEF Park",
        "Kasthuri Nagar STP Park",
        "Kasthuri Nagar Gas Godown Park",
        "ITI Layout Park"
      ]
    },
    {
      name: "Vignananagara",
      number: "24",
      parks: [
        "M.V.G. Water Tank Park",
        "M.V.G. Layout Park"
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
      zone = await Zone.create({ name: data.zone, code: "Z-09", districtId: district._id, corporationId: corporation._id });
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
