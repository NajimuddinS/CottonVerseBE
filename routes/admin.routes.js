const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getAllOrders,
  updateOrderStatus,
  getSalesStats
} = require('../controllers/admin.controller.js');
const { protect, authorize } = require('../middlewares/auth.middleware.js');

// User management routes
router.route('/users')
  .get(protect, authorize('admin'), getAllUsers);

router.route('/users/:id')
  .get(protect, authorize('admin'), getUser)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

// Order management routes
router.route('/orders')
  .get(protect, authorize('admin'), getAllOrders);

router.route('/orders/:id')
  .put(protect, authorize('admin'), updateOrderStatus);

// Analytics routes
router.route('/sales')
  .get(protect, authorize('admin'), getSalesStats);

module.exports = router;