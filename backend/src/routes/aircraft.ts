import express from 'express';
import {
  getAirlineAircraft,
  createAircraft,
  updateAircraft,
  deleteAircraft
} from '../controllers/aircraftController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Airline user routes - manage their own aircraft
router.get('/', authenticate, authorize('airline'), getAirlineAircraft);
router.post('/', authenticate, authorize('airline'), createAircraft);
router.put('/:id', authenticate, authorize('airline'), updateAircraft);
router.delete('/:id', authenticate, authorize('airline'), deleteAircraft);

export default router;