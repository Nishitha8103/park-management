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
  zone: "Zone-1 → Mayohall",
  wards: [
    {
      name: "Ramaswamy Palya",
      number: "1",
      parks: [
        "Ramaswamy Palya Park Part 1 & 2"
      ]
    },
    {
      name: "Jayamahal",
      number: "2",
      parks: [
        "Taskar Town Park", "Balappagarden Park"
      ]
    },
    {
      name: "Vasanth Nagar",
      number: "3",
      parks: [
        "2nd & 3rd Cross Center Park", "Jawaharlal Nehru Tharalaya Park", "Kumar Park West, Subbaiah Layout", "10th Cross, 1st Main Road, Vasanthanagar", "1st Main Road Vasantha Nagara"
      ]
    },
    {
      name: "Sampangirama Nagar",
      number: "4",
      parks: [
        "Kempe Gowda Park Head Offices BBMP", "Bannappa Park, K.G. Road", "Bannappa Park, Kempegowda Road", "S.R. Nagara Lake Park", "S.R. Nagara BBMP Head Office Outside Park", "BBMP Head Office Inside Park"
      ]
    },
    {
      name: "Shivajinagar",
      number: "5",
      parks: [
        "Neharu Puram Coks A Road BBMP Park", "Neharu Puram Thimmaiah Road Cross 7th Cross Park"
      ]
    },
    {
      name: "Bharathi Nagar",
      number: "6",
      parks: [
        "Thimmaiah Road Memorial Street Park"
      ]
    },
    {
      name: "Hoysala Nagara Central",
      number: "9",
      parks: [
        "Defence Colony Park 3, 5th & 6th Main Road", "Jayarajanagara A Cross Park", "Murpy Town 2nd A Cross, Housing Board Quarters Near", "Murpy Town Park", "Indiranagar 1st Stage Double Road Park", "Defence Colony 2nd & 3rd Main Park", "Indiranagara 2nd Stage, 17th B Cross Children's Park", "Hoysalanagara Contact Point & Indiranagar 17th F Cross Park", "Indiranagara 2nd Stage, 13th Cross Park", "Indiranagara 2nd Stage, 12th Cross Park", "Murpy Town Near BBMP Samudaya Bhavan", "Indiranagara 1st Stage, 14th Cross, Near Jain College", "Indiranangara 1st Stage, Krishna Temple Park"
      ]
    },
    {
      name: "Indiranagar",
      number: "15",
      parks: [
        "Indiranagar 60 Ft Road Side Part-1"
      ]
    },
    {
      name: "New Thippasandra",
      number: "16",
      parks: [
        "New Thippasandra Park, Geethanjali Layout"
      ]
    },
    {
      name: "Jeevan Bhimanagar",
      number: "19",
      parks: [
        "Indiranagara HAL 2nd Stage, Kodihalli, 16E & 16F Main Road Middle Park", "HAL 2nd Stage 15th Main Near ISRO Compound", "Radhakrishnan Park NAL beside", "Domlur Flyover Under, Mini Forest", "Domlur Airport Flyover Below Park"
      ]
    },
    {
      name: "Kodihalli",
      number: "20",
      parks: [] // Text was informational
    },
    {
      name: "Konena Agrahara",
      number: "21",
      parks: [
        "HAL Airport Main, Murugeshpalya Bus Stop Near", "HAL 3rd Stage 4th A & 4th B Main BDA Layout Big", "HAL 3rd Stage BDA Layout Small Park"
      ]
    },
    {
      name: "Domluru",
      number: "22",
      parks: [
        "Domlur 2nd Stage, 2nd B Cross, 2nd Main, Clubhouse Park", "Domlur BDA Shopping Complex opposite, 8th Main", "Domlur Layout, 1st C Main", "HAL Airport Road Flyover Below BBMP Mini Forest", "HAL Main Road Playground Children's Park 1", "HAL Main Road Domlur Park 2", "HAL Airport Road Part 3", "HAL Airport Road, Domlur Part 4", "T Pudi Park Domlur", "Domlur Amarajyothi Layout IBM Road Park", "Domlur BDA Complex Park", "Domlur Kalkibagavan Temple Near", "Cambridge Layout, Someshwarapura 3rd Main, 4th Cross Children's Park", "Indiranagar 60 Ft Road Side Part-1"
      ]
    },
    {
      name: "Jogpalya",
      number: "23",
      parks: [
        "Cambridge Road, 1st Cross Gundappa Park", "Ulsoor Referral Hospital Compound Park"
      ]
    },
    {
      name: "Vannarpet",
      number: "26",
      parks: [
        "Viveknagar 2nd & 3rd Main BBMP Hospital Behind Park", "Viveknagar 5th Main Road Park", "Neelasandra 6th Main, BDA Layout Children's Park"
      ]
    },
    {
      name: "Ambedkarnagar",
      number: "27",
      parks: [
        "Dr Ambedkar Park, Nethaji Road"
      ]
    },
    {
      name: "Austin Town",
      number: "29",
      parks: [] // Informational text
    },
    {
      name: "Shanthinagar",
      number: "31",
      parks: [
        "Bekal Layout, Barly Street Park", "Shanthinagara BBMP Dispensary Compound Park", "Vinayakanagara 1st A Cross Children's Playground & Park"
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
      zone = await Zone.create({ name: data.zone, code: "Z-02", districtId: district._id, corporationId: corporation._id });
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
