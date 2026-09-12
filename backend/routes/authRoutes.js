const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLogin, getUserProfile, getUsers, getUserById, updateUser, getNextOfficialId, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-login', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getUserProfile);
router.get('/users', getUsers);
router.get('/next-official-id', getNextOfficialId);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);

module.exports = router;
