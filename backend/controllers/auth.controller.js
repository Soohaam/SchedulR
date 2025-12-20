const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  res.status(StatusCodes.CREATED).json(result);
});

const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.body);

  res.status(StatusCodes.OK).json(result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  res.status(StatusCodes.OK).json(result);
});

const verifyTwoFactorLogin = asyncHandler(async (req, res) => {
  const { user, accessToken } = await authService.verifyTwoFactorLogin(req.body);

  res.status(StatusCodes.OK).json({
    user,
    accessToken,
  });
});

const generateTwoFactorSetup = asyncHandler(async (req, res) => {
  const setup = await authService.generateTwoFactorSetup(req.user.id);

  res.status(StatusCodes.OK).json(setup);
});

const enableTwoFactor = asyncHandler(async (req, res) => {
  const user = await authService.enableTwoFactor(req.user.id, req.body.code);

  res.status(StatusCodes.OK).json({ user });
});

const disableTwoFactor = asyncHandler(async (req, res) => {
  const user = await authService.disableTwoFactor(req.user.id, req.body.code);

  res.status(StatusCodes.OK).json({ user });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);

  res.status(StatusCodes.OK).json({ user });
});

module.exports = {
  register,
  login,
  verifyTwoFactorLogin,
  generateTwoFactorSetup,
  enableTwoFactor,
  disableTwoFactor,
  getProfile,
  verifyEmail,
};
