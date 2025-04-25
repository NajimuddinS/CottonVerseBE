const Cart = require('../models/cart.model.js');
const Product = require('../models/product.model.js');
const ErrorHandler = require('../utils/errorHandler.js');
const catchAsyncErrors = require('../utils/catchAsyncErrors.js');

// Add item to cart => /api/cart/add
exports.addToCart = catchAsyncErrors(async (req, res, next) => {
  const { productId, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  // Check if product is in stock
  if (product.stock < quantity) {
    return next(
      new ErrorHandler(
        `Only ${product.stock} items available in stock`,
        400
      )
    );
  }

  // Check if user already has a cart
  let cart = await Cart.findOne({ user: req.user._id });

  if (cart) {
    // Check if product already exists in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      // Product exists in cart, update quantity
      const item = cart.items[itemIndex];
      item.quantity += quantity;

      // Check stock again with new quantity
      if (product.stock < item.quantity) {
        return next(
          new ErrorHandler(
            `Only ${product.stock} items available in stock`,
            400
          )
        );
      }

      cart.items[itemIndex] = item;
    } else {
      // Product does not exists in cart, add new item
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
        name: product.name,
        image: product.images[0].url
      });
    }

    // Calculate totals
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    cart.totalQuantity = cart.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
  } else {
    // No cart for user, create new cart
    cart = await Cart.create({
      user: req.user._id,
      items: [
        {
          product: productId,
          quantity,
          price: product.price,
          name: product.name,
          image: product.images[0].url
        }
      ],
      totalPrice: product.price * quantity,
      totalQuantity: quantity
    });
  }

  await cart.save();

  res.status(200).json({
    success: true,
    cart
  });
});

// Get user cart => /api/cart
exports.getCart = catchAsyncErrors(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.product',
    'name price images stock'
  );

  if (!cart) {
    return next(new ErrorHandler('Cart is empty', 404));
  }

  res.status(200).json({
    success: true,
    cart
  });
});

// Remove item from cart => /api/cart/remove/:itemId
exports.removeFromCart = catchAsyncErrors(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return next(new ErrorHandler('Cart not found', 404));
  }

  const itemIndex = cart.items.findIndex(
    (item) => item._id.toString() === req.params.itemId
  );

  if (itemIndex > -1) {
    const item = cart.items[itemIndex];
    cart.totalPrice -= item.price * item.quantity;
    cart.totalQuantity -= item.quantity;
    cart.items.splice(itemIndex, 1);

    await cart.save();

    res.status(200).json({
      success: true,
      cart
    });
  } else {
    return next(new ErrorHandler('Item not found in cart', 404));
  }
});

// Update cart item quantity => /api/cart/update/:itemId
exports.updateCartItem = catchAsyncErrors(async (req, res, next) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return next(new ErrorHandler('Cart not found', 404));
  }

  const itemIndex = cart.items.findIndex(
    (item) => item._id.toString() === req.params.itemId
  );

  if (itemIndex > -1) {
    const item = cart.items[itemIndex];
    
    // Get product to check stock
    const product = await Product.findById(item.product);
    if (!product) {
      return next(new ErrorHandler('Product not found', 404));
    }

    // Check if requested quantity is available
    if (product.stock < quantity) {
      return next(
        new ErrorHandler(
          `Only ${product.stock} items available in stock`,
          400
        )
      );
    }

    // Update cart totals
    cart.totalPrice = cart.totalPrice - (item.price * item.quantity) + (item.price * quantity);
    cart.totalQuantity = cart.totalQuantity - item.quantity + quantity;
    
    // Update item quantity
    item.quantity = quantity;
    cart.items[itemIndex] = item;

    await cart.save();

    res.status(200).json({
      success: true,
      cart
    });
  } else {
    return next(new ErrorHandler('Item not found in cart', 404));
  }
});

// Clear cart => /api/cart/clear
exports.clearCart = catchAsyncErrors(async (req, res, next) => {
  await Cart.findOneAndDelete({ user: req.user._id });

  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully'
  });
});