const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const { bulkUploadParks } = require('./controllers/parkController');

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const req = {
    file: {
      buffer: fs.readFileSync('./BBMP_Parks_List_Complete.xlsx')
    }
  };

  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log('Status:', this.statusCode);
      console.log('Response:', JSON.stringify(data, null, 2));
      process.exit(0);
    }
  };

  await bulkUploadParks(req, res);
};

run().catch(console.error);
