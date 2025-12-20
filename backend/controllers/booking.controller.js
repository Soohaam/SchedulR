const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../utils/asyncHandler');
const bookingService = require('../services/booking.service');

/**
 * Create a new booking
 */
const createBooking = asyncHandler(async (req, res) => {
    const {
        appointmentTypeId,
        slotId,
        customerDetails,
        answers,
        timezone
    } = req.body;

    // Use authenticated user if available
    const customerId = req.user ? req.user.id : null;

    const result = await bookingService.createBooking({
        appointmentTypeId,
        slotId,
        customerDetails,
        customerId,
        answers,
        timezone
    });

    res.status(StatusCodes.CREATED).json(result);
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
    getBookingDetails
};
