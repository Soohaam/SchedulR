const express = require('express');
const organizerController = require('../controllers/organizer.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/requireRole.middleware');
const validateRequest = require('../middlewares/validateRequest');
const {
    getBookingsQuerySchema,
    getCalendarQuerySchema,
    confirmBookingSchema,
    rejectBookingSchema,
    cancelBookingSchema,
    rescheduleBookingSchema,
    bookingIdParamSchema,
} = require('../validators/organizer.validator');

const router = express.Router();

// All organizer routes require authentication and ORGANISER role
router.use(requireAuth);
router.use(requireRole(['ORGANISER']));

/**
 * Booking View Routes
 */

// Get all bookings for organizer
router.get(
    '/bookings',
    validateRequest(getBookingsQuerySchema),
    organizerController.getBookings
);

// Get booking calendar
router.get(
    '/bookings/calendar',
    validateRequest(getCalendarQuerySchema),
    organizerController.getBookingCalendar
);

// Get booking by ID (must be after /calendar route)
router.get(
    '/bookings/:id',
    validateRequest(bookingIdParamSchema),
    organizerController.getBookingById
);

/**
 * Manual Confirmation Routes
 */

// Confirm booking
router.post(
    '/bookings/:id/confirm',
    validateRequest(confirmBookingSchema),
    organizerController.confirmBooking
);

// Reject booking
router.post(
    '/bookings/:id/reject',
    validateRequest(rejectBookingSchema),
    organizerController.rejectBooking
);

/**
 * Booking Action Routes
 */

// Complete booking
router.post(
    '/bookings/:id/complete',
    validateRequest(bookingIdParamSchema),
    organizerController.completeBooking
);

// Cancel booking
router.post(
    '/bookings/:id/cancel',
    validateRequest(cancelBookingSchema),
    organizerController.cancelBooking
);

// Reschedule booking
router.post(
    '/bookings/:id/reschedule',
    validateRequest(rescheduleBookingSchema),
    organizerController.rescheduleBooking
);

module.exports = router;
