import express from 'express';
import { signup, signin, getProfile, updateProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateUserSignup, validateUserSignin } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/signup', validateUserSignup, signup);
router.post('/signin', validateUserSignin, signin);

// Protected routes
router.get('/me', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

export default router; 