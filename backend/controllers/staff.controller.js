const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../utils/asyncHandler');
const staffService = require('../services/staff.service');
const AppError = require('../utils/appError');

/**
 * Create staff member
 * POST /api/organiser/staff
 */
const createStaffMember = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can create staff members', StatusCodes.FORBIDDEN);
  }

  const staffMember = await staffService.createStaffMember(req.user.id, req.body);

  res.status(StatusCodes.CREATED).json({
    success: true,
    staffMember,
  });
});

/**
 * List all staff members
 * GET /api/organiser/staff
 */
const listStaffMembers = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can view staff members', StatusCodes.FORBIDDEN);
  }

  const result = await staffService.listStaffMembers(req.user.id, req.query);

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
});

/**
 * Get single staff member details
 * GET /api/organiser/staff/:id
 */
const getStaffMemberById = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can view staff member details', StatusCodes.FORBIDDEN);
  }

  const staffMember = await staffService.getStaffMemberById(req.user.id, req.params.id);

  res.status(StatusCodes.OK).json({
    success: true,
    staffMember,
  });
});

/**
 * Update staff member
 * PATCH /api/organiser/staff/:id
 */
const updateStaffMember = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can update staff members', StatusCodes.FORBIDDEN);
  }

  const staffMember = await staffService.updateStaffMember(req.user.id, req.params.id, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    staffMember,
  });
});

/**
 * Delete (deactivate) staff member
 * DELETE /api/organiser/staff/:id
 */
const deleteStaffMember = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can delete staff members', StatusCodes.FORBIDDEN);
  }

  const result = await staffService.deleteStaffMember(req.user.id, req.params.id);

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
});

/**
 * Update staff member working hours
 * POST /api/organiser/staff/:id/working-hours
 */
const updateWorkingHours = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can update working hours', StatusCodes.FORBIDDEN);
  }

  const result = await staffService.updateWorkingHours(req.user.id, req.params.id, req.body.workingHours);

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
});

/**
 * Add availability exception
 * POST /api/organiser/staff/:id/exceptions
 */
const addAvailabilityException = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can add availability exceptions', StatusCodes.FORBIDDEN);
  }

  const result = await staffService.addAvailabilityException(req.user.id, req.params.id, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
});

module.exports = {
  createStaffMember,
  listStaffMembers,
  getStaffMemberById,
  updateStaffMember,
  deleteStaffMember,
  updateWorkingHours,
  addAvailabilityException,
};
