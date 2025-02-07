const express= require('express');
const { addDoctor, updateDoctor } = require('../controllers/doctor.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const router= express.Router();

router.post('/', authenticate, addDoctor);
router.put('/:doctorId', authenticate, updateDoctor);

module.exports= router;