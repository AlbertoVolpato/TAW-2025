import { Flight, Seat } from './flight.model';
import { User } from './user.model';

export interface Passenger {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber?: string;
  passportExpiry?: string;
  specialRequests?: string;
}

export interface BookingPassenger extends Passenger {
  seatNumber?: string;
  seatClass: 'economy' | 'business' | 'first';
  meal?: string;
  baggage?: {
    carryOn: boolean;
    checked: number;
  };
}

export interface Booking {
  _id: string;
  bookingReference: string;
  user: User;
  flight: Flight;
  returnFlight?: Flight;
  passengers: BookingPassenger[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  bookingDate?: Date;
  checkedIn: boolean;
  checkedInAt?: Date;
  contactInfo: {
    email: string;
    phone: string;
  };
  pricing: {
    basePrice: number;
    taxes: number;
    fees: number;
    extras: {
      name: string;
      price: number;
    }[];
    totalPrice: number;
  };
  payment: {
    method: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    paidAt?: Date;
  };
  baggage: {
    carryOn: number;
    checked: number;
    extraBags: number;
  };
  specialServices: {
    wheelchairAssistance: boolean;
    specialMeal?: string;
    unaccompaniedMinor: boolean;
    petTransport: boolean;
  };
  seats?: {
    outbound: string[];
    return?: string[];
  };
  extras?: {
    meals: string[];
    baggage: {
      carryOn: number;
      checked: number;
    };
    insurance: boolean;
    priorityBoarding: boolean;
    extraLegroom: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingRequest {
  flightId: string;
  returnFlightId?: string;
  passengers: BookingPassenger[];
  seats: {
    outbound: string[];
    return?: string[];
  };
  extras: {
    meals: string[];
    baggage: {
      carryOn: number;
      checked: number;
    };
    insurance: boolean;
    priorityBoarding: boolean;
    extraLegroom: boolean;
  };
}

export interface BookingResponse {
  success: boolean;
  message?: string;
  data?: {
    booking: Booking;
  };
  booking?: Booking; // For backward compatibility
}

export interface BookingListResponse {
  success: boolean;
  message?: string;
  data: {
    bookings: Booking[];
    count?: number;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface SeatMap {
  rows: SeatRow[];
  aircraft: {
    model: string;
    capacity: number;
  };
}

export interface SeatRow {
  rowNumber: number;
  seats: SeatInfo[];
  class: 'economy' | 'business' | 'first';
  exitRow?: boolean;
  extraLegroom?: boolean;
}

export interface SeatInfo {
  seatNumber: string;
  isAvailable: boolean;
  isSelected: boolean;
  price: number;
  type: 'window' | 'middle' | 'aisle';
  class: 'economy' | 'business' | 'first';
  extraLegroom?: boolean;
  exitRow?: boolean;
}

export interface PaymentRequest {
  bookingId: string;
  paymentMethod: 'credit_card' | 'paypal' | 'bank_transfer';
  paymentDetails: {
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    cardholderName?: string;
    paypalEmail?: string;
    bankAccount?: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  message?: string;
  data?: {
    paymentId: string;
    status: 'pending' | 'completed' | 'failed';
    transactionId?: string;
  };
}