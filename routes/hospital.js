const express= require('express');
const addHospital = require('../controllers/hospital.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const router= express.Router();

router.post('/', authenticate, addHospital);

module.exports= router;