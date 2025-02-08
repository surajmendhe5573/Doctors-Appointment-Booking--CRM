const express= require('express');
const { createAppointment, updateAppointment, cancelAppointment } = require('../controllers/appointment.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const router= express.Router();

router.post('/', authenticate, createAppointment);
router.put('/:appointmentId', authenticate, updateAppointment);
router.patch('/:appointmentId', authenticate, cancelAppointment);

module.exports= router;