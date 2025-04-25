const express = require('express');
const router = express.Router();
const {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  checkCouponValidity
} = require('../controllers/coupon.controller.js');
const { protect, authorize } = require('../middlewares/auth.middleware.js');

router.route('/')
  .get(protect, authorize('admin'), getCoupons)
  .post(protect, authorize('admin'), createCoupon);

router.route('/:id')
  .get(protect, authorize('admin'), getCoupon)
  .put(protect, authorize('admin'), updateCoupon)
  .delete(protect, authorize('admin'), deleteCoupon);

router.route('/check/:code')
  .get(checkCouponValidity);

module.exports = router;