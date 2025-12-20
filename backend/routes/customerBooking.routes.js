const express = require('express');
const customerBookingController = require('../controllers/customerBooking.controller');
const requireAuth = require('../middlewares/auth.middleware');
const optionalAuth = require('../middlewares/optionalAuth.middleware');

const router = express.Router();

/**
 * @route   POST /api/v1/customer/bookings/create
 * @desc    Create a new booking
 * @access  Public (guests can book) / Private (logged-in users get better tracking)
 * NOTE: Must be defined before /:id routes to avoid conflict
 */
router.post('/create', optionalAuth, customerBookingController.createBooking);

/**
 * @route   GET /api/v1/customer/bookings/my-bookings
 * @desc    Get customer's bookings
 * @access  Private (CUSTOMER)
 * NOTE: Must be defined before /:id routes to avoid conflict
 */
router.get('/my-bookings', requireAuth, customerBookingController.getMyBookings);

/**
 * @route   POST /api/v1/customer/bookings/:id/confirm-payment
 * @desc    Confirm payment
 * @access  Private (CUSTOMER)
 */
router.post('/:id/confirm-payment', requireAuth, customerBookingController.confirmPayment);

/**
 * @route   GET /api/v1/customer/bookings/:id
 * @desc    Get booking details
 * @access  Private (CUSTOMER)
 */
router.get('/:id', requireAuth, customerBookingController.getBookingDetails);

/**
 * @route   POST /api/v1/customer/bookings/:id/cancel
 * @desc    Cancel booking
 * @access  Private (CUSTOMER)
 */
router.post('/:id/cancel', requireAuth, customerBookingController.cancelBooking);

/**
 * @route   POST /api/v1/customer/bookings/:id/reschedule
 * @desc    Reschedule booking
 * @access  Private (CUSTOMER)
 */
router.post('/:id/reschedule', requireAuth, customerBookingController.rescheduleBooking);

module.exports = router;
