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
  zone: "Zone-1 — Jayanagar",
  wards: [
    {
      name: "Padmanabhanagara",
      number: "1",
      parks: [
        "R.K. Layout Park (1st Stage, 7th/8th cross)",
        "R.K. Layout Park (2nd Stage, Kavikatte Road)",
        "Telecom Layout Park",
        "Gururaja Layout Children's Park",
        "Bharath Housing Layout Park (Parts 1 & 2)",
        "Samrudhi Nagar Park (12th Cross Road)",
        "Gangadareshwara Swamy Temple & Lakshmikantha Swamy Gudda Park"
      ]
    },
    {
      name: "Kadirenahalli",
      number: "2",
      parks: [
        "Kadirenahalli Park (35th Cross, Ring Road)"
      ]
    },
    {
      name: "Kumaraswamy Layout",
      number: "3",
      parks: [
        "ISRO Layout Park (16th/17th Cross)",
        "ISRO Layout Drainage Park",
        "ISRO Layout Park (1st & 2nd Main)",
        "Kumaraswamy Layout Hoysala Park (15th/16th Main)",
        "Kumaraswamy Layout Park (14th Main, near Police Station)",
        "Kumaraswamy Layout Triangular Park (53rd–58th Main)",
        "Lava Kusha Park (35th–36th Cross)",
        "Pushpanjali Park (33rd–34th Cross)",
        "Kanaka Layout Park (1st Main)",
        "J.H.B.C.S. Park (2nd & 3rd Main)",
        "Kumaraswamy Layout Park (44th/45th Cross)",
        "Dairy Park (14th Main, 19th/20th Cross)",
        "ISRO Layout Children's Playground Park"
      ]
    },
    {
      name: "Banashankari Temple Ward",
      number: "4",
      parks: [
        "Park in front of Library (Police Quarters)",
        "Banashankari Temple Park (Police Quarters)",
        "HT Line Park (5th & 4th Main)",
        "HT Line Park (2nd & 1st Main)",
        "Ambedkar Stadium Park",
        "Boulevard Park (Parts 1–6)"
      ]
    },
    { name: "Kane Muneshwara Ward", number: "5", parks: [] },
    { name: "Gowdanapalya", number: "6", parks: [] },
    {
      name: "Byrasandra",
      number: "7",
      parks: [
        "Byrasandra Swimming Pool Park",
        "Byrasandra Bhavi Park (18th Cross)",
        "L.I.C. Colony Park (2nd & 3rd Cross)",
        "Jayanagar Complex Park",
        "Byrasandra Village & Playground Park"
      ]
    },
    {
      name: "Tilak Nagara",
      number: "8",
      parks: [
        "Jayanagar 4th Block Bhavi Park (34th/35th Cross)",
        "Jayanagar 4th T Block Park (near Bangalore-One Office)",
        "Jayanagar 4th T Block Park (Shakthi Ganapathi Temple Opp.)",
        "Jayanagar 4th T Block Park (behind MLA Office)",
        "L.I.C. Colony Park (shared with Ward 7)"
      ]
    },
    {
      name: "N.A.L Layout",
      number: "9",
      parks: [
        "Nimhans Colony Park (8th 'A' Main)",
        "K.E.B. Layout Park (Sai Baba Temple Opp.)",
        "N.A.L. Layout Park (1st/3rd/4th Main)",
        "East End 'A', 'B', 'C', 'D' Main Road Parks",
        "N.A.L. Layout Children's Park",
        "N.A.L. Layout Park (3rd/4th Main; 4th Cross)"
      ]
    },
    {
      name: "Jayanagar East",
      number: "11",
      parks: [
        "Jayanagar 9th T Block Children's Play Park (28th Main, 36th Cross)"
      ]
    },
    {
      name: "Pattabhirama Nagara",
      number: "12",
      parks: [
        "Pattabhi Ram Nagar (G.N.R) Park",
        "Dr. Vishnu Vardhan Vishranthi Vana Park",
        "Akka Mahadevi Park (Marenahalli, Part I)",
        "Jayanagar 4th Block Bhavi Park (shared with Ward 8)"
      ]
    },
    {
      name: "Marenahalli South",
      number: "13",
      parks: [
        "Akka Mahadevi Park, Marenahalli (shared with Ward 12)",
        "KSRTC Layout Park (Part 1, 5th/6th Main)",
        "JP Nagar 2nd Stage KSRTC Layout Park (Part 2, HT Line)"
      ]
    },
    {
      name: "J.P Nagar",
      number: "14",
      parks: [
        "J.P. Nagar 3rd Stage Mini Forest / AnandaVana Park (Ring Road side)",
        "J.P. Nagar 8th Main, 12th Cross Park",
        "J.P. Nagar 4th Stage Park (near Chinmaya Mission/Clarence School)",
        "J.P. Nagar 4th Block Park (16th Cross)",
        "Freedom Park (J.P. Nagar 4th Block, 2nd Cross)",
        "J.P. Nagar 3rd Stage Mini Forest Parts 2, 3 & 4",
        "J.P. Nagar 4th Stage Dollars Colony Park (near Hopcoms)",
        "Maruthi Layout Park (2nd/1st Cross)"
      ]
    },
    {
      name: "Shakambarinagara",
      number: "15",
      parks: [
        "Dhanvantri Park (20th/21st Main, 10th/12th Cross)",
        "Park near Oxford School (11th/13th Cross)",
        "J.P. Nagar 1st Stage Park (27th Main, 12th Cross)",
        "J.P. Nagar 2nd Stage Park (Senior Citizen/Ward Office backside)",
        "J.P. Nagar 5th Stage Park (near Hopcoms)",
        "J.P. Nagar 1st Stage Park (KEB backside, Sindhoora Kalyana Mantapa)",
        "J.P. Nagar 2nd Stage Park (Below HT Line)",
        "J.P. Nagar 1st Stage Park (34th Main, near BWSSB Tank)",
        "J.P. Nagar 6th Stage Park (Kashi Vishwanatha Temple)",
        "J.P. Nagar 5th Stage Park (near Shiva Temple)"
      ]
    },
    {
      name: "Viswamanava Kuvempu Ward",
      number: "18",
      parks: [
        "Kuvempu Park & Playground (BTM 2nd Stage, MICO Layout)",
        "Nandavana Park (BTM Layout 2nd Stage, MICO Layout)",
        "N.S. Palya IPP Park (1st Main, 12th Cross)",
        "BTM Layout Parks (Shakthi Ganapathi Temple front & back)",
        "IAS Officers' Colony Park",
        "KAS Officers' Layout Park (39th Main)",
        "EWS Colony Park (MES College backside)",
        "BTM Layout MICO/SFHS Parks (two entries)",
        "BTM Layout Triangular Park (6th/7th Cross)"
      ]
    },
    {
      name: "New Tavarekere",
      number: "19",
      parks: [
        "BTM Layout 1st Stage Park (KEB Office backside)",
        "BTM Layout 1st Stage Ward Office Park",
        "BTM Layout Dollar Sector Park",
        "BTM Layout Madivala-Thavarekere Ashwath Katte Park",
        "BTM Layout Park (Samparka Kendra)",
        "BTM Layout Venkateshwara Layout Park",
        "BTM Layout Vinayaka Layout Ashwath Katte Park"
      ]
    },
    {
      name: "Madiwala",
      number: "20",
      parks: [
        "Thavarekere Park (Rashtra Kavi Kuvempu)",
        "Jogi Colony Park",
        "Madivala Under Bridge Park (Shani Mahatma Temple Opp.)"
      ]
    },
    {
      name: "Chikka Adugodi",
      number: "21",
      parks: [
        "Jogi Colony Park (overlap with Ward 20)"
      ]
    },
    {
      name: "Lakkasandra",
      number: "23",
      parks: [
        "Rani Park, Wilson Garden",
        "Homebegowda Nagar Bhuvaneshwari Park",
        "Lakkasandra Park",
        "Lakkasandra Swimming Pool Tree Park"
      ]
    },
    {
      name: "Adugodi",
      number: "24",
      parks: [
        "Chamundi Park, Koramangala 7th Block",
        "Dr. B.R. Ambedkar Park, Koramangala 8th Block",
        "Koramangala 7th Block Nanjappa Block Park",
        "Adugodi Police Quarters Prakruthi Vana Park",
        "Adugodi Police Playground Kadamba Park",
        "Koramangala 7th Block Park (Mangala Kalyana Mantapa Opp.)",
        "Panchavathi Park (Police Quarters)",
        "Park opp. ACP Office Guest House",
        "Koramangala 7th Block Triangular Park",
        "Lakshmi Devi Samadhi Park"
      ]
    },
    {
      name: "Ejipura",
      number: "26",
      parks: [
        "S.T. Bed Park, Ejipura",
        "Ejipura Samparka Kendra Park (80ft Road)",
        "Koramangala 1st Block Drainage Park",
        "Ejipura S.T. Bed Children's Playground"
      ]
    },
    {
      name: "Sri Lakshmi Devi Ward",
      number: "27",
      parks: [
        "Koramangala Lakshmi Devi Park, 7th Block",
        "Koramangala 6th Block Park (Subramanya Temple)",
        "Koramangala 6th Block Eco Park",
        "Koramangala 6th Block Park (18th Main, 3-A Cross)",
        "Koramangala 5th Block Park, K.H.B. Colony",
        "Koramangala 5th Block Park (Opp. Ward Office)",
        "Koramangala 5th Block Ganapathi Temple Park",
        "Koramangala 5th Block Park (near Raghavendra School)",
        "Koramangala 5th Block Park (5th 'B', 2nd A Cross)"
      ]
    },
    {
      name: "Kormangala East",
      number: "28",
      parks: [
        "Koramangala 4th C Block BDA Hopcoms Park",
        "Koramangala 4th Block Rectangular Park",
        "Koramangala 3rd Block Park (10th–12th Main)",
        "Koramangala 4th Block Park (2nd A Cross, BDA)",
        "Koramangala 3rd 'J' Block Park",
        "Koramangala 3rd Block Reheja Residency Park",
        "Koramangala 4th Block Atti Mara Park",
        "Koramangala Park opp. BBMP Ward Office",
        "Koramangala 1st Block Drainage Park (shared with Ward 26)"
      ]
    },
    {
      name: "Kormangala West",
      number: "29",
      parks: [
        "Koramangala Park (17th 'G'/'H' Main, K.H.B. Colony)",
        "Koramangala 1st Block Park (Wipro, 80ft Road)",
        "Koramangala 4th Block Fountain Park",
        "Koramangala 7th Block parks (overlap with Ward 24)"
      ]
    },
    {
      name: "Kasavanahalli",
      number: "31",
      parks: [
        "Ambalipura Park (Haralur Road)"
      ]
    },
    {
      name: "Kudlu",
      number: "32",
      parks: [
        "Singasandra Govt. Hospital Premises Park",
        "Kudlu Ward Office Park",
        "A.E.C.S. Layout Park, Singasandra (near HT line)"
      ]
    },
    {
      name: "Yelenahalli",
      number: "37",
      parks: [
        "Royal Lakefront Residency Layout Park",
        "Gottigere Gram Panchayat Office Park (Bannerghatta Main Road)"
      ]
    },
    { name: "Gottigere", number: "39", parks: [] },
    {
      name: "RBI Layout",
      number: "42",
      parks: [
        "RBI Layout Park (10th A Main)",
        "RBI Layout Park (8th Main, 7th Cross)",
        "Vilsan Garden House Co-op Society Layout Park",
        "RBI Layout Park (4th Main, 3rd/4th Cross)"
      ]
    },
    {
      name: "Harinagar",
      number: "44",
      parks: [
        "Avalahalli Mythriya Vana Park",
        "Avalahalli Agasya Vana Park",
        "Avalahalli Agasya Vana (South) Park",
        "Konanakunte Park (Anjanapura Road, Govt. Hospital Quarters)"
      ]
    },
    {
      name: "Konanakunte",
      number: "45",
      parks: [
        "Royal Residency Layout Park, Avalahalli"
      ]
    },
    {
      name: "Vasanthapura",
      number: "48",
      parks: [
        "ISRO Layout Park (17th Cross, Bangalore South)",
        "Jayanagar Housing Society Park",
        "Ramanjaneya Layout Park (4th Main)",
        "Maruthy Layout Park, Vasanthapura"
      ]
    },
    {
      name: "Uttarahalli",
      number: "49",
      parks: [
        "Bharath Co-operative Housing Society Park (near Patalamma)",
        "Poornapragna Layout Park (21st Cross)",
        "Patalamma Temple Premises Park",
        "Poornapragna Layout Park (BMTC Bus-stop)",
        "Uttarahalli Junction Park (near BBMP Helpline)",
        "AGS Layout Park, Arehalli"
      ]
    },
    {
      name: "Subramanyapura",
      number: "51",
      parks: [
        "AGS Layout Park, Arehalli (shared with Ward 49)"
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
      zone = await Zone.create({ name: data.zone, code: "Z-06", districtId: district._id, corporationId: corporation._id });
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
