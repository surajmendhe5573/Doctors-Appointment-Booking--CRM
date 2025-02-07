const express= require('express');
const { createAppointment } = require('../controllers/appointment.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const router= express.Router();

router.post('/', authenticate, createAppointment);

module.exports= router;