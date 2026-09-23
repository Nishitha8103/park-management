const Contractor = require('../models/Contractor');
const Park = require('../models/Park');
const { sendContractorCredentialsEmail, sendContractorUpdateEmail } = require('../config/sendEmail');
const crypto = require('crypto');

const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

// @desc    Get all contractors
// @route   GET /api/contractors
// @access  Private/Admin
const getContractors = async (req, res) => {
  try {
    const contractors = await Contractor.find()
      .populate('corporation')
      .populate('zone')
      .populate('ward')
      .sort({ createdAt: -1 });
    res.json(contractors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get contractor by ID
// @route   GET /api/contractors/:id
// @access  Private/Admin
const getContractorById = async (req, res) => {
  try {
    const contractor = await Contractor.findById(req.params.id)
      .populate('corporation')
      .populate('zone')
      .populate('ward');
      
    if (contractor) {
      res.json(contractor);
    } else {
      res.status(404).json({ message: 'Contractor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new contractor
// @route   POST /api/contractors
// @access  Private/Admin
const createContractor = async (req, res) => {
  try {
    let {
      name, email, phone, address,
      district, corporation, zone, ward, assignedParks, username, password, status, maintenanceSkills
    } = req.body;
    
    if (!password) {
      password = crypto.randomBytes(4).toString('hex');
    }

    // Check if contractor email or username already exists
    const emailExists = await Contractor.findOne({ email });
    if (emailExists) return res.status(400).json({ message: 'Email already exists' });
    
    // Auto generate username if not provided or empty
    let finalUsername = username ? username.trim() : '';
    if (!finalUsername && email) {
      finalUsername = email.split('@')[0];
    }
    
    if (finalUsername) {
      const usernameExists = await Contractor.findOne({ username: finalUsername });
      if (usernameExists) return res.status(400).json({ message: `Username '${finalUsername}' already exists` });
    }


    // Generate contractorId (e.g., CON001)
    const latestContractor = await Contractor.findOne().sort({ contractorId: -1 });
    let nextIdNumber = 1;
    if (latestContractor && latestContractor.contractorId && latestContractor.contractorId.startsWith('CON')) {
      const currentIdNumber = parseInt(latestContractor.contractorId.replace('CON', ''), 10);
      if (!isNaN(currentIdNumber)) {
        nextIdNumber = currentIdNumber + 1;
      }
    }
    const contractorId = `CON${nextIdNumber.toString().padStart(3, '0')}`;

    // Handle image upload if provided (from multer)
    let profilePhoto = null;
    if (req.file) {
      profilePhoto = `/uploads/parks/${req.file.filename}`;
    }

    const contractor = new Contractor({
      contractorId,
      name,
      email,
      phone,
      address,
      district,
      corporation,
      zone,
      ward,
      assignedParks: assignedParks || [],
      username: finalUsername,
      password,
      status: status || 'Active',
      maintenanceSkills: maintenanceSkills || [],
      profilePhoto
    });

    const createdContractor = await contractor.save();

    // Send credentials email to contractor
    try {
      await sendContractorCredentialsEmail(email, name, finalUsername, password);
    } catch (emailErr) {
      console.error('Failed to send email:', emailErr);
    }

    res.status(201).json(createdContractor);

  } catch (error) {
    console.error('Error creating contractor:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a contractor
// @route   PUT /api/contractors/:id
// @access  Private/Admin
const updateContractor = async (req, res) => {
  try {
    const {
      name, email, phone, address,
      district, corporation, zone, ward, assignedParks, username, password, status, maintenanceSkills
    } = req.body;

    const contractor = await Contractor.findById(req.params.id);

    if (contractor) {
      // Check if updating to an existing email or username
      if (email !== contractor.email) {
        const emailExists = await Contractor.findOne({ email });
        if (emailExists) return res.status(400).json({ message: 'Email already in use' });
      }
      
      if (username !== contractor.username) {
        const usernameExists = await Contractor.findOne({ username });
        if (usernameExists) return res.status(400).json({ message: 'Username already in use' });
      }

      contractor.name = name || contractor.name;
      contractor.email = email || contractor.email;
      contractor.phone = phone || contractor.phone;
      contractor.address = address || contractor.address;
      contractor.district = district || contractor.district;
      contractor.corporation = corporation || contractor.corporation;
      contractor.zone = zone || contractor.zone;
      contractor.ward = ward || contractor.ward;
      if (assignedParks) contractor.assignedParks = assignedParks;
      contractor.username = username || contractor.username;
      contractor.status = status || contractor.status;
      if (maintenanceSkills) contractor.maintenanceSkills = maintenanceSkills;

      if (password) {
        contractor.password = password; // Will be hashed by pre-save hook
      }

      if (req.file) {
        contractor.profilePhoto = `/uploads/parks/${req.file.filename}`;
      }

      const updatedContractor = await contractor.save();

      // Fetch park names for the email
      let parkNames = [];
      if (updatedContractor.assignedParks && updatedContractor.assignedParks.length > 0) {
        const parksList = await Park.find({ _id: { $in: updatedContractor.assignedParks } }).select('name').lean();
        parkNames = parksList.map(p => p.name);
      }

      // Send update email with new info
      try {
        await sendContractorUpdateEmail(updatedContractor.email, updatedContractor.name, updatedContractor.username, password || null, parkNames);
      } catch (emailErr) {
        console.error('Failed to send email on update:', emailErr);
      }

      res.json(updatedContractor);
    } else {
      res.status(404).json({ message: 'Contractor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a contractor
// @route   DELETE /api/contractors/:id
// @access  Private/Admin
const deleteContractor = async (req, res) => {
  try {
    const contractor = await Contractor.findById(req.params.id);
    if (contractor) {
      await Contractor.deleteOne({ _id: req.params.id });
      res.json({ message: 'Contractor removed' });
    } else {
      res.status(404).json({ message: 'Contractor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Auth contractor & get token
// @route   POST /api/contractors/login
// @access  Public
const loginContractor = async (req, res) => {
  try {
    const idTrimmed = (username || '').trim();
    const identifierRegex = new RegExp(`^${idTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    const contractor = await Contractor.findOne({ 
      $or: [
        { username: identifierRegex },
        { email: identifierRegex },
        { contractorId: identifierRegex }
      ] 
    });

    if (contractor && (await contractor.matchPassword(password))) {
      if (contractor.status === 'Inactive') {
        return res.status(401).json({ message: 'Account is inactive. Contact Administrator.' });
      }
      
      res.json({
        message: 'Login successful',
        user: {
          id: contractor._id,
          contractorId: contractor.contractorId,
          name: contractor.name,
          username: contractor.username,
          email: contractor.email,
          role: contractor.role,
          corporation: contractor.corporation,
          zone: contractor.zone,
          ward: contractor.ward,
          profilePhoto: contractor.profilePhoto,
          token: generateToken(contractor._id),
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get next contractor ID
// @route   GET /api/contractors/next-id
// @access  Private/Admin
const getNextContractorId = async (req, res) => {
  try {
    const latestContractor = await Contractor.findOne().sort({ contractorId: -1 });
    let nextIdNumber = 1;
    if (latestContractor && latestContractor.contractorId && latestContractor.contractorId.startsWith('CON')) {
      const currentIdNumber = parseInt(latestContractor.contractorId.replace('CON', ''), 10);
      if (!isNaN(currentIdNumber)) {
        nextIdNumber = currentIdNumber + 1;
      }
    }
    const contractorId = `CON${nextIdNumber.toString().padStart(3, '0')}`;
    res.json({ nextId: contractorId });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update contractor profile (self)
// @route   PUT /api/contractors/profile
// @access  Private/Contractor
const updateContractorProfile = async (req, res) => {
  try {
    const contractorId = req.user?._id || req.user?.id;
    const contractor = await Contractor.findById(contractorId);

    if (contractor) {
      if (req.body.name) contractor.name = req.body.name;
      if (req.body.email) contractor.email = req.body.email;
      if (req.body.phone) contractor.phone = req.body.phone;
      if (req.body.address) contractor.address = req.body.address;

      if (req.body.password && req.body.password.trim() !== '') {
        contractor.password = req.body.password;
      }

      if (req.file) {
        contractor.profilePhoto = `/uploads/parks/${req.file.filename}`;
      } else if (req.body.profilePhoto) {
        contractor.profilePhoto = req.body.profilePhoto;
      } else if (req.body.profilePic) {
        contractor.profilePhoto = req.body.profilePic;
      }

      const updatedContractor = await contractor.save();

      // Fetch park names for email if needed
      let parkNames = [];
      if (updatedContractor.assignedParks && updatedContractor.assignedParks.length > 0) {
        const Park = require('../models/Park');
        const parksList = await Park.find({ _id: { $in: updatedContractor.assignedParks } }).select('name').lean();
        parkNames = parksList.map(p => p.name);
      }

      if (req.body.password) {
        const { sendContractorUpdateEmail } = require('../config/sendEmail');
        try {
          await sendContractorUpdateEmail(
            updatedContractor.email,
            updatedContractor.name,
            updatedContractor.username,
            req.body.password || null,
            parkNames
          );
        } catch (emailErr) {
          console.error('Failed to send email on profile update:', emailErr);
        }
      }

      const existingToken = (req.headers.authorization && req.headers.authorization.split(' ')[1]) || req.user?.token;

      res.json({
        id: updatedContractor._id,
        _id: updatedContractor._id,
        contractorId: updatedContractor.contractorId,
        name: updatedContractor.name,
        username: updatedContractor.username,
        email: updatedContractor.email,
        phone: updatedContractor.phone,
        address: updatedContractor.address,
        role: updatedContractor.role,
        department: updatedContractor.department,
        corporation: updatedContractor.corporation,
        zone: updatedContractor.zone,
        ward: updatedContractor.ward,
        assignedParks: updatedContractor.assignedParks,
        profilePhoto: updatedContractor.profilePhoto,
        profilePic: updatedContractor.profilePhoto,
        maintenanceSkills: updatedContractor.maintenanceSkills,
        status: updatedContractor.status,
        token: existingToken
      });
    } else {
      res.status(404).json({ message: 'Contractor not found' });
    }
  } catch (error) {
    console.error('Update contractor profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc  Get own profile for logged-in contractor
// @route GET /api/contractors/profile
// @access Contractor
const getMyProfile = async (req, res) => {
  try {
    const contractorId = req.user?._id || req.user?.id;
    const contractor = await Contractor.findById(contractorId).lean();
    if (!contractor) return res.status(404).json({ message: 'Contractor not found' });
    res.json({
      id: contractor._id,
      _id: contractor._id,
      contractorId: contractor.contractorId,
      name: contractor.name,
      username: contractor.username,
      email: contractor.email,
      phone: contractor.phone,
      address: contractor.address,
      role: contractor.role,
      corporation: contractor.corporation,
      zone: contractor.zone,
      ward: contractor.ward,
      assignedParks: contractor.assignedParks,
      profilePhoto: contractor.profilePhoto,
      profilePic: contractor.profilePhoto,
      maintenanceSkills: contractor.maintenanceSkills,
      status: contractor.status
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  updateContractorProfile,
  getMyProfile,
  getContractors,
  getContractorById,
  createContractor,
  updateContractor,
  deleteContractor,
  loginContractor,
  getNextContractorId
};
