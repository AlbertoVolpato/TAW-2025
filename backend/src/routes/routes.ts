import express from 'express';
import {
  getAirlineRoutes,
  createRoute,
  updateRoute,
  deleteRoute
} from '../controllers/routeController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Airline user routes - manage their own routes
router.get('/', authenticate, authorize('airline'), getAirlineRoutes);
router.post('/', authenticate, authorize('airline'), createRoute);
router.put('/:id', authenticate, authorize('airline'), updateRoute);
router.delete('/:id', authenticate, authorize('airline'), deleteRoute);

export default router;