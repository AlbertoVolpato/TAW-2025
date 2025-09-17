import { Request, Response, NextFunction } from 'express';
import { Booking } from '../models/Booking';
import { Flight } from '../models/Flight';
import mongoose from 'mongoose';

// Mock payment processing - In production, integrate with Stripe, PayPal, etc.
interface PaymentRequest {
  bookingId: string;
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
  paymentDetails: {
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    cardholderName?: string;
    paypalEmail?: string;
    bankAccount?: string;
  };
}

interface PaymentResponse {
  success: boolean;
  message?: string;
  data?: {
    paymentId: string;
    status: 'pending' | 'completed' | 'failed';
    transactionId?: string;
  };
}

// Process payment for a booking
export const processPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { bookingId, paymentMethod, paymentDetails }: PaymentRequest = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate required fields
    if (!bookingId || !paymentMethod || !paymentDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment information'
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId)
      .populate('flight')
      .populate('user');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only process payments for your own bookings.'
      });
    }

    // Check if booking is in valid state for payment
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not in a valid state for payment'
      });
    }

    // Check if payment is already completed
    if (booking.payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been completed for this booking'
      });
    }

    // Validate payment method specific details
    const validationResult = validatePaymentDetails(paymentMethod, paymentDetails);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: validationResult.message
      });
    }

    // Mock payment processing
    const paymentResult = await mockProcessPayment({
      amount: booking.pricing.totalPrice,
      currency: 'EUR',
      paymentMethod,
      paymentDetails
    });

    if (!paymentResult.success) {
      // Update booking with failed payment
      booking.payment.status = 'failed';
      await booking.save();

      return res.status(400).json({
        success: false,
        message: paymentResult.message || 'Payment processing failed'
      });
    }

    // Update booking with successful payment
    booking.payment = {
      method: paymentMethod,
      status: 'completed',
      transactionId: paymentResult.transactionId,
      paidAt: new Date()
    };
    booking.status = 'confirmed';
    await booking.save();

    // Update seat availability in flight
    if (booking.flight && booking.passengers) {
      const flight = await Flight.findById(booking.flight._id);
      if (flight) {
        booking.passengers.forEach(passenger => {
          const seatIndex = flight.seats.findIndex(seat => seat.seatNumber === passenger.seatNumber);
          if (seatIndex !== -1) {
            flight.seats[seatIndex].isAvailable = false;
          }
        });
        await flight.save();
      }
    }

    const response: PaymentResponse = {
      success: true,
      message: 'Payment processed successfully',
      data: {
        paymentId: paymentResult.paymentId,
        status: 'completed',
        transactionId: paymentResult.transactionId
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error processing payment:', error);
    next(error);
  }
};

// Get payment status for a booking
export const getPaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { bookingId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        paymentStatus: booking.payment.status,
        paymentMethod: booking.payment.method,
        transactionId: booking.payment.transactionId,
        paidAt: booking.payment.paidAt,
        totalAmount: booking.pricing.totalPrice
      }
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    next(error);
  }
};

// Refund payment for a booking
export const refundPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { bookingId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const booking = await Booking.findById(bookingId)
      .populate('flight');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking or is admin
    if (booking.user.toString() !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if payment can be refunded
    if (booking.payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment must be completed before refund can be processed'
      });
    }

    // Mock refund processing
    const refundResult = await mockProcessRefund({
      transactionId: booking.payment.transactionId!,
      amount: booking.pricing.totalPrice,
      reason: reason || 'Customer request'
    });

    if (!refundResult.success) {
      return res.status(400).json({
        success: false,
        message: refundResult.message || 'Refund processing failed'
      });
    }

    // Update booking status
    booking.payment.status = 'refunded';
    booking.status = 'cancelled';
    await booking.save();

    // Release seats back to flight
    if (booking.flight && booking.passengers) {
      const flight = await Flight.findById(booking.flight._id);
      if (flight) {
        booking.passengers.forEach(passenger => {
          const seatIndex = flight.seats.findIndex(seat => seat.seatNumber === passenger.seatNumber);
          if (seatIndex !== -1) {
            flight.seats[seatIndex].isAvailable = true;
          }
        });
        await flight.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refundResult.refundId,
        refundAmount: booking.pricing.totalPrice
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    next(error);
  }
};

// Helper function to validate payment details
function validatePaymentDetails(paymentMethod: string, paymentDetails: any): { isValid: boolean; message?: string } {
  switch (paymentMethod) {
    case 'credit_card':
    case 'debit_card':
      if (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv || !paymentDetails.cardholderName) {
        return { isValid: false, message: 'Missing required card details' };
      }
      // Basic card number validation (should be 16 digits)
      if (!/^\d{16}$/.test(paymentDetails.cardNumber.replace(/\s/g, ''))) {
        return { isValid: false, message: 'Invalid card number format' };
      }
      // Basic expiry date validation (MM/YY format)
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentDetails.expiryDate)) {
        return { isValid: false, message: 'Invalid expiry date format' };
      }
      // Basic CVV validation (3-4 digits)
      if (!/^\d{3,4}$/.test(paymentDetails.cvv)) {
        return { isValid: false, message: 'Invalid CVV format' };
      }
      break;
    case 'paypal':
      if (!paymentDetails.paypalEmail) {
        return { isValid: false, message: 'PayPal email is required' };
      }
      break;
    case 'bank_transfer':
      if (!paymentDetails.bankAccount) {
        return { isValid: false, message: 'Bank account information is required' };
      }
      break;
    default:
      return { isValid: false, message: 'Unsupported payment method' };
  }
  return { isValid: true };
}

// Mock payment processing function
async function mockProcessPayment(paymentData: any): Promise<any> {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock success rate (95% success)
  const isSuccess = Math.random() > 0.05;

  if (isSuccess) {
    return {
      success: true,
      paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  } else {
    return {
      success: false,
      message: 'Payment declined by bank'
    };
  }
}

// Mock refund processing function
async function mockProcessRefund(refundData: any): Promise<any> {
  // Simulate refund processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    success: true,
    refundId: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}