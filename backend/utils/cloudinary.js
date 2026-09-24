const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

/**
 * Upload a single file (file path, buffer, or base64 data URI) to Cloudinary
 * @param {string|Buffer} fileInput - Local file path, Buffer, or Base64 data string
 * @param {string} folder - Target Cloudinary folder (e.g., 'parks', 'complaints', 'kyc', 'contractors')
 * @param {object} customOptions - Extra options for Cloudinary uploader
 * @returns {Promise<string>} The secure HTTPS URL of the uploaded asset
 */
const uploadToCloudinary = async (fileInput, folder = 'parks', customOptions = {}) => {
  if (!fileInput) return '';

  const options = {
    folder: `park_management/${folder}`,
    resource_type: 'auto',
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    ...customOptions
  };

  try {
    // 1. If it's a buffer
    if (Buffer.isBuffer(fileInput)) {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
          if (error) {
            console.error('[Cloudinary] Buffer upload error:', error);
            return reject(error);
          }
          resolve(result.secure_url || result.url);
        });
        stream.end(fileInput);
      });
    }

    // 2. If it's a string (file path or base64 / URL)
    if (typeof fileInput === 'string') {
      // If already a Cloudinary / remote URL, return as-is
      if (fileInput.startsWith('http://') || fileInput.startsWith('https://')) {
        return fileInput;
      }

      // If it's a relative /uploads path, resolve absolute disk path if it exists
      let diskPath = fileInput;
      if (fileInput.startsWith('/uploads/')) {
        diskPath = path.join(__dirname, '..', fileInput);
      }

      // Check if file exists on disk
      if (fs.existsSync(diskPath)) {
        const result = await cloudinary.uploader.upload(diskPath, options);
        return result.secure_url || result.url;
      }

      // If it's a base64 Data URI (e.g. data:image/jpeg;base64,...)
      if (fileInput.startsWith('data:')) {
        const result = await cloudinary.uploader.upload(fileInput, options);
        return result.secure_url || result.url;
      }

      // If file doesn't exist on disk (e.g. seed/mock path), keep original string
      return fileInput;
    }

    // If file object has path (like Multer file object)
    if (fileInput && typeof fileInput === 'object' && fileInput.path) {
      const result = await cloudinary.uploader.upload(fileInput.path, options);
      return result.secure_url || result.url;
    }

    // If file object has buffer (like Multer memoryStorage)
    if (fileInput && typeof fileInput === 'object' && fileInput.buffer) {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
          if (error) {
            console.error('[Cloudinary] Multer buffer upload error:', error);
            return reject(error);
          }
          resolve(result.secure_url || result.url);
        });
        stream.end(fileInput.buffer);
      });
    }

    console.warn('[Cloudinary] Unsupported fileInput format:', typeof fileInput);
    return typeof fileInput === 'string' ? fileInput : '';
  } catch (error) {
    console.error('[Cloudinary] Upload failed:', error.message || error);
    // Return relative or fallback string if available to avoid breaking app flow
    if (typeof fileInput === 'string') {
      return fileInput;
    }
    if (fileInput && fileInput.filename) {
      return `/uploads/${folder}/${fileInput.filename}`;
    }
    return '';
  }
};

/**
 * Upload multiple files to Cloudinary in parallel
 * @param {Array<string|object>} files - Array of file paths or Multer file objects
 * @param {string} folder - Target Cloudinary folder
 * @returns {Promise<string[]>} Array of secure URLs
 */
const uploadMultipleToCloudinary = async (files, folder = 'parks') => {
  if (!files || !Array.isArray(files) || files.length === 0) return [];
  const uploadPromises = files.map(file => uploadToCloudinary(file, folder));
  const results = await Promise.all(uploadPromises);
  return results.filter(Boolean);
};

/**
 * Delete an asset from Cloudinary by public ID
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('[Cloudinary] Delete failed:', error.message || error);
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary
};
