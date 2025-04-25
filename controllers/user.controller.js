const User = require('../models/user.model.js');
const Product = require('../models/product.model.js');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get user profile
// @route   GET /api/v1/users/me
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/users/me
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name || req.user.name,
      email: req.body.email || req.user.email,
      mobile: req.body.mobile || req.user.mobile
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/v1/users/me
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add to cart
// @route   POST /api/v1/users/cart
// @access  Private
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity, size } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    // Check if size is available
    const sizeAvailable = product.sizes.find(s => s.size === size);
    if (!sizeAvailable || sizeAvailable.quantity < quantity) {
      return next(new ErrorResponse('Selected size/quantity not available', 400));
    }

    const user = await User.findById(req.user.id);

    // Check if product already in cart
    const itemIndex = user.cart.findIndex(
      item => item.product.toString() === productId && item.size === size
    );

    if (itemIndex >= 0) {
      // Update quantity if already in cart
      user.cart[itemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      user.cart.push({ product: productId, quantity, size });
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user.cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get cart items
// @route   GET /api/v1/users/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('cart.product');

    res.status(200).json({
      success: true,
      data: user.cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove from cart
// @route   DELETE /api/v1/users/cart/:productId
// @access  Private
exports.removeFromCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Remove item from cart
    user.cart = user.cart.filter(
      item => item.product.toString() !== req.params.productId
    );

    await user.save();

    res.status(200).json({
      success: true,
      data: user.cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add review to product
// @route   POST /api/v1/users/reviews
// @access  Private
exports.addReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorResponse('Product not found', 404));
    }

    // Check if user already reviewed the product
    const alreadyReviewed = product.reviews.find(
      r => r.user.toString() === req.user.id.toString()
    );

    if (alreadyReviewed) {
      return next(new ErrorResponse('Product already reviewed', 400));
    }

    const review = {
      user: req.user.id,
      name: req.user.name,
      rating: Number(rating),
      comment
    };

    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;

    // Calculate average rating
    product.ratings =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Review added successfully'
    });
  } catch (error) {
    next(error);
  }
};