const express= require('express');
const { addDoctor, updateDoctor, fetchAllDoctors, deleteDoctors } = require('../controllers/doctor.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const router= express.Router();

router.post('/', authenticate, addDoctor);
router.put('/:doctorId', authenticate, updateDoctor);
router.get('/', fetchAllDoctors);
router.delete('/:doctorId', authenticate, deleteDoctors);

module.exports= router;