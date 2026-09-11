const mongoose = require('mongoose');
const Park = require('./models/Park');
require('dotenv').config();

async function clear() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/park_monitoring');
    await Park.deleteMany({});
    console.log('Cleared all parks from the database.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}
clear();
