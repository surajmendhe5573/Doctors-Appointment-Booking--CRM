const express= require('express');
const {addHospital, updateHospital, deleteHospital, fetchAllHospitals, searchHospitals} = require('../controllers/hospital.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const router= express.Router();

router.post('/', authenticate, addHospital);
router.put('/:id', authenticate, updateHospital);
router.delete('/:id', authenticate, deleteHospital);
router.get('/search', authenticate, searchHospitals);

router.get('/', authenticate, fetchAllHospitals);

module.exports= router;