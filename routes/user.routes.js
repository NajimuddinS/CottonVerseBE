const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  deleteAccount,
  addToCart,
  getCart,
  removeFromCart,
  addReview
} = require('../controllers/user.controller.js');
const { protect } = require('../middlewares/auth.middleware.js');

// Profile routes
router.route('/me')
  .get(protect, getUserProfile)
  .put(protect, updateProfile)
  .delete(protect, deleteAccount);

// Cart routes
router.route('/cart')
  .get(protect, getCart)
  .post(protect, addToCart);

router.route('/cart/:productId')
  .delete(protect, removeFromCart);

// Review route
router.route('/reviews')
  .post(protect, addReview);

module.exports = router;