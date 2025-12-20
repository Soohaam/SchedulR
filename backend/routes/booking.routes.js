const express = require('express');
const bookingController = require('../controllers/booking.controller');

const router = express.Router();

/**
 * @route   POST /api/bookings/create
 * @desc    Create a new booking
 */
router.post('/create', bookingController.createBooking);

/**
 * @route   POST /api/bookings/:id/confirm-payment
 * @desc    Confirm payment
 */
router.post('/:id/confirm-payment', bookingController.confirmPayment);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking details
 */
router.get('/:id', bookingController.getBookingDetails);

module.exports = router;
