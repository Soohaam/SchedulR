const express = require('express');
const authController = require('../controllers/auth.controller');
const validateRequest = require('../middlewares/validateRequest');
const requireAuth = require('../middlewares/auth.middleware');
const {
  registerSchema,
  loginSchema,
  twoFactorVerifySchema,
  twoFactorCodeSchema,
} = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/2fa/verify', validateRequest(twoFactorVerifySchema), authController.verifyTwoFactorLogin);
router.post('/2fa/setup', requireAuth, authController.generateTwoFactorSetup);
router.post('/2fa/enable', requireAuth, validateRequest(twoFactorCodeSchema), authController.enableTwoFactor);
router.post('/2fa/disable', requireAuth, validateRequest(twoFactorCodeSchema), authController.disableTwoFactor);
router.get('/me', requireAuth, authController.getProfile);

module.exports = router;
