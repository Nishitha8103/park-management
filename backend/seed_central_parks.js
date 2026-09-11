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
  zone: "Zone-1 — CV Raman Nagar / Mayohall side",
  wards: [
    {
      name: "Ramaswamy Palya",
      number: "1",
      parks: [
        "Chinnappa Garden I.T.I. Layout 4th Main Road Park",
        "Chinnappa Garden I.T.I. Layout Ganesh Temple Park"
      ]
    },
    {
      name: "Jayamahal",
      number: "2",
      parks: [
        "Jayamahal Park",
        "Javaharlal nehru Taralya park",
        "Taskar Town Park",
        "Balappa Garden",
        "Queens Road Ward Office Premises Park",
        "Jayamahal Park Musical Dancing fountain"
      ]
    },
    {
      name: "Sampangirama Nagar",
      number: "4",
      parks: [
        "Banappa Park",
        "Sampangi Tank Park",
        "Freedom fighter Park",
        "Kempegowda Statue Park",
        "Head Office Premises Park",
        "Head Office Swimming Pool Park",
        "Hudson Circle",
        "Head Office Out side & inside Premises Park"
      ]
    },
    {
      name: "Shivajinagar",
      number: "5",
      parks: [
        "Nehru Nagara"
      ]
    },
    {
      name: "Bharathi Nagar",
      number: "6",
      parks: [
        "Memorial Park"
      ]
    },
    {
      name: "Hoysala Nagara Central",
      number: "9",
      parks: [
        "Opp Market Murphy Town Park",
        "Murphy Town Park",
        "Jayarajanagar Murphy Town Park",
        "Indiranagar 17th Cross Children's Park",
        "17th Cross Mini Forest Indiranagar 2nd Stage park",
        "Mini Forest 13th Cross Park",
        "Indiranagar 13th Cross Park",
        "Indirangara 1st stage BDA Park",
        "Indirangara 1st stage BM Sree Circle Park",
        "Binamangala Kaval Indirangara park",
        "Indirangara Defiance Colony 2nd &4th Main Road Park",
        "Defiance Colony 2nd &3th Main Road Dicora Park",
        "Defiance Colony 4th Main ward office Park"
      ]
    },
    {
      name: "Konena Agrahara",
      number: "21",
      parks: [
        "B.D.A Layout 4th Main road, H.A.L 3rd Stage Park",
        "H.A.L. 3rd stage 2nd Cross, 4th Main Road Park"
      ]
    },
    {
      name: "Domluru",
      number: "22",
      parks: [
        "Dr: Ambedkar Park 10th Main Road, 7th Cross, (Near ESI Hospital) park",
        "Domalur 2nd Stage, 5th Main road, 1st Cross Park",
        "Domalur Opp B.D.A. Complex Park",
        "Domalur Suvrna Mathosava Park",
        "Domalur 2nd stage, 3rd 'D' Cross 2nd Main Road, Near Club house park",
        "H.A.L 2nd stage, 13th A Main Road Park",
        "Domalur 2nd Main 2nd Cross Road Park"
      ]
    },
    {
      name: "Jogpalya",
      number: "23",
      parks: [
        "Someshwar layout 3rd Main, Opp Sai baba Hospital Park",
        "Jogupalya (Gundappa) Park",
        "Someswarpura Layout Cambridge Park",
        "Ulsoor Maternity Hospital Park",
        "Udani Badavane Jogupalya park"
      ]
    },
    {
      name: "Shanthinagar",
      number: "31",
      parks: [
        "Shanthinagar Maternity Hospital Park",
        "8th Main Road Vivekanagar Park",
        "Vivekanagar Behind I.P.P Hospital Park"
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
      zone = await Zone.create({ name: data.zone, code: "Z-01", districtId: district._id, corporationId: corporation._id });
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
