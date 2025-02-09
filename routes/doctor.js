const express= require('express');
const { addDoctor, updateDoctor, fetchAllDoctors, deleteDoctors, searchDoctors } = require('../controllers/doctor.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const router= express.Router();

router.post('/', authenticate, addDoctor);
router.put('/:doctorId', authenticate, updateDoctor);
router.get('/', fetchAllDoctors);
router.delete('/:doctorId', authenticate, deleteDoctors);
router.get('/search', authenticate, searchDoctors);

module.exports= router;