const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const User = require('../backend/models/User');

async function fixUserRole() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/park_management';
    await mongoose.connect(mongoUri);
    const res = await User.updateMany(
      { email: /nishitha/i },
      { $set: { role: 'public_user' } }
    );
    console.log('Successfully updated users:', res);
    const users = await User.find({ email: /nishitha/i }, 'name email role');
    console.log('Current state of user accounts:', users);
  } catch (err) {
    console.error('Error fixing user role:', err);
  } finally {
    process.exit(0);
  }
}

fixUserRole();
