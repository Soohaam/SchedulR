const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../utils/asyncHandler');
const appointmentTypeService = require('../services/appointmentType.service');
const AppError = require('../utils/appError');

/**
 * Create appointment type
 * POST /api/organiser/appointment-types
 */
const createAppointmentType = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can create appointment types', StatusCodes.FORBIDDEN);
  }

  const appointmentType = await appointmentTypeService.createAppointmentType(req.user.id, req.body);

  res.status(StatusCodes.CREATED).json({
    success: true,
    appointmentType,
  });
});

/**
 * List all appointment types
 * GET /api/organiser/appointment-types
 */
const listAppointmentTypes = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can view appointment types', StatusCodes.FORBIDDEN);
  }

  const result = await appointmentTypeService.listAppointmentTypes(req.user.id, req.query);

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
});

/**
 * Get single appointment type details
 * GET /api/organiser/appointment-types/:id
 */
const getAppointmentTypeById = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can view appointment type details', StatusCodes.FORBIDDEN);
  }

  const appointmentType = await appointmentTypeService.getAppointmentTypeById(req.user.id, req.params.id);

  res.status(StatusCodes.OK).json({
    success: true,
    appointmentType,
  });
});

/**
 * Update appointment type
 * PATCH /api/organiser/appointment-types/:id
 */
const updateAppointmentType = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can update appointment types', StatusCodes.FORBIDDEN);
  }

  const appointmentType = await appointmentTypeService.updateAppointmentType(req.user.id, req.params.id, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    appointmentType,
  });
});

/**
 * Publish appointment type
 * POST /api/organiser/appointment-types/:id/publish
 */
const publishAppointmentType = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can publish appointment types', StatusCodes.FORBIDDEN);
  }

  const result = await appointmentTypeService.publishAppointmentType(req.user.id, req.params.id);

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
});

/**
 * Unpublish appointment type
 * POST /api/organiser/appointment-types/:id/unpublish
 */
const unpublishAppointmentType = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can unpublish appointment types', StatusCodes.FORBIDDEN);
  }

  const result = await appointmentTypeService.unpublishAppointmentType(req.user.id, req.params.id);

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
});

/**
 * Delete appointment type
 * DELETE /api/organiser/appointment-types/:id
 */
const deleteAppointmentType = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can delete appointment types', StatusCodes.FORBIDDEN);
  }

  const result = await appointmentTypeService.deleteAppointmentType(req.user.id, req.params.id);

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
});

/**
 * Set cancellation policy
 * POST /api/organiser/appointment-types/:id/cancellation-policy
 */
const setCancellationPolicy = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can set cancellation policies', StatusCodes.FORBIDDEN);
  }

  const policy = await appointmentTypeService.setCancellationPolicy(req.user.id, req.params.id, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    policy,
  });
});

/**
 * Get cancellation policy
 * GET /api/organiser/appointment-types/:id/cancellation-policy
 */
const getCancellationPolicy = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can view cancellation policies', StatusCodes.FORBIDDEN);
  }

  const policy = await appointmentTypeService.getCancellationPolicy(req.user.id, req.params.id);

  res.status(StatusCodes.OK).json({
    success: true,
    policy,
  });
});

module.exports = {
  createAppointmentType,
  listAppointmentTypes,
  getAppointmentTypeById,
  updateAppointmentType,
  publishAppointmentType,
  unpublishAppointmentType,
  deleteAppointmentType,
  setCancellationPolicy,
  getCancellationPolicy,
};
