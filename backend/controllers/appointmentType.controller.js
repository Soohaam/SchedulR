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

/**
 * Add a question to appointment type
 * POST /api/organiser/appointment-types/:id/questions
 */
const addQuestion = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can add questions', StatusCodes.FORBIDDEN);
  }

  const question = await appointmentTypeService.addQuestion(req.user.id, req.params.id, req.body);

  res.status(StatusCodes.CREATED).json({
    success: true,
    question,
  });
});

/**
 * List all questions for appointment type
 * GET /api/organiser/appointment-types/:id/questions
 */
const listQuestions = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can view questions', StatusCodes.FORBIDDEN);
  }

  const questions = await appointmentTypeService.listQuestions(req.user.id, req.params.id);

  res.status(StatusCodes.OK).json({
    success: true,
    count: questions.length,
    questions,
  });
});

/**
 * Update a question
 * PATCH /api/organiser/appointment-types/:id/questions/:questionId
 */
const updateQuestion = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can update questions', StatusCodes.FORBIDDEN);
  }

  const question = await appointmentTypeService.updateQuestion(
    req.user.id,
    req.params.id,
    req.params.questionId,
    req.body
  );

  res.status(StatusCodes.OK).json({
    success: true,
    question,
  });
});

/**
 * Delete a question
 * DELETE /api/organiser/appointment-types/:id/questions/:questionId
 */
const deleteQuestion = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can delete questions', StatusCodes.FORBIDDEN);
  }

  const result = await appointmentTypeService.deleteQuestion(
    req.user.id,
    req.params.id,
    req.params.questionId
  );

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
});

/**
 * Reorder questions
 * POST /api/organiser/appointment-types/:id/questions/reorder
 */
const reorderQuestions = asyncHandler(async (req, res) => {
  // Verify user is ORGANISER
  if (req.user.role !== 'ORGANISER') {
    throw new AppError('Only organisers can reorder questions', StatusCodes.FORBIDDEN);
  }

  const result = await appointmentTypeService.reorderQuestions(
    req.user.id,
    req.params.id,
    req.body.questionIds
  );

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
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
  addQuestion,
  listQuestions,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
};
