const express = require('express');
const {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem,
  clearCart
} = require('../controllers/cart.controller.js');
const { isAuthenticatedUser } = require('../middlewares/auth.middleware.js');

const router = express.Router();

router.route('/add').post(isAuthenticatedUser, addToCart);
router.route('/').get(isAuthenticatedUser, getCart);
router.route('/remove/:itemId').delete(isAuthenticatedUser, removeFromCart);
router.route('/update/:itemId').put(isAuthenticatedUser, updateCartItem);
router.route('/clear').delete(isAuthenticatedUser, clearCart);

module.exports = router;