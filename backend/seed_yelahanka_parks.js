require('dotenv').config();
const mongoose = require('mongoose');
const District = require('./models/District');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const Park = require('./models/Park');

const data = {
  district: "Bangalore Urban",
  corporation: "Bengaluru North City Corporation",
  zone: "Zone-1 — Yelahanka",
  wards: [
    {
      name: "Chowdeshwari Ward",
      number: "2",
      parks: [
        "Puttenahalli Park"
      ]
    },
    {
      name: "Yelahanka Satellite Town",
      number: "5",
      parks: [
        "12th and 13th Cross B Sector P B 5 in Yelahanka Newtown",
        "3rd and 4th Main P A 2 in Yelahanka Newtown",
        "6th and 7th Main Opp. to RTO Office P B 1 in Yelahanka Newtown",
        "GKVK Park Judicial Layout in Yelahanka",
        "6th and 7th Main OM Prakruthi Park P B 2 in Yelahanka Newtown",
        "3rd and 4th Main P B 4 in Yelahanka Newtown",
        "4th and 5th Cross P A 5 in Yelahanka Newtown",
        "Telecom Layout JNIAS Park",
        "11th Main 5th Cross A Sector P A 1 in Yelahanka Newtown",
        "Judicial Layout",
        "B Sector 20th and 21st Cross P B 8 in Yelahanka Newtown",
        "Allalasandra Park",
        "16th B Anjaneya Temple Park in Yelahanka Newtown",
        "17th and 18th Cross B Sector in Yelahanka Newtown",
        "7th B Main B Sector Sharadanagara Arch in Yelahanka Newtown",
        "22nd and 24th Cross P B 10 in Yelahanka Newtown",
        "Judicial Layout Kanaka Nagara Park",
        "16th B Cross Opp. to House No. 1150 in Yelahanka Newtown",
        "6th and 7th Main A Sector P A 3",
        "Yelahanka Mother Dairy Boulevard",
        "10th and 11th Main A Sector P A 4 Park",
        "6th and 7th Main B Sector Basavalingappa Park P B 2",
        "9th and 10th Main B Sector P B 3",
        "22nd Cross Park P B 9"
      ]
    },
    {
      name: "Attur",
      number: "7",
      parks: [
        "SFS 208 Opp. to Mother Dairy and 1st Main Park P 208 1",
        "SFS 208 Opp. to Mother Dairy 2nd Main P 208 2 Park No. 2",
        "SFS 407 1st and 3rd Main P 407 3",
        "SFS 208 1st Main and 2nd Main Behind House No. 1 P 208 5",
        "SFS 208 1st Main and 2nd Main P 208 6",
        "SFS 208 2nd Main and 4th Main P 208 7 and 8",
        "SFS 407 4th Main and SFS 707 Main",
        "SFS 407 4th Main P 407 1",
        "SFS 407 2nd Cross Between Apartment",
        "4th Phase Nagarjuna Apartment Park",
        "SFS 407 3rd A and 4th A Main P 407 2",
        "SFS 407 6th Cross Vinayaka Temple Park",
        "SFS 407 12th Main EXP 63 Park",
        "Doddaballapura Double Road Park",
        "4th Phase 3rd Cross Opp. House No. 229",
        "4th Phase 1st Cross Opp. House No. 90",
        "4th Phase 5th Cross House No. 381 C 5 Park",
        "SFS 208 1st Main 2nd Cross",
        "4th Phase 5th Main Park P 5 10",
        "4th Phase 6th Cross House No. 20 C 1",
        "5th Phase 8th Main Park No. 2",
        "2nd and 3rd Main CHS 707 Govt. School Ganapathi Temple Park C 6",
        "4th Phase 2nd Cross House No. 141 Park",
        "4th Phase 12th Cross Opp. House No. 637 Park",
        "Park at SFS 208 3rd Cross and 4th Main P 208 9",
        "Park at Yelahanka 4th Phase 1st Cross",
        "Park at 4th Phase Behind Mirindaa School",
        "Sai Garden Layout Park No. 1",
        "Sai Garden Layout Park No. 2",
        "Sai Garden Layout Park No. 3",
        "Sai Garden Layout Park No. 4",
        "Sai Garden Layout Park No. 5",
        "3rd Cross Industrial Area in Yelahanka Newtown Park",
        "Deo Marvel Layout 5th Main Park",
        "GKVK Layout Park No. 2"
      ]
    },
    {
      name: "Kuvempunagara",
      number: "9",
      parks: [
        "Singapura Paradise Layout Park",
        "Ganesha Layout Park in M.S. Palya",
        "Ramachandrapura Park",
        "Gutte Vinayaka Temple Park in Kuvempu Nagara",
        "Lakkappa Layout Park in Singapura Circle"
      ]
    },
    {
      name: "Vidyaranyapura",
      number: "10",
      parks: [
        "HMT Layout in Vidyaranyapura",
        "Canara Bank Layout Ganesha Temple Park",
        "3rd Block Anjaneya Temple Park",
        "Canara Bank 7th Cross Park",
        "Vidyaranyapura 6th Block and Main Park",
        "BEL Layout 6th Block 4th and 6th Main Park",
        "Vidyaranyapura 6th Block Park",
        "Vidyaranyapura 6th Block Near Bus Stop Park",
        "BEL Layout 6th Block Park No. 04",
        "Near Govt. School Park in Thindlu Village"
      ]
    },
    {
      name: "Doddabommasandra",
      number: "11",
      parks: [
        "Vidyaranyapura 2nd Block 4th Main Park"
      ]
    },
    {
      name: "Kodigehalli",
      number: "13",
      parks: [
        "Sahakaranagara Park No. 03",
        "Tata Nagara Layout Park",
        "Sahakaranagara CQAL Layout Park",
        "Vidyaranyapura NTI Layout Park",
        "Tata Nagara Park No. 02"
      ]
    },
    {
      name: "Byatarayanapura",
      number: "15",
      parks: [
        "3rd Phase UAS Layout in Jakkuru",
        "UAS Layout Shivanahalli Park in Jakkuru",
        "UAS Layout Narasimhaswamy Road Park in Jakkuru",
        "UAS Layout Chandra Shekara Kambara Road Park in Jakkuru",
        "Coffee Board Layout Park",
        "Kodigehalli Gundanjaneya Temple",
        "Ravishankar Layout Sanjeevini Nagara Park",
        "Sahakaranagara Park No. 01",
        "Sahakaranagara Park No. 02"
      ]
    },
    {
      name: "Amruthahalli",
      number: "16",
      parks: []
    },
    {
      name: "Jakkur",
      number: "17",
      parks: [
        "Near Dwaraka Nagara School Park",
        "Near Ashrama in Kattigenahalli Park",
        "Telecom Layout Park",
        "Prakruthi Layout Park in Kogilu Road",
        "Near Railway Gate Park in MCEHS Layout",
        "Vinfield Layout Main Road Park",
        "3rd and 4th Cross in Vinfield Layout Park",
        "Agrahara Layout Hospital Premises Park",
        "Jakkuru Aerodrum Park",
        "UAS Layout Jakkuru"
      ]
    },
    {
      name: "Thanisandra",
      number: "19",
      parks: [
        "Bhuvaneshwarinagara Park",
        "MCEHS Layout Park",
        "5th Cross Shabhari Nagara Park Hegade Nagara",
        "8th Cross Park in MCEHS Layout",
        "Rachenahalli Park",
        "Near Chamundi Temple Bhuvaneshwari Layout Park in Rachenahalli"
      ]
    },
    {
      name: "Kogilu",
      number: "21",
      parks: []
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
      corporation = await Corporation.create({ name: data.corporation, code: "BNCC-01", districtId: district._id });
      console.log("Created Corporation:", data.corporation);
    }

    // Get or Create Zone
    let zone = await Zone.findOne({ name: data.zone, corporationId: corporation._id });
    if (!zone) {
      zone = await Zone.create({ name: data.zone, code: "Z-04", districtId: district._id, corporationId: corporation._id });
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
