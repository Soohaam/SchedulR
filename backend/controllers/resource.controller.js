const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../utils/asyncHandler');
const resourceService = require('../services/resource.service');
const AppError = require('../utils/appError');

/**
 * Create resource
 * POST /api/organiser/resources
 */
const createResource = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can create resources', StatusCodes.FORBIDDEN);
  }

  const resource = await resourceService.createResource(req.user.id, req.body);

  res.status(StatusCodes.CREATED).json({
    success: true,
    resource,
  });
});

/**
 * List all resources
 * GET /api/organiser/resources
 */
const listResources = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can view resources', StatusCodes.FORBIDDEN);
  }

  const result = await resourceService.listResources(req.user.id, req.query);

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
});

/**
 * Get single resource details
 * GET /api/organiser/resources/:id
 */
const getResourceById = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can view resource details', StatusCodes.FORBIDDEN);
  }

  const resource = await resourceService.getResourceById(req.user.id, req.params.id);

  res.status(StatusCodes.OK).json({
    success: true,
    resource,
  });
});

/**
 * Update resource
 * PATCH /api/organiser/resources/:id
 */
const updateResource = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can update resources', StatusCodes.FORBIDDEN);
  }

  const resource = await resourceService.updateResource(req.user.id, req.params.id, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    resource,
  });
});

/**
 * Delete (deactivate) resource
 * DELETE /api/organiser/resources/:id
 */
const deleteResource = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can delete resources', StatusCodes.FORBIDDEN);
  }

  const result = await resourceService.deleteResource(req.user.id, req.params.id);

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
});

/**
 * Update resource working hours
 * POST /api/organiser/resources/:id/working-hours
 */
const updateWorkingHours = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can update working hours', StatusCodes.FORBIDDEN);
  }

  const result = await resourceService.updateWorkingHours(req.user.id, req.params.id, req.body.workingHours);

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
});

/**
 * Add availability exception
 * POST /api/organiser/resources/:id/exceptions
 */
const addAvailabilityException = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can add availability exceptions', StatusCodes.FORBIDDEN);
  }

  const result = await resourceService.addAvailabilityException(req.user.id, req.params.id, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
});

module.exports = {
  createResource,
  listResources,
  getResourceById,
  updateResource,
  deleteResource,
  updateWorkingHours,
  addAvailabilityException,
};
