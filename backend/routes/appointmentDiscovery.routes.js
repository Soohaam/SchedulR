const express = require('express');
const appointmentDiscoveryController = require('../controllers/appointmentDiscovery.controller');

const router = express.Router();

/**
 * @route   GET /api/appointments/available
 * @desc    Get all published appointment types with filters
 * @access  Public
 */
router.get('/available', appointmentDiscoveryController.getAvailableAppointments);

/**
 * @route   GET /api/appointments/share/:shareLink
 * @desc    Get appointment type by share link (even if unpublished)
 * @access  Public
 * @note    Must be before /:id/details to avoid route conflicts
 */
router.get('/share/:shareLink', appointmentDiscoveryController.getAppointmentByShareLink);

/**
 * @route   GET /api/appointments/:id/details
 * @desc    Get appointment type full details by ID
 * @access  Public
 */
router.get('/:id/details', appointmentDiscoveryController.getAppointmentDetails);

module.exports = router;

