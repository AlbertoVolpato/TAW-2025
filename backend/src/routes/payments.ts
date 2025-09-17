import express from 'express';
import {
  processPayment,
  getPaymentStatus,
  refundPayment
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All payment routes require authentication
router.use(authenticate);

// Process payment for a booking
router.post('/process', processPayment);

// Get payment status for a booking
router.get('/status/:bookingId', getPaymentStatus);

// Refund payment for a booking
router.post('/refund/:bookingId', refundPayment);

export default router;