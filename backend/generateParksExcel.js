const xlsx = require('xlsx');
const fs = require('fs');

const parksData = [
  // SOUTH ZONE
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'South', Ward: 'Lakkasandra',
    'Park Name': 'Lalbagh Botanical Garden', 'Park Code': 'BBMP-S-001', Address: 'Mavalli, Bengaluru, Karnataka 560004',
    Latitude: '12.9507', Longitude: '77.5848', Area: '240 Acres', 'Park Type': 'Botanical',
    Description: 'Lalbagh Botanical Garden is a 240-acre botanical garden in Bangalore, featuring a stunning glass house modelled on London\'s Crystal Palace, a 3,000-million-year-old rock formation, a magnificent collection of tropical and rare plants, a lake, and seasonal flower shows.',
    Images: 'https://images.unsplash.com/photo-1585320806297-9794b3e4aaae?w=800,https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800',
    Trees: 1854, Benches: 120, Lights: 200, Dustbins: 60,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'No', Garden: 'Yes', Lake: 'Yes', Restrooms: 'Yes', Parking: 'Yes',
    Facilities: 'Walking Track, Lake, Glass House, Flower Shows, Restrooms, Parking, Cafeteria, Security',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'South', Ward: 'Basavanagudi',
    'Park Name': 'Bugle Rock Park', 'Park Code': 'BBMP-S-002', Address: 'Bull Temple Rd, Basavanagudi, Bengaluru 560004',
    Latitude: '12.9429', Longitude: '77.5715', Area: '7.5 Acres', 'Park Type': 'Recreational',
    Description: 'Bugle Rock Park in Basavanagudi surrounds a famous 3,000 million year old gneiss rock formation. The park hosts the Dodda Ganesha Temple and provides a tranquil green space in the heart of South Bangalore, complete with walking paths and scenic views.',
    Images: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800',
    Trees: 320, Benches: 40, Lights: 60, Dustbins: 25,
    'Children Play Area': 'No', 'Walking Track': 'Yes', 'Open Gym': 'No', Garden: 'Yes', Lake: 'No', Restrooms: 'Yes', Parking: 'Yes',
    Facilities: 'Walking Track, Garden, Temple, Restrooms, Parking, Security',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'South', Ward: 'Jayanagar',
    'Park Name': 'Gayathri Devi Park', 'Park Code': 'BBMP-S-003', Address: '4th Block Jayanagar, Bengaluru 560041',
    Latitude: '12.9265', Longitude: '77.5838', Area: '3 Acres', 'Park Type': 'Neighborhood',
    Description: 'Gayathri Devi Park, nestled in Jayanagar 4th Block, is a well-maintained neighborhood park ideal for morning walks and leisure. It features a children play area, open lawns, and flowering plants maintained by BBMP Horticulture Department.',
    Images: 'https://images.unsplash.com/photo-1619468129361-605ebea04b44?w=800',
    Trees: 180, Benches: 25, Lights: 40, Dustbins: 15,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'Yes', Garden: 'Yes', Lake: 'No', Restrooms: 'Yes', Parking: 'No',
    Facilities: 'Walking Track, Children Play Area, Open Gym, Garden, Restrooms, Security',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'South', Ward: 'Uttarahalli',
    'Park Name': 'Uttarahalli Park', 'Park Code': 'BBMP-S-004', Address: 'Uttarahalli Main Rd, Bengaluru 560061',
    Latitude: '12.8973', Longitude: '77.5478', Area: '2.5 Acres', 'Park Type': 'Neighborhood',
    Description: 'A well-maintained community park in Uttarahalli locality, popular among local residents for morning walks and evening recreation. The park has a dedicated children play area and a walking track around its perimeter.',
    Images: 'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=800',
    Trees: 95, Benches: 18, Lights: 30, Dustbins: 12,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'No', Garden: 'Yes', Lake: 'No', Restrooms: 'No', Parking: 'No',
    Facilities: 'Walking Track, Children Play Area, Garden, Security',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'South', Ward: 'Jayanagar',
    'Park Name': 'Madhavan Park', 'Park Code': 'BBMP-S-005', Address: 'Jayanagar 5th Block, Bengaluru 560041',
    Latitude: '12.9261', Longitude: '77.5842', Area: '2 Acres', 'Park Type': 'Neighborhood',
    Description: 'Madhavan Park is a peaceful neighbourhood park in Jayanagar, beautifully landscaped with seasonal flowers, ornamental plants and shaded pathways. It serves as a popular morning walk destination for Jayanagar residents and features a children play area and open gym.',
    Images: 'https://images.unsplash.com/photo-1548448079-b0a7b8b3a1d1?w=800',
    Trees: 200, Benches: 30, Lights: 50, Dustbins: 20,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'Yes', Garden: 'Yes', Lake: 'No', Restrooms: 'Yes', Parking: 'No',
    Facilities: 'Walking Track, Children Play Area, Open Gym, Garden, Restrooms, Security',
    Status: 'Active'
  },

  // EAST ZONE
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'East', Ward: 'Shivajinagar',
    'Park Name': 'Cubbon Park', 'Park Code': 'BBMP-E-001', Address: 'Kasturba Rd, Ambedkar Veedhi, Bengaluru 560001',
    Latitude: '12.9763', Longitude: '77.5929', Area: '300 Acres', 'Park Type': 'Botanical',
    Description: 'Cubbon Park is the most iconic green space in Bengaluru, spanning 300 acres in the heart of the city. It houses the State Central Library, Attara Kacheri (High Court), museums, and a rich biodiversity of 6,000+ trees from 96 species. A favourite haunt for morning walkers, cyclists and nature lovers.',
    Images: 'https://images.unsplash.com/photo-1474524955719-b9f87c50ce47?w=800,https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800',
    Trees: 6000, Benches: 300, Lights: 450, Dustbins: 120,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'Yes', Garden: 'Yes', Lake: 'Yes', Restrooms: 'Yes', Parking: 'Yes',
    Facilities: 'Walking Track, Cycling Path, Children Play Area, Library, Museum, Restrooms, Parking, Security, Lake',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'East', Ward: 'Ulsoor',
    'Park Name': 'Ulsoor Lake Park', 'Park Code': 'BBMP-E-002', Address: 'Ulsoor Lake Rd, Ulsoor, Bengaluru 560042',
    Latitude: '12.9844', Longitude: '77.6133', Area: '50 Acres', 'Park Type': 'Recreational',
    Description: 'Ulsoor Lake Park is a beautiful lakeside recreational park surrounding the 50-acre Ulsoor Lake. It offers boating facilities, a walking track around the lake, designated picnic spots, and a serene environment for relaxation. The lake is home to migratory birds.',
    Images: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    Trees: 850, Benches: 80, Lights: 120, Dustbins: 45,
    'Children Play Area': 'No', 'Walking Track': 'Yes', 'Open Gym': 'No', Garden: 'Yes', Lake: 'Yes', Restrooms: 'Yes', Parking: 'Yes',
    Facilities: 'Walking Track, Boating, Lake, Bird Watching, Picnic Area, Restrooms, Parking',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'East', Ward: 'Shivajinagar',
    'Park Name': 'Indira Gandhi Musical Fountain Park', 'Park Code': 'BBMP-E-003', Address: 'Raj Bhavan Rd, Bengaluru 560001',
    Latitude: '12.9813', Longitude: '77.5972', Area: '4 Acres', 'Park Type': 'Recreational',
    Description: 'Indira Gandhi Musical Fountain Park is a popular evening destination adjacent to Cubbon Park. The park features a spectacular musical fountain with light shows every evening, well-maintained gardens, and seating arrangements.',
    Images: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800',
    Trees: 420, Benches: 60, Lights: 150, Dustbins: 30,
    'Children Play Area': 'Yes', 'Walking Track': 'No', 'Open Gym': 'No', Garden: 'Yes', Lake: 'No', Restrooms: 'Yes', Parking: 'Yes',
    Facilities: 'Musical Fountain, Light Show, Garden, Children Play Area, Restrooms, Parking, Security',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'East', Ward: 'Frazer Town',
    'Park Name': 'Frazer Town Park', 'Park Code': 'BBMP-E-004', Address: 'Frazer Town, Bengaluru 560005',
    Latitude: '12.9869', Longitude: '77.6171', Area: '1.5 Acres', 'Park Type': 'Neighborhood',
    Description: 'Frazer Town Park is a compact well-maintained neighbourhood park in the vibrant Frazer Town area of East Bangalore. The park provides a green respite with morning walks area, seasonal flowers, and shady spots amid the busy residential locality.',
    Images: 'https://images.unsplash.com/photo-1465433360938-e02f2b81cd4c?w=800',
    Trees: 120, Benches: 18, Lights: 28, Dustbins: 10,
    'Children Play Area': 'Yes', 'Walking Track': 'No', 'Open Gym': 'No', Garden: 'Yes', Lake: 'No', Restrooms: 'No', Parking: 'No',
    Facilities: 'Garden, Children Play Area, Shade Area, Security',
    Status: 'Active'
  },

  // WEST ZONE
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'West', Ward: 'Rajajinagar',
    'Park Name': 'JP Park (Jayaprakash Narayan Biodiversity Park)', 'Park Code': 'BBMP-W-001', Address: '2nd Stage, Rajajinagar, Bengaluru 560010',
    Latitude: '12.9919', Longitude: '77.5534', Area: '22 Acres', 'Park Type': 'Recreational',
    Description: 'JP Park (Jayaprakash Narayan Biodiversity Park) is one of Bangalore\'s most popular family parks, offering a beautiful musical fountain, themed Japanese garden, an open air theatre, play zones, and a serene lake.',
    Images: 'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=800',
    Trees: 1200, Benches: 150, Lights: 250, Dustbins: 70,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'Yes', Garden: 'Yes', Lake: 'Yes', Restrooms: 'Yes', Parking: 'Yes',
    Facilities: 'Musical Fountain, Walking Track, Children Play Area, Open Gym, Boating, Lake, Cafeteria, Restrooms, Parking, Security',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'West', Ward: 'Sadashivanagar',
    'Park Name': 'Sankey Tank (Sadashivanagar Lake Park)', 'Park Code': 'BBMP-W-002', Address: 'Sankey Rd, Sadashivanagar, Bengaluru 560080',
    Latitude: '13.0084', Longitude: '77.5794', Area: '37 Acres', 'Park Type': 'Recreational',
    Description: 'Sankey Tank is a picturesque artificial lake constructed in 1882, surrounded by a beautiful park with walking tracks and serene lakeside ambience. Located in upscale Sadashivanagar, it is a haven for birds including painted storks, pelicans and other migratory species.',
    Images: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800',
    Trees: 750, Benches: 90, Lights: 130, Dustbins: 45,
    'Children Play Area': 'No', 'Walking Track': 'Yes', 'Open Gym': 'No', Garden: 'Yes', Lake: 'Yes', Restrooms: 'Yes', Parking: 'Yes',
    Facilities: 'Walking Track, Cycling Path, Lake, Bird Watching, Boat Club, Restrooms, Parking, Security',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'West', Ward: 'Malleswaram',
    'Park Name': 'Malleswaram Park', 'Park Code': 'BBMP-W-003', Address: '18th Cross, Malleswaram, Bengaluru 560055',
    Latitude: '13.0031', Longitude: '77.5610', Area: '3.5 Acres', 'Park Type': 'Neighborhood',
    Description: 'Malleswaram Park is a beloved neighbourhood park in the historic Malleswaram area of West Bangalore. The park features tree-lined pathways, well-maintained lawns, a children play area, and an open gym.',
    Images: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=800',
    Trees: 280, Benches: 40, Lights: 55, Dustbins: 20,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'Yes', Garden: 'Yes', Lake: 'No', Restrooms: 'Yes', Parking: 'No',
    Facilities: 'Walking Track, Children Play Area, Open Gym, Garden, Restrooms, Security',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'West', Ward: 'Vijayanagar',
    'Park Name': 'Vijayanagar Park', 'Park Code': 'BBMP-W-004', Address: 'Chord Rd, Vijayanagar, Bengaluru 560040',
    Latitude: '12.9749', Longitude: '77.5267', Area: '2 Acres', 'Park Type': 'Neighborhood',
    Description: 'Vijayanagar Park is a compact community park in the Vijayanagar area of West Bangalore. It offers a peaceful green escape for local residents with a walking path, children play equipment, and seasonal flower beds maintained by BBMP Horticulture.',
    Images: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800',
    Trees: 80, Benches: 15, Lights: 25, Dustbins: 10,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'No', Garden: 'Yes', Lake: 'No', Restrooms: 'No', Parking: 'No',
    Facilities: 'Walking Track, Children Play Area, Garden, Security',
    Status: 'Active'
  },

  // BOMMANAHALLI ZONE
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'Bommanahalli', Ward: 'HSR Layout',
    'Park Name': 'Agara Lake Park', 'Park Code': 'BBMP-B-001', Address: 'Agara, HSR Layout, Bengaluru 560102',
    Latitude: '12.9098', Longitude: '77.6479', Area: '60 Acres', 'Park Type': 'Recreational',
    Description: 'Agara Lake Park is a serene lakeside park in HSR Layout. The park surrounds the beautiful Agara Lake with walking tracks and gardens. It is a popular spot for morning walkers, bird watchers and families.',
    Images: 'https://images.unsplash.com/photo-1455218873509-8097305ee378?w=800',
    Trees: 600, Benches: 70, Lights: 100, Dustbins: 40,
    'Children Play Area': 'No', 'Walking Track': 'Yes', 'Open Gym': 'Yes', Garden: 'Yes', Lake: 'Yes', Restrooms: 'Yes', Parking: 'Yes',
    Facilities: 'Walking Track, Lake, Open Gym, Bird Watching, Garden, Restrooms, Parking',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'Bommanahalli', Ward: 'HSR Layout',
    'Park Name': 'HSR Layout Sector 2 Park', 'Park Code': 'BBMP-B-002', Address: 'Sector 2, HSR Layout, Bengaluru 560102',
    Latitude: '12.9134', Longitude: '77.6399', Area: '2 Acres', 'Park Type': 'Neighborhood',
    Description: 'A well-maintained neighbourhood park in HSR Layout Sector 2, serving the local residential community. Features a walking track, children play area with swings and slides, and a sitting area.',
    Images: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800',
    Trees: 95, Benches: 20, Lights: 35, Dustbins: 12,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'No', Garden: 'Yes', Lake: 'No', Restrooms: 'No', Parking: 'No',
    Facilities: 'Walking Track, Children Play Area, Garden, Security',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'Bommanahalli', Ward: 'Bommanahalli',
    'Park Name': 'Bommanahalli Lake Biodiversity Park', 'Park Code': 'BBMP-B-003', Address: 'Bommanahalli, Bengaluru 560068',
    Latitude: '12.8998', Longitude: '77.6348', Area: '8 Acres', 'Park Type': 'Recreational',
    Description: 'Bommanahalli Lake Biodiversity Park is a rejuvenated lake park developed as part of BBMP\'s lake restoration program. The park surrounds the restored Bommanahalli Lake with walking tracks, native plant gardens, and bird watching areas promoting biodiversity conservation.',
    Images: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    Trees: 380, Benches: 45, Lights: 65, Dustbins: 25,
    'Children Play Area': 'No', 'Walking Track': 'Yes', 'Open Gym': 'No', Garden: 'Yes', Lake: 'Yes', Restrooms: 'Yes', Parking: 'No',
    Facilities: 'Walking Track, Lake, Bird Watching, Nature Trail, Garden, Restrooms',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'Bommanahalli', Ward: 'Koramangala',
    'Park Name': 'Koramangala 6th Block Park', 'Park Code': 'BBMP-B-004', Address: '6th Block, Koramangala, Bengaluru 560095',
    Latitude: '12.9284', Longitude: '77.6226', Area: '1.5 Acres', 'Park Type': 'Neighborhood',
    Description: 'Koramangala 6th Block Park is a popular community park amidst the IT hub area of Koramangala. The park provides a green escape in the densely populated neighbourhood, with walking paths, children equipment, and a shaded relaxation area.',
    Images: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
    Trees: 110, Benches: 18, Lights: 30, Dustbins: 12,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'Yes', Garden: 'Yes', Lake: 'No', Restrooms: 'No', Parking: 'No',
    Facilities: 'Walking Track, Children Play Area, Open Gym, Garden, Security',
    Status: 'Active'
  },

  // MAHADEVAPURA ZONE
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'Mahadevapura', Ward: 'Whitefield',
    'Park Name': 'Whitefield Park (Nallurhalli Park)', 'Park Code': 'BBMP-M-001', Address: 'ITPL Main Rd, Whitefield, Bengaluru 560066',
    Latitude: '12.9742', Longitude: '77.7466', Area: '5 Acres', 'Park Type': 'Neighborhood',
    Description: 'Whitefield Park (also known as Nallurhalli Park) is a popular community park in the IT hub area of Whitefield. It features spacious lawns, walking tracks, children play area and is especially popular among tech park employees.',
    Images: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800',
    Trees: 320, Benches: 45, Lights: 60, Dustbins: 22,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'Yes', Garden: 'Yes', Lake: 'No', Restrooms: 'Yes', Parking: 'Yes',
    Facilities: 'Walking Track, Children Play Area, Open Gym, Garden, Restrooms, Parking, Security',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'Mahadevapura', Ward: 'Varthur',
    'Park Name': 'Varthur Lake Park', 'Park Code': 'BBMP-M-002', Address: 'Varthur Rd, Varthur, Bengaluru 560087',
    Latitude: '12.9389', Longitude: '77.7485', Area: '10 Acres', 'Park Type': 'Recreational',
    Description: 'Varthur Lake Park is developed around the Varthur Lake in East Bangalore. As part of BBMP lake restoration efforts, the surrounding area has been developed as a public park with walking paths and greenery.',
    Images: 'https://images.unsplash.com/photo-1484038851000-36c8df806cda?w=800',
    Trees: 280, Benches: 35, Lights: 50, Dustbins: 18,
    'Children Play Area': 'No', 'Walking Track': 'Yes', 'Open Gym': 'No', Garden: 'Yes', Lake: 'Yes', Restrooms: 'No', Parking: 'No',
    Facilities: 'Walking Track, Lake, Garden, Nature Trail',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'Mahadevapura', Ward: 'KR Puram',
    'Park Name': 'KR Puram Lake Park', 'Park Code': 'BBMP-M-003', Address: 'KR Puram, Bengaluru 560036',
    Latitude: '13.0057', Longitude: '77.7023', Area: '6 Acres', 'Park Type': 'Recreational',
    Description: 'KR Puram Lake Park is a peaceful lakeside recreational area in the Mahadevapura zone. The park has been developed with walking tracks along the lake periphery and provides much-needed green space.',
    Images: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    Trees: 210, Benches: 28, Lights: 42, Dustbins: 16,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'No', Garden: 'Yes', Lake: 'Yes', Restrooms: 'Yes', Parking: 'No',
    Facilities: 'Walking Track, Lake, Children Play Area, Garden, Restrooms',
    Status: 'Active'
  },

  // R.R. NAGAR ZONE
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'R.R. Nagar', Ward: 'Kengeri',
    'Park Name': 'Kengeri Park', 'Park Code': 'BBMP-R-001', Address: 'Kengeri Satellite Town, Bengaluru 560060',
    Latitude: '12.9104', Longitude: '77.4879', Area: '3 Acres', 'Park Type': 'Neighborhood',
    Description: 'Kengeri Park is a neighbourhood park in Kengeri Satellite Town serving the local residential community. The park has a children play area, walking tracks, and well-maintained gardens.',
    Images: 'https://images.unsplash.com/photo-1619468129361-605ebea04b44?w=800',
    Trees: 150, Benches: 22, Lights: 35, Dustbins: 14,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'No', Garden: 'Yes', Lake: 'No', Restrooms: 'Yes', Parking: 'No',
    Facilities: 'Walking Track, Children Play Area, Garden, Restrooms, Security',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'R.R. Nagar', Ward: 'Rajarajeshwari Nagar',
    'Park Name': 'Rajarajeshwari Nagar Park', 'Park Code': 'BBMP-R-002', Address: 'RR Nagar 1st Stage, Bengaluru 560098',
    Latitude: '12.9238', Longitude: '77.5137', Area: '4 Acres', 'Park Type': 'Neighborhood',
    Description: 'Rajarajeshwari Nagar Park is a well-maintained public park in RR Nagar with walking track, children play area, and open gym facilities.',
    Images: 'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=800',
    Trees: 210, Benches: 30, Lights: 45, Dustbins: 18,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'Yes', Garden: 'Yes', Lake: 'No', Restrooms: 'Yes', Parking: 'Yes',
    Facilities: 'Walking Track, Children Play Area, Open Gym, Garden, Restrooms, Parking, Security',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'R.R. Nagar', Ward: 'Anjanapura',
    'Park Name': 'Anjanapura Park', 'Park Code': 'BBMP-R-003', Address: 'Anjanapura, Bengaluru 560083',
    Latitude: '12.8712', Longitude: '77.5283', Area: '2.5 Acres', 'Park Type': 'Neighborhood',
    Description: 'Anjanapura Park serves the Anjanapura residential layout in South Bangalore. BBMP maintains this park with a children play area, walking path and ornamental gardens.',
    Images: 'https://images.unsplash.com/photo-1548448079-b0a7b8b3a1d1?w=800',
    Trees: 130, Benches: 20, Lights: 30, Dustbins: 12,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'No', Garden: 'Yes', Lake: 'No', Restrooms: 'No', Parking: 'No',
    Facilities: 'Walking Track, Children Play Area, Garden, Security',
    Status: 'Active'
  },

  // YELAHANKA ZONE
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'Yelahanka', Ward: 'Hebbal',
    'Park Name': 'Hebbal Lake Park', 'Park Code': 'BBMP-Y-001', Address: 'Hebbal Kempapura Rd, Hebbal, Bengaluru 560024',
    Latitude: '13.0350', Longitude: '77.5958', Area: '75 Acres', 'Park Type': 'Recreational',
    Description: 'Hebbal Lake Park surrounds the famous Hebbal Lake, home to over 200 species of migratory and resident birds. The park features well-laid walking and cycling tracks, manicured gardens, birdwatching platforms and a beautiful lake view.',
    Images: 'https://images.unsplash.com/photo-1474524955719-b9f87c50ce47?w=800',
    Trees: 890, Benches: 100, Lights: 140, Dustbins: 55,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'Yes', Garden: 'Yes', Lake: 'Yes', Restrooms: 'Yes', Parking: 'Yes',
    Facilities: 'Walking Track, Cycling Path, Lake, Bird Watching, Open Gym, Children Play Area, Garden, Restrooms, Parking, Security',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'Yelahanka', Ward: 'HBR Layout',
    'Park Name': 'Lumbini Gardens (Nagawara Lake Park)', 'Park Code': 'BBMP-Y-002', Address: 'Nagawara, HBR Layout, Bengaluru 560045',
    Latitude: '13.0371', Longitude: '77.6265', Area: '11 Acres', 'Park Type': 'Recreational',
    Description: 'Lumbini Gardens is a magnificent theme park on the banks of Nagawara Lake in North Bangalore. The park features a 180-metre suspension bridge, entertainment zone, musical water fountain and lakeside boating.',
    Images: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800',
    Trees: 650, Benches: 80, Lights: 200, Dustbins: 50,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'No', Garden: 'Yes', Lake: 'Yes', Restrooms: 'Yes', Parking: 'Yes',
    Facilities: 'Walking Track, Boating, Musical Fountain, Lake, Suspension Bridge, Amusement Zone, Cafeteria, Children Play Area, Restrooms, Parking, Security',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'Yelahanka', Ward: 'Yelahanka',
    'Park Name': 'Yelahanka New Town Lake Park', 'Park Code': 'BBMP-Y-003', Address: 'Yelahanka New Town, Bengaluru 560064',
    Latitude: '13.1023', Longitude: '77.5963', Area: '15 Acres', 'Park Type': 'Recreational',
    Description: 'Yelahanka New Town Lake Park is a beautiful lakeside park in North Bangalore. Developed around the Yelahanka Lake, it offers excellent walking tracks, lush greenery and a peaceful lakeside ambience.',
    Images: 'https://images.unsplash.com/photo-1455218873509-8097305ee378?w=800',
    Trees: 520, Benches: 65, Lights: 95, Dustbins: 38,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'Yes', Garden: 'Yes', Lake: 'Yes', Restrooms: 'Yes', Parking: 'Yes',
    Facilities: 'Walking Track, Lake, Open Gym, Children Play Area, Garden, Restrooms, Parking, Security',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'Yelahanka', Ward: 'Jakkur',
    'Park Name': 'Jakkur Lake Eco Park', 'Park Code': 'BBMP-Y-004', Address: 'Jakkur Main Rd, Jakkur, Bengaluru 560064',
    Latitude: '13.0711', Longitude: '77.5975', Area: '28 Acres', 'Park Type': 'Recreational',
    Description: 'Jakkur Lake Eco Park is built around the restored Jakkur Lake in North Bangalore. Home to over 110 species of birds making it a premier bird watching destination. It features a walking trail around the entire lake, native plant restoration zones and birdwatching platforms.',
    Images: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800',
    Trees: 680, Benches: 55, Lights: 80, Dustbins: 35,
    'Children Play Area': 'No', 'Walking Track': 'Yes', 'Open Gym': 'No', Garden: 'Yes', Lake: 'Yes', Restrooms: 'Yes', Parking: 'Yes',
    Facilities: 'Walking Track, Eco Trail, Lake, Bird Watching Platform, Native Plant Garden, Restrooms, Parking',
    Status: 'Active'
  },

  // DASARAHALLI ZONE
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'Dasarahalli', Ward: 'Dasarahalli',
    'Park Name': 'Hesaraghatta Road Park', 'Park Code': 'BBMP-DA-001', Address: 'Hesaraghatta Road, Dasarahalli, Bengaluru 560073',
    Latitude: '13.0351', Longitude: '77.5143', Area: '3.5 Acres', 'Park Type': 'Neighborhood',
    Description: 'Hesaraghatta Road Park is a community park serving the Dasarahalli zone of Northwest Bangalore. Maintained by BBMP, it features walking tracks, a children play area, and gardening areas with shade trees.',
    Images: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800',
    Trees: 160, Benches: 22, Lights: 38, Dustbins: 15,
    'Children Play Area': 'Yes', 'Walking Track': 'Yes', 'Open Gym': 'No', Garden: 'Yes', Lake: 'No', Restrooms: 'Yes', Parking: 'No',
    Facilities: 'Walking Track, Children Play Area, Garden, Restrooms, Security',
    Status: 'Active'
  },
  { 
    District: 'Bangalore Urban', Corporation: 'BBMP', Zone: 'Dasarahalli', Ward: 'Peenya Industrial Area',
    'Park Name': 'Peenya Industrial Area Park', 'Park Code': 'BBMP-DA-002', Address: 'Peenya Industrial Area, Bengaluru 560058',
    Latitude: '13.0300', Longitude: '77.5177', Area: '2 Acres', 'Park Type': 'Neighborhood',
    Description: 'Peenya Industrial Area Park is developed by BBMP to provide recreational facilities for workers and residents in the Peenya industrial belt. It offers shade trees, benches, and a small children play area.',
    Images: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    Trees: 75, Benches: 12, Lights: 20, Dustbins: 8,
    'Children Play Area': 'Yes', 'Walking Track': 'No', 'Open Gym': 'No', Garden: 'Yes', Lake: 'No', Restrooms: 'No', Parking: 'No',
    Facilities: 'Children Play Area, Garden, Shade Area',
    Status: 'Active'
  },
];

const worksheet = xlsx.utils.json_to_sheet(parksData);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, 'Parks');

xlsx.writeFile(workbook, 'BBMP_Parks_List.xlsx');
console.log('Successfully generated BBMP_Parks_List.xlsx with beautiful park images!');
