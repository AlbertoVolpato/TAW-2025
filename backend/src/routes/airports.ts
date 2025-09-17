import express from 'express';
import {
  getAllAirports,
  getAirportById,
  getAirportByCode,
  createAirport,
  updateAirport,
  deleteAirport,
  searchAirports
} from '../controllers/airportController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getAllAirports);
router.get('/search', searchAirports);
router.get('/code/:code', getAirportByCode);
router.get('/:id', getAirportById);

// Admin only routes
router.post('/', authenticate, authorize('admin'), createAirport);
router.put('/:id', authenticate, authorize('admin'), updateAirport);
router.delete('/:id', authenticate, authorize('admin'), deleteAirport);

export default router;