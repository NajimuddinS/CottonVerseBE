const jwt = require('jsonwebtoken');
const ErrorResponse = require('./errorResponse');

const verifyToken = token => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new ErrorResponse('Invalid token', 401);
  }
};

module.exports = verifyToken;