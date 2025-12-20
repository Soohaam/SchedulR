const express = require('express');
const appointmentTypeController = require('../controllers/appointmentType.controller');
const validateRequest = require('../middlewares/validateRequest');
const requireAuth = require('../middlewares/auth.middleware');
const upload = require('../middleware/upload');
const {
  createAppointmentTypeSchema,
  updateAppointmentTypeSchema,
  listAppointmentTypesSchema,
  setCancellationPolicySchema,
  addQuestionSchema,
  updateQuestionSchema,
  reorderQuestionsSchema,
} = require('../validators/appointmentType.validator');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Create appointment type
router.post(
  '/',
  validateRequest(createAppointmentTypeSchema),
  appointmentTypeController.createAppointmentType
);

// List all appointment types
router.get(
  '/',
  validateRequest(listAppointmentTypesSchema),
  appointmentTypeController.listAppointmentTypes
);

// Get single appointment type details
router.get(
  '/:id',
  appointmentTypeController.getAppointmentTypeById
);

// Update appointment type
router.patch(
  '/:id',
  validateRequest(updateAppointmentTypeSchema),
  appointmentTypeController.updateAppointmentType
);

// Upload profile image for appointment type
router.post(
  '/:id/upload-image',
  upload.single('image'),
  appointmentTypeController.uploadAppointmentImage
);

// Delete profile image for appointment type
router.delete(
  '/:id/image',
  appointmentTypeController.deleteAppointmentImage
);

// Publish appointment type
router.post(
  '/:id/publish',
  appointmentTypeController.publishAppointmentType
);

// Unpublish appointment type
router.post(
  '/:id/unpublish',
  appointmentTypeController.unpublishAppointmentType
);

// Delete appointment type
router.delete(
  '/:id',
  appointmentTypeController.deleteAppointmentType
);

// Set cancellation policy
router.post(
  '/:id/cancellation-policy',
  validateRequest(setCancellationPolicySchema),
  appointmentTypeController.setCancellationPolicy
);

// Get cancellation policy
router.get(
  '/:id/cancellation-policy',
  appointmentTypeController.getCancellationPolicy
);

// Add question to appointment type
router.post(
  '/:id/questions',
  validateRequest(addQuestionSchema),
  appointmentTypeController.addQuestion
);

// List all questions for appointment type
router.get(
  '/:id/questions',
  appointmentTypeController.listQuestions
);

// Reorder questions (must be before /:questionId route)
router.post(
  '/:id/questions/reorder',
  validateRequest(reorderQuestionsSchema),
  appointmentTypeController.reorderQuestions
);

// Update a question
router.patch(
  '/:id/questions/:questionId',
  validateRequest(updateQuestionSchema),
  appointmentTypeController.updateQuestion
);

// Delete a question
router.delete(
  '/:id/questions/:questionId',
  appointmentTypeController.deleteQuestion
);

module.exports = router;
