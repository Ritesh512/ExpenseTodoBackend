// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const auth = require('../middleware/auth');

// User Sign Up
router.post('/signup', userController.signup);

// User Login
router.post('/login', userController.login);

// Forgot Password
router.post('/forgot-password', userController.forgotPassword);

router.get('/profile/:userId', userController.getUserDashboard);

router.post('/changePassword',auth,  userController.changePassword);

module.exports = router;
