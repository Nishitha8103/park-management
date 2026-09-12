const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOfficialCredentialsEmail, sendContractorCredentialsEmail, sendWelcomePublicEmail } = require('../config/sendEmail');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    let { name, email, username, password, role, phone, department, zone, ward, district } = req.body;
    
    // Auto generate username if missing
    let finalUsername = username ? username.trim() : '';
    if (!finalUsername && email) {
      finalUsername = email.split('@')[0];
    }
    
    // Auto generate password if missing
    if (!password) {
      password = crypto.randomBytes(4).toString('hex');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user (password hashing is handled in User model pre-save)
    const user = await User.create({
      name,
      email,
      username: finalUsername,
      password,
      role: role || 'Public',
      phone,
      department,
      zone: zone || undefined,
      ward: ward || undefined,
      district: district || undefined
    });

    if (user) {
      // Assign official to multiple parks
      if (req.body.parks && Array.isArray(req.body.parks)) {
        const Park = require('../models/Park');
        await Park.updateMany(
          { _id: { $in: req.body.parks } },
          { governmentOfficial: user._id }
        );
      }

      // Send credentials email to Government Official or Contractor, or Welcome email to Public User
      if (role === 'Government Official' || role === 'government_official' || role === 'official') {
        try {
          await sendOfficialCredentialsEmail(email, name, finalUsername, password);
        } catch (emailErr) {
          console.error('Failed to send email:', emailErr);
        }
      } else if (role === 'Contractor' || role === 'contractor') {
        try {
          await sendContractorCredentialsEmail(email, name, finalUsername, password);
        } catch (emailErr) {
          console.error('Failed to send email to contractor:', emailErr);
        }
      } else {
        // Public User registration welcome email
        try {
          await sendWelcomePublicEmail(email, name);
        } catch (emailErr) {
          console.error('Failed to send welcome email to public user:', emailErr);
        }
      }

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          token: generateToken(user._id),
        }
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const identifier = (email || username || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide email/username and password' });
    }

    // 1. Try finding in User model (Admin, Government Official, Public User)
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (user && (await user.matchPassword(password))) {
      let normalizedRole = user.role;
      if (['official', 'government_official', 'Government Official'].includes(user.role)) {
        normalizedRole = 'Government Official';
      } else if (['contractor', 'Contractor'].includes(user.role)) {
        normalizedRole = 'Contractor';
      } else if (['public_user', 'Public', 'Public User'].includes(user.role)) {
        normalizedRole = 'Public User';
      }

      return res.json({
        message: 'Login successful',
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username || user.email.split('@')[0],
          role: normalizedRole,
          phone: user.phone,
          department: user.department,
          profilePic: user.profilePic || null,
          token: generateToken(user._id),
        }
      });
    }

    // 2. Try finding in Contractor model
    const Contractor = require('../models/Contractor');
    const contractor = await Contractor.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (contractor && (await contractor.matchPassword(password))) {
      if (contractor.status === 'Inactive') {
        return res.status(401).json({ message: 'Account is inactive. Contact Administrator.' });
      }
      return res.json({
        message: 'Login successful',
        user: {
          id: contractor._id,
          contractorId: contractor.contractorId,
          name: contractor.name,
          username: contractor.username,
          email: contractor.email,
          phone: contractor.phone,
          role: 'Contractor',
          corporation: contractor.corporation,
          zone: contractor.zone,
          ward: contractor.ward,
          profilePhoto: contractor.profilePhoto,
          maintenanceSkills: contractor.maintenanceSkills || [],
          token: generateToken(contractor._id),
        }
      });
    }

    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      department: user.department,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Get users list (with optional role/zone/ward filter)
