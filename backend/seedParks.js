const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Park = require('./models/Park');
dotenv.config();

const zones = [
  "East", "West", "South", "North", 
  "Rajarajeshwari Nagar", "Dasarahalli", 
  "Yelahanka", "Bommanahalli", "Mahadevapura"
];

const facilitiesList = [
  "Walking Track", "Playground", "Open Gym", "Gazebo", 
  "Benches", "Restrooms", "Drinking Water", "Children Area",
  "Jogging Track", "Lake", "Musical Fountain", "Statues", "Skating Rink",
  "Yoga Area", "Badminton Court", "Lush Trees", "Sand Pit"
];

const imagesList = [
  "https://images.unsplash.com/photo-1585938389612-a552a28d6914?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1596422846543-72362b8875c7?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1600096194534-95cf5ece04cf?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1594498653385-d5172c532c00?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1563241527-2004cb5e3789?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1605142859862-37861d50b811?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1444212477810-20f11aa1a4c9?auto=format&fit=crop&q=80&w=800"
];

// The 10 famous parks from before
const famousParks = [
  { name: "Cubbon Park", ward: "111", zone: "Central", corporation: "BBMP", facilities: ["Walking Track", "Bamboo Grove", "Bandstand", "Library", "Toy Train"], status: "Active", images: [imagesList[0]] },
  { name: "Lalbagh Botanical Garden", ward: "153", zone: "South", corporation: "BBMP", facilities: ["Glass House", "Lake", "Walking Track", "Bonsai Garden", "Floral Clock"], status: "Active", images: [imagesList[1]] },
  { name: "Bugle Rock Park", ward: "154", zone: "South", corporation: "BBMP", facilities: ["Walking Track", "Amphitheatre", "Ancient Rocks", "Watchtower"], status: "Active", images: [imagesList[2]] },
  { name: "Jayaprakash Narayan Biodiversity Park (JP Park)", ward: "17", zone: "Rajarajeshwari Nagar", corporation: "BBMP", facilities: ["Lake", "Musical Fountain", "Jogging Track", "Nature Trail"], status: "Active", images: [imagesList[3]] },
  { name: "M.N. Krishna Rao Park", ward: "154", zone: "South", corporation: "BBMP", facilities: ["Playground", "Pavilion", "Jogging Track", "Skating Rink"], status: "Active", images: [imagesList[4]] },
  { name: "Ranadheera Kanteerava Park", ward: "169", zone: "South", corporation: "BBMP", facilities: ["Statues", "Children Play Area", "Jogging Track", "Open Gym"], status: "Active", images: [imagesList[5]] },
  { name: "Sankey Tank Park", ward: "64", zone: "West", corporation: "BBMP", facilities: ["Lake", "Boating", "Walking Track", "Benches"], status: "Active", images: [imagesList[6]] },
  { name: "Nandavana Children's Park", ward: "177", zone: "South", corporation: "BBMP", facilities: ["Play Equipment", "Sand Pit", "Benches", "Restrooms"], status: "Active", images: [imagesList[7]] },
  { name: "Binnamangala Park", ward: "89", zone: "East", corporation: "BBMP", facilities: ["Gym", "Walking Track", "Benches", "Lush Trees"], status: "Active", images: [imagesList[8]] },
  { name: "Kasturi Nagar Park", ward: "51", zone: "Mahadevapura", corporation: "BBMP", facilities: ["Walking Track", "Children Area", "Open Gym", "Gazebo"], status: "Active", images: [imagesList[9]] }
];

const generateParks = () => {
  const parks = [...famousParks];
  
  // Generate 150 more parks to heavily populate the dashboard across all zones
  for(let i = 1; i <= 150; i++) {
    const zone = zones[Math.floor(Math.random() * zones.length)];
    const ward = Math.floor(Math.random() * 243) + 1;
    
    const numFacilities = Math.floor(Math.random() * 5) + 2;
    const parkFacilities = [];
    for(let j=0; j<numFacilities; j++) {
      const f = facilitiesList[Math.floor(Math.random() * facilitiesList.length)];
      if(!parkFacilities.includes(f)) parkFacilities.push(f);
    }

    parks.push({
      name: `BBMP Neighborhood Park - Block ${Math.floor(Math.random() * 99) + 1}`,
      ward: ward.toString(),
      zone: zone,
      corporation: "BBMP",
      facilities: parkFacilities,
      status: Math.random() > 0.85 ? "Under Maintenance" : "Active",
      images: [imagesList[Math.floor(Math.random() * imagesList.length)]]
    });
  }
  return parks;
};

const seedDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('Clearing old parks...');
    await Park.deleteMany();
    
    const parksData = generateParks();
    console.log(`Inserting ${parksData.length} parks seed data across all zones...`);
    await Park.insertMany(parksData);
    
    console.log('Data Successfully Imported!');
    process.exit();
  } catch (error) {
    console.error('Error with seed data import!', error);
    process.exit(1);
  }
};

seedDB();
