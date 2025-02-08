const express= require('express');
const { createAppointment, updateAppointment, cancelAppointment, retrieveAppointments, retrieveCancelledAppointments, updateAppointmentStatus, getUpcomingAppointments, getDoneAppointments } = require('../controllers/appointment.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const router= express.Router();

router.post('/', authenticate, createAppointment);
router.put('/:appointmentId', authenticate, updateAppointment);
router.patch('/:appointmentId', authenticate, cancelAppointment);
router.get('/', authenticate, retrieveAppointments);
router.get('/cancelled', authenticate, retrieveCancelledAppointments);
router.put('/:appointmentId/status', authenticate, updateAppointmentStatus);
router.get('/status/upcoming', authenticate, getUpcomingAppointments);
router.get('/status/done', authenticate, getDoneAppointments);


module.exports= router;