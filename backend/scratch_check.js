const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const Contractor = require('./models/Contractor');
  const User = require('./models/User');
  
  const contractors = await Contractor.find({}, 'contractorId name email username password');
  console.log('CONTRACTORS:');
  contractors.forEach(c => {
    console.log(`- ID: ${c.contractorId}, Name: ${c.name}, Email: ${c.email}, Username: ${c.username}, PasswordHash: ${c.password?.substring(0, 15)}...`);
  });

  const users = await User.find({}, 'name email username role password');
  console.log('\nUSERS:');
  users.forEach(u => {
    console.log(`- Name: ${u.name}, Email: ${u.email}, Username: ${u.username}, Role: ${u.role}, PasswordHash: ${u.password?.substring(0, 15)}...`);
  });

  process.exit(0);
}
check().catch(err => { console.error(err); process.exit(1); });
