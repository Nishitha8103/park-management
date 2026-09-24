const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: __dirname + '/../.env' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'vgks5ytg',
  api_key: process.env.CLOUDINARY_API_KEY || '555852156124588',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'vsGWaGOA5w-dISPJkyrPkwwCEgs',
  secure: true
});

module.exports = cloudinary;
