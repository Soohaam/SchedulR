const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../utils/asyncHandler');
const customerBookingService = require('../services/customerBooking.service');

/**
 * Create a new booking
 */
const createBooking = asyncHandler(async (req, res) => {
    const {
        appointmentTypeId,
        providerId,
        providerType,
        date,
        startTime,
        capacity,
        answers,
        notes
    } = req.body;

    const customerId = req.user ? req.user.id : null;

    const result = await customerBookingService.createBooking({
        appointmentTypeId,
        providerId,
        providerType,
        date,
        startTime,
        capacity,
        answers,
        notes,
        customerId
    });

    res.status(StatusCodes.CREATED).json(result);
});

/**
 * Confirm Payment
 */
const confirmPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { paymentIntentId, transactionId } = req.body;
    const userId = req.user ? req.user.id : null;

    const result = await customerBookingService.confirmPayment(id, paymentIntentId, transactionId, userId);
    res.status(StatusCodes.OK).json(result);
});

/**
 * Get my bookings
 */
const getMyBookings = asyncHandler(async (req, res) => {
    const customerId = req.user.id;
    const { status, upcoming, past, page, limit } = req.query;

    const result = await customerBookingService.getMyBookings(customerId, {
        status,
        upcoming,
        past,
        page,
        limit
    });

    res.status(StatusCodes.OK).json(result);
});

/**
 * Get booking details
 */
const getBookingDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await customerBookingService.getBookingDetailsEnhanced(id, userId);

    res.status(StatusCodes.OK).json(result);
});

/**
 * Cancel booking
 */
const cancelBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    console.log(`[cancelBooking controller] Cancelling booking: ${id}, reason: ${reason}`);

    try {
        const result = await customerBookingService.cancelBooking(id, userId, reason);
        console.log(`[cancelBooking controller] Success:`, result);
        res.status(StatusCodes.OK).json(result);
    } catch (error) {
        console.error(`[cancelBooking controller] Error:`, error);
        throw error;
    }
});

/**
 * Reschedule booking
 */
const rescheduleBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newDate, newStartTime, providerId, reason } = req.body;
    const userId = req.user.id;

    const result = await customerBookingService.rescheduleBooking(id, userId, {
        newDate,
        newStartTime,
        providerId,
        reason
    });

    res.status(StatusCodes.OK).json(result);
});

module.exports = {
    createBooking,
    confirmPayment,
    getMyBookings,
    getBookingDetails,
    cancelBooking,
    rescheduleBooking
};
