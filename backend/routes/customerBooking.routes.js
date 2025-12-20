const express = require('express');
const customerBookingController = require('../controllers/customerBooking.controller');

const router = express.Router();

/**
 * @route   POST /api/v1/customer/bookings/create
 * @desc    Create a new booking
 * @access  Private (CUSTOMER)
 */
router.post('/create', customerBookingController.createBooking);

/**
 * @route   POST /api/v1/customer/bookings/:id/confirm-payment
 * @desc    Confirm payment
 * @access  Private (CUSTOMER)
 */
router.post('/:id/confirm-payment', customerBookingController.confirmPayment);

/**
 * @route   GET /api/v1/customer/bookings/my-bookings
 * @desc    Get customer's bookings
 * @access  Private (CUSTOMER)
 */
router.get('/my-bookings', customerBookingController.getMyBookings);

/**
 * @route   GET /api/v1/customer/bookings/:id
 * @desc    Get booking details
 * @access  Private (CUSTOMER)
 */
router.get('/:id', customerBookingController.getBookingDetails);

/**
 * @route   POST /api/v1/customer/bookings/:id/cancel
 * @desc    Cancel booking
 * @access  Private (CUSTOMER)
 */
router.post('/:id/cancel', customerBookingController.cancelBooking);

/**
 * @route   POST /api/v1/customer/bookings/:id/reschedule
 * @desc    Reschedule booking
 * @access  Private (CUSTOMER)
 */
router.post('/:id/reschedule', customerBookingController.rescheduleBooking);

module.exports = router;
