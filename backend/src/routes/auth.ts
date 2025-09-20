import express from 'express';
import { register, login, forceChangePassword } from '../controllers/authController';

const router = express.Router();

// Auth routes
router.post('/login', login);
router.post('/register', register);
router.post('/force-change-password', forceChangePassword);

export default router;