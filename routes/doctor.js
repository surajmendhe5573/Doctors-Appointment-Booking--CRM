const express= require('express');
const { addDoctor } = require('../controllers/doctor.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const router= express.Router();

router.post('/', authenticate, addDoctor);

module.exports= router;