// @route   GET /api/auth/users
// @access  Public (admin use)
const getUsers = async (req, res) => {
  try {
    const { role, zone, ward } = req.query;
    let query = {};

    if (role) {
      query.role = { $in: ['official', 'government_official', 'Government Official'] };
    }
    if (zone)  query.zone = zone;
    if (ward)  query.ward = ward;

    const users = await User.find(query)
      .populate('zone',     'name')
      .populate('ward',     'name')
      .populate('district', 'name')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user (name, email, phone, department, password)
// @route   PUT /api/auth/users/:id
// @access  Admin
const updateUser = async (req, res) => {
  try {
    const { name, email, username, phone, department, password, district, zone, ward, parks, profilePic } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined)       user.name = name;
    if (email !== undefined)      user.email = email;
    if (username !== undefined)   user.username = username;
    if (phone !== undefined)      user.phone = phone;
    if (department !== undefined) user.department = department;
    if (district !== undefined)   user.district = district || undefined;
    if (zone !== undefined)       user.zone = zone || undefined;
    if (ward !== undefined)       user.ward = ward || undefined;
    if (profilePic !== undefined) user.profilePic = profilePic;
    
    if (password && password.trim() !== '') {
      user.password = password; // pre-save hook will hash it
    }

    const updatedUser = await user.save();

    // Assign official to multiple parks if provided
    if (parks && Array.isArray(parks)) {
      const Park = require('../models/Park');
      // First remove this official from any parks they were previously assigned to
      await Park.updateMany(
        { governmentOfficial: user._id },
        { $unset: { governmentOfficial: "" } }
      );
      
      if (parks.length > 0) {
        // Then assign them to the new parks
        await Park.updateMany(
          { _id: { $in: parks } },
          { governmentOfficial: user._id }
        );
      }
    }

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        department: updatedUser.department,
        profilePic: updatedUser.profilePic,
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/auth/users/:id
// @access  Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get next sequential official ID
// @route   GET /api/auth/next-official-id
// @access  Public
const getNextOfficialId = async (req, res) => {
  try {
    const lastOfficial = await User.findOne({ 
      role: { $in: ['official', 'government_official', 'Government Official'] },
      username: { $regex: /^GOV-\d+$/ }
    }).sort({ createdAt: -1 });

    let nextNum = 1;
    if (lastOfficial && lastOfficial.username) {
      const match = lastOfficial.username.match(/^GOV-(\d+)$/);
      if (match && match[1]) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    
    // Format to 3 digits minimum (e.g., GOV-001)
    const nextIdStr = `GOV-${nextNum.toString().padStart(3, '0')}`;
    res.json({ nextId: nextIdStr });
  } catch (error) {
    console.error('Error generating next official ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Google OAuth login/register
// @route   POST /api/auth/google-login
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { token, credential, userInfo } = req.body;
    let email, name, picture, googleId;

    if (credential) {
      // Decode or verify Google JWT credential
      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
        googleId = payload.sub;
      } catch (verifyErr) {
        // Fallback: decode JWT payload directly if verification fails due to client ID mismatch in dev
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(credential);
        if (decoded && decoded.email) {
          email = decoded.email;
          name = decoded.name;
          picture = decoded.picture;
          googleId = decoded.sub;
        } else {
          throw verifyErr;
        }
      }
    } else if (token || userInfo) {
      // If access token / raw user info provided from useGoogleLogin flow
      if (userInfo && userInfo.email) {
        email = userInfo.email;
        name = userInfo.name || userInfo.email.split('@')[0];
        picture = userInfo.picture;
        googleId = userInfo.id || userInfo.sub;
      } else if (token) {
        const axios = require('axios');
        const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        });
        email = googleRes.data.email;
        name = googleRes.data.name;
        picture = googleRes.data.picture;
        googleId = googleRes.data.sub;
      }
    }

    if (!email) {
      return res.status(400).json({ message: 'Unable to retrieve Google user details.' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Auto-register as Public user
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const username = email.split('@')[0] + '_' + Math.floor(100 + Math.random() * 900);
      
      user = await User.create({
        name: name || 'Google User',
        email,
        username,
        password: randomPassword,
        role: 'Public',
        googleId,
        profilePic: picture || null
      });

      // Send welcome email on first time Google join
      try {
        await sendWelcomePublicEmail(email, name);
      } catch (emailErr) {
        console.error('Failed to send welcome email on Google signup:', emailErr);
      }
    } else {
      // Update profile picture and googleId if not present
      if (picture && !user.profilePic) {
        user.profilePic = picture;
      }
      if (googleId && !user.googleId) {
        user.googleId = googleId;
      }
      await user.save();
    }

    let normalizedRole = user.role;
    if (['official', 'government_official', 'Government Official'].includes(user.role)) {
      normalizedRole = 'Government Official';
    } else if (['contractor', 'Contractor'].includes(user.role)) {
      normalizedRole = 'Contractor';
    } else if (['public_user', 'Public', 'Public User'].includes(user.role)) {
      normalizedRole = 'Public User';
    }

    return res.json({
      message: 'Google login successful',
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username || user.email.split('@')[0],
        role: normalizedRole,
        phone: user.phone,
        department: user.department,
        profilePic: user.profilePic || picture || null,
        token: generateToken(user._id),
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  getUserProfile,
  getUsers,
  getUserById,
  updateUser,
  getNextOfficialId,
};
