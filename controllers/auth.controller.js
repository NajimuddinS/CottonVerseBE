const User = require('../models/user.model.js');
const Admin = require('../models/admin.model.js');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/emailService');
const sendSMS = require('../utils/smsService');
const jwt = require('jsonwebtoken');

// Generate token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('User already exists', 400));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      mobile,
      password
    });

    // Generate verification token
    const verificationToken = user.getVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Create verification URL
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${verificationToken}`;

    // Send email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Email Verification',
        message: `Please verify your email by clicking on the following link: \n\n ${verificationUrl}`
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Verification email sent.'
      });
    } catch (error) {
      user.verificationToken = undefined;
      user.verificationTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   GET /api/v1/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const verificationToken = req.params.token;

    // Hash the token and find user
    const user = await User.findOne({
      verificationToken,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ErrorResponse('Invalid or expired token', 400));
    }

    // Mark email as verified
    user.isVerified.email = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    // Send SMS for mobile verification
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.mobileVerificationOTP = otp;
    user.mobileVerificationOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    try {
      await sendSMS({
        to: `+91${user.mobile}`,
        body: `Your verification OTP is ${otp}. It will expire in 10 minutes.`
      });

      res.status(200).json({
        success: true,
        message: 'Email verified successfully. OTP sent to mobile.'
      });
    } catch (error) {
      user.mobileVerificationOTP = undefined;
      user.mobileVerificationOTPExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ErrorResponse('SMS could not be sent', 500));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify mobile
// @route   POST /api/v1/auth/verify-mobile
// @access  Public
exports.verifyMobile = async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;

    const user = await User.findOne({
      mobile,
      mobileVerificationOTP: otp,
      mobileVerificationOTPExpire: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ErrorResponse('Invalid OTP or expired', 400));
    }

    user.isVerified.mobile = true;
    user.mobileVerificationOTP = undefined;
    user.mobileVerificationOTPExpire = undefined;
    await user.save();

    sendTokenResponse(user, 'user', 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if email is verified
    if (!user.isVerified.email) {
      return next(new ErrorResponse('Please verify your email first', 401));
    }

    sendTokenResponse(user, 'user', 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Register admin
// @route   POST /api/v1/auth/admin/register
// @access  Private (only super admin)
exports.registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return next(new ErrorResponse('Admin already exists', 400));
    }

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password
    });

    sendTokenResponse(admin, 'admin', 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login admin
// @route   POST /api/v1/auth/admin/login
// @access  Public
exports.loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for admin
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    sendTokenResponse(admin, 'admin', 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    let user;
    if (req.user.role === 'user') {
      user = await User.findById(req.user.id);
    } else if (req.user.role === 'admin') {
      user = await Admin.findById(req.user.id);
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user/admin
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, role, statusCode, res) => {
  // Create token
  const token = generateToken(user._id, role);

  // Options for cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      role
    });
};