require('dotenv').config();
const mongoose = require('mongoose');
const District = require('./models/District');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const Park = require('./models/Park');

const data = {
  district: "Bangalore Urban",
  corporation: "Bengaluru West City Corporation",
  zone: "Zone-1 — Rajarajeshwari Nagar",
  wards: [
    {
      name: "Chokkasandra",
      number: "2",
      parks: [
        "HMT Layout Parks (Parts 1–8)", "Gruhalakshmi Layout Part-2", "KRS Gowda HMT Layout Park (Parts 1 & 2)", "Makkala Udyanavana"
      ]
    },
    {
      name: "Rajagopala Nagara",
      number: "7",
      parks: ["GKW Park"]
    },
    {
      name: "Dodda Bidarakallu",
      number: "11",
      parks: [
        "Doddamuneshwara Temple Park", "Thippenahalli Park", "Segehalli Nursery Park", "Herohalli \"D\" Group Layout Park (Parts 1–4)"
      ]
    },
    {
      name: "Herohalli",
      number: "14",
      parks: [
        "Ganesha Farm Anjana Nagar Park", "BEL Layout Parks (Gandhi, Jinke, Graveyard, East/West/School, Kere)", "Syndicate Bank Employees Layout Parks (1–3)", "Muddina Palya Main Road/Gidada Konehalli Park"
      ]
    },
    {
      name: "Ullal",
      number: "16",
      parks: [
        "Rajarajeswari Layout Park (Nagadevanahalli)", "Railway Employees RHCS Ullal Park", "Gavipuram Guttahalli Society Layout Park", "Ullal AGS Layout Parks", "Upkar Layout Park", "Kalyan HBCS Layout Parks", "Kengeri KHB Layout Park"
      ]
    },
    {
      name: "Nagadevanahalli",
      number: "17",
      parks: [
        "BDA 2nd Stage Nagadevanahalli 2nd Block Park", "Rajarajeswari Layout Park"
      ]
    },
    {
      name: "Kengeri",
      number: "21",
      parks: [
        "Bandematt Park", "Kengeri Upanagar Parks (1–7)", "Kengeri Crematorium", "Sri Rama Layout Park"
      ]
    },
    {
      name: "Rajarajeshwari Nagara",
      number: "23",
      parks: [
        "Boat Club Park (BEML Layout)", "Ideal Homes Layout Parks", "Field Marshal Kariyappa Park", "Kenchenahalli Parks", "Double Road Park", "Krishnappa & Srinivasaiah Block Parks", "RR Nagar Entrance Park"
      ]
    },
    {
      name: "Mallathahalli",
      number: "26",
      parks: [
        "NGEF Layout Park at Mallathalli", "ITI Layout Part-2 Mallathahalli Park"
      ]
    },
    {
      name: "Kottegepalya",
      number: "28",
      parks: [
        "Nagarabhavi Sub-Register Office Park", "Vinayaka Layout Park", "Ramakrishna Hegde Park", "Maruthi Temple Park", "Bande Maramma Park"
      ]
    },
    {
      name: "Laggere",
      number: "32",
      parks: ["Laggere Ring Road Junction Park"]
    },
    {
      name: "Lakshmi Devi Nagar",
      number: "33",
      parks: [
        "Jaibhuvaneshwarinagar Park", "Vidhana Soudha Layout Parks", "Jaraka Bande Park"
      ]
    },
    {
      name: "Peenya",
      number: "34",
      parks: [
        "Peenya Training College Opp. Park", "Peenya 4th Stage Park", "KIADB Parks (TVS Cross, near IFF Factory, near KLE College)", "Peenya Park at Reliance Petrol Bunk"
      ]
    },
    {
      name: "Nandini Layout",
      number: "38",
      parks: [
        "HSFS Park", "Park at Presidency School", "SFHS Parks", "Ramakrishna Nagar Park", "BHEL Layout Park", "Balamuri Varasiddi Vinayaka Temple Park", "Nandini Circular Park", "Nandini Layout Mini Forest Parks"
      ]
    },
    {
      name: "Jai Maruthi Nagar",
      number: "39",
      parks: ["Jai Maruthi Nagar Main Road Vacant Place (Parts 1 & 2)"]
    },
    {
      name: "Mahalakshmipuram",
      number: "40",
      parks: [
        "Pipeline Parks (1–3)", "Vasavi Park", "Saraswathipuram Park", "Anjaneya Gudda Park", "Swimming Pool Park"
      ]
    },
    {
      name: "Nagapura",
      number: "41",
      parks: [
        "Swami Vivekananda Park", "Buddashanti Park", "Mahadevithayi Park", "Akkamahadevi Park", "Ushe Park", "Sir M. Vishweshwaraiah Park"
      ]
    },
    {
      name: "Shakthi Ganapathi Nagara",
      number: "45",
      parks: [
        "40 VNT Bridge Park", "Vasavi Temple Park", "SBI Colony Park", "Kuvempu Park", "Kamala Ganapathi Park"
      ]
    },
    {
      name: "Vrishabhavathi Nagar",
      number: "47",
      parks: [
        "Ward Office Park, Vrushabhavathi Nagar"
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
      corporation = await Corporation.create({ name: data.corporation, code: "BWCC-01", districtId: district._id });
      console.log("Created Corporation:", data.corporation);
    }

    // Get or Create Zone
    let zone = await Zone.findOne({ name: data.zone, corporationId: corporation._id });
    if (!zone) {
      zone = await Zone.create({ name: data.zone, code: "Z-10", districtId: district._id, corporationId: corporation._id });
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
