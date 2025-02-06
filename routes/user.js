const express= require('express');
const { signUp, login, fetchAllUsers, editUsers, deleteUser } = require('../controllers/user.controller');
const { authenticate, authorizeAdmin } = require('../middlewares/auth.middleware');
const router= express.Router();

router.post('/signup', signUp);
router.post('/login', login);
router.get('/', authenticate, authorizeAdmin, fetchAllUsers);
router.put('/:id', authenticate, editUsers);
router.delete('/:id', authenticate, deleteUser);


module.exports= router;