const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { uploadToCloudinary } = require('../utils/cloudinary');
const Park = require('../models/Park');
const Complaint = require('../models/Complaint');
const Contractor = require('../models/Contractor');
const StallBooking = require('../models/StallBooking');
const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');

const MONGO_URI = process.env.MONGO_URI;

const migrate = async () => {
  if (!MONGO_URI) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB successfully.');

  let totalMigrated = 0;

  // 1. Parks
  console.log('\n--- Migrating Parks images ---');
  const parks = await Park.find({ images: { $exists: true, $ne: [] } });
  for (const park of parks) {
    let updated = false;
    const newImages = [];
    for (const img of park.images) {
      if (typeof img === 'string' && img.startsWith('/uploads/')) {
        console.log(`[Park ${park.name}] Uploading: ${img}`);
        const cloudUrl = await uploadToCloudinary(img, 'parks');
        if (cloudUrl && cloudUrl.startsWith('http')) {
          newImages.push(cloudUrl);
          updated = true;
          totalMigrated++;
        } else {
          newImages.push(img);
        }
      } else {
        newImages.push(img);
      }
    }
    if (updated) {
      park.images = newImages;
      await park.save();
      console.log(`Updated Park ${park.name} with Cloudinary URLs.`);
    }
  }

  // 2. Complaints
  console.log('\n--- Migrating Complaints images ---');
  const complaints = await Complaint.find();
  for (const c of complaints) {
    let updated = false;
    
    // c.images
    if (c.images && c.images.length > 0) {
      const newImgs = [];
      for (const img of c.images) {
        if (typeof img === 'string' && img.startsWith('/uploads/')) {
          console.log(`[Complaint ${c.complaintNumber}] Uploading evidence: ${img}`);
          const cloudUrl = await uploadToCloudinary(img, 'complaints');
          if (cloudUrl && cloudUrl.startsWith('http')) {
            newImgs.push(cloudUrl);
            updated = true;
            totalMigrated++;
          } else {
            newImgs.push(img);
          }
        } else {
          newImgs.push(img);
        }
      }
      c.images = newImgs;
    }

    // c.beforeImages
    if (c.beforeImages && c.beforeImages.length > 0) {
      const newBefore = [];
      for (const img of c.beforeImages) {
        if (typeof img === 'string' && img.startsWith('/uploads/')) {
          const cloudUrl = await uploadToCloudinary(img, 'complaints');
          newBefore.push(cloudUrl && cloudUrl.startsWith('http') ? cloudUrl : img);
          if (cloudUrl && cloudUrl.startsWith('http')) { updated = true; totalMigrated++; }
        } else {
          newBefore.push(img);
        }
      }
      c.beforeImages = newBefore;
    }

    // c.afterImages
    if (c.afterImages && c.afterImages.length > 0) {
      const newAfter = [];
      for (const img of c.afterImages) {
        if (typeof img === 'string' && img.startsWith('/uploads/')) {
          const cloudUrl = await uploadToCloudinary(img, 'complaints');
          newAfter.push(cloudUrl && cloudUrl.startsWith('http') ? cloudUrl : img);
          if (cloudUrl && cloudUrl.startsWith('http')) { updated = true; totalMigrated++; }
        } else {
          newAfter.push(img);
        }
      }
      c.afterImages = newAfter;
    }

    // c.inspectionImages
    if (c.inspectionImages && c.inspectionImages.length > 0) {
      const newInsp = [];
      for (const img of c.inspectionImages) {
        if (typeof img === 'string' && img.startsWith('/uploads/')) {
          const cloudUrl = await uploadToCloudinary(img, 'complaints');
          newInsp.push(cloudUrl && cloudUrl.startsWith('http') ? cloudUrl : img);
          if (cloudUrl && cloudUrl.startsWith('http')) { updated = true; totalMigrated++; }
        } else {
          newInsp.push(img);
        }
      }
      c.inspectionImages = newInsp;
    }

    // c.completionReport
    if (c.completionReport && typeof c.completionReport === 'string' && c.completionReport.startsWith('/uploads/')) {
      const cloudUrl = await uploadToCloudinary(c.completionReport, 'complaints');
      if (cloudUrl && cloudUrl.startsWith('http')) {
        c.completionReport = cloudUrl;
        updated = true;
        totalMigrated++;
      }
    }

    if (updated) {
      await c.save();
      console.log(`Updated Complaint ${c.complaintNumber} with Cloudinary URLs.`);
    }
  }

  // 3. Contractors
  console.log('\n--- Migrating Contractor Profile Photos ---');
  const contractors = await Contractor.find();
  for (const con of contractors) {
    if (con.profilePhoto && typeof con.profilePhoto === 'string' && con.profilePhoto.startsWith('/uploads/')) {
      console.log(`[Contractor ${con.name}] Uploading profile: ${con.profilePhoto}`);
      const cloudUrl = await uploadToCloudinary(con.profilePhoto, 'contractors');
      if (cloudUrl && cloudUrl.startsWith('http')) {
        con.profilePhoto = cloudUrl;
        await con.save();
        console.log(`Updated Contractor ${con.name} profile photo.`);
        totalMigrated++;
      }
    }
  }

  // 4. Stall Bookings
  console.log('\n--- Migrating Stall Booking Documents ---');
  const stallBookings = await StallBooking.find();
  for (const sb of stallBookings) {
    let updated = false;
    if (sb.photoUrl && sb.photoUrl.startsWith('/uploads/')) {
      const cloudUrl = await uploadToCloudinary(sb.photoUrl, 'stall_bookings');
      if (cloudUrl && cloudUrl.startsWith('http')) { sb.photoUrl = cloudUrl; updated = true; totalMigrated++; }
    }
    if (sb.documentUrl && sb.documentUrl.startsWith('/uploads/')) {
      const cloudUrl = await uploadToCloudinary(sb.documentUrl, 'stall_bookings');
      if (cloudUrl && cloudUrl.startsWith('http')) { sb.documentUrl = cloudUrl; updated = true; totalMigrated++; }
    }
    if (sb.currentAddressProofUrl && sb.currentAddressProofUrl.startsWith('/uploads/')) {
      const cloudUrl = await uploadToCloudinary(sb.currentAddressProofUrl, 'stall_bookings');
      if (cloudUrl && cloudUrl.startsWith('http')) { sb.currentAddressProofUrl = cloudUrl; updated = true; totalMigrated++; }
    }
    if (updated) {
      await sb.save();
      console.log(`Updated Stall Booking ${sb.bookingId || sb._id}`);
    }
  }

  // 5. Users (KYC & Profile)
  console.log('\n--- Migrating User Documents & Profiles ---');
  const users = await User.find();
  for (const u of users) {
    let updated = false;
    if (u.profilePic && u.profilePic.startsWith('/uploads/')) {
      const cloudUrl = await uploadToCloudinary(u.profilePic, 'users');
      if (cloudUrl && cloudUrl.startsWith('http')) { u.profilePic = cloudUrl; updated = true; totalMigrated++; }
    }
    if (u.aadhaarFrontImage && u.aadhaarFrontImage.startsWith('/uploads/')) {
      const cloudUrl = await uploadToCloudinary(u.aadhaarFrontImage, 'kyc');
      if (cloudUrl && cloudUrl.startsWith('http')) { u.aadhaarFrontImage = cloudUrl; updated = true; totalMigrated++; }
    }
    if (u.aadhaarBackImage && u.aadhaarBackImage.startsWith('/uploads/')) {
      const cloudUrl = await uploadToCloudinary(u.aadhaarBackImage, 'kyc');
      if (cloudUrl && cloudUrl.startsWith('http')) { u.aadhaarBackImage = cloudUrl; updated = true; totalMigrated++; }
    }
    if (updated) {
      await u.save();
      console.log(`Updated User ${u.name || u.email}`);
    }
  }

  // 6. Leaves
  console.log('\n--- Migrating Leave Documents ---');
  const leaves = await LeaveRequest.find();
  for (const l of leaves) {
    if (l.supportingDocument && l.supportingDocument.startsWith('/uploads/')) {
      const cloudUrl = await uploadToCloudinary(l.supportingDocument, 'leaves');
      if (cloudUrl && cloudUrl.startsWith('http')) {
        l.supportingDocument = cloudUrl;
        await l.save();
        console.log(`Updated Leave ${l.leaveId}`);
        totalMigrated++;
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`Migration Complete! Total files migrated to Cloudinary: ${totalMigrated}`);
  console.log(`========================================\n`);

  await mongoose.disconnect();
  process.exit(0);
};

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
