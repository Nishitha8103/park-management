const axios = require('axios');
axios.get('http://127.0.0.1:5000/api/parks').then(res => {
  const park = res.data[0];
  console.log("First park:");
  console.log(JSON.stringify(park, null, 2));
}).catch(console.error);
