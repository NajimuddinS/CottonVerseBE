const Review = require('../models/review.model.js');
const Product = require('../models/product.model.js');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
  try {
    let query;

    if (req.params.productId) {
      query = Review.find({ product: req.params.productId });
    } else {
      query = Review.find();
    }

    const reviews = await query.populate({
      path: 'user',
      select: 'name'
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
exports.getReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id).populate({
      path: 'user',
      select: 'name'
    });

    if (!review) {
      return next(
        new ErrorResponse(`Review not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create review
// @route   POST /api/products/:productId/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    req.body.product = req.params.productId;
    req.body.user = req.user.id;

    // Check if user has purchased the product
    const order = await Order.findOne({
      user: req.user.id,
      'orderItems.product': req.params.productId,
      orderStatus: 'Delivered'
    });

    if (!order) {
      return next(
        new ErrorResponse('You can only review products you have purchased', 400)
      );
    }

    // Check if user already reviewed the product
    const existingReview = await Review.findOne({
      user: req.user.id,
      product: req.params.productId
    });

    if (existingReview) {
      return next(
        new ErrorResponse('You have already reviewed this product', 400)
      );
    }

    const review = await Review.create(req.body);

    // Update product ratings
    const product = await Product.findById(req.params.productId);
    const reviews = await Review.find({ product: req.params.productId });

    product.ratings =
      reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    product.numOfReviews = reviews.length;
    await product.save();

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return next(
        new ErrorResponse(`Review not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is review owner
    if (review.user.toString() !== req.user.id) {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to update this review`,
          401
        )
      );
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Update product ratings
    const product = await Product.findById(review.product);
    const reviews = await Review.find({ product: review.product });

    product.ratings =
      reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    product.numOfReviews = reviews.length;
    await product.save();

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return next(
        new ErrorResponse(`Review not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is review owner or admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse(
          `User ${req.user.id} is not authorized to delete this review`,
          401
        )
      );
    }

    await review.remove();

    // Update product ratings
    const product = await Product.findById(review.product);
    const reviews = await Review.find({ product: review.product });

    if (reviews.length === 0) {
      product.ratings = 0;
      product.numOfReviews = 0;
    } else {
      product.ratings =
        reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
      product.numOfReviews = reviews.length;
    }

    await product.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};