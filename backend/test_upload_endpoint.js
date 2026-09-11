const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config();

const User = require('./models/User');

async function testUpload() {
  await mongoose.connect(process.env.MONGO_URI);
  const admin = await User.findOne({ role: 'Admin' });
  if (!admin) {
    console.log('No admin found');
    process.exit(1);
  }
  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  
  // Create dummy excel file using xlsx
  const xlsx = require('xlsx');
  const data = [];
  for (let i = 0; i < 900; i++) {
    data.push({
      "District": "Bangalore Urban",
      "Corporation": "BBMP",
      "Zone": "South",
      "Ward": "111",
      "Park Name": `Test Park ${i}`,
      "Park Code": `TP-${i}`
    });
  }
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
  xlsx.writeFile(wb, 'dummy.xlsx');

  const form = new FormData();
  form.append('excelFile', fs.createReadStream('dummy.xlsx'));

  try {
    console.log('Sending request...');
    const startTime = Date.now();
    const res = await axios.post('http://127.0.0.1:5000/api/parks/bulk-upload', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Response:', res.data);
    console.log(`Took ${Date.now() - startTime}ms`);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
  
  process.exit(0);
}

testUpload();
