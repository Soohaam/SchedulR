const express = require('express');
const resourceController = require('../controllers/resource.controller');
const validateRequest = require('../middlewares/validateRequest');
const requireAuth = require('../middlewares/auth.middleware');
const {
  createResourceSchema,
  updateResourceSchema,
  listResourcesSchema,
  updateWorkingHoursSchema,
  addExceptionSchema,
} = require('../validators/resource.validator');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Create resource
router.post(
  '/',
  validateRequest(createResourceSchema),
  resourceController.createResource
);

// List all resources
router.get(
  '/',
  validateRequest(listResourcesSchema),
  resourceController.listResources
);

// Get single resource details
router.get(
  '/:id',
  resourceController.getResourceById
);

// Update resource
router.patch(
  '/:id',
  validateRequest(updateResourceSchema),
  resourceController.updateResource
);

// Delete (deactivate) resource
router.delete(
  '/:id',
  resourceController.deleteResource
);

// Update working hours
router.post(
  '/:id/working-hours',
  validateRequest(updateWorkingHoursSchema),
  resourceController.updateWorkingHours
);

// Add availability exception
router.post(
  '/:id/exceptions',
  validateRequest(addExceptionSchema),
  resourceController.addAvailabilityException
);

module.exports = router;
