const Park = require('../models/Park');
const District = require('../models/District');
const Corporation = require('../models/Corporation');
const Zone = require('../models/Zone');
const Ward = require('../models/Ward');
const xlsx = require('xlsx');
const { uploadMultipleToCloudinary } = require('../utils/cloudinary');

// @desc    Get a single park by ID
// @route   GET /api/parks/:id
// @access  Public
const getParkById = async (req, res) => {
  try {
    const park = await Park.findById(req.params.id)
      .populate('district', 'name')
      .populate('corporation', 'name')
      .populate('zone', 'name')
      .populate('ward', 'name')
      .lean();
    if (!park) {
      return res.status(404).json({ message: 'Park not found' });
    }
    res.json(park);
  } catch (error) {
    console.error('Error fetching park by id:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const parksCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

const clearParksCache = () => {
  parksCache.clear();
};

// @desc    Get all parks
// @route   GET /api/parks
// @access  Public / Private
const getParks = async (req, res) => {
  try {
    const cacheKey = JSON.stringify(req.query || {});
    const cached = parksCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return res.json(cached.data);
    }

    const { districtId, corporationId, zoneId, wardId, district, corporation, zone, ward, contractorId } = req.query;
    let filter = {};
    if (districtId || district) filter.district = districtId || district;
    if (corporationId || corporation) filter.corporation = corporationId || corporation;
    if (zoneId || zone) filter.zone = zoneId || zone;
    if (wardId || ward) filter.ward = wardId || ward;

    if (contractorId) {
      try {
        const Contractor = require('../models/Contractor');
        const Complaint = require('../models/Complaint');
        const contractor = await Contractor.findById(contractorId).lean();
        if (contractor) {
          const parkIds = [];
          if (contractor.park) parkIds.push(contractor.park.toString());
          if (contractor.assignedParks && contractor.assignedParks.length > 0) {
            contractor.assignedParks.forEach(p => {
              if (p) parkIds.push(p.toString());
            });
          }
          // Also check parks referenced in complaints assigned to this contractor
          const contractorComplaints = await Complaint.find({ assignedContractor: contractorId }).select('park').lean();
          contractorComplaints.forEach(c => {
            if (c.park && !parkIds.includes(c.park.toString())) {
              parkIds.push(c.park.toString());
            }
          });

          filter._id = { $in: parkIds };
        }
      } catch (err) {
        console.error('Error finding contractor for parks filter:', err);
      }
    }

    const parks = await Park.find(filter)
      .populate('district', 'name code')
      .populate('corporation', 'name code')
      .populate('zone', 'name code')
      .populate('ward', 'name wardNumber')
      .sort({ createdAt: -1 })
      .lean();

    parksCache.set(cacheKey, { timestamp: Date.now(), data: parks });
    res.json(parks);
  } catch (error) {
    console.error('Error fetching parks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new park
// @route   POST /api/parks
// @access  Private/Admin
const createPark = async (req, res) => {
  try {
    const {
      district, corporation, zone, ward,
      name, parkCode, address, latitude, longitude, area, parkType,
      numberOfTrees, numberOfBenches, numberOfLights, numberOfDustbins,
      childrenPlayArea, walkingTrack, openGym, garden, lake, restrooms, parking,
      yogaSpace, drinkingWater, openedOn, maintenance,
      wheelchairAccessible, accessiblePathways, petFriendly, firstAid, cctv, strollerFriendly, emergencyAssistance,
      description, status, facilities, totalStallSlots, stallBookingAmount
    } = req.body;
    
    // --- Validation Checks ---
    if (!name || !name.toString().trim()) {
      return res.status(400).json({ message: 'Park Name is required.' });
    }
    if (!parkCode || !parkCode.toString().trim()) {
      return res.status(400).json({ message: 'Park Code is required.' });
    }
    if (!district || !corporation || !zone || !ward) {
      return res.status(400).json({ message: 'District, Corporation, Zone, and Ward are required.' });
    }

    // Check unique Park Code
    const existingCode = await Park.findOne({ parkCode: parkCode.toString().trim() });
    if (existingCode) {
      return res.status(400).json({ message: `A park with code '${parkCode.toString().trim()}' already exists. Please enter a unique Park Code.` });
    }

    // Validate non-negative numbers
    if (Number(numberOfTrees) < 0 || Number(numberOfBenches) < 0 || Number(numberOfLights) < 0 || Number(numberOfDustbins) < 0) {
      return res.status(400).json({ message: 'Asset counts (trees, benches, lights, dustbins) cannot be negative.' });
    }
    if (Number(totalStallSlots) < 0 || Number(stallBookingAmount) < 0) {
      return res.status(400).json({ message: 'Stall slot counts and booking amounts cannot be negative.' });
    }

    // Latitude & Longitude validation
    if (latitude && latitude.toString().trim() !== '') {
      const latNum = Number(latitude);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        return res.status(400).json({ message: 'Latitude must be a valid number between -90 and 90.' });
      }
    }
    if (longitude && longitude.toString().trim() !== '') {
      const lngNum = Number(longitude);
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        return res.status(400).json({ message: 'Longitude must be a valid number between -180 and 180.' });
      }
    }

    // Parse facilities if it's sent as a string
    let parsedFacilities = [];
    if (facilities) {
      if (typeof facilities === 'string') {
        try {
          parsedFacilities = JSON.parse(facilities);
        } catch (e) {
          parsedFacilities = facilities.split(',').map(f => f.trim()).filter(Boolean);
        }
      } else if (Array.isArray(facilities)) {
        parsedFacilities = facilities;
      }
    }

    // Handle image paths via Cloudinary
    const imagePaths = req.files && req.files.length > 0 
      ? await uploadMultipleToCloudinary(req.files, 'parks') 
      : [];

    const parsedTotalStallSlots = Number(totalStallSlots) || 0;
    const park = new Park({
      district,
      corporation,
      zone,
      ward,
      name: name.toString().trim(),
      parkCode: parkCode.toString().trim(),
      address,
      latitude,
      longitude,
      area,
      parkType,
      numberOfTrees: Number(numberOfTrees) || 0,
      numberOfBenches: Number(numberOfBenches) || 0,
      numberOfLights: Number(numberOfLights) || 0,
      numberOfDustbins: Number(numberOfDustbins) || 0,
      totalStallSlots: parsedTotalStallSlots,
      availableStallSlots: parsedTotalStallSlots,
      stallBookingAmount: Number(stallBookingAmount) || 0,
      childrenPlayArea: childrenPlayArea === 'true' || childrenPlayArea === true,
      walkingTrack: walkingTrack === 'true' || walkingTrack === true,
      openGym: openGym === 'true' || openGym === true,
      garden: garden === 'true' || garden === true,
      lake: lake === 'true' || lake === true,
      restrooms: restrooms === 'true' || restrooms === true,
      parking: parking === 'true' || parking === true,
      yogaSpace: yogaSpace === 'true' || yogaSpace === true,
      drinkingWater: drinkingWater === 'true' || drinkingWater === true,
      wheelchairAccessible: wheelchairAccessible === 'true' || wheelchairAccessible === true,
      accessiblePathways: accessiblePathways === 'true' || accessiblePathways === true,
      petFriendly: petFriendly === 'true' || petFriendly === true,
      firstAid: firstAid === 'true' || firstAid === true,
      cctv: cctv === 'true' || cctv === true,
      strollerFriendly: strollerFriendly === 'true' || strollerFriendly === true,
      emergencyAssistance: emergencyAssistance === 'true' || emergencyAssistance === true,
      openedOn,
      maintenance,
      facilities: parsedFacilities,
      status: status || 'Active',
      images: imagePaths,
      description
    });

    const createdPark = await park.save();
    clearParksCache();
    res.status(201).json(createdPark);
  } catch (error) {
    console.error('Error creating park:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to parse boolean flags in Excel import
const parseBoolean = (val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const s = val.toLowerCase().trim();
    return s === 'true' || s === 'yes' || s === 'y' || s === '1' || s === 'active' || s === 'checked';
  }
  if (typeof val === 'number') return val === 1;
  return false;
};

// @desc    Bulk upload parks via Excel
// @route   POST /api/parks/bulk-upload
// @access  Private/Admin
const bulkUploadParks = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    // Fetch all master data to perform memory lookups
    const [allDistricts, allCorporations, allZones, allWards] = await Promise.all([
      District.find({}).lean(),
      Corporation.find({}).lean(),
      Zone.find({}).lean(),
      Ward.find({}).lean()
    ]);

    const results = {
      successCount: 0,
      failureCount: 0,
      errors: []
    };

    const parkBulkOps = [];


    console.log(`Starting processing for ${rows.length} rows`);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Row number in Excel (1-based index + 1 for header)
      
      if (i % 100 === 0) console.log(`Processing row ${rowNum}`);

      try {
        const getValue = (keys) => {
          for (const k of keys) {
            const foundKey = Object.keys(row).find(
              (rk) => rk.trim().toLowerCase() === k.toLowerCase()
            );
            if (foundKey) return row[foundKey];
          }
          return undefined;
        };

        const districtName = getValue(['District']) || 'Bangalore Urban';
        const corpName = getValue(['Corporation']) || 'BBMP';
        const zoneName = getValue(['Zone']) || 'Unknown Zone';
        const wardNameOrNum = getValue(['Ward']) || 'Unknown Ward';
        const name = getValue(['Park Name', 'Name']) || getValue(Object.keys(row)); // fallback to first column if no name
        const providedParkCode = getValue(['Park Code', 'ParkCode', 'Code']);
        const parkCode = providedParkCode || 'P-' + Math.floor(100000 + Math.random() * 900000);

        const missing = [];
        if (!name) missing.push('Park Name');

        if (missing.length > 0) {
          throw new Error(`Missing required fields: ${missing.join(', ')}. Available columns in your file: ${Object.keys(row).join(', ')}`);
        }

        // 1. Find or create District
        const dKeyClean = districtName.toString().trim().toLowerCase();
        let district = allDistricts.find(d => 
          (d.name && d.name.trim().toLowerCase() === dKeyClean) || 
          (d.code && d.code.trim().toLowerCase() === dKeyClean) ||
          (d.name && d.name.trim().toLowerCase().replace('bengaluru', 'bangalore') === dKeyClean.replace('bengaluru', 'bangalore'))
        );
        if (!district) {
          const distCode = districtName.toString().trim().substring(0, 3).toUpperCase() + Math.floor(100 + Math.random() * 900);
          const newDist = await District.create({
            name: districtName.toString().trim(),
            code: distCode,
            description: `${districtName.toString().trim()} District (Auto-created)`
          });
          district = newDist.toObject ? newDist.toObject() : newDist;
          allDistricts.push(district);
        }

        // 2. Find or create Corporation
        const cKeyClean = corpName.toString().trim().toLowerCase();
        let corp = allCorporations.find(c => 
          c.districtId.toString() === district._id.toString() && (
            (c.name && c.name.trim().toLowerCase() === cKeyClean) || 
            (c.code && c.code.trim().toLowerCase() === cKeyClean)
          )
        );
        if (!corp) {
          const corpCode = `${district.code}-CC-${Math.floor(10 + Math.random() * 90)}`;
          const newCorp = await Corporation.create({
            districtId: district._id,
            name: corpName.toString().trim(),
            code: corpCode,
            description: `${corpName.toString().trim()} (Auto-created)`
          });
          corp = newCorp.toObject ? newCorp.toObject() : newCorp;
          allCorporations.push(corp);
        }

        // 3. Find or create Zone
        const zKeyClean = zoneName.toString().trim().toLowerCase();
        let zone = allZones.find(z => 
          z.corporationId.toString() === corp._id.toString() && (
            (z.name && z.name.trim().toLowerCase() === zKeyClean) || 
            (z.code && z.code.trim().toLowerCase() === zKeyClean)
          )
        );
        if (!zone) {
          const zoneCode = `${corp.code}-Z-${Math.floor(10 + Math.random() * 90)}`;
          const newZone = await Zone.create({
            districtId: district._id,
            corporationId: corp._id,
            name: zoneName.toString().trim(),
            code: zoneCode
          });
          zone = newZone.toObject ? newZone.toObject() : newZone;
          allZones.push(zone);
        }

        // 4. Find or create Ward
        const wKeyClean = wardNameOrNum.toString().trim().toLowerCase();
        let ward = allWards.find(w => 
          w.zoneId.toString() === zone._id.toString() && (
            (w.name && w.name.trim().toLowerCase() === wKeyClean) || 
            (w.wardNumber && w.wardNumber.toString().trim().toLowerCase() === wKeyClean)
          )
        );
        if (!ward) {
          const wardNumStr = wardNameOrNum.toString().trim();
          const newWard = await Ward.create({
            districtId: district._id,
            corporationId: corp._id,
            zoneId: zone._id,
            name: isNaN(Number(wardNumStr)) ? wardNumStr : `Ward ${wardNumStr}`,
            wardNumber: wardNumStr
          });
          ward = newWard.toObject ? newWard.toObject() : newWard;
          allWards.push(ward);
        }

        // 5. Build bulk operation
        
        // Parse facilities array
        let parsedFacilities = [];
        const facValue = getValue(['Facilities', 'facilities']);
        if (facValue) {
          parsedFacilities = facValue.toString().split(',').map(f => f.trim()).filter(Boolean);
        }

        // Parse images array
        let parsedImages = [];
        const imgValue = getValue(['Images', 'images', 'Image', 'image']);
        if (imgValue) {
          parsedImages = imgValue.toString().split(',').map(img => img.trim()).filter(Boolean);
        }

        const parkData = {
          district: district._id,
          corporation: corp._id,
          zone: zone._id,
          ward: ward._id,
          name: name.toString().trim(),
          parkCode: parkCode.toString().trim(),
          address: getValue(['Address', 'address']) || '',
          latitude: getValue(['Latitude', 'latitude']) || '',
          longitude: getValue(['Longitude', 'longitude']) || '',
          area: getValue(['Area', 'area']) || '',
          parkType: getValue(['Park Type', 'parkType']) || '',
          numberOfTrees: parseInt(getValue(['Trees', 'numberOfTrees'])) || 0,
          numberOfBenches: parseInt(getValue(['Benches', 'numberOfBenches'])) || 0,
          numberOfLights: parseInt(getValue(['Lights', 'numberOfLights'])) || 0,
          numberOfDustbins: parseInt(getValue(['Dustbins', 'numberOfDustbins'])) || 0,
          childrenPlayArea: parseBoolean(getValue(['Children Play Area', 'childrenPlayArea'])),
          walkingTrack: parseBoolean(getValue(['Walking Track', 'walkingTrack'])),
          openGym: parseBoolean(getValue(['Open Gym', 'openGym'])),
          garden: parseBoolean(getValue(['Garden', 'garden'])),
          lake: parseBoolean(getValue(['Lake', 'lake'])),
          restrooms: parseBoolean(getValue(['Restrooms', 'restrooms'])),
          parking: parseBoolean(getValue(['Parking', 'parking'])),
          facilities: parsedFacilities,
          description: getValue(['Description', 'description']) || '',
          status: getValue(['Status', 'status']) || 'Active'
        };

        if (parsedImages.length > 0) {
          parkData.images = parsedImages;
        }
        
        let upsertFilter = {};
        if (providedParkCode) {
          upsertFilter = { parkCode: providedParkCode.toString().trim() };
        } else {
          upsertFilter = { name: name.toString().trim(), ward: ward._id };
        }

        parkBulkOps.push({
          updateOne: {
            filter: upsertFilter,
            update: { $set: parkData },
            upsert: true
          }
        });

      } catch (err) {
        results.failureCount++;
        results.errors.push({
          row: rowNum,
          parkName: row['Park Name'] || row.name || 'Unknown',
          message: err.message
        });
      }
    }

    if (parkBulkOps.length > 0) {
      try {
        const bulkResult = await Park.bulkWrite(parkBulkOps);
        results.successCount = parkBulkOps.length;
      } catch (err) {
        console.error("Bulk write error:", err);
        throw new Error("Database error during bulk insert");
      }
    }

    clearParksCache();
    console.log("Finished processing, sending response:", results);
    res.status(200).json(results);
  } catch (error) {
    console.error('Error uploading bulk parks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a park
// @route   PUT /api/parks/:id
const updatePark = async (req, res) => {
  try {
    const { id } = req.params;
    let park = await Park.findById(id);
    if (!park) {
      return res.status(404).json({ message: 'Park not found' });
    }

    const updateFields = { ...req.body };

    // --- Validation Checks ---
    if (updateFields.name !== undefined && !updateFields.name.toString().trim()) {
      return res.status(400).json({ message: 'Park Name cannot be empty.' });
    }
    if (updateFields.parkCode !== undefined && !updateFields.parkCode.toString().trim()) {
      return res.status(400).json({ message: 'Park Code cannot be empty.' });
    }

    if (updateFields.parkCode) {
      const codeStr = updateFields.parkCode.toString().trim();
      const existingCode = await Park.findOne({ parkCode: codeStr, _id: { $ne: id } });
      if (existingCode) {
        return res.status(400).json({ message: `A park with code '${codeStr}' already exists. Please use a unique Park Code.` });
      }
      updateFields.parkCode = codeStr;
    }

    if (updateFields.name) {
      updateFields.name = updateFields.name.toString().trim();
    }

    if (updateFields.latitude && updateFields.latitude.toString().trim() !== '') {
      const latNum = Number(updateFields.latitude);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        return res.status(400).json({ message: 'Latitude must be a valid number between -90 and 90.' });
      }
    }
    if (updateFields.longitude && updateFields.longitude.toString().trim() !== '') {
      const lngNum = Number(updateFields.longitude);
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        return res.status(400).json({ message: 'Longitude must be a valid number between -180 and 180.' });
      }
    }

    // Parse boolean flags
    const booleanFlags = [
      'childrenPlayArea', 'walkingTrack', 'openGym', 'garden', 'lake', 'restrooms', 'parking', 'yogaSpace', 'drinkingWater',
      'wheelchairAccessible', 'accessiblePathways', 'petFriendly', 'firstAid', 'cctv', 'strollerFriendly', 'emergencyAssistance'
    ];
    booleanFlags.forEach(flag => {
      if (updateFields[flag] !== undefined) {
        updateFields[flag] = updateFields[flag] === 'true' || updateFields[flag] === true;
      }
    });

    // Parse facilities if present
    if (updateFields.facilities) {
      if (typeof updateFields.facilities === 'string') {
        try {
          updateFields.facilities = JSON.parse(updateFields.facilities);
        } catch (e) {
          updateFields.facilities = updateFields.facilities.split(',').map(f => f.trim()).filter(Boolean);
        }
      }
    }

    // Number conversions
    const numFields = ['numberOfTrees', 'numberOfBenches', 'numberOfLights', 'numberOfDustbins', 'totalStallSlots', 'stallBookingAmount'];
    numFields.forEach(field => {
      if (updateFields[field] !== undefined) {
        updateFields[field] = Number(updateFields[field]) || 0;
      }
    });

    // If totalStallSlots is updated, adjust availableStallSlots
    if (updateFields.totalStallSlots !== undefined && park.totalStallSlots !== undefined) {
      const difference = updateFields.totalStallSlots - park.totalStallSlots;
      updateFields.availableStallSlots = (park.availableStallSlots || 0) + difference;
      if (updateFields.availableStallSlots < 0) updateFields.availableStallSlots = 0;
    } else if (updateFields.totalStallSlots !== undefined && park.totalStallSlots === undefined) {
      updateFields.availableStallSlots = updateFields.totalStallSlots;
    }

    // Handle new images via Cloudinary
    if (req.files && req.files.length > 0) {
      const newImages = await uploadMultipleToCloudinary(req.files, 'parks');
      updateFields.images = [...(park.images || []), ...newImages];
    }

    const updatedPark = await Park.findByIdAndUpdate(id, updateFields, { new: true });
    clearParksCache();
    res.json(updatedPark);
  } catch (error) {
    console.error('Error updating park:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a park
// @route   DELETE /api/parks/:id
const deletePark = async (req, res) => {
  try {
    const { id } = req.params;
    const park = await Park.findById(id);
    if (!park) {
      return res.status(404).json({ message: 'Park not found' });
    }
    await Park.findByIdAndDelete(id);
    clearParksCache();
    res.json({ message: 'Park removed successfully' });
  } catch (error) {
    console.error('Error deleting park:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete multiple parks
// @route   POST /api/parks/bulk-delete
// @access  Private/Admin
const bulkDeleteParks = async (req, res) => {
  try {
    const { parkIds } = req.body;
    if (!parkIds || !Array.isArray(parkIds) || parkIds.length === 0) {
      return res.status(400).json({ message: 'No park IDs provided' });
    }
    await Park.deleteMany({ _id: { $in: parkIds } });
    clearParksCache();
    res.json({ message: 'Parks removed successfully' });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Export parks to Excel
// @route   GET /api/parks/export
// @access  Private/Admin
const exportParksToExcel = async (req, res) => {
  try {
    const parks = await Park.find({})
      .populate('district')
      .populate('corporation')
      .populate('zone')
      .populate('ward')
      .sort({ createdAt: -1 });

    const data = parks.map(park => ({
      District: park.district?.name || '',
      Corporation: park.corporation?.name || '',
      Zone: park.zone?.name || '',
      Ward: park.ward?.name || park.ward?.wardNumber || '',
      'Park Name': park.name || '',
      'Park Code': park.parkCode || '',
      Address: park.address || '',
      Latitude: park.latitude || '',
      Longitude: park.longitude || '',
      Area: park.area || '',
      'Park Type': park.parkType || '',
      Trees: park.numberOfTrees || 0,
      Benches: park.numberOfBenches || 0,
      Lights: park.numberOfLights || 0,
      Dustbins: park.numberOfDustbins || 0,
      'Children Play Area': park.childrenPlayArea ? 'Yes' : 'No',
      'Walking Track': park.walkingTrack ? 'Yes' : 'No',
      'Open Gym': park.openGym ? 'Yes' : 'No',
      Garden: park.garden ? 'Yes' : 'No',
      Lake: park.lake ? 'Yes' : 'No',
      Restrooms: park.restrooms ? 'Yes' : 'No',
      Parking: park.parking ? 'Yes' : 'No',
      Facilities: Array.isArray(park.facilities) ? park.facilities.join(', ') : '',
      Images: Array.isArray(park.images) ? park.images.join(', ') : '',
      Description: park.description || '',
      Status: park.status || 'Active'
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Parks');

    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.set({
      'Content-Disposition': 'attachment; filename="parks_export.xlsx"',
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting parks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getParks,
  getParkById,
  createPark,
  bulkUploadParks,
  bulkDeleteParks,
  updatePark,
  deletePark,
  exportParksToExcel
};

