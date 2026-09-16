const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOfficialCredentialsEmail, sendContractorCredentialsEmail, sendWelcomePublicEmail, sendPasswordResetOtpEmail } = require('../config/sendEmail');

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

    const identifierRegex = new RegExp(`^${identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    // 1. Try finding in User model (Admin, Government Official, Public User)
    const user = await User.findOne({
      $or: [{ email: identifierRegex }, { username: identifierRegex }]
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
          phone: user.phone || '',
          address: user.address || '',
          department: user.department,
          profilePic: user.profilePic || null,
          createdAt: user.createdAt,
          token: generateToken(user._id),
        }
      });
    }

    // 2. Try finding in Contractor model (by email, username, or contractorId with case-insensitivity)
    const Contractor = require('../models/Contractor');
    const contractor = await Contractor.findOne({
      $or: [
        { email: identifierRegex },
        { username: identifierRegex },
        { contractorId: identifierRegex }
      ]
    });

    if (contractor && (await contractor.matchPassword(password))) {
      if (contractor.status === 'Inactive') {
        return res.status(401).json({ message: 'Account is inactive. Contact Administrator.' });
      }
      return res.json({
        message: 'Login successful',
        user: {
          id: contractor._id,
          _id: contractor._id,
          contractorId: contractor.contractorId,
          name: contractor.name,
          username: contractor.username,
          email: contractor.email,
          phone: contractor.phone || '',
          address: contractor.address || '',
          role: 'Contractor',
          corporation: contractor.corporation,
          zone: contractor.zone,
          ward: contractor.ward,
          profilePhoto: contractor.profilePhoto,
          profilePic: contractor.profilePhoto,
          maintenanceSkills: contractor.maintenanceSkills || [],
          createdAt: contractor.createdAt,
          token: generateToken(contractor._id),
        }
      });
    }

    return res.status(401).json({ message: 'Invalid email/username or password' });
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
      phone: user.phone || '',
      address: user.address || '',
      department: user.department,
      profilePic: user.profilePic || null,
      createdAt: user.createdAt
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

// @desc    Update user (name, email, phone, department, password, address)
// @route   PUT /api/auth/users/:id
// @access  Admin
const updateUser = async (req, res) => {
  try {
    const { name, email, username, phone, address, department, password, district, zone, ward, parks, profilePic } = req.body;
    
    // Check in User model first
    let user = await User.findById(req.params.id);

    if (user) {
      if (name !== undefined)       user.name = name;
      if (email !== undefined)      user.email = email;
      if (username !== undefined)   user.username = username;
      if (phone !== undefined)      user.phone = phone;
      if (address !== undefined)    user.address = address;
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
        await Park.updateMany(
          { governmentOfficial: user._id },
          { $unset: { governmentOfficial: "" } }
        );
        
        if (parks.length > 0) {
          await Park.updateMany(
            { _id: { $in: parks } },
            { governmentOfficial: user._id }
          );
        }
      }

      return res.json({
        message: 'User updated successfully',
        user: {
          id: updatedUser._id,
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          username: updatedUser.username,
          role: updatedUser.role,
          phone: updatedUser.phone || '',
          address: updatedUser.address || '',
          department: updatedUser.department,
          profilePic: updatedUser.profilePic,
          createdAt: updatedUser.createdAt
        }
      });
    }

    // If not in User, check Contractor model
    const Contractor = require('../models/Contractor');
    const contractor = await Contractor.findById(req.params.id);
    if (contractor) {
      if (name !== undefined)       contractor.name = name;
      if (email !== undefined)      contractor.email = email;
      if (username !== undefined)   contractor.username = username;
      if (phone !== undefined)      contractor.phone = phone;
      if (address !== undefined)    contractor.address = address;
      if (profilePic !== undefined) {
        contractor.profilePhoto = profilePic;
      }
      if (password && password.trim() !== '') {
        contractor.password = password;
      }

      const updatedContractor = await contractor.save();
      return res.json({
        message: 'Contractor profile updated successfully',
        user: {
          id: updatedContractor._id,
          _id: updatedContractor._id,
          name: updatedContractor.name,
          email: updatedContractor.email,
          username: updatedContractor.username,
          role: 'Contractor',
          phone: updatedContractor.phone || '',
          address: updatedContractor.address || '',
          profilePhoto: updatedContractor.profilePhoto,
          profilePic: updatedContractor.profilePhoto,
          createdAt: updatedContractor.createdAt
        }
      });
    }

    return res.status(404).json({ message: 'User not found' });
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
        phone: user.phone || '',
        address: user.address || '',
        department: user.department,
        profilePic: user.profilePic || picture || null,
        createdAt: user.createdAt,
        token: generateToken(user._id),
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
};

// @desc    Forgot Password - Generate and send 6-digit OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { emailOrUsername } = req.body;
    const identifier = (emailOrUsername || '').trim();

    if (!identifier) {
      return res.status(400).json({ message: 'Please provide your email address or username.' });
    }

    const identifierRegex = new RegExp(`^${identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    // Find in User model
    const userAccount = await User.findOne({
      $or: [{ email: identifierRegex }, { username: identifierRegex }]
    });

    // Find in Contractor model
    const Contractor = require('../models/Contractor');
    const contractorAccount = await Contractor.findOne({
      $or: [{ email: identifierRegex }, { username: identifierRegex }, { contractorId: identifierRegex }]
    });

    if (!userAccount && !contractorAccount) {
      return res.status(404).json({ message: 'No registered account found with that email or username.' });
    }

    const targetEmail = (userAccount && userAccount.email) || (contractorAccount && contractorAccount.email);
    const targetName = (userAccount && userAccount.name) || (contractorAccount && contractorAccount.name);

    if (!targetEmail) {
      return res.status(400).json({ message: 'Account does not have an email address associated.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to all matching accounts sharing this email/username
    if (userAccount) {
      userAccount.resetPasswordOtp = otp;
      userAccount.resetPasswordOtpExpires = otpExpires;
      await userAccount.save();
    }
    if (contractorAccount) {
      contractorAccount.resetPasswordOtp = otp;
      contractorAccount.resetPasswordOtpExpires = otpExpires;
      await contractorAccount.save();
    }

    // Also update any other accounts with the same email
    await User.updateMany(
      { email: new RegExp(`^${targetEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      { resetPasswordOtp: otp, resetPasswordOtpExpires: otpExpires }
    );
    await Contractor.updateMany(
      { email: new RegExp(`^${targetEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      { resetPasswordOtp: otp, resetPasswordOtpExpires: otpExpires }
    );

    // Send OTP Email
    try {
      await sendPasswordResetOtpEmail(targetEmail, targetName, otp);
    } catch (emailErr) {
      console.error('Failed to send OTP email:', emailErr);
      return res.status(500).json({ message: 'Failed to send OTP email. Please check your email configuration.' });
    }

    const maskedEmail = targetEmail.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(Math.max(0, gp3.length)));

    res.json({
      message: `A 6-digit verification code has been sent to ${maskedEmail}`,
      email: targetEmail
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset Password with 6-digit OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { emailOrUsername, otp, newPassword } = req.body;
    const identifier = (emailOrUsername || '').trim();
    const enteredOtp = (otp || '').trim();

    if (!identifier || !enteredOtp || !newPassword) {
      return res.status(400).json({ message: 'All fields are required (identifier, OTP, and new password).' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const identifierRegex = new RegExp(`^${identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    const userAccount = await User.findOne({
      $or: [{ email: identifierRegex }, { username: identifierRegex }]
    });

    const Contractor = require('../models/Contractor');
    const contractorAccount = await Contractor.findOne({
      $or: [{ email: identifierRegex }, { username: identifierRegex }, { contractorId: identifierRegex }]
    });

    if (!userAccount && !contractorAccount) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    const activeAccount = contractorAccount || userAccount;

    // Check OTP
    const validOtp = (userAccount && userAccount.resetPasswordOtp === enteredOtp) ||
                     (contractorAccount && contractorAccount.resetPasswordOtp === enteredOtp);

    if (!validOtp) {
      return res.status(400).json({ message: 'Invalid verification code. Please check and try again.' });
    }

    const isExpired = (account) => !account.resetPasswordOtpExpires || new Date() > new Date(account.resetPasswordOtpExpires);
    if ((userAccount && isExpired(userAccount)) && (contractorAccount && isExpired(contractorAccount))) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Reset password on both if contractor and user share email/ID
    if (contractorAccount) {
      contractorAccount.password = newPassword;
      contractorAccount.resetPasswordOtp = null;
      contractorAccount.resetPasswordOtpExpires = null;
      await contractorAccount.save();
    }

    if (userAccount) {
      userAccount.password = newPassword;
      userAccount.resetPasswordOtp = null;
      userAccount.resetPasswordOtpExpires = null;
      await userAccount.save();
    }

    const canonicalUsername = (contractorAccount && (contractorAccount.contractorId || contractorAccount.username)) ||
                              (userAccount && (userAccount.username || userAccount.email)) || identifier;

    res.json({ 
      message: 'Password has been reset successfully! You can now log in with your new password.',
      username: canonicalUsername,
      contractorId: (contractorAccount && contractorAccount.contractorId) || null,
      email: (contractorAccount && contractorAccount.email) || (userAccount && userAccount.email)
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
  forgotPassword,
  resetPassword
};
