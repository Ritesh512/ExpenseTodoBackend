import express from 'express';
import * as userController from '../controller/userController.js'; // Import all functions from userController
import auth from '../middleware/auth.js'; // Import auth middleware

const router = express.Router();

// User Sign Up
router.post('/signup', userController.signup);

// User Login
router.post('/login', userController.login);

// Forgot Password
router.post('/forgot-password', userController.forgotPassword);

router.get('/profile/:userId', userController.getUserDashboard);

router.post('/changePassword',auth,  userController.changePassword);

export default router;

