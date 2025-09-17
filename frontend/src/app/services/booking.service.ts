import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  Booking, 
  BookingRequest, 
  BookingResponse, 
  BookingListResponse,
  SeatMap,
  PaymentRequest,
  PaymentResponse
} from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Get user bookings (protected endpoint)
  getUserBookings(page: number = 1, limit: number = 10, status?: string): Observable<BookingListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (status) {
      params = params.set('status', status);
    }
    
    return this.http.get<BookingListResponse>(`${this.apiUrl}/bookings`, { params });
  }

  // Get booking by ID (protected endpoint)
  getBookingById(bookingId: string): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.apiUrl}/bookings/${bookingId}`);
  }

  // Get booking by reference (public endpoint)
  getBookingByReference(reference: string, email: string): Observable<BookingResponse> {
    const params = new HttpParams().set('email', email);
    return this.http.get<BookingResponse>(`${this.apiUrl}/bookings/reference/${reference}`, { params });
  }

  // Create new booking (protected endpoint)
  createBooking(bookingData: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.apiUrl}/bookings`, bookingData);
  }

  // Update booking (protected endpoint)
  updateBooking(bookingId: string, bookingData: Partial<BookingRequest>): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.apiUrl}/bookings/${bookingId}`, bookingData);
  }

  // Cancel booking (protected endpoint)
  cancelBooking(bookingId: string, reason?: string): Observable<{ success: boolean; message?: string }> {
    const body = reason ? { reason } : {};
    return this.http.delete<{ success: boolean; message?: string }>(`${this.apiUrl}/bookings/${bookingId}`, { body });
  }

  // Get seat map for flight (public endpoint)
  getSeatMap(flightId: string): Observable<{ success: boolean; data: { seatMap: SeatMap }; message?: string }> {
    return this.http.get<{ success: boolean; data: { seatMap: SeatMap }; message?: string }>(`${this.apiUrl}/flights/${flightId}/seats`);
  }

  // Check seat availability (public endpoint)
  checkSeatAvailability(flightId: string, seatNumbers: string[]): Observable<{ success: boolean; data: { available: boolean; unavailableSeats: string[] }; message?: string }> {
    const params = new HttpParams().set('seats', seatNumbers.join(','));
    return this.http.get<{ success: boolean; data: { available: boolean; unavailableSeats: string[] }; message?: string }>(`${this.apiUrl}/flights/${flightId}/seats/check`, { params });
  }

  // Process payment (protected endpoint)
  processPayment(paymentData: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/payments/process`, paymentData);
  }

  // Check-in for booking (protected endpoint)
  checkIn(bookingId: string): Observable<{ success: boolean; message?: string; data?: { boardingPass: any } }> {
    return this.http.post<{ success: boolean; message?: string; data?: { boardingPass: any } }>(`${this.apiUrl}/bookings/${bookingId}/checkin`, {});
  }

  // Get boarding pass (protected endpoint)
  getBoardingPass(bookingId: string): Observable<{ success: boolean; data?: { boardingPass: any }; message?: string }> {
    return this.http.get<{ success: boolean; data?: { boardingPass: any }; message?: string }>(`${this.apiUrl}/bookings/${bookingId}/boarding-pass`);
  }

  // Utility methods
  calculateTotalPrice(basePrice: number, passengers: number, extras: any): number {
    let total = basePrice * passengers;
    
    // Add extras costs
    if (extras.meals && extras.meals.length > 0) {
      total += extras.meals.length * 25; // €25 per meal
    }
    
    if (extras.baggage) {
      total += extras.baggage.checked * 30; // €30 per checked bag
    }
    
    if (extras.insurance) {
      total += 15; // €15 for insurance
    }
    
    if (extras.priorityBoarding) {
      total += 20; // €20 for priority boarding
    }
    
    if (extras.extraLegroom) {
      total += 35; // €35 for extra legroom
    }
    
    return total;
  }

  formatBookingReference(reference: string): string {
    // Format booking reference as XXX-XXX
    return reference.replace(/(.{3})(.{3})/, '$1-$2').toUpperCase();
  }

  getBookingStatusColor(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'primary';
      case 'pending':
        return 'accent';
      case 'cancelled':
        return 'warn';
      case 'completed':
        return 'primary';
      default:
        return 'primary';
    }
  }

  getBookingStatusText(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Confermata';
      case 'pending':
        return 'In Attesa';
      case 'cancelled':
        return 'Cancellata';
      case 'completed':
        return 'Completata';
      default:
        return 'Sconosciuto';
    }
  }

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'paid':
        return 'primary';
      case 'pending':
        return 'accent';
      case 'failed':
      case 'refunded':
        return 'warn';
      default:
        return 'primary';
    }
  }

  getPaymentStatusText(status: string): string {
    switch (status) {
      case 'paid':
        return 'Pagato';
      case 'pending':
        return 'In Attesa';
      case 'failed':
        return 'Fallito';
      case 'refunded':
        return 'Rimborsato';
      default:
        return 'Sconosciuto';
    }
  }
}