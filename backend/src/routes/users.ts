import express from 'express';
import { register, login, getProfile, updateProfile, changePassword, forceChangePassword } from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllUsers,
  createAirlineByInvitation,
  deleteUser,
  toggleUserStatus,
  getUserById
} from '../controllers/userController';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/force-change-password', forceChangePassword);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

// Admin-only user management routes
router.get('/admin/all', authenticate, authorize('admin'), getAllUsers);
router.get('/admin/:userId', authenticate, authorize('admin'), getUserById);
router.post('/admin/invite-airline', authenticate, authorize('admin'), createAirlineByInvitation);
router.patch('/admin/:userId/toggle-status', authenticate, authorize('admin'), toggleUserStatus);
router.delete('/admin/:userId', authenticate, authorize('admin'), deleteUser);

export default router;
