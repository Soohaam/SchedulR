const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/appError');

/**
 * Middleware to check if authenticated user has required role(s)
 * Must be used after requireAuth middleware
 * 
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated (should be set by requireAuth middleware)
    if (!req.user) {
      throw new AppError(
        'Authentication required',
        StatusCodes.UNAUTHORIZED
      );
    }

    // Normalize to array for easier checking
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      throw new AppError(
        'You do not have permission to access this resource',
        StatusCodes.FORBIDDEN
      );
    }

    next();
  };
};

module.exports = requireRole;
