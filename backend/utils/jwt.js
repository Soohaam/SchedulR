const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const AppError = require('./appError');

const signAccessToken = (payload, options = {}) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError('JWT secret is not configured', StatusCodes.INTERNAL_SERVER_ERROR);
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn, ...options });
};

const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError('JWT secret is not configured', StatusCodes.INTERNAL_SERVER_ERROR);
  }

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new AppError('Invalid or expired token', StatusCodes.UNAUTHORIZED);
  }
};

module.exports = {
  signAccessToken,
  verifyToken,
};
