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
  zone: "Zone-2 — Rajajinagara / Malleshwaram",
  wards: [
    { name: "Mathikere", number: "48", parks: ["R.K. Garden Park (near Gowri Apartment)", "Park near Chandrodaya School"] },
    { name: "Aramane Nagara", number: "49", parks: ["Sankey Lake Park", "Kempegowda North Tower Park", "Janatha Bazar Park", "Hopcoms Society Park", "K.C. Reddy Swimming Pool Park", "M.S. Ramaiah Park (AGS Layout)", "Low Level Park", "East West Park", "IDL Park", "Island Park", "Palace Guttahalli Island Park"] },
    { name: "Rajamahal", number: "51", parks: ["Swimming Pool Park (10th Cross)", "Guttahalli Hospital Park", "Guttahalli Triangular Park", "Anantha Krishna Rao Park", "Dattatreya Temple Park", "Maszid Park"] },
    { name: "Malleshwaram", number: "53", parks: ["Park near Yeshwanthapura Police Station", "Balasubramanyam Park"] },
    { name: "Subramanyanagara", number: "55", parks: ["Milk Colony Park (Parts 1 & 2)", "Sangolli Rayanna Park", "Vyalikaval Park"] },
    { name: "Dayanand Nagara", number: "58", parks: ["Labour Colony Park (Bhashyam Nagara)", "Dayananda Nagar Park"] },
    { name: "Prakash Nagara", number: "60", parks: ["Gayathridevi Park", "Sarakari Gudda Park"] },
    { name: "Rama Mandira", number: "62", parks: ["Lalithamba Ganapathi Park", "A B C Park", "Mahadeva Banakar Park", "Vykunta Park", "Park in front of Madhu Hotel", "Dharma Naidu Park"] },
    { name: "Rajajinagara", number: "63", parks: ["9th/10th Cross Park (Adarsha Layout)", "Kalyana Venkateshwara Park", "Gayathri Housing Society Park", "LIC Colony Park", "Navarang Park", "RTO Complex Park", "R.V. Apartment Park"] },
    { name: "Shivanagara", number: "64", parks: ["Shivanagar Park", "Park beside Pushpanjali Theatre", "Dhobhi Ghat Park", "Muthyalamma Park"] },
    { name: "Basaveshwara Nagara", number: "67", parks: ["Sir M. Vishweshwaraiah Park (University Layout)", "Nethaji Subashchandra Bhoss Park & Playground"] },
    { name: "Kamakshipalya", number: "68", parks: ["S.B.I. Colony Park", "Sharada Colony Park", "Aladamara Park", "KHB Colony Parks"] },
    { name: "Agrahara Dasarahalli", number: "69", parks: ["Nandanavana Park", "Naveen Park", "Vivekananda Park", "Basavavana Park", "Dasarahalli IPP Hospital Park"] },
    { name: "Dr Rajkumar Ward", number: "70", parks: ["Park in front of Library", "HT Line Parks", "Ambedkar Stadium Park", "Boulevard Park", "Banashankari Temple Park"] },
    { name: "Thimmenahalli", number: "71", parks: ["Thimmenahalli Park & Playground"] },
    { name: "Kaveripura", number: "72", parks: ["Siddaruda Park", "Prashanthi Vana (Parts 1–5)", "Sai Baba Temple Park", "Balayyana Lake Park"] },
    { name: "Marenahalli West", number: "75", parks: ["Amarjyothinagar Park", "Park behind Udaya School", "MC Layout HT Line Park", "Mini Bazar Park"] },
    { name: "Moodalapalya", number: "76", parks: ["Kailasagiri Park", "Akkamahadevi Park", "Kitthur Rani Chennamma Park", "Swamy Vivekananda Park", "Salumarada Thimmakka Park"] },
    { name: "Maruthi Mandira Ward", number: "77", parks: ["Ward Office Park", "P.F. Layout Park", "G.K.W. Layout Park", "Vinayaka Layout Park", "Canara Bank Colony Park"] },
    { name: "Nagarbhavi", number: "79", parks: ["Central Teachers Colony Park", "Ayyappa Swamy Temple Park", "NGEF Layout Park", "Arundathi Nagar Park"] },
    { name: "Chandra Layout", number: "80", parks: ["BCC Layout Parks", "Binny Layout", "Ganesha Temple Backside Park", "Widia Layout Park"] },
    { name: "Nayanda Halli", number: "81", parks: ["Suvarna Nagara Layout Park", "ITI Layout Parks (1–3)"] },
    { name: "Attigupe", number: "82", parks: ["80 feet Road Park", "Sky Line Apartment Park", "Income Tax Layout Park"] },
    { name: "Hampi Nagar", number: "83", parks: ["Swimming Pool Park", "Alada Mara Park", "Remco Layout Park", "Vijayanagar Boulevard SBI Opp. Park"] },
    { name: "Hosahalli", number: "84", parks: ["Pipe Line Boulevard (Parts 1–3)", "Telecom Layout Park", "Hosahalli Park"] },
    { name: "Adi Chunchanagiri Ward", number: "85", parks: ["West of Chord Road Park (opp. Adi Chunchanagiri)"] },
    { name: "Vidyaranyanagara", number: "86", parks: ["Vidyaranya Nagar Park (Prameela Bhai Maane School)"] },
    { name: "Sangolli Rayanna Ward", number: "88", parks: ["Sangolli Rayanna Park"] },
    { name: "Bapuji Nagara", number: "89", parks: ["Nrupathunga/Bapuji Nagar Park"] },
    { name: "Gali Anjaneya Temple Ward", number: "91", parks: ["Telecom Layout Park", "Avalahalli IPP Compound Park", "Kasturiba Nagar Maternity Hospital Park"] },
    { name: "Avalahalli", number: "93", parks: ["Avalahalli 50ft Road Park (shared cluster with Ward 94)"] },
    { name: "Deepanjali Nagara", number: "94", parks: ["Rashtra Kavi Kuvempu Rangamandira Park"] },
    { name: "Kathriguppe", number: "96", parks: ["Mysore Mallige Park", "Kempegowda Layout Park"] },
    { name: "Srinagar", number: "100", parks: ["Srinagar Park"] },
    { name: "Kempambudhi Ward", number: "101", parks: ["Kempabudhi Half & Full Parks", "Tagore Circle Park", "National College Nursery"] },
    { name: "Hanumanthanagar", number: "102", parks: ["Deer Park", "Hari Hara Gudda Park", "Veerabhadra Temple Park", "Swimming Pool Park"] },
    { name: "Yediyuru", number: "105", parks: ["Yediyur Lake Park", "Ambedkar Park", "Laxman Rao Boulevard Parks"] },
    { name: "Dharmagiri Ward", number: "107", parks: ["Dharmagiri Manjunath Swamy Temple Park"] },
    { name: "Ganesh Mandira Ward", number: "108", parks: ["Banashankari 2nd Stage Brundavana Park", "DVG Park", "Banagiri Park", "Kuvempu Park"] },
    { name: "Chikkalasandra", number: "110", parks: ["Bhuvaneshwarinagar Park", "Dena Bank Colony Park"] },
    { name: "Ittamadu", number: "111", parks: ["Ittamadu Main Road Park", "KEB Park", "Ganapathi Temple Park"] },
    { name: "Hosakerehalli", number: "112", parks: ["Anjananagar Park", "Hill View Apartment Park", "Nandanavana Park"] }
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
      zone = await Zone.create({ name: data.zone, code: "Z-11", districtId: district._id, corporationId: corporation._id });
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
