const express= require('express');
const {addHospital, updateHospital, deleteHospital, fetchAllHospitals} = require('../controllers/hospital.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const router= express.Router();

router.post('/', authenticate, addHospital);
router.put('/:id', authenticate, updateHospital);
router.delete('/:id', authenticate, deleteHospital);
router.get('/', authenticate, fetchAllHospitals);

module.exports= router;