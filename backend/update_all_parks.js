const mongoose = require('mongoose');
require('dotenv').config();
const Park = require('./models/Park');

const specificDescriptions = {
  'Lalbagh Botanical Garden': 'Lalbagh Botanical Garden is a 240-acre botanical garden in Bangalore, featuring a stunning glass house modelled on London\'s Crystal Palace, a 3,000-million-year-old rock formation, a magnificent collection of tropical and rare plants, a lake, and seasonal flower shows that attract lakhs of visitors. Commissioned by Hyder Ali in 1760 and completed by his son Tipu Sultan, it has grown to become one of the most significant botanical gardens in India.',
  'Bugle Rock Park': 'Bugle Rock Park is a beautiful park in Basavanagudi, surrounding the famous 3,000 million year old gneiss rock formation. The park hosts the Dodda Ganesha Temple and provides a tranquil green space in the heart of South Bangalore. During the reign of Kempe Gowda II, a watchtower was built on this rock to keep a lookout on the city\'s southern borders, and bugle calls were made to alert citizens.',
  'Cubbon Park': 'Cubbon Park is the most iconic green space in Bengaluru, spanning over 300 acres in the heart of the city. Established in 1870, it houses historic buildings like the State Central Library, Attara Kacheri (High Court), and various museums. The park is renowned for its rich biodiversity, boasting over 6,000 trees representing nearly 100 species.',
  'Ulsoor Lake Park': 'Ulsoor Lake Park is a beautiful lakeside recreational park surrounding the historic 50-acre Ulsoor Lake, one of the biggest lakes in Bangalore. Dating back to the era of Kempe Gowda II, the lake is dotted with several small islands and is a major center for the Ganesha Chaturthi celebrations.',
  'Jayaprakash Narayana Park (JP Park)': 'Jayaprakash Narayana Park (JP Park) is one of Bangalore\'s most popular and expansive family parks. Spanning 85 acres, it was developed on a former degraded land and now stands as a model of urban biodiversity. The park features a spectacular musical fountain, four lakes, a rock garden, a Japanese-themed garden, an open-air theatre, and extensive play zones.',
  'Sankey Lake Park': 'Sankey Lake Park is a picturesque artificial lake constructed in 1882 by Col. Richard Hieram Sankey to meet the water supply demands of Bangalore. Today, it is surrounded by a beautifully landscaped park featuring wide walking tracks, bird-watching areas, and a serene lakeside ambience.',
  'Freedom Park': 'Freedom Park is a unique urban park located in the heart of Gandhinagar. Once the site of the Central Jail where many political leaders were imprisoned during the 1975 Emergency, it has been transformed into a sprawling 21-acre public space. The park preserves historical elements such as the central watchtower and barracks.',
  'Nehru Park': 'Nehru Park is one of the premier green spaces in Bangalore, offering a lush, serene environment for city dwellers. Located prominently within the city, it has served as a historical recreational ground for decades. The park is characterized by its wide, tree-lined walking tracks, open play areas for children, and well-maintained botanical segments. It is a favored destination for early morning joggers, yoga enthusiasts, and families seeking a weekend picnic spot.',
  'Sir M.N. Krishna Rao Park': 'Sir M.N. Krishna Rao Park is a historic and beautifully maintained park in Basavanagudi. Named after the former acting Dewan of Mysore, it features dense canopies of heritage trees and a vibrant community atmosphere. The park is highly popular for morning walks, children\'s play, and community sports, featuring a cricket pitch and ample seating.',
  'Coles Park (Freedom Fighters Park)': 'Coles Park, also known as Freedom Fighters Park, is a well-loved green space in Frazer Town. Known for its accessibility and specialized facilities for physically challenged individuals, it offers a smooth walking track and a serene environment right in the center of the bustling cantonment area.'
};

const templates = [
  "{parkName} is a beautifully landscaped community park situated in Bangalore. It serves as a vital green lung for the surrounding neighborhoods, offering residents a peaceful escape from the urban hustle. The park boasts well-paved walking and jogging tracks, carefully manicured lawns, and a variety of shade-giving trees. It is heavily frequented by fitness enthusiasts in the mornings and families in the evenings, providing a safe and clean environment for outdoor recreation.",
  
  "Maintained by the municipal authorities, {parkName} is a prominent neighborhood park known for its vibrant floral arrangements and dense tree canopy. It features dedicated play areas equipped with modern amenities for children, alongside plenty of benches for senior citizens to relax. The park acts as a focal point for community gatherings and daily exercise, ensuring a healthy, green environment for local residents.",
  
  "{parkName} stands out as a tranquil recreational spot in the city. With its extensive walking trails and diverse collection of local flora, it provides an excellent venue for nature lovers and joggers alike. The park has been recently upgraded with better lighting, outdoor gym equipment, and improved landscaping, making it one of the most preferred destinations in the locality for morning walks and weekend family outings.",
  
  "Nestled in a bustling residential area, {parkName} offers a refreshing breath of fresh air with its expansive green lawns and well-maintained botanical beds. The park is equipped with a modern children's play area, robust walking paths, and well-lit seating areas. It serves not only as a place for physical activity but also as a community hub where neighbors meet and interact in a safe, serene setting.",
  
  "Recognized for its pristine upkeep, {parkName} is a favorite local getaway. The park features a blend of open spaces for sports and shaded areas for relaxation. Regular maintenance by civic authorities ensures that the walkways remain clean and the gardens flourish year-round. It is a vital asset to the community, promoting a healthy lifestyle and offering a natural retreat amidst the concrete structures of the city."
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const parks = await Park.find({});
    let updated = 0;
    
    for (let park of parks) {
      let desc = '';
      if (specificDescriptions[park.name]) {
        desc = specificDescriptions[park.name];
      } else {
        // Pick a template deterministically based on park name length to ensure consistency
        const templateIndex = park.name.length % templates.length;
        desc = templates[templateIndex].replace(/{parkName}/g, park.name);
      }
      
      park.description = desc;
      await park.save();
      updated++;
    }
    
    console.log(`Successfully updated ${updated} park descriptions with varied text.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
