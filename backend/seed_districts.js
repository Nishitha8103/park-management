const mongoose = require('mongoose');
const dotenv = require('dotenv');
const District = require('./models/District');

dotenv.config();

const seedDistricts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding Districts...');

    const distData = [
      { name: 'Bagalkote', code: 'KA-BG' },
      { name: 'Ballari (Bellary)', code: 'KA-BL' },
      { name: 'Belagavi (Belgaum)', code: 'KA-BE' },
      { name: 'Bengaluru Rural', code: 'KA-BKR' },
      { name: 'Bengaluru Urban', code: 'KA-BLR' },
      { name: 'Bidar', code: 'KA-BD' },
      { name: 'Chamarajanagar', code: 'KA-CJ' },
      { name: 'Chikkaballapura', code: 'KA-CB' },
      { name: 'Chikkamagaluru (Chikmagalur)', code: 'KA-CK' },
      { name: 'Chitradurga', code: 'KA-CT' },
      { name: 'Dakshina Kannada', code: 'KA-DK' },
      { name: 'Davanagere', code: 'KA-DA' },
      { name: 'Dharwad', code: 'KA-DH' },
      { name: 'Gadag', code: 'KA-GA' },
      { name: 'Hassan', code: 'KA-HS' },
      { name: 'Haveri', code: 'KA-HV' },
      { name: 'Kalaburagi (Gulbarga)', code: 'KA-GU' },
      { name: 'Kodagu', code: 'KA-KD' },
      { name: 'Kolar', code: 'KA-KO' },
      { name: 'Koppal', code: 'KA-KP' },
      { name: 'Mandya', code: 'KA-MA' },
      { name: 'Mysuru (Mysore)', code: 'KA-MYS' },
      { name: 'Raichur', code: 'KA-RA' },
      { name: 'Ramanagara', code: 'KA-RM' },
      { name: 'Shivamogga (Shimoga)', code: 'KA-SH' },
      { name: 'Tumakuru (Tumkur)', code: 'KA-TU' },
      { name: 'Udupi', code: 'KA-UD' },
      { name: 'Uttara Kannada', code: 'KA-UK' },
      { name: 'Vijayapura (Bijapur)', code: 'KA-BJ' },
      { name: 'Yadgir', code: 'KA-YD' },
      { name: 'Vijayanagara', code: 'KA-VN' }
    ];

    for (const d of distData) {
      // Find if district already exists by name or another close name (like Mysuru vs Mysuru (Mysore))
      let existing = await District.findOne({ name: { $regex: new RegExp(`^${d.name.split(' ')[0]}`, 'i') } });
      
      if (existing) {
        // Update it
        await District.findOneAndUpdate(
          { _id: existing._id },
          { name: d.name, code: d.code },
          { new: true }
        );
      } else {
        // Create new
        await District.create(d);
      }
    }
    
    // Clean up Hubballi-Dharwad since we have Dharwad now
    await District.deleteOne({ name: 'Hubballi-Dharwad' });

    console.log('Seeding Districts Complete!');
    process.exit();
  } catch (error) {
    console.error('Error with Seeding Districts', error);
    process.exit(1);
  }
};

seedDistricts();
