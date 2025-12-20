const express = require('express');
const appointmentDiscoveryController = require('../controllers/appointmentDiscovery.controller');

const router = express.Router();

// GET /api/appointments/available
router.get('/available', appointmentDiscoveryController.getAvailableAppointments);

// GET /api/appointments/share/:shareLink
router.get('/share/:shareLink', appointmentDiscoveryController.getAppointmentByShareLink);

// GET /api/appointments/:id/details
router.get('/:id/details', appointmentDiscoveryController.getAppointmentDetails);

// GET /api/appointments/:id/available-providers
router.get('/:id/available-providers', appointmentDiscoveryController.getAvailableProviders);

// POST /api/appointments/:id/check-availability
router.post('/:id/check-availability', appointmentDiscoveryController.checkAvailability);

module.exports = router;
