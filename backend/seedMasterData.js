const mongoose = require('mongoose');
const dotenv = require('dotenv');
const District = require('./models/District');
const Corporation = require('./models/Corporation');
const Zone = require('./models/Zone');
const Ward = require('./models/Ward');
const Park = require('./models/Park');

dotenv.config();

const karnatakaDistricts = [
  "Bagalkot", "Bangalore Rural", "Bangalore Urban", "Belagavi", "Ballari", 
  "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", 
  "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Kalaburagi", 
  "Hassan", "Haveri", "Kodagu", "Kolar", "Koppal", 
  "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", 
  "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir", "Vijayanagara"
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await District.deleteMany({});
    await Corporation.deleteMany({});
    await Zone.deleteMany({});
    await Ward.deleteMany({});
    await Park.deleteMany({});
    console.log('Cleared existing data.');

    let distBlr = null;
    let corpBbmp = null;
    let zoneSouth = null;
    let ward111 = null;
    let ward153 = null;

    let i = 1;
    // Loop and create all districts, corporations, zones, wards
    for (const distName of karnatakaDistricts) {
      const code = distName.substring(0, 3).toUpperCase() + i.toString();
      const district = await District.create({ name: distName, code: code, description: `${distName} District` });
      
      const corp = await Corporation.create({ districtId: district._id, name: `${distName} City Corporation`, code: `${code}-CC`, description: `${distName} City Corporation` });
      
      const zoneN = await Zone.create({ districtId: district._id, corporationId: corp._id, name: 'North Zone', code: `${code}-NZ` });
      const zoneS = await Zone.create({ districtId: district._id, corporationId: corp._id, name: 'South Zone', code: `${code}-SZ` });
      
      const w1 = await Ward.create({ districtId: district._id, corporationId: corp._id, zoneId: zoneN._id, name: `${distName} Ward 1`, wardNumber: `${i}1` });
      const w2 = await Ward.create({ districtId: district._id, corporationId: corp._id, zoneId: zoneN._id, name: `${distName} Ward 2`, wardNumber: `${i}2` });
      
      const w3 = await Ward.create({ districtId: district._id, corporationId: corp._id, zoneId: zoneS._id, name: `${distName} Ward 3`, wardNumber: `${i}3` });
      const w4 = await Ward.create({ districtId: district._id, corporationId: corp._id, zoneId: zoneS._id, name: `${distName} Ward 4`, wardNumber: `${i}4` });
      
      i++;

      // Save the specific Bangalore Urban items to seed the specific parks later
      if (distName === "Bangalore Urban") {
        distBlr = district;
        corpBbmp = corp;
        zoneSouth = zoneS;
        ward111 = w3;
        ward153 = w4;
        
        // Also add the historical BBMP wards from previous seed to maintain compatibility if needed
        await Ward.create({ districtId: district._id, corporationId: corp._id, zoneId: zoneS._id, name: 'Shantala Nagar', wardNumber: '111' });
        await Ward.create({ districtId: district._id, corporationId: corp._id, zoneId: zoneS._id, name: 'Jayanagar', wardNumber: '153' });
      }
    }

    if (distBlr && corpBbmp && zoneSouth) {
      // 5. Create some Parks for Bangalore Urban to keep the dashboard working
      await Park.create({
        district: distBlr._id,
        corporation: corpBbmp._id,
        zone: zoneSouth._id,
        ward: ward111._id,
        name: 'Cubbon Park',
        parkCode: 'P-111-01',
        address: 'Kasturba Road',
        latitude: '12.9779',
        longitude: '77.5952',
        area: '300 Acres',
        parkType: 'Botanical',
        numberOfTrees: 6000,
        numberOfBenches: 150,
        numberOfLights: 300,
        numberOfDustbins: 50,
        childrenPlayArea: true,
        walkingTrack: true,
        openGym: false,
        garden: true,
        lake: true,
        restrooms: true,
        parking: true,
        images: ['/uploads/parks/placeholder1.jpg']
      });

      await Park.create({
        district: distBlr._id,
        corporation: corpBbmp._id,
        zone: zoneSouth._id,
        ward: ward153._id,
        name: 'Madhavan Park',
        parkCode: 'P-153-01',
        address: 'Jayanagar 3rd Block',
        latitude: '12.9354',
        longitude: '77.5847',
        area: '10 Acres',
        parkType: 'Neighborhood',
        numberOfTrees: 200,
        numberOfBenches: 30,
        numberOfLights: 40,
        numberOfDustbins: 15,
        childrenPlayArea: true,
        walkingTrack: true,
        openGym: true,
        garden: true,
        lake: false,
        restrooms: true,
        parking: false,
        images: ['/uploads/parks/placeholder2.jpg']
      });
    }

    console.log('Database seeded successfully with all 31 Karnataka Districts!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding DB:', error);
    process.exit(1);
  }
};

seedDB();
