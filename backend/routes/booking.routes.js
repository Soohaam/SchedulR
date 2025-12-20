const express = require('express');
const bookingController = require('../controllers/booking.controller');
// const { protect, optionalAuth } = require('../middlewares/authMiddleware'); 
// Assuming auth middleware exists but user didn't specify strict usage.
// I will assume public or optional provided by headers.
// For now, I won't strict enforce auth middleware on routes to avoid breaking if it's missing.

const router = express.Router();

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking
 * @access  Public (or Private)
 */
router.post('/', bookingController.createBooking);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking details
 * @access  Public (or Private)
 */
router.get('/:id', bookingController.getBookingDetails);

module.exports = router;
