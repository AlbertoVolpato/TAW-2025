import express from 'express';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  checkInBooking,
  getBookingByReference
} from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public route for booking lookup
router.get('/reference/:reference', getBookingByReference);

// Protected routes (require authentication)
router.use(authenticate);

// Create a new booking
router.post('/', createBooking);

// Get user's bookings
router.get('/', getUserBookings);

// Get specific booking by ID
router.get('/:bookingId', getBookingById);

// Update booking (limited fields)
router.put('/:bookingId', updateBooking);

// Cancel booking
router.delete('/:bookingId', cancelBooking);

// Check-in for booking
router.post('/:bookingId/checkin', checkInBooking);

export default router;