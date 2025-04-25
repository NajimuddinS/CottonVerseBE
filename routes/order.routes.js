const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrder,
  getMyOrders,
  updateOrderToPaid,
  applyCoupon
} = require('../controllers/order.controller');
const { protect } = require('../middlewares/auth.middleware.js');

router.route('/')
  .post(protect, createOrder)
  .get(protect, getMyOrders);

router.route('/:id')
  .get(protect, getOrder);

router.route('/:id/pay')
  .put(protect, updateOrderToPaid);

router.route('/apply-coupon')
  .post(protect, applyCoupon);

module.exports = router;