const express= require('express');
const router= express.Router();
const  {addFeedback, getFeedbackForDoctor, getFeedbackForHospital}  = require('../controllers/feedback.controller');
const {authenticate}= require('../middlewares/auth.middleware');

router.post('/', authenticate, addFeedback);
router.get('/:doctorId', getFeedbackForDoctor);
router.get('/hospital/:hospitalId', getFeedbackForHospital);

module.exports= router;