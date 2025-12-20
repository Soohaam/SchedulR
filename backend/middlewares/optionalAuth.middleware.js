const { verifyToken } = require('../utils/jwt');
const { pool } = require('../config/db');
const { toPublicUser } = require('../utils/user');

/**
 * Optional authentication middleware
 * Attaches user to request if valid token is provided, but doesn't block if no token
 */
const optionalAuth = async (req, res, next) => {
  console.log('🔓 Optional Auth Middleware - Request to:', req.path);
  console.log('Authorization Header:', req.headers.authorization ? 'Present' : 'Not present');
  
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log('Token found, verifying...');
      
      try {
        const decoded = verifyToken(token);
        console.log('Token valid, decoded:', decoded);

        const result = await pool.query(
          'SELECT * FROM "User" WHERE "id" = $1',
          [decoded.sub]
        );
        
        const user = result.rows[0];
        if (user) {
          req.user = toPublicUser(user);
          console.log('✅ User attached:', req.user.email);
        } else {
          console.log('⚠️ Token valid but user not found');
        }
      } catch (error) {
        // Invalid token, but continue without user
        console.log('⚠️ Optional auth: Invalid token, continuing without user:', error.message);
      }
    } else {
      console.log('No token provided, continuing as guest');
    }

    console.log('✅ Proceeding with request, user:', req.user ? req.user.email : 'guest');
    next();
  } catch (error) {
    // If any error occurs, continue without user
    console.log('❌ Error in optionalAuth:', error);
    next();
  }
};

module.exports = optionalAuth;
