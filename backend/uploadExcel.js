const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function uploadParks() {
  try {
    // Login to get token
    const loginRes = await axios.post('http://127.0.0.1:5000/api/users/login', {
      email: 'giri@gmail.com', // Assuming this is an admin email created in the previous instruction "create govt official name as giri create as a admin"
      password: 'password123'
    }).catch(() => axios.post('http://127.0.0.1:5000/api/users/login', {
      email: 'admin@pms.com',
      password: 'password123'
    }));
    
    const token = loginRes.data.token;
    
    // Create form data
    const formData = new FormData();
    formData.append('excelFile', fs.createReadStream('./BBMP_Parks_List.xlsx'));
    
    // Upload excel
    const uploadRes = await axios.post('http://127.0.0.1:5000/api/parks/bulk-upload', formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Upload Success:', uploadRes.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

uploadParks();
