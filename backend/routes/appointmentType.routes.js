const express = require('express');
const appointmentTypeController = require('../controllers/appointmentType.controller');
const validateRequest = require('../middlewares/validateRequest');
const requireAuth = require('../middlewares/auth.middleware');
const {
  createAppointmentTypeSchema,
  updateAppointmentTypeSchema,
  listAppointmentTypesSchema,
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

module.exports = router;
