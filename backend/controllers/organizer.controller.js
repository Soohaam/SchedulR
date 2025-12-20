const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../utils/asyncHandler');
const organizerService = require('../services/organizer.service');

/**
 * Get all bookings for organizer
 * GET /api/v1/organiser/bookings
 */
const getBookings = asyncHandler(async (req, res) => {
    const filters = {
        status: req.query.status,
        appointmentTypeId: req.query.appointmentTypeId,
        staffMemberId: req.query.staffMemberId,
        resourceId: req.query.resourceId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        search: req.query.search,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
    };

    const result = await organizerService.getOrganizerBookings(req.user.id, filters);

    res.status(StatusCodes.OK).json({
        success: true,
        ...result,
    });
});

/**
 * Get booking by ID
 * GET /api/v1/organiser/bookings/:id
 */
const getBookingById = asyncHandler(async (req, res) => {
    const result = await organizerService.getBookingById(req.params.id, req.user.id);

    res.status(StatusCodes.OK).json({
        success: true,
        ...result,
    });
});

/**
 * Get booking calendar
 * GET /api/v1/organiser/bookings/calendar
 */
const getBookingCalendar = asyncHandler(async (req, res) => {
    const filters = {
        staffMemberId: req.query.staffMemberId,
        resourceId: req.query.resourceId,
    };

    const result = await organizerService.getBookingCalendar(
        req.user.id,
        req.query.month,
        filters
    );

    res.status(StatusCodes.OK).json({
        success: true,
        ...result,
    });
});

/**
 * Confirm booking
 * POST /api/v1/organiser/bookings/:id/confirm
 */
const confirmBooking = asyncHandler(async (req, res) => {
    const result = await organizerService.confirmBooking(
        req.params.id,
        req.user.id,
        req.body.confirmationMessage
    );

    res.status(StatusCodes.OK).json({
        success: true,
        ...result,
    });
});

/**
 * Reject booking
 * POST /api/v1/organiser/bookings/:id/reject
 */
const rejectBooking = asyncHandler(async (req, res) => {
    const result = await organizerService.rejectBooking(
        req.params.id,
        req.user.id,
        req.body.reason
    );

    res.status(StatusCodes.OK).json({
        success: true,
        ...result,
    });
});

/**
 * Complete booking
 * POST /api/v1/organiser/bookings/:id/complete
 */
const completeBooking = asyncHandler(async (req, res) => {
    const result = await organizerService.completeBooking(req.params.id, req.user.id);

    res.status(StatusCodes.OK).json({
        success: true,
        ...result,
    });
});

/**
 * Cancel booking
 * POST /api/v1/organiser/bookings/:id/cancel
 */
const cancelBooking = asyncHandler(async (req, res) => {
    const result = await organizerService.cancelBooking(
        req.params.id,
        req.user.id,
        req.body.reason
    );

    res.status(StatusCodes.OK).json({
        success: true,
        ...result,
    });
});

/**
 * Reschedule booking
 * POST /api/v1/organiser/bookings/:id/reschedule
 */
const rescheduleBooking = asyncHandler(async (req, res) => {
    const result = await organizerService.rescheduleBooking(
        req.params.id,
        req.user.id,
        req.body.newStartTime,
        req.body.reason
    );

    res.status(StatusCodes.OK).json({
        success: true,
        ...result,
    });
});

module.exports = {
    getBookings,
    getBookingById,
    getBookingCalendar,
    confirmBooking,
    rejectBooking,
    completeBooking,
    cancelBooking,
    rescheduleBooking,
};
