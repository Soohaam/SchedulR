const express = require('express');
const staffController = require('../controllers/staff.controller');
const validateRequest = require('../middlewares/validateRequest');
const requireAuth = require('../middlewares/auth.middleware');
const {
  createStaffMemberSchema,
  updateStaffMemberSchema,
  listStaffMembersSchema,
  updateWorkingHoursSchema,
  addExceptionSchema,
} = require('../validators/staff.validator');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Create staff member
router.post(
  '/',
  validateRequest(createStaffMemberSchema),
  staffController.createStaffMember
);

// List all staff members
router.get(
  '/',
  validateRequest(listStaffMembersSchema),
  staffController.listStaffMembers
);

// Get single staff member details
router.get(
  '/:id',
  staffController.getStaffMemberById
);

// Update staff member
router.patch(
  '/:id',
  validateRequest(updateStaffMemberSchema),
  staffController.updateStaffMember
);

// Delete (deactivate) staff member
router.delete(
  '/:id',
  staffController.deleteStaffMember
);

// Update working hours
router.post(
  '/:id/working-hours',
  validateRequest(updateWorkingHoursSchema),
  staffController.updateWorkingHours
);

// Add availability exception
router.post(
  '/:id/exceptions',
  validateRequest(addExceptionSchema),
  staffController.addAvailabilityException
);

module.exports = router;
