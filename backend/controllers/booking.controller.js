const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../utils/asyncHandler');
const bookingService = require('../services/booking.service');

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
        notes,
        customerDetails
    } = req.body;

    const customerId = req.user ? req.user.id : null;

    const result = await bookingService.createBooking({
        appointmentTypeId,
        providerId,
        providerType,
        date,
        startTime,
        capacity,
        answers,
        notes,
        customerDetails,
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
    // Note: For now assuming auth middleware populates req.user. 
    // If no auth middleware is active in main index.js for this route, userId might be null.
    // The service handles checks.

    const result = await bookingService.confirmPayment(id, paymentIntentId, transactionId, userId);
    res.status(StatusCodes.OK).json(result);
});

/**
 * Get booking details
 */
const getBookingDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;

    const result = await bookingService.getBookingDetails(id, userId);

    res.status(StatusCodes.OK).json(result);
});

module.exports = {
    createBooking,
    confirmPayment,
    getBookingDetails
};
