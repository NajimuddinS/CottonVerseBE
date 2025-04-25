const express = require('express');
const router = express.Router();
const {
  registerUser,
  verifyEmail,
  verifyMobile,
  loginUser,
  getMe,
  logout,
  registerAdmin,
  loginAdmin
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/register', registerUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/verify-mobile', verifyMobile);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

// Admin routes
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);

module.exports = router;