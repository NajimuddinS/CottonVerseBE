const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage
} = require('../controllers/product.controller.js');
const { protect, authorize } = require('../middlewares/auth.middleware.js');
const upload = require('../middlewares/upload.middleware.js');

router
  .route('/')
  .get(getProducts)
  .post(protect, authorize('admin'), createProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(protect, authorize('admin'), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

router
  .route('/:id/image')
  .put(protect, authorize('admin'), upload('image'), uploadProductImage);

module.exports = router;