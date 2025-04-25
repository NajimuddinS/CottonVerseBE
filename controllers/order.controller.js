const Order = require('../models/order.model.js');
const Product = require('../models/product.model.js');
const Coupon = require('../models/coupon.model.js');
const User = require('../models/user.model.js');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const {
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      coupon
    } = req.body;

    // Get user cart
    const user = await User.findById(req.user.id).populate('cart.product');
    if (user.cart.length === 0) {
      return next(new ErrorResponse('Cart is empty', 400));
    }

    // Calculate total price
    let totalPrice = itemsPrice + taxPrice + shippingPrice;
    let discount = 0;

    // Apply coupon if valid
    if (coupon) {
      const couponDoc = await Coupon.findOne({ code: coupon, isActive: true });
      if (!couponDoc || couponDoc.expiry < Date.now()) {
        return next(new ErrorResponse('Invalid or expired coupon', 400));
      }

      if (totalPrice < couponDoc.minAmount) {
        return next(
          new ErrorResponse(
            `Order total must be at least ${couponDoc.minAmount} to use this coupon`,
            400
          )
        );
      }

      discount = Math.min(couponDoc.discount, couponDoc.maxAmount);
      totalPrice -= discount;
    }

    // Create order
    const order = await Order.create({
      shippingInfo,
      orderItems: user.cart.map(item => ({
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        size: item.size,
        image: item.product.images[0].url,
        product: item.product._id
      })),
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      discount,
      coupon: coupon ? coupon._id : undefined,
      user: req.user.id
    });

    // Update product stock
    for (const item of user.cart) {
      const product = await Product.findById(item.product._id);
      const sizeIndex = product.sizes.findIndex(s => s.size === item.size);
      if (sizeIndex >= 0) {
        product.sizes[sizeIndex].quantity -= item.quantity;
        await product.save();
      }
    }

    // Clear user cart
    user.cart = [];
    await user.save();

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (!order) {
      return next(
        new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
      );
    }

    // Make sure user is order owner or admin
    if (
      order.user._id.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return next(
        new ErrorResponse(
          `Not authorized to access order ${req.params.id}`,
          401
        )
      );
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/v1/orders/myorders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order to paid
// @route   PUT /api/v1/orders/:id/pay
// @access  Private
exports.updateOrderToPaid = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(
        new ErrorResponse(`Order not found with id of ${req.params.id}`, 404)
      );
    }

    if (order.user.toString() !== req.user.id) {
      return next(
        new ErrorResponse(
          `Not authorized to update order ${req.params.id}`,
          401
        )
      );
    }

    order.paymentInfo = {
      id: req.body.id,
      status: req.body.status
    };
    order.paidAt = Date.now();

    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply coupon to order
// @route   POST /api/v1/orders/apply-coupon
// @access  Private
exports.applyCoupon = async (req, res, next) => {
  try {
    const { couponCode, orderTotal } = req.body;

    const coupon = await Coupon.findOne({
      code: couponCode,
      isActive: true,
      expiry: { $gt: Date.now() }
    });

    if (!coupon) {
      return next(new ErrorResponse('Invalid or expired coupon', 400));
    }

    if (orderTotal < coupon.minAmount) {
      return next(
        new ErrorResponse(
          `Order total must be at least ${coupon.minAmount} to use this coupon`,
          400
        )
      );
    }

    const discount = Math.min(coupon.discount, coupon.maxAmount);

    res.status(200).json({
      success: true,
      data: {
        coupon: coupon.code,
        discount,
        newTotal: orderTotal - discount
      }
    });
  } catch (error) {
    next(error);
  }
};