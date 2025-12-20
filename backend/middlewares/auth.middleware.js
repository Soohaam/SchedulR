const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/jwt');
const AppError = require('../utils/appError');
const { pool } = require('../config/db');
const { toPublicUser } = require('../utils/user');

const requireAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authorization token missing', StatusCodes.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  const result = await pool.query(
    'SELECT * FROM "User" WHERE "id" = $1',
    [decoded.sub]
  );
  const user = result.rows[0];

  if (!user) {
    throw new AppError('User not found', StatusCodes.UNAUTHORIZED);
  }

  req.user = toPublicUser(user);

  next();
});

module.exports = requireAuth;
