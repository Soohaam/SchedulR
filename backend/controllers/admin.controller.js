const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/admin.service');

/**
 * Get all users with filtering and pagination
 * GET /api/v1/admin/users
 */
const getAllUsers = asyncHandler(async (req, res) => {
    const filters = {
        role: req.query.role,
        isActive: req.query.isActive,
        isVerified: req.query.isVerified,
        search: req.query.search,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
    };

    const result = await adminService.getAllUsers(filters);

    res.status(StatusCodes.OK).json({
        success: true,
        ...result,
    });
});

/**
 * Get user by ID with statistics
 * GET /api/v1/admin/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
    const result = await adminService.getUserById(req.params.id);

    res.status(StatusCodes.OK).json({
        success: true,
        ...result,
    });
});

/**
 * Toggle user active status
 * PATCH /api/v1/admin/users/:id/toggle-status
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
    const { isActive } = req.body;
    const result = await adminService.toggleUserStatus(req.params.id, isActive);

    res.status(StatusCodes.OK).json({
        success: true,
        ...result,
    });
});

/**
 * Change user role
 * PATCH /api/v1/admin/users/:id/change-role
 */
const changeUserRole = asyncHandler(async (req, res) => {
    const { newRole } = req.body;
    const result = await adminService.changeUserRole(
        req.params.id,
        newRole,
        req.user.id // Pass current admin's ID to prevent self-role change
    );

    res.status(StatusCodes.OK).json({
        success: true,
        ...result,
    });
});

/**
 * Get dashboard statistics
 * GET /api/v1/admin/dashboard
 */
const getDashboard = asyncHandler(async (req, res) => {
    const stats = await adminService.getDashboardStats();

    res.status(StatusCodes.OK).json({
        success: true,
        data: stats,
    });
});

/**
 * Get all appointments (system-wide)
 * GET /api/v1/admin/appointments
 */
const getAllAppointments = asyncHandler(async (req, res) => {
    const filters = {
        status: req.query.status,
        organizerId: req.query.organizerId,
        customerId: req.query.customerId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
    };

    const result = await adminService.getAllAppointments(filters);

    res.status(StatusCodes.OK).json({
        success: true,
        ...result,
    });
});

module.exports = {
    getAllUsers,
    getUserById,
    toggleUserStatus,
    changeUserRole,
    getDashboard,
    getAllAppointments,
};
