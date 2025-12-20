const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../utils/asyncHandler');
const appointmentDiscoveryService = require('../services/appointmentDiscovery.service');

/**
 * Get all available (published) appointment types with filters
 */
const getAvailableAppointments = asyncHandler(async (req, res) => {
  const {
    page,
    limit,
    search,
    minPrice,
    maxPrice,
    duration,
    type,
  } = req.query;

  const result = await appointmentDiscoveryService.getAvailableAppointments({
    page: page ? parseInt(page) : 1,
    limit: limit ? parseInt(limit) : 10,
    search,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    duration: duration ? parseInt(duration) : undefined,
    type,
  });

  res.status(StatusCodes.OK).json(result);
});

/**
 * Get appointment type full details by ID
 */
const getAppointmentDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await appointmentDiscoveryService.getAppointmentDetails(id);

  res.status(StatusCodes.OK).json(result);
});

/**
 * Get appointment type by share link (even if unpublished)
 */
const getAppointmentByShareLink = asyncHandler(async (req, res) => {
  const { shareLink } = req.params;

  const result = await appointmentDiscoveryService.getAppointmentByShareLink(shareLink);

  res.status(StatusCodes.OK).json(result);
});

module.exports = {
  getAvailableAppointments,
  getAppointmentDetails,
  getAppointmentByShareLink,
};

