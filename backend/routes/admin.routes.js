const express = require('express');
const adminController = require('../controllers/admin.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/requireRole.middleware');
const validateRequest = require('../middlewares/validateRequest');
const {
    toggleUserStatusSchema,
    changeUserRoleSchema,
    getUsersQuerySchema,
    getAppointmentsQuerySchema,
    getUserByIdSchema,
} = require('../validators/admin.validator');

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(requireAuth);
router.use(requireRole(['ADMIN']));

/**
 * User Management Routes
 */

// Get all users with filtering
router.get(
    '/users',
    validateRequest(getUsersQuerySchema),
    adminController.getAllUsers
);

// Get user by ID with statistics
router.get(
    '/users/:id',
    validateRequest(getUserByIdSchema),
    adminController.getUserById
);

// Toggle user active status
router.patch(
    '/users/:id/toggle-status',
    validateRequest(toggleUserStatusSchema),
    adminController.toggleUserStatus
);

// Change user role
router.patch(
    '/users/:id/change-role',
    validateRequest(changeUserRoleSchema),
    adminController.changeUserRole
);

/**
 * Dashboard Routes
 */

// Get dashboard statistics
router.get('/dashboard', adminController.getDashboard);

/**
 * Appointments Routes
 */

// Get all appointments (system-wide)
router.get(
    '/appointments',
    validateRequest(getAppointmentsQuerySchema),
    adminController.getAllAppointments
);

module.exports = router;
