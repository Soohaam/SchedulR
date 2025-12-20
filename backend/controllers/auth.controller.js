const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

const registerCustomer = asyncHandler(async (req, res) => {
  const result = await authService.registerCustomer(req.body);

  res.status(StatusCodes.CREATED).json(result);
});

const registerOrganiser = asyncHandler(async (req, res) => {
  const result = await authService.registerOrganiser(req.body);

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

const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);

  res.status(StatusCodes.OK).json({ user });
});

const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.user.id);

  res.status(StatusCodes.OK).json(result);
});

module.exports = {
  registerCustomer,
  registerOrganiser,
  verifyEmail,
  login,
  logout,
  getProfile,
};
