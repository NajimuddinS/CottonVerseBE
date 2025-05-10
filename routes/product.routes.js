const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages
} = require('../controllers/product.controller.js');
const { protect, authorize } = require('../middlewares/auth.middleware.js');
const upload = require('../middlewares/upload.middleware.js');

const validateProduct = [
  check('name')
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 100 }).withMessage('Product name cannot exceed 100 characters'),
  
  check('price')
    .notEmpty().withMessage('Product price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    
  check('description')
    .notEmpty().withMessage('Product description is required'),
    
  check('category')
    .notEmpty().withMessage('Product category is required')
    .isIn([
      'Shirts', 'T-shirts', 'Jeans', 'Pants', 'Dresses', 
      'Skirts', 'Jackets', 'Sweaters', 'Activewear', 
      'Swimwear', 'Underwear', 'Socks', 'Accessories'
    ]).withMessage('Invalid product category'),
    
  check('seller')
    .notEmpty().withMessage('Product seller is required'),
    
  check('stock')
    .notEmpty().withMessage('Product stock is required')
    .isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
    
  check('sizes')
    .notEmpty().withMessage('Product sizes are required')
    .custom(value => {
      try {
        const sizes = JSON.parse(value);
        return Array.isArray(sizes) && sizes.length > 0;
      } catch {
        return false;
      }
    }).withMessage('Invalid sizes format'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
    next();
  }
];

router
  .route('/')
  .get(getProducts)
  .post(
    protect, 
    authorize('admin'), 
    upload.array('images', 3),
    validateProduct,  // Add this line
    createProduct
  );


router
  .route('/:id')
  .get(getProduct)
  .put(protect, authorize('admin'), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

router
  .route('/:id/images')
  .put(
    protect, 
    authorize('admin'), 
    upload.array('images', 3), // Apply .array() here
    uploadProductImages
  );

module.exports = router;