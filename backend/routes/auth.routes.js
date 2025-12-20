const express = require('express');
const authController = require('../controllers/auth.controller');
const validateRequest = require('../middlewares/validateRequest');
const requireAuth = require('../middlewares/auth.middleware');
const {
  registerCustomerSchema,
  registerOrganiserSchema,
  loginSchema,
  emailVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/auth.validator');

const router = express.Router();

// Registration routes
router.post(
  '/register/customer',
  validateRequest(registerCustomerSchema),
  authController.registerCustomer
);

router.post(
  '/register/organiser',
  validateRequest(registerOrganiserSchema),
  authController.registerOrganiser
);

// Email verification
router.post(
  '/verify-email',
  validateRequest(emailVerificationSchema),
  authController.verifyEmail
);

// Login route (unified for all roles)
router.post('/login', validateRequest(loginSchema), authController.login);

// Logout route (protected)
router.post('/logout', requireAuth, authController.logout);

// Profile route
router.get('/me', requireAuth, authController.getProfile);

// Forgot password route
router.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword
);

// Reset password route
router.post(
  '/reset-password',
  validateRequest(resetPasswordSchema),
  authController.resetPassword
);

module.exports = router;
