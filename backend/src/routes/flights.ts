import express from 'express';
import {
  searchFlights,
  getAllFlights,
  getFlightById,
  createFlight,
  updateFlight,
  deleteFlight,
  getAirlineFlights
} from '../controllers/flightController';
import {
  checkFlightAvailability,
  suggestAlternativeDates,
  checkDateAvailability,
  getAvailableDatesForMonth
} from '../controllers/flightAvailabilityController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/search', searchFlights);
router.get('/availability', checkFlightAvailability);
router.get('/suggest-dates', suggestAlternativeDates);
router.get('/check-date', checkDateAvailability);
router.get('/available-dates/:year/:month', getAvailableDatesForMonth);
router.get('/', getAllFlights);
router.get('/:id', getFlightById);

// Protected routes (airline only)
router.get('/airline/my', authenticate, getAirlineFlights);
router.post('/', authenticate, createFlight);
router.put('/:id', authenticate, updateFlight);
router.delete('/:id', authenticate, deleteFlight);

export default router;