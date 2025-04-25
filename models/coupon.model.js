const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please enter coupon code'],
    unique: true,
    uppercase: true
  },
  discount: {
    type: Number,
    required: [true, 'Please enter coupon discount amount']
  },
  minAmount: {
    type: Number,
    required: [true, 'Please enter minimum amount for coupon']
  },
  maxAmount: {
    type: Number,
    required: [true, 'Please enter maximum discount amount']
  },
  expiry: {
    type: Date,
    required: [true, 'Please enter coupon expiry date']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Coupon', couponSchema);