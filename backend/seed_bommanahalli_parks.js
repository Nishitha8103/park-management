require('dotenv').config();
const mongoose = require('mongoose');
const District = require('./models/District');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const Park = require('./models/Park');

const data = {
  district: "Bangalore Urban",
  corporation: "Bengaluru South City Corporation",
  zone: "Zone-2 — Bommanahalli",
  wards: [
    {
      name: "Doresanipalya",
      number: "56",
      parks: [
        "The Park at Arekere, Panduranga Nagar, 8th Main, Near Forest"
      ]
    },
    {
      name: "Hulimavu",
      number: "57",
      parks: [
        "The Park at Hulimav, B.D.A. Layout"
      ]
    },
    {
      name: "Arakere",
      number: "58",
      parks: [
        "Shanthinekethan Layout Park (Kaveri Park)",
        "Shanthinekethan Layout Park (Family Park)",
        "Shanthinekethan Layout Park, 1st Main",
        "Shanthinekethan Layout Park (Shradda Park)",
        "Shanthinekethan Layout Park (Brundavan Park, Sathya Sai Baba Temple)"
      ]
    },
    {
      name: "Vijaya Bank Layout",
      number: "59",
      parks: [
        "Vijaya Bank Colony Park (near Police Station, Iyyappa Temple front/rear)",
        "Vijaya Bank Colony Park (near Cauveramma Temple)",
        "BTM Layout 4th Stage Park (Triangular Park, in front of KPTCL)",
        "BTM Layout 4th Stage Park (Banana Park, K.P.C.L.)",
        "BTM Layout 4th Stage Park (near Power Station)"
      ]
    },
    {
      name: "Bommanahalli",
      number: "63",
      parks: [
        "Bharath Co-operative Society Layout Park, Viratanagar"
      ]
    },
    {
      name: "Singasandra",
      number: "66",
      parks: [
        "Singasandra Govt. Hospital Premises Park",
        "A.E.C.S. Layout Park, Singasandra (near high-tension line)"
      ]
    },
    {
      name: "Bandepalya",
      number: "67",
      parks: [
        "A.E.C.S. Layout Park, Singasandra (possible overlap with Ward 66)"
      ]
    },
    {
      name: "Iblur",
      number: "70",
      parks: [
        "Park near Parangipalya Bus Stop (HSR Layout Sector-2, 26th Main Road)"
      ]
    },
    {
      name: "HSR Layout",
      number: "72",
      parks: [
        "HSR Layout Sector-1 parks: 22nd/22nd 'A' Main & 23rd Cross",
        "HSR Layout Sector-1 parks: 28th Main",
        "HSR Layout Sector-1 parks: 22nd A Main & 15th B Cross",
        "HSR Layout Sector-1 parks: Ganesha Temple Park (11th Cross, 25th Main)",
        "HSR Layout Sector-1 parks: Banyan Tree Park (24th Main)",
        "HSR Layout Sector-1 parks: 13th Cross/24th & 25th Main Park",
        "HSR Layout Sector-2 parks: 22nd Main/24th Cross",
        "HSR Layout Sector-2 parks: near Electrical Power Station (25th Main)",
        "HSR Layout Sector-2 parks: near Nif College (28th/29th Main)",
        "HSR Layout Sector-2 parks: 24th Cross Park",
        "HSR Layout Sector-3 parks: Twin Park (24th Cross, Mangamanapalya)",
        "HSR Layout Sector-3 parks: 16th Main/20th Cross",
        "HSR Layout Sector-3 parks: 16th Main Park",
        "HSR Layout Sector-4 parks: 17th Main/15th Cross",
        "HSR Layout Sector-4 parks: near Kara School (15th Cross)",
        "HSR Layout Sector-4 parks: 14th Main (in front of BDA Complex)",
        "HSR Layout Sector-6 parks: 14th 'A' Cross (near sub-division office)",
        "HSR Layout Sector-6 parks: IAS Officers' Colony",
        "HSR Layout Sector-6 parks: 16 'B' Cross",
        "HSR Layout Sector-6 parks: behind Spatika Hospital (3rd Main)",
        "HSR Layout Sector-6 parks: IAS Officers' Club Park (1st Main)",
        "HSR Layout Sector-6 parks: behind Star Hospital (3rd Main)",
        "HSR Layout Sector-7 parks: 7th/8th Main & 22nd/23rd Cross (near Mughal Garden)",
        "HSR Layout Sector-7 parks: 24th Cross (Vrukshavana)",
        "HSR Layout Sector-7 parks: 19th Cross",
        "HSR Layout Sector-7 parks: 19th/19th A Cross, 8th Main",
        "HSR Layout Sector-7 parks: 11th/12th Main & 19th/19th B Cross",
        "Park at Ibbaluru (in front of Sun City Apartment)"
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
      corporation = await Corporation.create({ name: data.corporation, code: "BSCC-01", districtId: district._id });
      console.log("Created Corporation:", data.corporation);
    }

    // Get or Create Zone
    let zone = await Zone.findOne({ name: data.zone, corporationId: corporation._id });
    if (!zone) {
      zone = await Zone.create({ name: data.zone, code: "Z-07", districtId: district._id, corporationId: corporation._id });
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
