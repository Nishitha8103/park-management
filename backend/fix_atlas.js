require('dotenv').config();
const mongoose = require('mongoose');

async function fixAtlas() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb+srv://nishithaanchan39_db_user:Nishitha08@cluster0.entzv4n.mongodb.net/parks-monitoring?appName=Cluster0';
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    
    console.log('Connected to Atlas');
    
    // Update the complaint
    const result = await db.collection('complaints').updateOne(
      { complaintNumber: 'CMP792645178' },
      { 
        $set: { 
          userName: 'nishitha',
          district: 'Bangalore Urban',
          zone: 'South',
          ward: 'Ward 132'
        } 
      }
    );
    
    console.log('Update result:', result);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixAtlas();
