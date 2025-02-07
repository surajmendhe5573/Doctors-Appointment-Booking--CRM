const express= require('express');
const { signUp, login, fetchAllUsers, editUsers, deleteUser, refreshAccessToken, logout, forgotPassword, resetPassword } = require('../controllers/user.controller');
const { authenticate, authorizeAdmin } = require('../middlewares/auth.middleware');
const router= express.Router();

router.post('/signup', signUp);
router.post('/login', login);
router.get('/', authenticate, authorizeAdmin, fetchAllUsers);
router.put('/:id', authenticate, editUsers);
router.delete('/:id', authenticate, deleteUser);

router.post('/refresh-token', refreshAccessToken);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


module.exports= router;