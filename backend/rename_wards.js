const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Ward = require('./models/Ward');

dotenv.config();

const realWardNames = [
  "Kempegowda Ward", "Chowdeshwari", "Attur", "Yelahanka Satellite Town", "Jakkur",
  "Thanisandra", "Byatarayanapura", "Kodigehalli", "Vidyaranyapura", "Dodda Bommasandra",
  "Kuvempu Nagar", "Shettihalli", "Mallasandra", "Bagalagunte", "T Dasarahalli",
  "Jalahalli", "J P Park", "Radhakrishna Temple", "Sanjaya Nagar", "Ganganagar",
  "Hebbal", "Vishwanath Nagenahalli", "Manorayanapalya", "Aramane Nagara", "Mathikere",
  "Yeshwanthpura", "Raj Mahal Vilas", "Malleswaram", "Subramanya Nagar", "Gayithri Nagar",
  "Kadu Malleshwar", "Srirama Mandir", "Prakash Nagar", "Rajajinagar", "Basaveshwara Nagar",
  "Kamakshipalya", "Kaveripura", "Govindaraja Nagar", "Padarayanapura", "Rayapuram",
  "Chalavadipalya", "Muneshwara Nagar", "Binnipete", "Cottonpete", "Chickpete",
  "Dharmaraya Swamy Temple", "Sudham Nagar", "Sampangiram Nagar", "Shanthi Nagar", "Austin Town",
  "Neelasandra", "Domlur", "Jogupalya", "Halasuru", "Bharathinagar",
  "Shivajinagar", "Vasanth Nagar", "Jayamahal", "JC Nagar", "Devara Jeevanahalli",
  "Kaval Bairasandra", "Kushalnagar", "Muneshwara Nagar (East)", "Sagayapuram", "SK Garden",
  "Pulakeshinagar", "Maruthi Sevanagar", "Kammanahalli", "Kacharakanahalli", "Hennur",
  "Kalyan Nagar", "Horamavu", "Ramamurthy Nagar", "Vijnanapura", "K R Puram",
  "Basavanapura", "Devasandra", "A Narayanapura", "CV Raman Nagar", "Bennigana Halli",
  "New Tippasandra", "HAL Airport", "Jeevanbhima Nagar", "Konena Agrahara", "Dodda Nekkundi",
  "Marathahalli", "Garudacharpalya", "Kadugodi", "Hagadur", "Varthur",
  "Bellandur", "HSR Layout", "Bommanahalli", "Mangammanapalya", "Singasandra",
  "Arakere", "Bilekahalli", "Hongasandra", "Jaraganahalli", "Puttenahalli",
  "JP Nagar", "Sarakki", "Shakambari Nagar", "Jayanagar East", "Gurappanapalya",
  "BTM Layout", "Madivala", "Koramangala", "Ejipura", "Vannarpet",
  "Siddapura", "Hombegowda Nagar", "Lakkasandra", "Adugodi", "Ganesha Mandira",
  "Banashankari Temple", "Kumara Swamy Layout", "Padmanabhanagar", "Yediyur", "Pattabhiram Nagar",
  "Byrasandra", "Someshwara Nagar", "Jayanagar", "Girinagar", "Srinagar",
  "Basavanagudi", "Hanumanth Nagar", "Vidyapeeta", "Gali Anjaneya Temple", "Bapuji Nagar",
  "Deepanjali Nagar", "Attiguppe", "Vijayanagar", "Hosahalli", "Agrahara Dasarahalli",
  "Magadi Road", "Chalukya Nagar", "Nayandahalli", "Rajarajeshwari Nagar", "Jnanabharathi",
  "Kengeri", "Ullalu", "Hemmigepura", "Herohalli", "Vrushabhavathi Nagar",
  "Gottigere", "Anjanapura", "Uttarahalli", "Yelachenahalli", "Vasanthpura",
  "Rajagopal Nagar", "Peenya Industrial Area", "Chokkasandra", "Kottigepalya", "Srigandhakaval",
  "Laggere", "Marappana Palya", "Nandini Layout", "Mahalakshmipuram", "Nagapura",
  "Vijnana Nagar", "Vidyagiri", "Sarvagnanagar", "Banaswadi", "HBR Layout",
  "Lingarajapuram", "Kadugondanahalli", "Vengal Rao Nagar", "Kadarenahalli", "Kattigenahalli",
  "Yelahanka", "Dasarahalli", "Bommasandra", "Electronic City", "Whitefield",
  "Koramangala Block 1", "Koramangala Block 3", "Koramangala Block 8", "Rajajinagar 1st Block", "Rajajinagar 6th Block",
  "Jayanagar 1st Block", "Jayanagar 4th Block", "Jayanagar 9th Block", "BTM 2nd Stage", "HSR Layout Sector 1",
  "HSR Layout Sector 3", "Indiranagar", "Ulsoor", "Seshadripuram", "Sadashivanagar",
  "Palace Guttahalli", "Vyalikaval", "Richmond Town", "Langford Town", "Benson Town",
  "Fraser Town", "Cox Town", "Cooke Town", "Richards Town", "Shivajinagar Bus Stand",
  "Commercial Street", "Brigade Road", "MG Road", "Cunningham Road", "Infantry Road",
  "Lavelle Road", "Residency Road", "St Marks Road", "Victoria Road", "Richmond Road",
  "Double Road", "Kengal Hanumanthaiah Road", "Race Course Road", "Vidhana Soudha", "Cubbon Park",
  "Lalbagh", "Basavanagudi N R Colony", "Srinivasa Nagar", "Ashok Nagar", "Srinagar",
  "Chamarajpet", "Shankarapura", "Visvesvarapuram", "Gavipuram", "Banashankari 2nd Stage",
  "Banashankari 3rd Stage", "Kumaraswamy Layout", "ISRO Layout", "Padmanabhanagar", "Uttarahalli",
  "Subramanyapura", "Gubbalala", "Kanakapura Road", "JP Nagar 1st Phase", "JP Nagar 7th Phase"
]; // ~ 190+ names, if we run out we will append " Phase 2" etc.

const updateWardNames = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Ward Renaming...');

    const wards = await Ward.find().sort({ _id: 1 });
    
    let nameIndex = 0;
    const bulkOps = [];
    
    for (let i = 0; i < wards.length; i++) {
      let baseName = realWardNames[nameIndex % realWardNames.length];
      
      let suffix = "";
      if (Math.floor(nameIndex / realWardNames.length) > 0) {
        suffix = ` Extension ${Math.floor(nameIndex / realWardNames.length)}`;
      }
      
      const newName = `${baseName}${suffix}`;
      
      bulkOps.push({
        updateOne: {
          filter: { _id: wards[i]._id },
          update: { $set: { name: newName } }
        }
      });
      
      nameIndex++;
    }

    if (bulkOps.length > 0) {
      await Ward.bulkWrite(bulkOps);
    }

    console.log(`Successfully renamed ${wards.length} wards with realistic Bangalore names!`);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

updateWardNames();
