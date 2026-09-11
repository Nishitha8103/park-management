const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Park = require('./models/Park');

const extendedDescriptions = {
  'Lalbagh Botanical Garden': 'Lalbagh Botanical Garden is a 240-acre botanical garden in Bangalore, featuring a stunning glass house modelled on London\'s Crystal Palace, a 3,000-million-year-old rock formation, a magnificent collection of tropical and rare plants, a lake, and seasonal flower shows that attract lakhs of visitors. Commissioned by Hyder Ali in 1760 and completed by his son Tipu Sultan, it has grown to become one of the most significant botanical gardens in India. The garden serves as a vital lung space for the city and a center for scientific study of plants. It is managed by the Directorate of Horticulture, Government of Karnataka, and remains a premier destination for nature lovers, morning walkers, and tourists.',
  
  'Bugle Rock Park': 'Bugle Rock Park is a beautiful park in Basavanagudi, surrounding the famous 3,000 million year old gneiss rock formation. The park hosts the Dodda Ganesha Temple and provides a tranquil green space in the heart of South Bangalore. During the reign of Kempe Gowda II, a watchtower was built on this rock to keep a lookout on the city\'s southern borders, and bugle calls were made to alert citizens. Today, it is a well-maintained green haven featuring dense tree cover, paved walking paths, an amphitheater, and scenic views, making it extremely popular among local residents for morning walks and evening relaxation.',
  
  'Cubbon Park': 'Cubbon Park is the most iconic green space in Bengaluru, spanning over 300 acres in the heart of the city. Established in 1870, it houses historic buildings like the State Central Library, Attara Kacheri (High Court), and various museums. The park is renowned for its rich biodiversity, boasting over 6,000 trees representing nearly 100 species. Its meticulously maintained lawns, bamboo groves, and beautiful flower beds offer a peaceful retreat from the bustling city traffic. A favourite haunt for morning walkers, cyclists, nature lovers, and families, this heritage park is a true lung space and cultural hub for the city.',
  
  'Ulsoor Lake Park': 'Ulsoor Lake Park is a beautiful lakeside recreational park surrounding the historic 50-acre Ulsoor Lake, one of the biggest lakes in Bangalore. Dating back to the era of Kempe Gowda II, the lake is dotted with several small islands and is a major center for the Ganesha Chaturthi celebrations. The park offers boating facilities, a well-paved walking track around the water body, designated picnic spots, and a serene environment for relaxation. It is a hotspot for bird watchers observing migratory birds and for locals enjoying sunset views over the water.',
  
  'JP Park (Jayaprakash Narayan Biodiversity Park)': 'JP Park (Jayaprakash Narayan Biodiversity Park) is one of Bangalore\'s most popular and expansive family parks. Spanning 85 acres, it was developed on a former degraded land and now stands as a model of urban biodiversity. The park features a spectacular musical fountain, four lakes, a rock garden, a Japanese-themed garden, an open-air theatre, and extensive play zones. Serving thousands of visitors daily, it is a critical biodiversity conservation site in West Bangalore, home to hundreds of plant species and a variety of birds.',
  
  'Sankey Tank (Sadashivanagar Lake Park)': 'Sankey Tank is a picturesque artificial lake constructed in 1882 by Col. Richard Hieram Sankey to meet the water supply demands of Bangalore. Today, it is surrounded by a beautifully landscaped park featuring wide walking tracks, bird-watching areas, and a serene lakeside ambience. Located in the upscale Sadashivanagar area, the park is meticulously maintained by the BBMP. It serves as a haven for nature enthusiasts, morning walkers, and cyclists, offering excellent views of painted storks, pelicans, and other birds that frequent the water.',
  
  'Agara Lake Park': 'Agara Lake Park is a serene lakeside green space situated in the bustling HSR Layout neighbourhood. Centered around the historic Agara Lake, which is believed to be over 1,200 years old, the park has undergone significant restoration. It now features a 3-kilometer beautifully maintained walking and jogging track, an open gym, and lush gardens. The park is highly popular among morning walkers, bird watchers, and local families. The BBMP and citizen groups have actively worked to maintain its ecosystem, making it a pristine natural retreat in the IT corridor.',
  
  'Bellandur Lake Park': 'Bellandur Lake Park is developed along the periphery of Bellandur Lake, the largest water body in Bangalore. Despite historical ecological challenges, recent restoration efforts have rejuvenated the surrounding areas into accessible public parks. The park offers extensive walking tracks, open green spaces for recreation, and panoramic views of the vast lake. It acts as an important green buffer in the Mahadevapura zone, providing local residents and tech workers a necessary escape into nature, complete with outdoor gyms and children\'s play areas.',
  
  'Freedom Park': 'Freedom Park is a unique urban park located in the heart of Gandhinagar. Once the site of the Central Jail where many political leaders were imprisoned during the 1975 Emergency, it has been transformed into a sprawling 21-acre public space. The park preserves historical elements such as the central watchtower, barracks, and hanging spots, combining them with modern amenities like an amphitheater, exhibition halls, and a children\'s play area. It serves both as a memorial of India\'s democratic struggles and a vibrant venue for public gatherings and peaceful protests.',
  
  'Lumbini Gardens (Nagawara Lake Park)': 'Lumbini Gardens is a magnificent family entertainment and eco-park situated on the banks of Nagawara Lake in North Bangalore. Named after the birthplace of Lord Buddha, the park is uniquely designed with a serene, spiritual ambiance paired with modern amusements. It features a stunning 180-metre suspension bridge, an artificial beach, a wave pool, and extensive lakeside boating facilities. Maintained to high standards, it is one of the premier destinations for family outings, offering a perfect blend of lush greenery, water sports, and well-paved walking tracks.',
  
  'Hebbal Lake Park': 'Hebbal Lake Park surrounds the picturesque Hebbal Lake, one of the oldest lakes in Bangalore created by Kempe Gowda in the 16th century. The lake and its surrounding parkland span over 150 acres and have been beautifully restored. It is highly regarded as a birdwatcher\'s paradise, attracting over 200 species of migratory and resident birds, including pelicans, painted storks, and cormorants. The park features well-laid walking and cycling tracks beneath heavy canopies, manicured gardens, and designated birdwatching platforms, making it one of the most scenic public spaces in North Bangalore.',
  
  'Default': 'This park is a vital urban green space maintained by the local municipal authorities to promote community well-being, environmental sustainability, and outdoor recreation. It features well-laid walking tracks, lush lawns, and vibrant flower beds that provide a refreshing escape from the city\'s concrete landscape. The park is equipped with modern amenities including children\'s play structures, seating areas, and proper lighting to ensure safety and comfort for all visitors. Regular maintenance ensures the preservation of its local flora, making it a cherished daily destination for residents seeking fitness, relaxation, and a connection with nature.'
};

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const parks = await Park.find({});
    console.log(`Found ${parks.length} parks in the database.`);
    
    let updated = 0;
    for (let park of parks) {
      let desc = extendedDescriptions[park.name];
      if (!desc) {
        // Fallback to default extended description, replacing "This park" with the actual name
        desc = extendedDescriptions['Default'].replace('This park', park.name);
      }
      
      park.description = desc;
      await park.save();
      updated++;
    }
    
    console.log(`Successfully updated ${updated} park descriptions.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
