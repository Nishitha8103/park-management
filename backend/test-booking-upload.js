const http = require('http');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');

const form = new FormData();
form.append('parkId', '6a8fcc80107438d599dd7cf9');
form.append('slotId', '6a95af3f6bea8d4d9e4c0deb');
form.append('userId', '6a434e0ca1997728957b0f3b');
form.append('applicantName', 'Nishitha');
form.append('applicantPhone', '6364121437');
form.append('applicantEmail', 'nishitha@gmail.com');
form.append('stallName', 'Foodies stall');
form.append('productsType', 'Spicy foods');
form.append('amountPaid', '400');
form.append('nativeAddress', 'JP Nagar Bangalore');
form.append('isAddressSameAsAadhaar', 'true');

// Use an existing small png image from uploads to simulate real upload
const sampleImg = fs.readFileSync(path.join(__dirname, 'uploads/parks/park-1790006088230-581486082.png'));
form.append('photo', sampleImg, { filename: 'applicant-photo.png', contentType: 'image/png' });
form.append('document', sampleImg, { filename: 'aadhaar-card.png', contentType: 'image/png' });

const token = jwt.sign({ id: '6a434e0ca1997728957b0f3b' }, 'secret');

const req = http.request('http://localhost:5000/api/stall-bookings', {
  method: 'POST',
  headers: {
    ...form.getHeaders(),
    Authorization: 'Bearer ' + token
  }
}, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Result:', data);
    process.exit(0);
  });
});

req.on('error', err => {
  console.error('Request error:', err);
  process.exit(1);
});

form.pipe(req);
