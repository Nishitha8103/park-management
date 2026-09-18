const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testSubmit() {
  try {
    const form = new FormData();
    form.append('parkName', 'Central Park');
    form.append('locationInPark', 'Near Gate');
    form.append('category', 'Electrical');
    form.append('priority', 'Medium');
    form.append('userPhone', '1234567890');
    form.append('description', 'This is a test description longer than 10 characters');

    // Attach a dummy file
    fs.writeFileSync('dummy.jpg', 'dummy content');
    form.append('images', fs.createReadStream('dummy.jpg'));

    const res = await axios.post('http://127.0.0.1:5000/api/complaints', form, {
      headers: form.getHeaders()
    });

    console.log('Success:', res.data);
  } catch (error) {
    if (error.response) {
      console.error('Error Response:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testSubmit();
